# -*- encoding: utf-8 -*-
"""
Copyright (c) 2019 - present AppSeed.us
"""

from openai import OpenAI
from apps.home import blueprint
from flask import render_template, request, jsonify
from flask_login import login_required, current_user
from jinja2 import TemplateNotFound
import json
import os
import logging

from apps.services.extraction_serviceV2 import DocumentExtractionServiceV2

logger = logging.getLogger(__name__)


@blueprint.route('/index')
@login_required
def index():

    return render_template('home/index.html', segment='index')


@blueprint.route('/index/extractor-invoice')
@login_required
def extractor_extract():
    return render_template('home/extractor-invoice.html', segment='extractor-invoice')

@blueprint.route('/index/extractor-viewport')
@login_required  
def extractor_extract_viewport():
    return render_template('home/extractor-viewport.html', segment='extractor-viewport')

@blueprint.route('/index/extractor-list')
@login_required  
def extractor_list():
    from apps.models.extractor import Extractor
    from apps import db
    
    # Fetch extractors belonging to the current user, ordered by creation date (newest first)
    extractors = Extractor.query.filter_by(user_id=current_user.id).order_by(Extractor.created_at.desc()).all()
    
    return render_template('home/extractor-list.html', segment='extractor-list', workflows=extractors)

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
        logger.exception("Create bot error: %s", e)
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
        
        # Get schema and viewports or an extractor_id referencing a stored schema
        schema_json = request.form.get('schema', '[]')
        viewports_json = request.form.get('viewports', '[]')
        extractor_id = request.form.get('extractor_id')

        viewports = json.loads(viewports_json)

        schema = None
        if extractor_id:
            try:
                from apps.models.extractor import Extractor
                from apps import db

                extractor = db.session.get(Extractor, int(extractor_id))
                if extractor:
                    schema = extractor.schema
                else:
                    return jsonify({'success': False, 'error': f'Extractor id {extractor_id} not found'})
            except Exception as e:
                return jsonify({'success': False, 'error': str(e)})
        else:
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
        
        # Extract data using OpenAI
        results = extraction_service.extract_from_file(file_content, schema_dict)

        return jsonify({
            'success': True,
            'results': results,
            'filename': file.filename,
            'viewports': viewports
        })
        
    except Exception as e:
        logger.exception("Document extraction error: %s", e)
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
    API endpoint to handle document extraction and save results
    """
    try:
        # Get uploaded file
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file uploaded'})
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'})
        
        # Get schema configuration and extractor_id
        schema_json = request.form.get('schema', '{}')
        schema = json.loads(schema_json)
        extractor_id = request.form.get('extractor_id')
        
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
            'filename': file.filename,
            'extractor_id': extractor_id
        })
        
    except Exception as e:
        logger.exception("Extraction error: %s", e)
        return jsonify({'success': False, 'error': str(e)})


# @blueprint.route('/api/extract/<extractor_uid>', methods=['POST'])
# def api_extract_by_uid(extractor_uid):
#     try:
#         from flask import current_app
#         from apps.authentication.models import Users
#         from apps.models.extractor import Extractor

#         api_key = request.headers.get('X-API-Key')
#         if not api_key:
#             return jsonify({'success': False, 'error': 'API key required.'}), 401

#         is_master_key = (api_key == current_app.config.get('MASTER_API_KEY'))
#         if not is_master_key:
#             user = Users.query.filter_by(api_key=api_key).first()
#             if not user:
#                 return jsonify({'success': False, 'error': 'Invalid API key'}), 401
#         else:
#             user = None

#         extractor = Extractor.query.filter_by(uid=extractor_uid).first()
#         if not extractor:
#             return jsonify({'success': False, 'error': f'Extractor {extractor_uid} not found'}), 404

#         if not is_master_key and user and extractor.user_id != user.id:
#             return jsonify({'success': False, 'error': 'No permission to use this extractor'}), 403

#         if 'file' not in request.files or request.files['file'].filename == '':
#             return jsonify({'success': False, 'error': 'No file uploaded'}), 400

#         file_content = request.files['file'].read()
#         schema = extractor.schema

#         # Initialize OpenAI client
#         openai =  os.getenv('OPENAI_API_KEY')
#         extraction_service = DocumentExtractionServiceV2(client=openai)

#         results = extraction_service.extract_from_file(file_content, schema)

#         return jsonify({
#             'success': True,
#             'results': results,
#             'filename': request.files['file'].filename,
#             'extractor': {
#                 'uid': extractor.uid,
#                 'name': extractor.name,
#                 'schema': extractor.schema
#             }
#         })

#     except Exception as e:
#         logger.exception("Extraction error: %s", e)
#         return jsonify({'success': False, 'error': str(e)}), 500



@blueprint.route('/api/extract/<extractor_uid>', methods=['POST'])
def api_extract_by_uid(extractor_uid):
    """
    API endpoint to extract document using saved extractor template by UUID
    Requires API key authentication via X-API-Key header
    
    Supports two types of authentication:
    1. Master API Key (set in config/environment) - bypasses user ownership checks
    2. User API Key (generated per user) - checks extractor ownership
    
    Usage:
    POST /api/extract/<extractor_uid>
    Headers: X-API-Key: your-api-key-here
    Body: multipart/form-data with 'file' field (PDF or image)
    
    Returns:
    {
        "success": true,
        "results": {...},
        "filename": "document.pdf",
        "extractor": {
            "uid": "...",
            "name": "...",
            "schema": {...}
        }
    }
    """
    try:
        from flask import current_app
        from apps.authentication.models import Users
        from apps.models.extractor import Extractor
        from apps.services.extraction_service import DocumentExtractionService
        
        # Check for API key in headers
        api_key = request.headers.get('X-API-Key')
        
        if not api_key:
            return jsonify({
                'success': False, 
                'error': 'API key required. Please provide X-API-Key header'
            }), 401
        
        # Check if it's the master API key
        is_master_key = (api_key == current_app.config.get('MASTER_API_KEY'))
        
        # If not master key, validate as user API key
        if not is_master_key:
            user = Users.query.filter_by(api_key=api_key).first()
            
            if not user:
                return jsonify({
                    'success': False, 
                    'error': 'Invalid API key'
                }), 401
        else:
            user = None  # Master key doesn't need a user
        
        # Find extractor by UID
        extractor = Extractor.query.filter_by(uid=extractor_uid).first()
        
        if not extractor:
            return jsonify({'success': False, 'error': f'Extractor with UID {extractor_uid} not found'}), 404
        
        # Check if extractor belongs to the user (skip check for master key)
        if not is_master_key and user:
            if extractor.user_id is not None and extractor.user_id != user.id:
                return jsonify({
                    'success': False, 
                    'error': 'You do not have permission to use this extractor'
                }), 403
         
        # Get uploaded file
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        
        # Read file content
        file_content = file.read()
        
        # Use the extractor's schema
        schema = extractor.schema
        
        # Initialize the extraction service
        extraction_service = DocumentExtractionService()
        
        # Extract data using OpenAI
        results = extraction_service.extract_from_file(file_content, schema)
        
        return jsonify({
            'success': True,
            'results': results,
            'filename': file.filename,
            'extractor': {
                'uid': extractor.uid,
                'name': extractor.name,
                'schema': extractor.schema
            }
        })
        
    except Exception as e:
        logger.exception("Extraction error: %s", e)
        return jsonify({'success': False, 'error': str(e)}), 500


@blueprint.route('/api/key', methods=['GET'])
@login_required
def get_api_key():
    """
    Get or generate API key for the current user
    """
    from apps import db
    
    # Generate API key if user doesn't have one
    if not current_user.api_key:
        import secrets
        current_user.api_key = secrets.token_urlsafe(32)
        db.session.commit()
    
    return jsonify({
        'success': True,
        'api_key': current_user.api_key
    })


@blueprint.route('/api/key/regenerate', methods=['POST'])
@login_required
def regenerate_api_key():
    """
    Regenerate API key for the current user
    """
    from apps import db
    import secrets
    
    current_user.api_key = secrets.token_urlsafe(32)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'api_key': current_user.api_key,
        'message': 'API key regenerated successfully'
    })


@blueprint.route('/api/extractors', methods=['POST'])
def api_create_extractor():
    """
    Create a new extractor (bot) with a name and schema JSON
    """
    try:
        name = request.form.get('name') or request.json.get('name')
        description = request.form.get('description') or request.json.get('description')
        schema_json = request.form.get('schema') or (request.json.get('schema') if request.is_json else None)

        if not name or not schema_json:
            return jsonify({'success': False, 'error': 'name and schema are required'}), 400

        schema = schema_json if isinstance(schema_json, dict) else json.loads(schema_json)

        from apps.models.extractor import Extractor
        from apps import db

        # Get user_id if user is authenticated
        user_id = current_user.id if current_user.is_authenticated else None

        extractor = Extractor(name=name, description=description, schema=schema, user_id=user_id)

        # Generate a unique uid and attempt to commit. If a collision occurs (very rare with UUID4),
        # retry a few times before failing.
        from sqlalchemy.exc import IntegrityError

        max_attempts = 5
        for attempt in range(max_attempts):
            extractor.uid = Extractor.generate_uid()
            db.session.add(extractor)
            try:
                db.session.commit()
                break
            except IntegrityError as ie:
                # UID collision or other unique constraint violation; rollback and retry UID
                db.session.rollback()
                if attempt == max_attempts - 1:
                    raise ie
                # otherwise, try again with a new uid
                continue

        return jsonify({'success': True, 'extractor': extractor.to_dict()})

    except Exception as e:
        logger.exception("Create extractor error: %s", e)
        return jsonify({'success': False, 'error': str(e)}), 500


@blueprint.route('/api/extractors/<int:extractor_id>', methods=['PUT'])
@login_required
def api_update_extractor(extractor_id):
    """
    Update an extractor's name (only the owner can update)
    """
    try:
        from apps.models.extractor import Extractor
        from apps import db
        
        # Find the extractor
        extractor = Extractor.query.filter_by(id=extractor_id, user_id=current_user.id).first()
        
        if not extractor:
            return jsonify({'success': False, 'error': 'Extractor not found or you do not have permission to edit it'}), 404
        
        # Get new name from request
        data = request.get_json()
        new_name = data.get('name', '').strip()
        
        if not new_name:
            return jsonify({'success': False, 'error': 'Name cannot be empty'}), 400
        
        # Update the name
        extractor.name = new_name
        db.session.commit()
        
        return jsonify({'success': True, 'extractor': extractor.to_dict()})
    
    except Exception as e:
        logger.exception("Update extractor error: %s", e)
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


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


@blueprint.route('/api/extractors/list', methods=['GET'])
def api_list_extractors():
    """
    Get list of extractors for a specific user
    Requires:
    - Header: X-API-Key with MASTER_API_KEY
    - Query param: username
    
    Returns:
    - List of extractors with name and uid (uuid)
    """
    try:
        from flask import current_app
        from apps.authentication.models import Users
        from apps.models.extractor import Extractor
        
        # Check for Master API key in headers
        api_key = request.headers.get('X-API-Key')
        
        if not api_key:
            return jsonify({
                'success': False, 
                'error': 'API key required. Please provide X-API-Key header with master token'
            }), 401
        
        # Verify it's the master API key
        master_key = current_app.config.get('MASTER_API_KEY')
        if api_key != master_key:
            return jsonify({
                'success': False, 
                'error': 'Invalid master API key'
            }), 403
        
        # Get username from query parameter
        username = request.args.get('username')
        
        if not username:
            return jsonify({
                'success': False, 
                'error': 'username parameter is required'
            }), 400
        
        # Find user by username
        user = Users.query.filter_by(username=username).first()
        
        if not user:
            return jsonify({
                'success': False, 
                'error': f'User not found: {username}'
            }), 404
        
        # Get all extractors for this user
        extractors = Extractor.query.filter_by(user_id=user.id).order_by(Extractor.created_at.desc()).all()
        
        # Format response with only name and uid
        extractor_list = [
            {
                'name': extractor.name,
                'uuid': extractor.uid
            }
            for extractor in extractors
        ]
        
        return jsonify({
            'success': True,
            'username': username,
            'user_id': user.id,
            'count': len(extractor_list),
            'extractors': extractor_list
        }), 200
        
    except Exception as e:
        logger.exception("List extractors error: %s", e)
        return jsonify({
            'success': False, 
            'error': str(e)
        }), 500


# Helper - Extract current page name from request
def get_segment(request):

    try:

        segment = request.path.split('/')[-1]

        if segment == '':
            segment = 'index'

        return segment

    except:
        return None
