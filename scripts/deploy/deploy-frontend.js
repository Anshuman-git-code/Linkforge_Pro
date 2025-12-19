#!/usr/bin/env node

/**
 * Frontend Deployment Script
 * Deploys the frontend application to S3
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function loadConfig(environment) {
    const configPath = `config/environments/${environment}.json`;
    if (!fs.existsSync(configPath)) {
        throw new Error(`Configuration file not found: ${configPath}`);
    }
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

function updateFrontendConfig(config) {
    log('📝 Updating frontend configuration...', 'blue');
    
    const apiBaseUrl = config.aws.apiGateway.baseUrl;
    const demoMode = config.frontend.demoMode;
    
    // Update app.js configuration
    const appJsPath = 'src/frontend/assets/app.js';
    let appJsContent = fs.readFileSync(appJsPath, 'utf8');
    
    // Replace API_BASE_URL
    appJsContent = appJsContent.replace(
        /API_BASE_URL: '[^']*'/,
        `API_BASE_URL: '${apiBaseUrl}'`
    );
    
    // Replace DEMO_MODE
    appJsContent = appJsContent.replace(
        /DEMO_MODE: (true|false)/,
        `DEMO_MODE: ${demoMode}`
    );
    
    fs.writeFileSync(appJsPath, appJsContent);
    
    // Update admin.js configuration
    const adminJsPath = 'src/frontend/assets/admin.js';
    let adminJsContent = fs.readFileSync(adminJsPath, 'utf8');
    
    // Replace API_BASE_URL
    adminJsContent = adminJsContent.replace(
        /API_BASE_URL: '[^']*'/,
        `API_BASE_URL: '${apiBaseUrl}'`
    );
    
    // Replace DEMO_MODE
    adminJsContent = adminJsContent.replace(
        /DEMO_MODE: (true|false)/,
        `DEMO_MODE: ${demoMode}`
    );
    
    fs.writeFileSync(adminJsPath, adminJsContent);
    
    log('✅ Frontend configuration updated', 'green');
}

function syncToS3(bucketName, region) {
    log('📤 Uploading files to S3...', 'blue');
    
    try {
        // Sync frontend files to S3
        const syncCommand = `aws s3 sync src/frontend/ s3://${bucketName}/ --region ${region} --delete --exclude "*.md"`;
        execSync(syncCommand, { stdio: 'inherit' });
        
        // Set proper content types
        const commands = [
            `aws s3 cp s3://${bucketName}/ s3://${bucketName}/ --recursive --exclude "*" --include "*.html" --content-type "text/html" --metadata-directive REPLACE --region ${region}`,
            `aws s3 cp s3://${bucketName}/ s3://${bucketName}/ --recursive --exclude "*" --include "*.css" --content-type "text/css" --metadata-directive REPLACE --region ${region}`,
            `aws s3 cp s3://${bucketName}/ s3://${bucketName}/ --recursive --exclude "*" --include "*.js" --content-type "application/javascript" --metadata-directive REPLACE --region ${region}`
        ];
        
        commands.forEach(cmd => {
            try {
                execSync(cmd, { stdio: 'pipe' });
            } catch (error) {
                // Ignore errors for content-type setting
            }
        });
        
        log('✅ Files uploaded successfully', 'green');
        
    } catch (error) {
        throw new Error(`S3 sync failed: ${error.message}`);
    }
}

function invalidateCloudFront(distributionId) {
    if (!distributionId) return;
    
    log('🔄 Invalidating CloudFront cache...', 'blue');
    
    try {
        const invalidateCommand = `aws cloudfront create-invalidation --distribution-id ${distributionId} --paths "/*"`;
        execSync(invalidateCommand, { stdio: 'inherit' });
        log('✅ CloudFront invalidation created', 'green');
    } catch (error) {
        log(`⚠️  CloudFront invalidation failed: ${error.message}`, 'yellow');
    }
}

function main() {
    const environment = process.argv[2] || 'production';
    
    log(`🌐 Deploying Frontend for ${environment} environment...`, 'blue');
    
    try {
        // Load configuration
        const config = loadConfig(environment);
        const bucketName = config.aws.s3.bucketName;
        const region = config.aws.region;
        const websiteUrl = config.aws.s3.websiteUrl;
        
        // Update frontend configuration
        updateFrontendConfig(config);
        
        // Deploy to S3
        syncToS3(bucketName, region);
        
        // Invalidate CloudFront if configured
        if (config.aws.cloudfront && config.aws.cloudfront.distributionId) {
            invalidateCloudFront(config.aws.cloudfront.distributionId);
        }
        
        log('✅ Frontend deployment completed', 'green');
        log(`🌐 Website URL: ${websiteUrl}`, 'blue');
        log(`📊 Admin Dashboard: ${websiteUrl}/admin.html`, 'blue');
        
    } catch (error) {
        log(`❌ Frontend deployment failed: ${error.message}`, 'red');
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}