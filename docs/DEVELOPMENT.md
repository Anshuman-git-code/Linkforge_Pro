# Development Guide

## Getting Started

### Prerequisites

- **Node.js** 16+ (for deployment scripts and package management)
- **Python** 3.9+ (for Lambda functions)
- **AWS CLI** configured with appropriate permissions
- **Git** for version control
- **Code Editor** (VS Code recommended)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/linkforge-pro.git
   cd linkforge-pro
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Python environment**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install boto3
   ```

## Project Structure

```
linkforge-pro/
├── src/
│   ├── backend/              # Lambda functions
│   │   ├── functions/        # Individual function handlers
│   │   └── shared/           # Shared utilities
│   └── frontend/             # Web application
│       ├── assets/           # JS, CSS files
│       ├── index.html        # Main page
│       └── admin.html        # Admin dashboard
├── infrastructure/           # CloudFormation templates
├── config/                   # Environment configurations
├── scripts/                  # Deployment and utility scripts
├── docs/                     # Documentation
└── tests/                    # Test suites (to be implemented)
```

## Development Workflow

### 1. Frontend Development

#### Local Development Server
```bash
cd src/frontend
python3 -m http.server 8000
# Open http://localhost:8000
```

#### Frontend Architecture
- **Vanilla JavaScript**: No frameworks, pure ES6+
- **CSS3**: Modern styling with Flexbox/Grid
- **Progressive Enhancement**: Works without JavaScript
- **Responsive Design**: Mobile-first approach

#### Key Files
- `assets/app.js`: Main application logic
- `assets/admin.js`: Admin dashboard functionality
- `assets/styles.css`: All styling
- `index.html`: Main URL shortener page
- `admin.html`: Analytics dashboard

#### Frontend Features
- **Demo Mode**: Works offline with mock data
- **Real-time Updates**: Connects to live backend when available
- **QR Code Generation**: Multiple fallback methods
- **Copy Functionality**: Cross-browser clipboard support
- **Error Handling**: Graceful degradation

### 2. Backend Development

#### Lambda Function Structure
```python
def lambda_handler(event, context):
    """
    Standard Lambda handler function
    """
    # CORS headers
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    }
    
    # Handle OPTIONS requests
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}
    
    try:
        # Business logic here
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'success': True})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'success': False, 'error': str(e)})
        }
```

#### Testing Lambda Functions Locally
```bash
# Test create_link function
cd src/backend/functions
python3 -c "
import create_link
import json
event = {
    'httpMethod': 'POST',
    'body': json.dumps({'url': 'https://example.com'})
}
result = create_link.lambda_handler(event, {})
print(json.dumps(result, indent=2))
"
```

#### DynamoDB Local Development
```bash
# Install DynamoDB Local
npm install -g dynamodb-local

# Start DynamoDB Local
dynamodb-local

# Create local table
aws dynamodb create-table \
  --table-name url-shortener-dev-links \
  --attribute-definitions AttributeName=code,AttributeType=S \
  --key-schema AttributeName=code,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --endpoint-url http://localhost:8000
```

### 3. Infrastructure Development

#### CloudFormation Best Practices
- Use parameters for environment-specific values
- Include comprehensive outputs
- Add resource tags for organization
- Use least privilege IAM policies

#### Validating Templates
```bash
aws cloudformation validate-template \
  --template-body file://infrastructure/cloudformation/infrastructure.yaml
```

#### Testing Infrastructure Changes
```bash
# Deploy to development environment first
./scripts/deploy/deploy-infrastructure.sh development

# Test functionality
curl https://dev-api-url.com/admin/links

# Deploy to production
./scripts/deploy/deploy-infrastructure.sh production
```

## Configuration Management

### Environment Configuration Files

Each environment has its own configuration in `config/environments/`:

```json
{
  "environment": "development",
  "aws": {
    "region": "us-east-1",
    "stackName": "linkforge-dev"
  },
  "frontend": {
    "demoMode": true,
    "shortDomain": "localhost:3000"
  },
  "features": {
    "customCodes": true,
    "analytics": true,
    "qrCodes": true,
    "debugMode": true
  }
}
```

### Feature Flags

Control features through configuration:
- `customCodes`: Enable custom short code creation
- `analytics`: Enable click tracking
- `qrCodes`: Enable QR code generation
- `debugMode`: Enable debug logging

## Testing Strategy

### Unit Testing (To Be Implemented)

#### Backend Tests
```python
# tests/backend/test_create_link.py
import unittest
from src.backend.functions import create_link

class TestCreateLink(unittest.TestCase):
    def test_valid_url(self):
        event = {
            'httpMethod': 'POST',
            'body': '{"url": "https://example.com"}'
        }
        result = create_link.lambda_handler(event, {})
        self.assertEqual(result['statusCode'], 201)
```

#### Frontend Tests
```javascript
// tests/frontend/test_app.js
describe('URL Validation', () => {
  test('should validate HTTP URLs', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
    expect(isValidUrl('http://example.com')).toBe(true);
    expect(isValidUrl('invalid-url')).toBe(false);
  });
});
```

### Integration Testing

#### API Testing
```bash
# Test create link endpoint
curl -X POST https://api-url.com/links \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Test redirect
curl -I https://api-url.com/abc123

# Test admin endpoint
curl https://api-url.com/admin/links
```

### End-to-End Testing

#### Manual Testing Checklist
- [ ] Create short link with valid URL
- [ ] Create short link with custom code
- [ ] Test redirect functionality
- [ ] Verify click count increment
- [ ] Test QR code generation
- [ ] Test copy functionality
- [ ] Test admin dashboard
- [ ] Test error handling

## Debugging

### Lambda Function Debugging

#### CloudWatch Logs
```bash
# View logs for create link function
aws logs tail /aws/lambda/linkforge-prod-createLink --follow

# Filter logs by error level
aws logs filter-log-events \
  --log-group-name /aws/lambda/linkforge-prod-createLink \
  --filter-pattern "ERROR"
```

#### Local Debugging
```python
# Add debug prints to Lambda functions
import json
print(f"Event: {json.dumps(event, indent=2)}")
print(f"Context: {context}")
```

### Frontend Debugging

#### Browser Developer Tools
- Use Network tab to monitor API calls
- Check Console for JavaScript errors
- Use Application tab to inspect localStorage

#### Debug Mode
Enable debug mode in configuration:
```json
{
  "features": {
    "debugMode": true
  }
}
```

## Performance Optimization

### Lambda Optimization
- Keep functions small and focused
- Minimize cold start time
- Use connection pooling for DynamoDB
- Implement proper error handling

### Frontend Optimization
- Minimize JavaScript bundle size
- Use efficient DOM manipulation
- Implement proper caching strategies
- Optimize images and assets

### DynamoDB Optimization
- Use efficient query patterns
- Implement proper indexing
- Monitor read/write capacity
- Use batch operations when possible

## Security Considerations

### Input Validation
```python
def validate_url(url):
    """Validate URL format and security"""
    if not url or len(url) > 2048:
        return False
    
    try:
        parsed = urlparse(url)
        return parsed.scheme in ['http', 'https'] and parsed.netloc
    except Exception:
        return False
```

### CORS Configuration
```python
headers = {
    'Access-Control-Allow-Origin': '*',  # Restrict in production
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
}
```

### Environment Variables
```python
import os

# Use environment variables for sensitive data
TABLE_NAME = os.environ.get('TABLE_NAME', 'default-table')
```

## Deployment

### Development Deployment
```bash
# Deploy to development environment
./scripts/deploy/deploy-all.sh development
```

### Production Deployment
```bash
# Deploy to production (requires approval)
./scripts/deploy/deploy-all.sh production
```

### Rollback Strategy
```bash
# Rollback CloudFormation stack
aws cloudformation cancel-update-stack --stack-name linkforge-prod

# Or delete and redeploy previous version
git checkout previous-version
./scripts/deploy/deploy-all.sh production
```

## Contributing

### Code Style

#### Python
- Follow PEP 8 style guide
- Use type hints where appropriate
- Write docstrings for functions
- Keep functions under 50 lines

#### JavaScript
- Use ES6+ features
- Follow consistent naming conventions
- Write comments for complex logic
- Use async/await for promises

### Git Workflow

1. Create feature branch from main
2. Make changes and test locally
3. Deploy to development environment
4. Create pull request
5. Code review and approval
6. Merge to main
7. Deploy to production

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Deployment
- [ ] Tested in development environment
- [ ] Ready for production deployment
```