# -*- encoding: utf-8 -*-
"""
Copyright (c) 2019 - present AppSeed.us
"""

from apps.home import blueprint
from flask import render_template, request, jsonify
from flask_login import login_required
from jinja2 import TemplateNotFound
import json
import os


@blueprint.route('/index')
@login_required
def index():

    return render_template('home/index.html', segment='index')


@blueprint.route('/index/extractor-extract')
@login_required
def extractor_extract():
    return render_template('home/extractor-extract.html', segment='extractor-extract')


@blueprint.route('/index/extractor-viewport')
@login_required  
def extractor_extract_viewport():
    return render_template('home/extractor-viewport.html', segment='extractor-viewport')


@blueprint.route('/create_bot', methods=['POST'])
def create_bot():
    """
    Handle PDF upload and page rendering for bot creation
    """
    try:
        # Get uploaded file
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'})
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'})
        
        # Get page number (default to 0)
        page_num = int(request.form.get('page_num', 0))
        
        # Save file temporarily
        import tempfile
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
            file.save(tmp_file.name)
            
            # Convert PDF page to image
            from apps.services.pdf_service import PDFService
            pdf_service = PDFService()
            
            result = pdf_service.convert_page_to_image(tmp_file.name, page_num)
            
            # Clean up temp file
            os.unlink(tmp_file.name)
            
            if result.get('error'):
                return jsonify({'error': result['error']})
            
            return jsonify({
                'image_url': result['image_url'],
                'page_count': result['page_count'],
                'pdf_width': result['pdf_width'],
                'pdf_height': result['pdf_height'],
                'target_width': result.get('target_width', 595),
                'target_height': result.get('target_height', 842),
                'paste_x': result.get('paste_x', 0),
                'paste_y': result.get('paste_y', 0)
            })
            
    except Exception as e:
        print(f"Create bot error: {str(e)}")
        return jsonify({'error': str(e)})


@blueprint.route('/extract_document', methods=['POST'])
def extract_document():
    """
    Handle document extraction with viewports and schema
    """
    try:
        # Get uploaded file
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file uploaded'})
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'})
        
        # Get schema and viewports
        schema_json = request.form.get('schema', '[]')
        viewports_json = request.form.get('viewports', '[]')
        
        schema = json.loads(schema_json)
        viewports = json.loads(viewports_json)
        
        # Read file content
        file_content = file.read()
        
        # Initialize the extraction service
        from apps.services.extraction_service import DocumentExtractionService
        extraction_service = DocumentExtractionService()
        
        # Convert schema format for extraction service
        schema_dict = {
            'fields': schema
        }
        
        # Extract data using OpenAI
        results = extraction_service.extract_from_file(file_content, schema_dict)
        
        return jsonify({
            'success': True,
            'data': results,
            'filename': file.filename,
            'viewports': viewports
        })
        
    except Exception as e:
        print(f"Document extraction error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})


@blueprint.route('/extract_text', methods=['POST'])
def extract_text():
    """
    Extract text from specific viewport coordinates (for legacy support)
    """
    try:
        # Get uploaded file
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'})
        
        file = request.files['file']
        page_num = int(request.form.get('page_num', 0))
        x0 = float(request.form.get('x0', 0))
        y0 = float(request.form.get('y0', 0))
        x1 = float(request.form.get('x1', 100))
        y1 = float(request.form.get('y1', 100))
        
        # For now, return dummy text extraction
        # In a real implementation, you would extract text from the specific coordinates
        dummy_texts = [
            "Invoice #INV-2024-001",
            "Amount: $1,234.56",
            "Date: 2024-05-19",
            "ABC Company Ltd.",
            "Website Development Services"
        ]
        
        import random
        return jsonify({'text': random.choice(dummy_texts)})
        
    except Exception as e:
        return jsonify({'error': str(e)})


@blueprint.route('/api/extract', methods=['POST'])
def api_extract():
    """
    API endpoint to handle document extraction using dummy data
    """
    try:
        # Get uploaded file
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file uploaded'})
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'})
        
        # Get schema configuration
        schema_json = request.form.get('schema', '{}')
        schema = json.loads(schema_json)
        
                # Read file content
        file_content = file.read()
        
        # Initialize the extraction service
        from apps.services.extraction_service import DocumentExtractionService
        extraction_service = DocumentExtractionService()
        
        # Extract data using OpenAI
        results = extraction_service.extract_from_file(file_content, schema)
        
        return jsonify({
            'success': True,
            'results': results,
            'filename': file.filename
        })
        
    except Exception as e:
        print(f"Extraction error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})


def generate_dummy_data(schema):
    """Generate dummy data based on the schema for testing"""
    results = {}
    
    for field in schema.get('fields', []):
        field_name = field.get('name', '')
        field_type = field.get('type', 'text')
        
        if field_type == 'table':
            # Generate dummy table data based on the screenshot
            if field_name.lower() == 'line_items':
                results[field_name] = [
                    {
                        "description": "Website development",
                        "item_total_amount": 6000,
                        "quantity": 1,
                        "unit_price": 6000
                    },
                    {
                        "description": "Website Hosting (Monthly)",
                        "item_total_amount": 600,
                        "quantity": 1,
                        "unit_price": 600
                    },
                    {
                        "description": "Domain Purchase - .com",
                        "item_total_amount": 70,
                        "quantity": 1,
                        "unit_price": 70
                    },
                    {
                        "description": "Website Support and Maintenance",
                        "item_total_amount": 5000,
                        "quantity": 1,
                        "unit_price": 5000
                    }
                ]
            else:
                # Generic table data
                subfield_data = {}
                for subfield in field.get('subfields', []):
                    subfield_type = subfield.get('type', 'text')
                    if subfield_type == 'number':
                        subfield_data[subfield['name']] = 100.00
                    elif subfield_type == 'date':
                        subfield_data[subfield['name']] = '2024-05-19'
                    else:
                        subfield_data[subfield['name']] = f"Sample {subfield['name']}"
                results[field_name] = [subfield_data]
        
        elif field_type == 'number':
            # Use specific values based on field name
            if 'total' in field_name.lower():
                results[field_name] = 11670
            elif 'tax' in field_name.lower():
                results[field_name] = 0
            else:
                results[field_name] = 123.45
        
        elif field_type == 'date':
            results[field_name] = '2024-05-19'
        
        elif field_type == 'boolean':
            results[field_name] = True
        
        else:
            # String fields with specific dummy data
            if 'date' in field_name.lower():
                results[field_name] = '2024-05-19'
            elif 'number' in field_name.lower():
                results[field_name] = 'INV19052024001'
            elif 'seller' in field_name.lower() or 'vendor' in field_name.lower():
                results[field_name] = 'Cemerlang IT & Network Solutions'
            elif 'amount' in field_name.lower():
                results[field_name] = '11670'
            else:
                results[field_name] = f"Sample {field_name} value"
    
    return results


@blueprint.route('/<template>')
@login_required
def route_template(template):

    try:

        if not template.endswith('.html'):
            template += '.html'

        # Detect the current page
        segment = get_segment(request)

        # Serve the file (if exists) from app/templates/home/FILE.html
        return render_template("home/" + template, segment=segment)

    except TemplateNotFound:
        return render_template('home/page-404.html'), 404

    except:
        return render_template('home/page-500.html'), 500


# Helper - Extract current page name from request
def get_segment(request):

    try:

        segment = request.path.split('/')[-1]

        if segment == '':
            segment = 'index'

        return segment

    except:
        return None
