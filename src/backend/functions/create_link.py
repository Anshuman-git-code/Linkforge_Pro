import json
import boto3
import random
import string
import re
from datetime import datetime
from urllib.parse import urlparse
from decimal import Decimal

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
table = dynamodb.Table('url-shortener-infra-links')

def lambda_handler(event, context):
    """
    Lambda handler for creating short links
    """
    print(f"CreateLink event: {json.dumps(event)}")
    
    # CORS headers
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    }
    
    # Handle OPTIONS request
    if event.get('httpMethod') == 'OPTIONS' or event.get('requestContext', {}).get('http', {}).get('method') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': ''
        }
    
    try:
        # Parse request body
        try:
            body = json.loads(event.get('body', '{}'))
        except json.JSONDecodeError:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({
                    'success': False,
                    'error': 'Invalid JSON in request body'
                })
            }
        
        url = body.get('url')
        custom_code = body.get('customCode')
        
        # Validate required fields
        if not url:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({
                    'success': False,
                    'error': 'URL is required'
                })
            }
        
        # Validate URL format
        if not is_valid_url(url):
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({
                    'success': False,
                    'error': 'Invalid URL format'
                })
            }
        
        # Validate URL length
        if len(url) > 2048:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({
                    'success': False,
                    'error': 'URL too long (max 2048 characters)'
                })
            }
        
        short_code = None
        is_custom = False
        
        # Handle custom code
        if custom_code:
            if not is_valid_custom_code(custom_code):
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({
                        'success': False,
                        'error': 'Invalid custom code (3-50 alphanumeric characters only)'
                    })
                }
            short_code = custom_code
            is_custom = True
        else:
            # Generate random code with collision handling
            attempts = 0
            max_attempts = 5
            
            while attempts < max_attempts:
                short_code = generate_short_code(6)
                try:
                    # Check if code exists
                    response = table.get_item(Key={'code': short_code})
                    if 'Item' not in response:
                        break  # Code is available
                    attempts += 1
                except Exception as e:
                    print(f"Error checking code existence: {e}")
                    attempts += 1
            
            if attempts >= max_attempts:
                return {
                    'statusCode': 500,
                    'headers': headers,
                    'body': json.dumps({
                        'success': False,
                        'error': 'Unable to generate unique short code'
                    })
                }
        
        # Create link in database
        timestamp = datetime.utcnow().isoformat() + 'Z'
        
        item = {
            'code': short_code,
            'target_url': url,
            'created_at': timestamp,
            'click_count': 0,
            'custom_code': is_custom
        }
        
        try:
            # Use condition to prevent overwrites
            table.put_item(
                Item=item,
                ConditionExpression='attribute_not_exists(code)'
            )
        except Exception as e:
            if 'ConditionalCheckFailedException' in str(e):
                return {
                    'statusCode': 409,
                    'headers': headers,
                    'body': json.dumps({
                        'success': False,
                        'error': 'Custom code already exists'
                    })
                }
            raise e
        
        # Return success response
        return {
            'statusCode': 201,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'shortCode': short_code,
                'shortUrl': f"https://ijlmwfo9gd.execute-api.us-east-1.amazonaws.com/dev/{short_code}",
                'targetUrl': url,
                'createdAt': timestamp
            })
        }
    
    except Exception as e:
        print(f"Error creating link: {e}")
        
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'error': 'Internal server error'
            })
        }

def generate_short_code(length=6):
    """Generate a random short code using Base62 encoding"""
    chars = string.ascii_letters + string.digits  # a-z, A-Z, 0-9
    return ''.join(random.choice(chars) for _ in range(length))

def is_valid_url(url):
    """Validate URL format"""
    try:
        parsed = urlparse(url)
        return parsed.scheme in ['http', 'https'] and parsed.netloc
    except Exception:
        return False

def is_valid_custom_code(code):
    """Validate custom short code"""
    pattern = r'^[a-zA-Z0-9]{3,50}$'
    return bool(re.match(pattern, code))