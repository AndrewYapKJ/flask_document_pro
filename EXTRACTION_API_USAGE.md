# Extraction API Usage Guide

## Endpoint: Extract Document Using Extractor UUID

### URL
```
POST /api/extract/<extractor_uid>
```

### Authentication
Requires user to be logged in (uses `@login_required` decorator)

### Parameters
- `extractor_uid` (path parameter): The UUID of the saved extractor template

### Request Body
- Content-Type: `multipart/form-data`
- Field: `file` - PDF or image file (PNG, JPG, etc.)

### Response
```json
{
    "success": true,
    "results": {
        "field_name_1": "extracted value 1",
        "field_name_2": "extracted value 2",
        ...
    },
    "filename": "document.pdf",
    "extractor": {
        "uid": "abc123-def456-...",
        "name": "Invoice_Extractor_2025-11-19_9fields",
        "schema": {
            "fields": [...]
        }
    }
}
```

## JavaScript Examples

### Example 1: Using Fetch API
```javascript
async function extractWithUUID(extractorUUID, fileInput) {
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    
    try {
        const response = await fetch(`/api/extract/${extractorUUID}`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('Extraction results:', data.results);
            console.log('Used extractor:', data.extractor.name);
            return data.results;
        } else {
            console.error('Extraction failed:', data.error);
            alert('Extraction failed: ' + data.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Network error: ' + error);
    }
}

// Usage:
const fileInput = document.querySelector('#file-input');
const extractorUUID = 'abc123-def456-ghi789';
extractWithUUID(extractorUUID, fileInput);
```

### Example 2: Using XMLHttpRequest
```javascript
function extractWithUUID(extractorUUID, file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/extract/${extractorUUID}`, true);
    
    xhr.onload = function() {
        if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);
            if (data.success) {
                console.log('Extraction results:', data.results);
                displayResults(data.results);
            } else {
                alert('Extraction failed: ' + data.error);
            }
        } else {
            alert('Error: ' + xhr.status);
        }
    };
    
    xhr.onerror = function() {
        alert('Network error occurred');
    };
    
    xhr.send(formData);
}

// Usage with file input
document.querySelector('#extract-btn').addEventListener('click', function() {
    const fileInput = document.querySelector('#file-input');
    const extractorUUID = document.querySelector('#extractor-uuid').value;
    
    if (fileInput.files.length === 0) {
        alert('Please select a file');
        return;
    }
    
    extractWithUUID(extractorUUID, fileInput.files[0]);
});
```

### Example 3: Complete Form with File Upload
```html
<!DOCTYPE html>
<html>
<head>
    <title>Extract Document</title>
</head>
<body>
    <h1>Document Extraction</h1>
    
    <form id="extraction-form">
        <div>
            <label>Extractor UUID:</label>
            <input type="text" id="extractor-uuid" value="your-extractor-uuid-here" />
        </div>
        
        <div>
            <label>Upload PDF/Image:</label>
            <input type="file" id="file-input" accept=".pdf,.png,.jpg,.jpeg" />
        </div>
        
        <button type="submit">Extract</button>
    </form>
    
    <div id="results"></div>
    
    <script>
        document.getElementById('extraction-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const extractorUUID = document.getElementById('extractor-uuid').value;
            const fileInput = document.getElementById('file-input');
            
            if (!fileInput.files[0]) {
                alert('Please select a file');
                return;
            }
            
            const formData = new FormData();
            formData.append('file', fileInput.files[0]);
            
            try {
                const response = await fetch(`/api/extract/${extractorUUID}`, {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // Display results
                    const resultsDiv = document.getElementById('results');
                    resultsDiv.innerHTML = '<h2>Extraction Results:</h2>';
                    
                    for (const [key, value] of Object.entries(data.results)) {
                        resultsDiv.innerHTML += `<p><strong>${key}:</strong> ${JSON.stringify(value)}</p>`;
                    }
                } else {
                    alert('Extraction failed: ' + data.error);
                }
            } catch (error) {
                alert('Error: ' + error);
            }
        });
    </script>
</body>
</html>
```

## Python Examples

### Example 1: Using Requests Library
```python
import requests

def extract_with_uuid(extractor_uuid, file_path, session_cookies=None):
    """
    Extract document using saved extractor template
    
    Args:
        extractor_uuid: UUID of the saved extractor
        file_path: Path to PDF or image file
        session_cookies: Session cookies for authentication
    
    Returns:
        dict: Extraction results
    """
    url = f'http://localhost:5000/api/extract/{extractor_uuid}'
    
    with open(file_path, 'rb') as f:
        files = {'file': f}
        
        response = requests.post(
            url, 
            files=files,
            cookies=session_cookies  # Required for authentication
        )
    
    if response.status_code == 200:
        data = response.json()
        if data['success']:
            print(f"Extracted using: {data['extractor']['name']}")
            return data['results']
        else:
            print(f"Extraction failed: {data['error']}")
            return None
    else:
        print(f"HTTP Error: {response.status_code}")
        return None

# Usage
results = extract_with_uuid(
    extractor_uuid='abc123-def456-ghi789',
    file_path='/path/to/invoice.pdf',
    session_cookies={'session': 'your-session-cookie'}
)

if results:
    print("Results:", results)
```

### Example 2: Using CURL
```bash
# Extract document using extractor UUID
curl -X POST \
  -F "file=@/path/to/invoice.pdf" \
  -H "Cookie: session=your-session-cookie" \
  http://localhost:5000/api/extract/abc123-def456-ghi789
```

## Error Responses

### 404 - Extractor Not Found
```json
{
    "success": false,
    "error": "Extractor with UID abc123 not found"
}
```

### 403 - Permission Denied
```json
{
    "success": false,
    "error": "You do not have permission to use this extractor"
}
```

### 400 - No File Uploaded
```json
{
    "success": false,
    "error": "No file uploaded"
}
```

### 500 - Extraction Error
```json
{
    "success": false,
    "error": "OpenAI API error message..."
}
```

## Notes

1. **Authentication Required**: The endpoint requires user authentication. Make sure to include session cookies.

2. **File Types Supported**: PDF, PNG, JPG, JPEG files

3. **Extractor Ownership**: By default, users can only use extractors they created. To allow sharing, remove the ownership check in the code:
   ```python
   # Remove or comment out these lines:
   if extractor.user_id != current_user.id:
       return jsonify({'success': False, 'error': 'You do not have permission to use this extractor'}), 403
   ```

4. **Finding Extractor UUID**: 
   - Go to the workflow list page (`/index/extractor-list`)
   - The UUID is displayed in the "WORKFLOW ID" column
   - Use the copy icon to copy the UUID to clipboard

5. **Schema is Automatic**: You don't need to provide the schema - it's loaded from the saved extractor template using the UUID.
