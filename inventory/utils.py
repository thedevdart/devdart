import os
import requests
import json
from decimal import Decimal, InvalidOperation
from itertools import product
from typing import List, Optional

# Handwritten digits that are often misread by OCR — each tuple is one confusable set.
CONFUSABLE_DIGIT_GROUPS = (
    ('1', '7', '9'),
    ('3', '8'),
    ('9', '0', '6'),
)

_DIGIT_TO_GROUP = {}
for _group in CONFUSABLE_DIGIT_GROUPS:
    for _digit in _group:
        _DIGIT_TO_GROUP[_digit] = _group

FIELD_LABELS = {
    'opening': 'Opening',
    'inward': 'Production',
    'dispatch': 'Dispatch',
    'closing': 'Closing',
}


def _append_correction(
    corrections: List[dict],
    item_name: str,
    field: str,
    scanned: Decimal,
    corrected: Decimal,
    reason: str,
) -> None:
    if scanned == corrected:
        return
    corrections.append({
        'item': item_name,
        'field': field,
        'field_label': FIELD_LABELS[field],
        'scanned': _decimal_to_digit_string(scanned),
        'corrected': _decimal_to_digit_string(corrected),
        'reason': reason,
    })


def _decimal_to_digit_string(value: Decimal) -> str:
    """Normalize a balance to a plain digit string for position-wise comparison."""
    integral = value.to_integral_value()
    if value == integral:
        return str(integral)
    normalized = format(value.normalize(), 'f')
    return normalized.rstrip('0').rstrip('.')


def try_correct_confusable_digits(scanned: Decimal, expected: Decimal) -> Optional[Decimal]:
    """
    If OCR misread one or more confusable handwritten digits, try substituting
    alternatives from the matching group until the scanned value equals expected.

    Example: scanned closing 816 vs calculated 810 — digit 6 vs 0 share group (9,0,6)
    → try combinations → 810 matches → return Decimal('810').
    """
    if scanned == expected:
        return scanned

    scanned_str = _decimal_to_digit_string(scanned)
    expected_str = _decimal_to_digit_string(expected)

    if len(scanned_str) != len(expected_str):
        return None

    diff_positions = [i for i, (s, e) in enumerate(zip(scanned_str, expected_str)) if s != e]
    if not diff_positions:
        return None

    alternatives_per_pos = []
    for pos in diff_positions:
        scanned_digit = scanned_str[pos]
        expected_digit = expected_str[pos]
        group = _DIGIT_TO_GROUP.get(scanned_digit)
        if not group or expected_digit not in group:
            return None
        alternatives_per_pos.append(group)

    for combo in product(*alternatives_per_pos):
        candidate = list(scanned_str)
        for idx, pos in enumerate(diff_positions):
            candidate[pos] = combo[idx]
        try:
            candidate_value = Decimal(''.join(candidate))
        except InvalidOperation:
            continue
        if candidate_value == expected:
            return candidate_value

    return None


def resolve_supervisor_ledger_row(
    opening: Decimal,
    inward: Decimal,
    dispatch: Decimal,
    closing: Decimal,
    prev_closing: Decimal,
    item_name: str = '',
) -> Optional[tuple[Decimal, Decimal, Decimal, Decimal, List[dict]]]:
    """
    Resolve OCR row values using confusable-digit rules without fixing the wrong column.

    The key insight: a single OCR slip in production also makes calculated closing
    disagree with scanned closing, so we must not blindly snap closing to calculated.

    Strategy:
    1. Anchor opening against previous day's closing.
    2. If calculated closing > scanned closing, production was likely over-read
       (e.g. 816 instead of 810) — fix production toward what scanned closing implies.
    3. If calculated closing < scanned closing, scanned closing was likely over-read
       (e.g. 2346 instead of 2340) — fix closing toward opening + production - dispatch.
    4. Fall back to dispatch correction when needed.
    """
    op, inw, disp, clo = opening, inward, dispatch, closing
    orig_op, orig_inw, orig_disp, orig_clo = op, inw, disp, clo
    corrections: List[dict] = []

    corrected_op = try_correct_confusable_digits(op, prev_closing)
    if corrected_op is not None:
        op = corrected_op

    def is_balanced(o: Decimal, i: Decimal, d: Decimal, c: Decimal) -> bool:
        return o + i - d == c

    if not is_balanced(op, inw, disp, clo):
        calc_clo = op + inw - disp
        implied_inw = clo - op + disp

        if calc_clo > clo:
            # Calculated closing too high — production was likely over-read; trust scanned closing.
            corrected_inw = try_correct_confusable_digits(inw, implied_inw)
            if corrected_inw is not None and is_balanced(op, corrected_inw, disp, clo):
                inw = corrected_inw

        if not is_balanced(op, inw, disp, clo) and calc_clo < clo:
            # Scanned closing too high — trust production; fix closing down toward calculated.
            corrected_clo = try_correct_confusable_digits(clo, calc_clo)
            if corrected_clo is not None and is_balanced(op, inw, disp, corrected_clo):
                clo = corrected_clo

        if not is_balanced(op, inw, disp, clo) and calc_clo < clo:
            corrected_inw = try_correct_confusable_digits(inw, implied_inw)
            if corrected_inw is not None and is_balanced(op, corrected_inw, disp, clo):
                inw = corrected_inw

        if not is_balanced(op, inw, disp, clo):
            expected_disp = op + inw - clo
            corrected_disp = try_correct_confusable_digits(disp, expected_disp)
            if corrected_disp is not None and is_balanced(op, inw, corrected_disp, clo):
                disp = corrected_disp

    if op != prev_closing or not is_balanced(op, inw, disp, clo):
        return None

    if orig_op != op:
        _append_correction(
            corrections, item_name, 'opening', orig_op, op,
            'Matched previous day closing (handwritten digit correction)',
        )
    if orig_inw != inw:
        orig_calc_clo = orig_op + orig_inw - orig_disp
        reason = (
            'Production aligned with scanned closing (handwritten digit correction)'
            if orig_calc_clo > orig_clo else
            'Production aligned with ledger total (handwritten digit correction)'
        )
        _append_correction(corrections, item_name, 'inward', orig_inw, inw, reason)
    if orig_disp != disp:
        _append_correction(
            corrections, item_name, 'dispatch', orig_disp, disp,
            'Dispatch aligned with ledger total (handwritten digit correction)',
        )
    if orig_clo != clo:
        _append_correction(
            corrections, item_name, 'closing', orig_clo, clo,
            'Closing aligned with opening + production - dispatch (handwritten digit correction)',
        )

    return op, inw, disp, clo, corrections


def analyze_with_gemini(mime_type, base64_data, center_name="Center", allowed_names=""):
    """
    Server-side proxy for Gemini API to hide the API Key.
    """
    api_key = os.getenv('GEMINI_API_KEY')
    
    if not api_key:
        return {"error": "Server Error: API Key missing configuration."}

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key={api_key}"
    
    prompt = f"""
    Analyze this inventory document for {center_name} as a STRICT TRANSCRIBER.
    GLOSSARY OF KNOWN ITEMS: [{allowed_names}].
    
    1. Find the DATE (DATE_FOUND: YYYY-MM-DD).
    2. Extract items row by row EXACTLY AS WRITTEN on the paper. 
       - Some sheets might have multiple rows for the same item.If the name is exactly the same, sum them up into one line.
       - If categories aren't explicitly written, assume the upper section is 'Raw Material' and the lower section is 'Finished Goods', guided primarily by the GLOSSARY.
       - Ignore completely blank lines without numbers.
       - Extract all 4 columns: Opening, Inward/Production, Dispatch, Closing. If a column is missing or blank, output 0.
    3. Return data in this format:
    DATE_FOUND: YYYY-MM-DD
    CSV_START
    Category,Item Name,Opening,Inward,Dispatch,Closing
    """

    payload = {
        "contents": [{
            "parts": [
                {"text": prompt},
                {"inline_data": {
                    "mime_type": mime_type,
                    "data": base64_data
                }}
            ]
        }]
    }

    try:
        response = requests.post(url, json=payload, headers={'Content-Type': 'application/json'})
        
        if response.status_code != 200:
            return {"error": f"Gemini Error {response.status_code}: {response.text}"}
            
        return response.json()
    except Exception as e:
        return {"error": str(e)}
