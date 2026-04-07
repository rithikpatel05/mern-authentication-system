# Use a lightweight Node.js image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first (optimizes caching)
COPY package*.json ./

# Install backend dependencies
RUN npm install

# Copy the rest of your backend code
COPY . .

# Expose the port your Express server runs on (change if yours isn't 5000)
EXPOSE 5000

# Command to start the server
CMD ["npm", "start"]