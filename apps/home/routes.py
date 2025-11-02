# -*- encoding: utf-8 -*-
"""
Copyright (c) 2019 - present AppSeed.us
"""

from apps.home import blueprint
from flask import render_template, request, jsonify
from flask_login import login_required, current_user
from jinja2 import TemplateNotFound
import json
import os
from apps import db
from apps.models.extraction_models import ExtractionTemplate, ExtractionField, ExtractionSubfield, ExtractionResult, SavedExtraction


@blueprint.route('/index')
@login_required
def index():

    return render_template('home/index.html', segment='index')
@blueprint.route('/index/bot_list')
@login_required
def bot_list():
    return render_template('home/bot_list.html', segment='bot_list')


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
        extraction_type = request.form.get('extraction_type', 'with_position')  # default to position-based
        
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
        
        # Extract data using OpenAI based on extraction type
        if extraction_type == 'without_position':
            results = extraction_service.extract_without_position(file_content, schema_dict)
        else:
            results = extraction_service.extract_with_position(file_content, schema_dict)
        
        return jsonify({
            'success': True,
            'data': results,
            'filename': file.filename,
            'viewports': viewports,
            'extraction_type': extraction_type
        })
        
    except Exception as e:
        print(f"Document extraction error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})


@blueprint.route('/extract_document_basic', methods=['POST'])
def extract_document_basic():
    """
    Handle basic document extraction without position information
    """
    try:
        # Get uploaded file
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file uploaded'})
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'})
        
        # Get schema only (no viewports needed for basic extraction)
        schema_json = request.form.get('schema', '[]')
        schema = json.loads(schema_json)
        
        # Read file content
        file_content = file.read()
        
        # Initialize the extraction service
        from apps.services.extraction_service import DocumentExtractionService
        extraction_service = DocumentExtractionService()
        
        # Convert schema format for extraction service
        schema_dict = {
            'fields': schema
        }
        
        # Extract data without position information
        results = extraction_service.extract_without_position(file_content, schema_dict)
        
        return jsonify({
            'success': True,
            'data': results,
            'filename': file.filename,
            'extraction_type': 'basic'
        })
        
    except Exception as e:
        print(f"Basic document extraction error: {str(e)}")
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


# Page to list created extraction templates (from pdf_extraction_templates)
@blueprint.route('/extractions')
@login_required
def extractions_list():
    """Render a page listing created PDF extraction templates and their fields"""
    try:
        # Query templates and their fields using raw SQL to avoid missing models
        sql_templates = "SELECT id, name, description, is_position_based, created_at FROM dbo.pdf_extraction_templates ORDER BY created_at DESC"
        templates = []
        with db.engine.connect() as conn:
            res = conn.execute(sql_templates)
            for row in res:
                tid = row['id']
                # fetch fields for this template
                sql_fields = "SELECT id, name, field_type, is_required, is_unique, properties_json, sort_order FROM dbo.pdf_extraction_fields WHERE template_id = ? ORDER BY sort_order"
                fields = []
                # use parameterized query compatible with pyodbc
                fres = conn.execute(sql_fields, (str(tid),))
                for f in fres:
                    fields.append({
                        'id': f['id'],
                        'name': f['name'],
                        'field_type': f['field_type'],
                        'is_required': f['is_required'],
                        'is_unique': f['is_unique'],
                        'properties_json': f['properties_json'],
                        'sort_order': f['sort_order']
                    })

                templates.append({
                    'id': tid,
                    'name': row['name'],
                    'description': row['description'],
                    'is_position_based': row['is_position_based'],
                    'created_at': row['created_at'],
                    'fields': fields
                })

        return render_template('home/extractions.html', templates=templates, segment='extractions')

    except Exception as e:
        print('Error loading extractions list:', str(e))
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


# API Endpoints for PDF Extraction Templates
@blueprint.route('/api/templates', methods=['GET'])
@login_required
def get_extraction_templates():
    """Get all extraction templates for the current user"""
    templates = ExtractionTemplate.query.filter_by(
        user_id=current_user.id, 
        is_active=True
    ).order_by(ExtractionTemplate.updated_at.desc()).all()
    
    return jsonify({
        'success': True,
        'templates': [template.to_dict() for template in templates]
    })


@blueprint.route('/api/templates', methods=['POST'])
@login_required 
def create_extraction_template():
    """Create a new extraction template"""
    try:
        data = request.get_json()
        
        # Create template
        template = ExtractionTemplate(
            name=data.get('name'),
            description=data.get('description'),
            user_id=current_user.id,
            document_metadata=data.get('document_metadata')
        )
        db.session.add(template)
        db.session.flush()  # Get the template ID
        
        # Create fields
        for field_data in data.get('fields', []):
            field = ExtractionField(
                template_id=template.id,
                name=field_data.get('name'),
                field_type=field_data.get('type'),
                description=field_data.get('description'),
                is_required=field_data.get('is_required', False),
                order_index=field_data.get('order_index', 0),
                position_data=field_data.get('position')
            )
            db.session.add(field)
            db.session.flush()  # Get the field ID
            
            # Create subfields for table types
            if field_data.get('type') == 'table':
                for subfield_data in field_data.get('subfields', []):
                    subfield = ExtractionSubfield(
                        field_id=field.id,
                        name=subfield_data.get('name'),
                        field_type=subfield_data.get('type'),
                        description=subfield_data.get('description'),
                        order_index=subfield_data.get('order_index', 0)
                    )
                    db.session.add(subfield)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'template': template.to_dict(),
            'message': 'Template created successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@blueprint.route('/api/templates/<int:template_id>', methods=['GET'])
@login_required
def get_extraction_template(template_id):
    """Get a specific extraction template"""
    template = ExtractionTemplate.query.filter_by(
        id=template_id,
        user_id=current_user.id
    ).first()
    
    if not template:
        return jsonify({
            'success': False,
            'error': 'Template not found'
        }), 404
        
    return jsonify({
        'success': True,
        'template': template.to_dict()
    })


@blueprint.route('/api/templates/<int:template_id>/results', methods=['POST'])
@login_required
def save_extraction_result(template_id):
    """Save extraction results"""
    try:
        data = request.get_json()
        
        result = ExtractionResult(
            template_id=template_id,
            user_id=current_user.id,
            original_filename=data.get('filename'),
            file_size=data.get('file_size'),
            file_type=data.get('file_type'),
            file_hash=data.get('file_hash'),
            extraction_method=data.get('extraction_method'),
            processing_time_ms=data.get('processing_time_ms'),
            extracted_data=data.get('extracted_data'),
            extraction_metadata=data.get('extraction_metadata'),
            status=data.get('status', 'completed'),
            error_message=data.get('error_message')
        )
        
        db.session.add(result)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'result': result.to_dict(),
            'message': 'Extraction result saved successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@blueprint.route('/api/extractions/saved', methods=['GET'])
@login_required
def get_saved_extractions():
    """Get user's saved extraction configurations"""
    saved = SavedExtraction.query.filter_by(
        user_id=current_user.id
    ).order_by(SavedExtraction.last_used_at.desc().nullslast(), SavedExtraction.created_at.desc()).all()
    
    return jsonify({
        'success': True,
        'saved_extractions': [config.to_dict() for config in saved]
    })


@blueprint.route('/api/extractions/saved', methods=['POST']) 
@login_required
def save_extraction_config():
    """Save an extraction configuration for reuse"""
    try:
        data = request.get_json()
        
        saved = SavedExtraction(
            user_id=current_user.id,
            name=data.get('name'),
            description=data.get('description'),
            schema_config=data.get('schema_config')
        )
        
        db.session.add(saved)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'saved_extraction': saved.to_dict(),
            'message': 'Extraction configuration saved successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
