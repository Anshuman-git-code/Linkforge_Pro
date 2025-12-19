#!/bin/bash

# Infrastructure Deployment Script
# Deploys AWS CloudFormation stack for URL shortener

set -e

ENVIRONMENT=${1:-production}
CONFIG_FILE="config/environments/${ENVIRONMENT}.json"

echo "🏗️  Deploying Infrastructure for $ENVIRONMENT environment..."

# Extract configuration
STACK_NAME=$(cat "$CONFIG_FILE" | python3 -c "import sys, json; print(json.load(sys.stdin)['aws']['stackName'])")
REGION=$(cat "$CONFIG_FILE" | python3 -c "import sys, json; print(json.load(sys.stdin)['aws']['region'])")

echo "Stack Name: $STACK_NAME"
echo "Region: $REGION"

# Deploy CloudFormation stack
aws cloudformation deploy \
    --template-file infrastructure/cloudformation/infrastructure.yaml \
    --stack-name "$STACK_NAME" \
    --capabilities CAPABILITY_IAM \
    --region "$REGION" \
    --parameter-overrides \
        Environment="$ENVIRONMENT" \
    --no-fail-on-empty-changeset

echo "✅ Infrastructure deployment completed"

# Get stack outputs
echo "📋 Stack Outputs:"
aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
    --output table