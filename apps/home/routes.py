# -*- encoding: utf-8 -*-
"""
Copyright (c) 2019 - present AppSeed.us
"""

from apps.home import blueprint
from flask import render_template, request, jsonify
from flask_login import login_required
from jinja2 import TemplateNotFound
import json


@blueprint.route('/index')
@login_required
def index():

    return render_template('home/index.html', segment='index')


@blueprint.route('/index/extractor-extract')
@login_required
def extractor_extract():
    return render_template('home/extractor-extract.html', segment='extractor-extract')


@blueprint.route('/api/extract', methods=['POST'])
@login_required
def api_extract():
    """
    API endpoint to handle document extraction
    This is a mock implementation - replace with actual extraction logic
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
        
        # Mock extraction results based on schema
        results = {}
        for field in schema.get('fields', []):
            field_name = field.get('name', '')
            field_type = field.get('type', 'text')
            
            if field_type == 'table':
                # Mock table data
                results[field_name] = [
                    {subfield['name']: f"Sample {subfield['name']} 1" for subfield in field.get('subfields', [])},
                    {subfield['name']: f"Sample {subfield['name']} 2" for subfield in field.get('subfields', [])}
                ]
            elif field_type == 'number':
                results[field_name] = 123.45
            elif field_type == 'date':
                results[field_name] = '2025-01-01'
            elif field_type == 'boolean':
                results[field_name] = True
            else:
                results[field_name] = f"Sample {field_name} value"
        
        return jsonify({
            'success': True,
            'results': results,
            'filename': file.filename
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


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
