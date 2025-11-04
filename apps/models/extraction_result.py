from datetime import datetime
from apps import db


class ExtractionResult(db.Model):
    __tablename__ = 'extraction_results'

    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(512), nullable=True)
    data = db.Column(db.JSON, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<ExtractionResult id={self.id} filename={self.filename} created_at={self.created_at}>"
