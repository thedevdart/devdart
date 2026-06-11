"""Shared supervisor stock-sheet upload pipeline (token URL + PWA)."""

import base64
from datetime import datetime, timedelta
from decimal import Decimal, InvalidOperation

from django.contrib.auth.models import User
from django.db import transaction
from django.utils import timezone

from .models import (
    CenterMasterItem,
    CenterItemAlias,
    MasterItem,
    Notification,
    StockEntry,
    StockSheet,
)
from .utils import analyze_with_gemini, resolve_supervisor_ledger_row

ALLOWED_UPLOAD_DAYS_BACK = 7
MAX_UPLOAD_FILE_BYTES = 10 * 1024 * 1024
ALLOWED_UPLOAD_MIMES = {
    'image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif',
    'application/pdf',
}


def validate_supervisor_upload_request(center, upload_date, upload):
    """Return None if valid, else an error string."""
    today = timezone.localdate()
    if upload_date > today:
        return 'You cannot upload for a future date.'
    if upload_date < today - timedelta(days=ALLOWED_UPLOAD_DAYS_BACK):
        return (
            f'You can only upload sheets from the last {ALLOWED_UPLOAD_DAYS_BACK} days. '
            'Contact admin for older dates.'
        )
    if not upload:
        return 'Please choose a photo or PDF of the sheet.'
    if upload.size > MAX_UPLOAD_FILE_BYTES:
        return (
            f'File is too large ({upload.size // (1024 * 1024)} MB). '
            f'Max allowed is {MAX_UPLOAD_FILE_BYTES // (1024 * 1024)} MB.'
        )
    if upload.content_type not in ALLOWED_UPLOAD_MIMES:
        return 'File must be a photo (JPG / PNG / HEIC) or a PDF.'
    if center is None:
        return 'Invalid center.'
    return None


def _build_notification_snapshot(gemini_result=None, center=None, upload_date=None, sheet=None, ai_corrections=None):
    image_path = ''
    if sheet:
        if sheet.review_image:
            image_path = sheet.review_image.name
        elif sheet.image:
            image_path = sheet.image.name
    return {
        'snapshot_raw_extracted_data': gemini_result,
        'snapshot_center_id': center.id if center else None,
        'snapshot_center_name': center.name if center else '',
        'snapshot_date': upload_date,
        'snapshot_image_path': image_path,
        'snapshot_ai_corrections': ai_corrections or None,
    }


def _create_admin_notifications(title, message, notif_type, target_id=None, snapshot=None):
    admins = User.objects.filter(is_superuser=True)
    notifs = []
    for admin in admins:
        kwargs = {
            'user': admin,
            'title': title,
            'message': message,
            'notif_type': notif_type,
            'target_id': target_id,
        }
        if snapshot:
            kwargs.update(snapshot)
        notifs.append(Notification(**kwargs))
    Notification.objects.bulk_create(notifs)


def process_supervisor_upload(center, token_obj, upload_date, upload, existing_sheet=None):
    """Run OCR + validation and create/update StockSheet. Returns a response dict."""
    if existing_sheet is None:
        existing_sheet = StockSheet.objects.filter(center=center, date=upload_date).first()

    gemini_result = None
    try:
        upload.seek(0)
        b64_data = base64.b64encode(upload.read()).decode('utf-8')

        center_masters = {cm.name.upper(): cm for cm in CenterMasterItem.objects.filter(center=center)}
        center_aliases = {
            ca.scanned_name.upper(): ca.mapped_to
            for ca in CenterItemAlias.objects.filter(center=center).select_related('mapped_to')
        }

        allowed_names_str = ', '.join(list(center_masters.keys()) + list(center_aliases.keys()))
        gemini_result = analyze_with_gemini(upload.content_type, b64_data, center.name, allowed_names_str)

        if 'error' in gemini_result:
            raise ValueError(f"AI Error: {gemini_result['error']}")

        candidates = gemini_result.get('candidates')
        if not candidates or not isinstance(candidates, list) or not candidates[0].get('content', {}).get('parts'):
            raise ValueError('AI returned an invalid response structure.')

        extracted_text = candidates[0].get('content', {}).get('parts', [{}])[0].get('text', '')
        if not extracted_text:
            raise ValueError('AI returned an empty analysis.')

        lines = extracted_text.strip().split('\n')
        items_to_save = []
        has_errors = False
        error_reasons = []

        prev_date = upload_date - timedelta(days=1)
        prev_entries = StockEntry.objects.filter(
            sheet__center=center, sheet__date=prev_date
        ).select_related('master_item')
        prev_balances = {entry.master_item.name.upper(): entry.closing_balance for entry in prev_entries}

        csv_start_index = -1
        for i, line in enumerate(lines):
            if 'CSV_START' in line or ('Category' in line and 'Item Name' in line):
                csv_start_index = i + 1
                break

        if csv_start_index == -1 or csv_start_index >= len(lines):
            has_errors = True
            error_reasons.append('Could not find CSV_START or header line in AI output.')

        if not has_errors and not lines[csv_start_index:]:
            has_errors = True
            error_reasons.append('No data lines found after CSV_START.')

        processed_items = set()
        sheet_corrections = []

        if not has_errors:
            for line in lines[csv_start_index:]:
                if 'Category' in line or 'Item Name' in line:
                    continue

                parts = [p.strip() for p in line.split(',')]
                if len(parts) < 6:
                    continue

                try:
                    raw_cat, raw_name, op_str, inw_str, disp_str, clo_str = parts[:6]
                    if not raw_name:
                        continue
                    op, inw, disp, clo = Decimal(op_str), Decimal(inw_str), Decimal(disp_str), Decimal(clo_str)
                except (ValueError, InvalidOperation):
                    has_errors = True
                    error_reasons.append(f'Failed to parse decimal values in line: {line}')
                    break

                item_name_upper = raw_name.upper()
                center_master_item = center_masters.get(item_name_upper) or center_aliases.get(item_name_upper)

                if not center_master_item:
                    has_errors = True
                    error_reasons.append(f'Item not found in master/aliases: {item_name_upper}')
                    break

                master_name_upper = center_master_item.name.upper()
                prev_bal = prev_balances.get(master_name_upper, Decimal('0'))

                resolved = resolve_supervisor_ledger_row(op, inw, disp, clo, prev_bal, raw_name)
                if resolved is None:
                    if op != prev_bal:
                        has_errors = True
                        error_reasons.append(
                            f'Opening balance mismatch for {raw_name}: expected {prev_bal}, got {op}'
                        )
                    else:
                        has_errors = True
                        error_reasons.append(
                            f'Math check failed for {raw_name}: {op} + {inw} - {disp} != {clo}'
                        )
                    break
                op, inw, disp, clo, row_corrections = resolved
                sheet_corrections.extend(row_corrections)

                processed_items.add(master_name_upper)

                items_to_save.append({
                    'center_master_name': center_master_item.name,
                    'sheet_category': center_master_item.category,
                    'opening_balance': op,
                    'inward': inw,
                    'dispatch': disp,
                    'closing_balance': clo,
                    'raw_name_scanned': raw_name,
                })

        if not has_errors:
            for prev_name, prev_bal in prev_balances.items():
                if prev_bal > 0 and prev_name not in processed_items:
                    has_errors = True
                    error_reasons.append(
                        f'Item {prev_name} had prev balance {prev_bal} but was missing from current sheet.'
                    )
                    break

        if has_errors or not items_to_save:
            error_msg = (
                f"Validation failed. Reasons: {', '.join(error_reasons)}"
                if error_reasons else 'Validation failed or no items found to save.'
            )
            raise ValueError(error_msg)

        was_replacement = existing_sheet and existing_sheet.entries.exists()
        with transaction.atomic():
            if existing_sheet:
                if was_replacement:
                    preserved_image_path = existing_sheet.review_image.name if existing_sheet.review_image else ''
                    if existing_sheet.image and not preserved_image_path:
                        from django.core.files.base import ContentFile
                        with existing_sheet.image.open('rb') as old_image:
                            preserved_name = old_image.name.split('/')[-1]
                            existing_sheet.review_image.save(
                                preserved_name, ContentFile(old_image.read()), save=False
                            )
                        preserved_image_path = existing_sheet.review_image.name

                    replaced_update = {
                        'notif_type': 'case4',
                        'title': f"Replaced: {center.name}",
                        'message': (
                            f"A newer tallied sheet was uploaded for {upload_date.strftime('%d %b')}. "
                            f"This entry has been replaced."
                        ),
                    }
                    if preserved_image_path:
                        replaced_update['snapshot_image_path'] = preserved_image_path
                    Notification.objects.filter(
                        target_id=existing_sheet.id, notif_type='case1'
                    ).update(**replaced_update)

                existing_sheet.image = upload
                existing_sheet.uploaded_by_source = 'supervisor'
                existing_sheet.raw_extracted_data = None
                if not was_replacement:
                    existing_sheet.review_image = None
                existing_sheet.save()
                existing_sheet.entries.all().delete()
                sheet = existing_sheet
                if was_replacement:
                    message = (
                        f'Success! Your revised sheet for {upload_date.strftime("%d %b %Y")} '
                        f'replaced the previous tallied entry.'
                    )
                else:
                    message = (
                        f'Success! Your corrected sheet for {upload_date.strftime("%d %b %Y")} '
                        f'was automatically verified.'
                    )
            else:
                sheet = StockSheet.objects.create(
                    center=center,
                    date=upload_date,
                    image=upload,
                    uploaded_by_source='supervisor',
                    uploaded_by_token=token_obj,
                    raw_extracted_data=None,
                )
                message = (
                    f'Success! Your sheet for {upload_date.strftime("%d %b %Y")} was automatically verified.'
                )

            _create_admin_notifications(
                title=f"Tallied: {center.name}",
                message=f"Stock sheet for {upload_date.strftime('%d %b')} was successfully verified.",
                notif_type='case1',
                target_id=sheet.id,
                snapshot=_build_notification_snapshot(
                    gemini_result, center, upload_date, sheet=sheet, ai_corrections=sheet_corrections
                ),
            )

            sheet.ai_corrections = sheet_corrections or None
            sheet.save(update_fields=['ai_corrections'])

            item_names_to_fetch = {item['center_master_name'] for item in items_to_save}
            global_masters = {mi.name: mi for mi in MasterItem.objects.filter(name__in=item_names_to_fetch)}

            for item_data in items_to_save:
                global_master = global_masters.get(item_data['center_master_name'])
                if not global_master:
                    global_master, _ = MasterItem.objects.get_or_create(
                        name=item_data['center_master_name'],
                        defaults={'category': item_data['sheet_category']},
                    )
                StockEntry.objects.create(
                    sheet=sheet,
                    master_item=global_master,
                    sheet_category=item_data['sheet_category'],
                    opening_balance=item_data['opening_balance'],
                    inward=item_data['inward'],
                    dispatch=item_data['dispatch'],
                    closing_balance=item_data['closing_balance'],
                    raw_name_scanned=item_data['raw_name_scanned'],
                )

        if token_obj:
            token_obj.last_used_at = timezone.now()
            token_obj.save(update_fields=['last_used_at'])

        return {'ok': True, 'date': str(upload_date), 'sheet_id': sheet.id, 'message': message}

    except Exception:
        if upload:
            upload.seek(0)

        existing_tallied = existing_sheet and existing_sheet.entries.exists()
        with transaction.atomic():
            if existing_tallied:
                existing_sheet.review_image = upload
                existing_sheet.raw_extracted_data = gemini_result
                existing_sheet.save()
                sheet = existing_sheet
                message = (
                    f'A tallied sheet already exists for {upload_date.strftime("%d %b %Y")}. '
                    f'Your new upload has been saved for admin review.'
                )
                _create_admin_notifications(
                    title=f"Review Requested: {center.name}",
                    message=f"Duplicate sheet uploaded for {upload_date.strftime('%d %b')} with errors.",
                    notif_type='case3',
                    target_id=sheet.id,
                    snapshot=_build_notification_snapshot(gemini_result, center, upload_date, sheet=sheet),
                )
            elif existing_sheet:
                existing_sheet.image = upload
                existing_sheet.uploaded_by_source = 'supervisor'
                existing_sheet.raw_extracted_data = gemini_result
                existing_sheet.review_image = None
                existing_sheet.save()
                existing_sheet.entries.all().delete()
                message = (
                    f'Got it. Your corrected sheet for {upload_date.strftime("%d %b %Y")} '
                    f'is queued for manual review.'
                )
                sheet = existing_sheet
                _create_admin_notifications(
                    title=f"Tally Failed: {center.name}",
                    message=f"Stock sheet for {upload_date.strftime('%d %b')} failed auto-verification.",
                    notif_type='case2',
                    target_id=sheet.id,
                    snapshot=_build_notification_snapshot(gemini_result, center, upload_date, sheet=sheet),
                )
            else:
                sheet = StockSheet.objects.create(
                    center=center,
                    date=upload_date,
                    image=upload,
                    uploaded_by_source='supervisor',
                    uploaded_by_token=token_obj,
                    raw_extracted_data=gemini_result,
                )
                message = (
                    f'Got it. Your sheet for {upload_date.strftime("%d %b %Y")} '
                    f'is queued for manual review.'
                )
                _create_admin_notifications(
                    title=f"Tally Failed: {center.name}",
                    message=f"Stock sheet for {upload_date.strftime('%d %b')} failed auto-verification.",
                    notif_type='case2',
                    target_id=sheet.id,
                    snapshot=_build_notification_snapshot(gemini_result, center, upload_date, sheet=sheet),
                )

            if token_obj:
                token_obj.last_used_at = timezone.now()
                token_obj.save(update_fields=['last_used_at'])

        return {'ok': True, 'date': str(upload_date), 'sheet_id': sheet.id, 'message': message}
