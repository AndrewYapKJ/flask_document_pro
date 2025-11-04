# -*- encoding: utf-8 -*-
"""
Copyright (c) 2019 - present AppSeed.us
"""

import os, random, string

class Config(object):

    basedir = os.path.abspath(os.path.dirname(__file__))

    # Assets Management
    ASSETS_ROOT = os.getenv('ASSETS_ROOT', '/static/assets')  
    
    # Set up the App SECRET_KEY
    SECRET_KEY  = os.getenv('SECRET_KEY', None)
    if not SECRET_KEY:
        SECRET_KEY = ''.join(random.choice( string.ascii_lowercase  ) for i in range( 32 ))

    # Social AUTH context
    SOCIAL_AUTH_GITHUB  = False

    GITHUB_ID      = os.getenv('GITHUB_ID'    , None)
    GITHUB_SECRET  = os.getenv('GITHUB_SECRET', None)

    # Enable/Disable Github Social Login    
    if GITHUB_ID and GITHUB_SECRET:
         SOCIAL_AUTH_GITHUB  = True        

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    DB_CONFIG = {
        'driver': '{ODBC Driver 17 for SQL Server}',
        'server': 'localhost',
        'database': 'DocumentPro',
        'username': 'sa',
        'password': 'VeryStr0ngP@ssw0rd'
    }
    
    # Primary database URI (SQL Server) - URL encode the password
    from urllib.parse import quote_plus
    try:
        encoded_password = quote_plus(DB_CONFIG['password'])
        SQLALCHEMY_DATABASE_URI = (
            f"mssql+pyodbc://{DB_CONFIG['username']}:{encoded_password}@"
            f"{DB_CONFIG['server']}/{DB_CONFIG['database']}?driver=ODBC+Driver+17+for+SQL+Server"
        )
    except:
        # Fallback to SQLite
        basedir = os.path.abspath(os.path.dirname(__file__))
        SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(basedir, 'db.sqlite3')
    
class ProductionConfig(Config):
    DEBUG = False

    # Security
    SESSION_COOKIE_HTTPONLY = True
    REMEMBER_COOKIE_HTTPONLY = True
    REMEMBER_COOKIE_DURATION = 3600

class DebugConfig(Config):
    DEBUG = True

# Load all possible configurations
config_dict = {
    'Production': ProductionConfig,
    'Debug'     : DebugConfig
}
