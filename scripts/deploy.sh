#!/bin/bash

# Navigate to the deployment directory on the EC2 server
cd /home/ubuntu/linkedin-login

# 1. Log into AWS ECR
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin 324178491391.dkr.ecr.ap-south-1.amazonaws.com

# 2. Export the variables from the new text file
export $(cat deploy_env.txt | xargs)

# 3. Pull the specific versions requested
docker compose pull

# 4. Stop the old containers
docker compose down

# 5. Start the new containers in the background
docker compose up -d