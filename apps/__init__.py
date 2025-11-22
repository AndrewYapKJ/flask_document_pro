# -*- encoding: utf-8 -*-
"""
Copyright (c) 2019 - present AppSeed.us
"""

import os

from flask import Flask
from flask_login import LoginManager
from flask_sqlalchemy import SQLAlchemy
from importlib import import_module


db = SQLAlchemy()
login_manager = LoginManager()


def register_extensions(app):
    db.init_app(app)
    login_manager.init_app(app)


def register_blueprints(app):
    for module_name in ('authentication', 'home'):
        module = import_module('apps.{}.routes'.format(module_name))
        app.register_blueprint(module.blueprint)


def configure_database(app):
    # Database tables should be created using init_db.py script
    # Don't create tables automatically on every request - causes timeouts in production
    
    @app.teardown_request
    def shutdown_session(exception=None):
        db.session.remove()

from apps.authentication.oauth import github_blueprint

def create_app(config):
    app = Flask(__name__)
    app.config.from_object(config)
    register_extensions(app)
    # Import models so they are registered with SQLAlchemy before creating tables
    try:
        import apps.models.extractor  # noqa: F401
    except Exception:
        pass
    register_blueprints(app)
    app.register_blueprint(github_blueprint, url_prefix="/login")    
    configure_database(app)
    return app
