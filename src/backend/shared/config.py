"""
Configuration settings for the URL Shortener backend
"""
import os

# DynamoDB Configuration
DYNAMODB_TABLE = os.environ.get('DYNAMODB_TABLE', 'url-shortener-infra-links')
AWS_REGION = os.environ.get('AWS_REGION', 'us-east-1')

# URL Configuration
BASE_URL = os.environ.get('BASE_URL', 'https://ijlmwfo9gd.execute-api.us-east-1.amazonaws.com/dev')
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://url-shortener-infra-frontend-264449293739.s3-website-us-east-1.amazonaws.com')

# Short Code Configuration
SHORT_CODE_LENGTH = int(os.environ.get('SHORT_CODE_LENGTH', '6'))
MAX_URL_LENGTH = int(os.environ.get('MAX_URL_LENGTH', '2048'))
CUSTOM_CODE_MAX_LENGTH = int(os.environ.get('CUSTOM_CODE_MAX_LENGTH', '50'))
CUSTOM_CODE_MIN_LENGTH = int(os.environ.get('CUSTOM_CODE_MIN_LENGTH', '3'))

# Rate Limiting
MAX_ATTEMPTS = int(os.environ.get('MAX_ATTEMPTS', '5'))

# CORS Configuration
CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*')
CORS_METHODS = os.environ.get('CORS_METHODS', 'GET, POST, OPTIONS')
CORS_HEADERS = os.environ.get('CORS_HEADERS', 'Content-Type, X-Amz-Date, Authorization, X-Api-Key')