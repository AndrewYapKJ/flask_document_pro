# -*- encoding: utf-8 -*-
"""
PDF Extraction Models
Database models for storing PDF extraction templates and results
"""

from datetime import datetime
from sqlalchemy import JSON
from sqlalchemy.orm import relationship
from apps import db


class ExtractionTemplate(db.Model):
    """Template for PDF extraction with field definitions"""
    
    __tablename__ = 'extraction_templates'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), nullable=False)
    description = db.Column(db.Text, nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Template metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    # Document metadata for position calculations
    document_metadata = db.Column(JSON, nullable=True)  # Store canvas dimensions, scale, etc.
    
    # Relationships
    fields = relationship("ExtractionField", back_populates="template", cascade="all, delete-orphan")
    extractions = relationship("ExtractionResult", back_populates="template")
    
    def __repr__(self):
        return f'<ExtractionTemplate {self.name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'is_active': self.is_active,
            'document_metadata': self.document_metadata,
            'fields': [field.to_dict() for field in self.fields]
        }


class ExtractionField(db.Model):
    """Individual field definition within an extraction template"""
    
    __tablename__ = 'extraction_fields'
    
    id = db.Column(db.Integer, primary_key=True)
    template_id = db.Column(db.Integer, db.ForeignKey('extraction_templates.id'), nullable=False)
    
    # Field properties
    name = db.Column(db.String(128), nullable=False)
    field_type = db.Column(db.String(32), nullable=False)  # text, number, date, boolean, table
    description = db.Column(db.Text, nullable=True)
    is_required = db.Column(db.Boolean, default=False)
    order_index = db.Column(db.Integer, default=0)
    
    # Position data for PDF extraction
    position_data = db.Column(JSON, nullable=True)  # Store coordinates, canvas info, page number
    
    # Relationships
    template = relationship("ExtractionTemplate", back_populates="fields")
    subfields = relationship("ExtractionSubfield", back_populates="field", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f'<ExtractionField {self.name} ({self.field_type})>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'type': self.field_type,
            'description': self.description,
            'is_required': self.is_required,
            'order_index': self.order_index,
            'position': self.position_data,
            'subfields': [subfield.to_dict() for subfield in self.subfields] if self.field_type == 'table' else []
        }


class ExtractionSubfield(db.Model):
    """Subfield definition for table-type fields"""
    
    __tablename__ = 'extraction_subfields'
    
    id = db.Column(db.Integer, primary_key=True)
    field_id = db.Column(db.Integer, db.ForeignKey('extraction_fields.id'), nullable=False)
    
    # Subfield properties
    name = db.Column(db.String(128), nullable=False)
    field_type = db.Column(db.String(32), nullable=False)  # text, number, date, boolean
    description = db.Column(db.Text, nullable=True)
    order_index = db.Column(db.Integer, default=0)
    
    # Relationship
    field = relationship("ExtractionField", back_populates="subfields")
    
    def __repr__(self):
        return f'<ExtractionSubfield {self.name} ({self.field_type})>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'type': self.field_type,
            'description': self.description,
            'order_index': self.order_index
        }


class ExtractionResult(db.Model):
    """Results from PDF extraction using a template"""
    
    __tablename__ = 'extraction_results'
    
    id = db.Column(db.Integer, primary_key=True)
    template_id = db.Column(db.Integer, db.ForeignKey('extraction_templates.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # File information
    original_filename = db.Column(db.String(256), nullable=False)
    file_size = db.Column(db.Integer, nullable=True)
    file_type = db.Column(db.String(32), nullable=True)
    file_hash = db.Column(db.String(128), nullable=True)  # For duplicate detection
    
    # Extraction metadata
    extraction_method = db.Column(db.String(32), nullable=False)  # 'with_position' or 'without_position'
    extraction_timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    processing_time_ms = db.Column(db.Integer, nullable=True)
    
    # Results data
    extracted_data = db.Column(JSON, nullable=False)  # The actual extracted values
    extraction_metadata = db.Column(JSON, nullable=True)  # Additional extraction info
    
    # Status tracking
    status = db.Column(db.String(32), default='completed')  # completed, failed, processing
    error_message = db.Column(db.Text, nullable=True)
    
    # Relationships
    template = relationship("ExtractionTemplate", back_populates="extractions")
    
    def __repr__(self):
        return f'<ExtractionResult {self.original_filename}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'template_id': self.template_id,
            'original_filename': self.original_filename,
            'file_size': self.file_size,
            'file_type': self.file_type,
            'extraction_method': self.extraction_method,
            'extraction_timestamp': self.extraction_timestamp.isoformat() if self.extraction_timestamp else None,
            'processing_time_ms': self.processing_time_ms,
            'extracted_data': self.extracted_data,
            'status': self.status,
            'error_message': self.error_message
        }


class SavedExtraction(db.Model):
    """User-saved extraction configurations for reuse"""
    
    __tablename__ = 'saved_extractions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Configuration details
    name = db.Column(db.String(128), nullable=False)
    description = db.Column(db.Text, nullable=True)
    schema_config = db.Column(JSON, nullable=False)  # Full schema configuration
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_used_at = db.Column(db.DateTime, nullable=True)
    usage_count = db.Column(db.Integer, default=0)
    is_favorite = db.Column(db.Boolean, default=False)
    
    def __repr__(self):
        return f'<SavedExtraction {self.name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'schema_config': self.schema_config,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_used_at': self.last_used_at.isoformat() if self.last_used_at else None,
            'usage_count': self.usage_count,
            'is_favorite': self.is_favorite
        }