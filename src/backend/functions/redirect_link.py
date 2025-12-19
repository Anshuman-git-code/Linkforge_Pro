import json
import boto3
from decimal import Decimal

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
table = dynamodb.Table('url-shortener-infra-links')

def lambda_handler(event, context):
    """
    Lambda handler for redirecting short links
    """
    print(f"RedirectLink event: {json.dumps(event)}")
    
    try:
        # Extract short code from path
        path_params = event.get('pathParameters') or {}
        short_code = path_params.get('code')
        
        if not short_code:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'text/html'},
                'body': '''
                <!DOCTYPE html>
                <html>
                <head><title>Invalid Link</title></head>
                <body>
                    <h1>Invalid Link</h1>
                    <p>No short code provided.</p>
                </body>
                </html>
                '''
            }
        
        # Look up the link
        try:
            response = table.get_item(Key={'code': short_code})
            link = response.get('Item')
        except Exception as e:
            print(f"Error getting link: {e}")
            link = None
        
        if not link:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'text/html'},
                'body': f'''
                <!DOCTYPE html>
                <html>
                <head><title>Link Not Found</title></head>
                <body>
                    <h1>Link Not Found</h1>
                    <p>The short link "{short_code}" does not exist.</p>
                    <p><a href="http://url-shortener-infra-frontend-264449293739.s3-website-us-east-1.amazonaws.com">Create a new short link</a></p>
                </body>
                </html>
                '''
            }
        
        # Increment click count asynchronously (don't wait for it to complete)
        try:
            table.update_item(
                Key={'code': short_code},
                UpdateExpression='ADD click_count :inc',
                ExpressionAttributeValues={':inc': 1}
            )
        except Exception as e:
            print(f"Failed to increment click count: {e}")
            # Don't fail the redirect for this
        
        # Redirect to target URL
        return {
            'statusCode': 301,
            'headers': {
                'Location': link['target_url'],
                'Cache-Control': 'no-cache'
            },
            'body': ''
        }
    
    except Exception as e:
        print(f"Error in redirect function: {e}")
        
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'text/html'},
            'body': '''
            <!DOCTYPE html>
            <html>
            <head><title>Server Error</title></head>
            <body>
                <h1>Server Error</h1>
                <p>An error occurred while processing your request.</p>
            </body>
            </html>
            '''
        }