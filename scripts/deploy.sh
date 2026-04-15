#!/bin/bash

# Navigate to the deployment directory on the EC2 server
cd /home/ubuntu/linkedin-login

# 1. Log into AWS ECR so the server can download the private images
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin 324178491391.dkr.ecr.ap-south-1.amazonaws.com

echo "Specify client version for deployment:"
read client_version

echo "Specify server version for deployment:"
read server_version

# 2. Pull the newest images that CodeBuild just created
docker pull 324178491391.dkr.ecr.ap-south-1.amazonaws.com/linkedin-client:${client_version}
docker pull 324178491391.dkr.ecr.ap-south-1.amazonaws.com/linkedin-server:${server_version}

docker tag 324178491391.dkr.ecr.ap-south-1.amazonaws.com/linkedin-client:${client_version} 324178491391.dkr.ecr.ap-south-1.amazonaws.com/mern-client:latest
docker tag 324178491391.dkr.ecr.ap-south-1.amazonaws.com/linkedin-server:${server_version} 324178491391.dkr.ecr.ap-south-1.amazonaws.com/mern-server:latest
# 3. Stop the old containers (if they are running)
docker compose down

# 4. Start the new containers in the background
docker compose up -d