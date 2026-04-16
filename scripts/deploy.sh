#!/bin/bash

# Navigate to the deployment directory on the EC2 server
cd /home/ubuntu/linkedin-login

echo "--- DEPLOYMENT DEBUG LOGS ---"
echo "1. Checking if the file arrived from CodeBuild:"
ls -la

echo "2. Checking what is inside the file:"
cat deploy_env.txt || echo "WARNING: deploy_env.txt is missing!"
echo "-----------------------------"

# 3. Log into AWS ECR
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin 324178491391.dkr.ecr.ap-south-1.amazonaws.com

# 4. Pull the specific versions (Let Docker read the file natively!)
docker compose --env-file deploy_env.txt pull

# 5. Stop the old containers
docker compose down

# 6. Start the new containers in the background
docker compose --env-file deploy_env.txt up -d