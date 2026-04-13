#!/bin/bash

# Navigate to the deployment directory on the EC2 server
cd /home/ubuntu/linkedin-login

# 1. Log into AWS ECR so the server can download the private images
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin 324178491391.dkr.ecr.ap-south-1.amazonaws.com

# 2. Pull the newest images that CodeBuild just created
docker compose pull

# 3. Stop the old containers (if they are running)
docker compose down

# 4. Start the new containers in the background
docker compose up -d