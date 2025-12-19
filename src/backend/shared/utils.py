"""
Utility functions for the URL Shortener backend
"""
import random
import string
import re
from datetime import datetime
from urllib.parse import urlparse
from typing import Optional


def generate_short_code(length: int = 6) -> str:
    """
    Generate a random short code using Base62 encoding
    
    Args:
        length: Length of the code to generate
        
    Returns:
        Random short code string
    """
    chars = string.ascii_letters + string.digits  # a-z, A-Z, 0-9
    return ''.join(random.choice(chars) for _ in range(length))


def is_valid_url(url: str) -> bool:
    """
    Validate URL format
    
    Args:
        url: URL string to validate
        
    Returns:
        True if valid URL, False otherwise
    """
    try:
        parsed = urlparse(url)
        return parsed.scheme in ['http', 'https'] and parsed.netloc
    except Exception:
        return False


def is_valid_custom_code(code: str) -> bool:
    """
    Validate custom short code format
    
    Args:
        code: Custom code to validate
        
    Returns:
        True if valid custom code, False otherwise
    """
    pattern = r'^[a-zA-Z0-9]{3,50}$'
    return bool(re.match(pattern, code))


def get_current_timestamp() -> str:
    """
    Generate current ISO timestamp
    
    Returns:
        ISO formatted timestamp string
    """
    return datetime.utcnow().isoformat() + 'Z'


def sanitize_url(url: str) -> str:
    """
    Sanitize and normalize URL
    
    Args:
        url: URL to sanitize
        
    Returns:
        Sanitized URL string
    """
    url = url.strip()
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url
    return url


def truncate_string(text: str, max_length: int) -> str:
    """
    Truncate string to maximum length
    
    Args:
        text: String to truncate
        max_length: Maximum allowed length
        
    Returns:
        Truncated string
    """
    if len(text) <= max_length:
        return text
    return text[:max_length - 3] + '...'