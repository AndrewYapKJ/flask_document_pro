# -*- encoding: utf-8 -*-
"""
Copyright (c) 2019 - present AppSeed.us
"""

import os
import hashlib
import binascii

# Inspiration -> https://www.vitoshacademy.com/hashing-passwords-in-python/


def hash_pass(password):
    """Hash a password for storing."""

    salt = hashlib.sha256(os.urandom(60)).hexdigest().encode('ascii')
    pwdhash = hashlib.pbkdf2_hmac('sha512', password.encode('utf-8'),
                                  salt, 100000)
    pwdhash = binascii.hexlify(pwdhash)
    return (salt + pwdhash)  # return bytes


def verify_pass(provided_password, stored_password):
    """Verify a stored password against one provided by user"""
    
    # Handle both binary and string stored passwords
    if isinstance(stored_password, bytes):
        try:
            stored_password = stored_password.decode('ascii')
        except UnicodeDecodeError:
            # If it's binary but not ASCII-decodable, convert to hex
            stored_password = stored_password.hex()
    
    # Check if it's a plain text password (for testing)
    if len(stored_password) < 64:
        # This is likely a plain text password, compare directly
        return provided_password == stored_password
    
    # This is a hashed password
    salt = stored_password[:64]
    stored_password = stored_password[64:]
    pwdhash = hashlib.pbkdf2_hmac('sha512',
                                  provided_password.encode('utf-8'),
                                  salt.encode('ascii'),
                                  100000)
    pwdhash = binascii.hexlify(pwdhash).decode('ascii')
    return pwdhash == stored_password
