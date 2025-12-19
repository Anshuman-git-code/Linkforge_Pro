#!/usr/bin/env python3

"""
Backend Deployment Script
Deploys Lambda functions for the URL shortener backend
"""

import json
import sys
import os
import zipfile
import boto3
from pathlib import Path

def load_config(environment):
    """Load environment configuration"""
    config_path = f"config/environments/{environment}.json"
    if not os.path.exists(config_path):
        raise FileNotFoundError(f"Configuration file not found: {config_path}")
    
    with open(config_path, 'r') as f:
        return json.load(f)

def create_deployment_package(function_name, source_dir):
    """Create a deployment package for a Lambda function"""
    print(f"📦 Creating deployment package for {function_name}...")
    
    zip_path = f"build/{function_name}.zip"
    os.makedirs("build", exist_ok=True)
    
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # Add the main function file
        function_file = f"{source_dir}/{function_name}.py"
        if os.path.exists(function_file):
            zipf.write(function_file, f"{function_name}.py")
        
        # Add shared utilities if they exist
        shared_dir = f"{source_dir}/../shared"
        if os.path.exists(shared_dir):
            for file_path in Path(shared_dir).rglob("*.py"):
                arcname = f"shared/{file_path.name}"
                zipf.write(file_path, arcname)
    
    return zip_path

def deploy_function(lambda_client, function_name, zip_path, config):
    """Deploy a Lambda function"""
    print(f"🚀 Deploying {function_name}...")
    
    try:
        # Read the deployment package
        with open(zip_path, 'rb') as f:
            zip_content = f.read()
        
        # Update function code
        response = lambda_client.update_function_code(
            FunctionName=function_name,
            ZipFile=zip_content
        )
        
        print(f"✅ {function_name} deployed successfully")
        return response
        
    except lambda_client.exceptions.ResourceNotFoundException:
        print(f"❌ Function {function_name} not found. Please deploy infrastructure first.")
        return None
    except Exception as e:
        print(f"❌ Error deploying {function_name}: {e}")
        return None

def main():
    if len(sys.argv) < 2:
        environment = "production"
    else:
        environment = sys.argv[1]
    
    print(f"⚡ Deploying Backend Functions for {environment} environment...")
    
    try:
        # Load configuration
        config = load_config(environment)
        region = config['aws']['region']
        
        # Initialize AWS clients
        lambda_client = boto3.client('lambda', region_name=region)
        
        # Function definitions
        functions = [
            'create_link',
            'redirect_link', 
            'admin_links'
        ]
        
        source_dir = "src/backend/functions"
        
        # Deploy each function
        for function_name in functions:
            # Create deployment package
            zip_path = create_deployment_package(function_name, source_dir)
            
            # Get actual function name from AWS (might have stack prefix)
            actual_function_name = f"url-shortener-infra-{function_name.replace('_', '').title()}Function-*"
            
            # Try to find the function by pattern
            try:
                response = lambda_client.list_functions()
                matching_functions = [
                    f for f in response['Functions'] 
                    if function_name.replace('_', '').lower() in f['FunctionName'].lower()
                ]
                
                if matching_functions:
                    actual_function_name = matching_functions[0]['FunctionName']
                    deploy_function(lambda_client, actual_function_name, zip_path, config)
                else:
                    print(f"⚠️  Function matching {function_name} not found")
                    
            except Exception as e:
                print(f"❌ Error finding function {function_name}: {e}")
        
        print("✅ Backend deployment completed")
        
    except Exception as e:
        print(f"❌ Backend deployment failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()