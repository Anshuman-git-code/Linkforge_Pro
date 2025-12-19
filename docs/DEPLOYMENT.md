# Deployment Guide

## Prerequisites

Before deploying LinkForge Pro, ensure you have:

- **AWS CLI** configured with appropriate permissions
- **Node.js** 16+ (for deployment scripts)
- **Python** 3.9+ (for Lambda functions)
- **Git** (for version control)

## AWS Permissions Required

Your AWS user/role needs the following permissions:
- CloudFormation (full access)
- Lambda (full access)
- API Gateway (full access)
- DynamoDB (full access)
- S3 (full access)
- IAM (create/update roles and policies)
- CloudWatch Logs (create/write)

## Quick Deployment

### 1. Clone and Setup

```bash
git clone https://github.com/yourusername/linkforge-pro.git
cd linkforge-pro
```

### 2. Configure Environment

Edit `config/environments/production.json`:

```json
{
  "environment": "production",
  "aws": {
    "region": "us-east-1",
    "stackName": "linkforge-prod"
  },
  "frontend": {
    "demoMode": false,
    "shortDomain": "yourdomain.com"
  }
}
```

### 3. Deploy Everything

```bash
# Make scripts executable
chmod +x scripts/deploy/*.sh

# Deploy entire application
./scripts/deploy/deploy-all.sh production
```

## Step-by-Step Deployment

### Step 1: Deploy Infrastructure

```bash
./scripts/deploy/deploy-infrastructure.sh production
```

This creates:
- DynamoDB table for links
- API Gateway HTTP API
- Lambda execution roles
- S3 bucket for frontend
- CloudWatch log groups

### Step 2: Deploy Backend Functions

```bash
python3 scripts/deploy/deploy-backend.py production
```

This deploys:
- `create_link.py` - Creates short links
- `redirect_link.py` - Handles redirects
- `admin_links.py` - Admin dashboard API

### Step 3: Deploy Frontend

```bash
node scripts/deploy/deploy-frontend.js production
```

This:
- Updates frontend configuration
- Uploads files to S3
- Sets proper content types

## Environment Configuration

### Production Environment

```json
{
  "environment": "production",
  "aws": {
    "region": "us-east-1",
    "stackName": "linkforge-prod",
    "apiGateway": {
      "baseUrl": "https://api.yourdomain.com"
    }
  },
  "frontend": {
    "demoMode": false,
    "shortDomain": "yourdomain.com"
  },
  "features": {
    "customCodes": true,
    "analytics": true,
    "qrCodes": true
  }
}
```

### Development Environment

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
  }
}
```

## Custom Domain Setup

### 1. Register Domain in Route 53

```bash
aws route53 create-hosted-zone --name yourdomain.com --caller-reference $(date +%s)
```

### 2. Create SSL Certificate

```bash
aws acm request-certificate \
  --domain-name yourdomain.com \
  --domain-name "*.yourdomain.com" \
  --validation-method DNS
```

### 3. Configure API Gateway Custom Domain

Update your CloudFormation template to include:

```yaml
CustomDomain:
  Type: AWS::ApiGatewayV2::DomainName
  Properties:
    DomainName: api.yourdomain.com
    DomainNameConfigurations:
      - CertificateArn: !Ref SSLCertificate
        SecurityPolicy: TLS_1_2
```

## Monitoring and Logging

### CloudWatch Logs

All Lambda functions log to CloudWatch:
- `/aws/lambda/linkforge-prod-createLink`
- `/aws/lambda/linkforge-prod-redirectLink`
- `/aws/lambda/linkforge-prod-adminLinks`

### CloudWatch Metrics

Monitor these key metrics:
- API Gateway request count and latency
- Lambda function duration and errors
- DynamoDB read/write capacity

### Set Up Alarms

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name "LinkForge-HighErrorRate" \
  --alarm-description "High error rate in API Gateway" \
  --metric-name 4XXError \
  --namespace AWS/ApiGateway \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold
```

## Backup and Recovery

### DynamoDB Backup

Enable point-in-time recovery:

```bash
aws dynamodb update-continuous-backups \
  --table-name linkforge-prod-links \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true
```

### S3 Versioning

S3 bucket versioning is enabled by default in the CloudFormation template.

## Scaling Considerations

### DynamoDB

- Uses on-demand billing mode
- Automatically scales based on traffic
- Consider switching to provisioned mode for predictable workloads

### Lambda

- Concurrent execution limit: 1000 (default)
- Request AWS support to increase if needed
- Monitor throttling metrics

### API Gateway

- Default limits: 10,000 requests per second
- Contact AWS support for higher limits

## Troubleshooting

### Common Issues

1. **Permission Denied**
   ```bash
   aws sts get-caller-identity
   # Verify your AWS credentials
   ```

2. **Stack Creation Failed**
   ```bash
   aws cloudformation describe-stack-events --stack-name linkforge-prod
   # Check CloudFormation events for errors
   ```

3. **Lambda Function Not Found**
   ```bash
   aws lambda list-functions --query 'Functions[?contains(FunctionName, `linkforge`)]'
   # List all LinkForge functions
   ```

### Rollback Deployment

```bash
# Rollback to previous CloudFormation stack version
aws cloudformation cancel-update-stack --stack-name linkforge-prod

# Or delete and redeploy
aws cloudformation delete-stack --stack-name linkforge-prod
```

## Security Best Practices

1. **Use least privilege IAM roles**
2. **Enable CloudTrail for audit logging**
3. **Regularly rotate access keys**
4. **Monitor for unusual API activity**
5. **Use VPC endpoints for private communication**

## Cost Optimization

1. **Monitor AWS costs with Cost Explorer**
2. **Set up billing alerts**
3. **Use DynamoDB on-demand pricing for variable workloads**
4. **Enable S3 lifecycle policies for old logs**

## Next Steps

After deployment:

1. Test all functionality
2. Set up monitoring and alerts
3. Configure custom domain (optional)
4. Set up CI/CD pipeline
5. Create backup procedures