# Postman Guide - Extraction API

## Testing the Extraction API with Postman

### Endpoint Details
- **URL**: `http://localhost:5000/api/extract/<extractor_uid>`
- **Method**: POST
- **Authentication**: Required (Session Cookie)
- **Content-Type**: multipart/form-data

---

## Step-by-Step Guide

### Step 1: Get Your Extractor UUID
1. Log in to your application
2. Go to the workflow list page: `http://localhost:5000/index/extractor-list`
3. Find the extractor you want to use
4. Copy the UUID from the "WORKFLOW ID" column (e.g., `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

---

### Step 2: Set Up Authentication in Postman

#### Option A: Using Session Cookie (Recommended)

1. **Login to get session cookie:**
   - Open your browser
   - Login to the application
   - Open Developer Tools (F12)
   - Go to "Application" tab → "Cookies"
   - Find the cookie named `session` (or `remember_token`)
   - Copy the cookie value

2. **Add Cookie to Postman:**
   - In Postman, go to the "Headers" tab
   - Add a new header:
     - **Key**: `Cookie`
     - **Value**: `session=YOUR_COPIED_COOKIE_VALUE`

#### Option B: Using Postman Cookie Manager

1. In Postman, click on "Cookies" (below the Send button)
2. Add domain: `localhost:5000`
3. Add cookie:
   - **Name**: `session`
   - **Value**: Your session cookie value
   - **Domain**: `localhost`
   - **Path**: `/`

---

### Step 3: Configure the Request

#### 3.1 Set the URL
```
http://localhost:5000/api/extract/YOUR-EXTRACTOR-UUID-HERE
```

Example:
```
http://localhost:5000/api/extract/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

#### 3.2 Set the Method
- Select **POST** from the dropdown

#### 3.3 Set the Body
1. Go to the **Body** tab
2. Select **form-data** (NOT raw or binary)
3. Add a new key:
   - **Key**: `file`
   - **Type**: Change from "Text" to **File** (hover over the key and click the dropdown)
   - **Value**: Click "Select Files" and choose your PDF or image file

---

### Step 4: Send the Request

Click the blue **Send** button

---

## Expected Response

### Success Response (200 OK)
```json
{
    "success": true,
    "results": {
        "invoice_number": "INV-2025-001",
        "invoice_date": "2025-11-19",
        "invoice_total_amount": "1500.00",
        "seller_name": "ABC Company Ltd",
        "line_items": [
            {
                "description": "Product A",
                "quantity": 2,
                "unit_price": "500.00",
                "item_total_amount": "1000.00"
            },
            {
                "description": "Product B",
                "quantity": 1,
                "unit_price": "500.00",
                "item_total_amount": "500.00"
            }
        ]
    },
    "filename": "invoice.pdf",
    "extractor": {
        "uid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "name": "Invoice_Extractor_2025-11-19_9fields",
        "schema": {
            "fields": [...]
        }
    }
}
```

### Error Responses

#### 401 Unauthorized (Not Logged In)
```json
{
    "error": "Unauthorized"
}
```
**Solution**: Add session cookie to headers

#### 404 Not Found (Invalid UUID)
```json
{
    "success": false,
    "error": "Extractor with UID abc123 not found"
}
```
**Solution**: Check the UUID is correct

#### 403 Forbidden (Not Your Extractor)
```json
{
    "success": false,
    "error": "You do not have permission to use this extractor"
}
```
**Solution**: Use an extractor that belongs to your user account

#### 400 Bad Request (No File)
```json
{
    "success": false,
    "error": "No file uploaded"
}
```
**Solution**: Make sure to attach a file in the Body → form-data

#### 500 Internal Server Error
```json
{
    "success": false,
    "error": "OpenAI API error: ..."
}
```
**Solution**: Check server logs, OpenAI API key, or file format

---

## Postman Collection JSON

You can import this collection into Postman:

```json
{
    "info": {
        "name": "Document Extraction API",
        "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    "item": [
        {
            "name": "Extract by Extractor UUID",
            "request": {
                "method": "POST",
                "header": [
                    {
                        "key": "Cookie",
                        "value": "session=YOUR_SESSION_COOKIE_HERE",
                        "type": "text"
                    }
                ],
                "body": {
                    "mode": "formdata",
                    "formdata": [
                        {
                            "key": "file",
                            "type": "file",
                            "src": []
                        }
                    ]
                },
                "url": {
                    "raw": "http://localhost:5000/api/extract/YOUR-EXTRACTOR-UUID-HERE",
                    "protocol": "http",
                    "host": [
                        "localhost"
                    ],
                    "port": "5000",
                    "path": [
                        "api",
                        "extract",
                        "YOUR-EXTRACTOR-UUID-HERE"
                    ]
                }
            },
            "response": []
        }
    ]
}
```

**To import:**
1. Copy the JSON above
2. In Postman, click "Import" button
3. Select "Raw text" tab
4. Paste the JSON
5. Click "Import"

---

## Quick Test Checklist

- [ ] Got extractor UUID from workflow list page
- [ ] Logged in to application in browser
- [ ] Copied session cookie value
- [ ] Created new POST request in Postman
- [ ] Set URL with correct UUID
- [ ] Added Cookie header with session value
- [ ] Selected Body → form-data
- [ ] Added `file` field and changed type to "File"
- [ ] Selected PDF or image file
- [ ] Clicked Send
- [ ] Received 200 OK response with extraction results

---

## Troubleshooting

### Issue: "Unauthorized" Error
**Cause**: Session cookie is missing or expired  
**Fix**: 
1. Login again in browser
2. Get fresh session cookie
3. Update Cookie header in Postman

### Issue: "Extractor not found"
**Cause**: Invalid UUID or extractor doesn't exist  
**Fix**: 
1. Go to `/index/extractor-list`
2. Verify the extractor exists
3. Copy the exact UUID (including hyphens)

### Issue: "No file uploaded"
**Cause**: File not properly attached  
**Fix**: 
1. Make sure Body type is **form-data**
2. Key is exactly `file`
3. Type is set to **File** (not Text)
4. File is selected

### Issue: No response or timeout
**Cause**: Server not running or wrong URL  
**Fix**: 
1. Check Flask server is running
2. Verify URL: `http://localhost:5000`
3. Check console for any errors

---

## Testing with Different File Types

The API supports:
- ✅ PDF files (`.pdf`)
- ✅ PNG images (`.png`)
- ✅ JPEG images (`.jpg`, `.jpeg`)

Just select any of these file types when attaching the file in Postman.

---

## Advanced: Using Postman Environment Variables

Create a Postman Environment with:
- **Variable**: `base_url` → **Value**: `http://localhost:5000`
- **Variable**: `session_cookie` → **Value**: Your session cookie
- **Variable**: `extractor_uid` → **Value**: Your extractor UUID

Then use in request:
- **URL**: `{{base_url}}/api/extract/{{extractor_uid}}`
- **Header Cookie**: `session={{session_cookie}}`

This makes it easy to switch between different environments or extractors.
