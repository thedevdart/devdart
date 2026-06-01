import os
import requests
import json

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
