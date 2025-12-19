import json
import boto3
from decimal import Decimal
from datetime import datetime

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
table = dynamodb.Table('url-shortener-infra-links')

def lambda_handler(event, context):
    """
    Lambda handler for admin links endpoint
    """
    print(f"AdminLinks event: {json.dumps(event)}")
    
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    }
    
    if event.get('httpMethod') == 'OPTIONS' or event.get('requestContext', {}).get('http', {}).get('method') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': ''
        }
    
    try:
        # Get query parameters
        query_params = event.get('queryStringParameters') or {}
        limit = int(query_params.get('limit', 50))
        last_key = None
        
        if query_params.get('lastKey'):
            try:
                last_key = json.loads(query_params['lastKey'])
            except json.JSONDecodeError:
                pass
        
        # Get links from database
        scan_kwargs = {'Limit': limit}
        
        if last_key:
            scan_kwargs['ExclusiveStartKey'] = last_key
            
        response = table.scan(**scan_kwargs)
        
        links = response.get('Items', [])
        
        # Convert Decimal types to int/float for JSON serialization
        links = convert_decimals(links)
        
        # Calculate statistics
        total_clicks = sum(link.get('click_count', 0) for link in links)
        average_clicks = total_clicks / len(links) if links else 0
        
        # Count today's links
        today = datetime.utcnow().date().isoformat()
        today_links = sum(1 for link in links if link.get('created_at', '').startswith(today))
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'links': links,
                'pagination': {
                    'lastKey': response.get('LastEvaluatedKey'),
                    'count': response.get('Count', 0)
                },
                'statistics': {
                    'totalLinks': len(links),
                    'totalClicks': total_clicks,
                    'averageClicks': round(average_clicks, 2),
                    'todayLinks': today_links
                }
            })
        }
    
    except Exception as e:
        print(f"Error listing links: {e}")
        
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'error': 'Internal server error'
            })
        }

def convert_decimals(obj):
    """Convert DynamoDB Decimal types to int/float for JSON serialization"""
    if isinstance(obj, list):
        return [convert_decimals(item) for item in obj]
    elif isinstance(obj, dict):
        return {key: convert_decimals(value) for key, value in obj.items()}
    elif isinstance(obj, Decimal):
        # Convert to int if it's a whole number, otherwise float
        if obj % 1 == 0:
            return int(obj)
        else:
            return float(obj)
    else:
        return obj