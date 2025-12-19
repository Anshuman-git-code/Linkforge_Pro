#!/bin/bash

# LinkForge Pro - Complete Deployment Script
# This script deploys the entire URL shortener application

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
CONFIG_FILE="config/environments/${ENVIRONMENT}.json"

echo -e "${BLUE}🚀 LinkForge Pro - Complete Deployment${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo "=================================================="

# Check if config file exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${RED}❌ Configuration file not found: $CONFIG_FILE${NC}"
    exit 1
fi

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Please install AWS CLI first.${NC}"
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Step 1: Deploy Infrastructure
echo -e "\n${YELLOW}📦 Step 1: Deploying Infrastructure...${NC}"
if ./scripts/deploy/deploy-infrastructure.sh "$ENVIRONMENT"; then
    echo -e "${GREEN}✅ Infrastructure deployed successfully${NC}"
else
    echo -e "${RED}❌ Infrastructure deployment failed${NC}"
    exit 1
fi

# Step 2: Deploy Backend Functions
echo -e "\n${YELLOW}⚡ Step 2: Deploying Backend Functions...${NC}"
if python3 scripts/deploy/deploy-backend.py "$ENVIRONMENT"; then
    echo -e "${GREEN}✅ Backend functions deployed successfully${NC}"
else
    echo -e "${RED}❌ Backend deployment failed${NC}"
    exit 1
fi

# Step 3: Deploy Frontend
echo -e "\n${YELLOW}🌐 Step 3: Deploying Frontend...${NC}"
if node scripts/deploy/deploy-frontend.js "$ENVIRONMENT"; then
    echo -e "${GREEN}✅ Frontend deployed successfully${NC}"
else
    echo -e "${RED}❌ Frontend deployment failed${NC}"
    exit 1
fi

# Step 4: Verify Deployment
echo -e "\n${YELLOW}🔍 Step 4: Verifying Deployment...${NC}"

# Extract API URL from config
API_URL=$(cat "$CONFIG_FILE" | python3 -c "import sys, json; print(json.load(sys.stdin)['aws']['apiGateway']['baseUrl'])")
FRONTEND_URL=$(cat "$CONFIG_FILE" | python3 -c "import sys, json; print(json.load(sys.stdin)['aws']['s3']['websiteUrl'])")

echo "Testing API endpoint..."
if curl -s -f "${API_URL}/admin/links" > /dev/null; then
    echo -e "${GREEN}✅ API is responding${NC}"
else
    echo -e "${YELLOW}⚠️  API might still be starting up${NC}"
fi

echo "Testing frontend..."
if curl -s -f "$FRONTEND_URL" > /dev/null; then
    echo -e "${GREEN}✅ Frontend is accessible${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend might still be propagating${NC}"
fi

# Success message
echo -e "\n${GREEN}🎉 Deployment Complete!${NC}"
echo "=================================================="
echo -e "${BLUE}Frontend URL:${NC} $FRONTEND_URL"
echo -e "${BLUE}Admin Dashboard:${NC} $FRONTEND_URL/admin.html"
echo -e "${BLUE}API Base URL:${NC} $API_URL"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "1. Test the application by creating a short link"
echo "2. Check the admin dashboard for analytics"
echo "3. Monitor CloudWatch logs for any issues"
echo ""
echo -e "${GREEN}✨ Your URL shortener is now live!${NC}"