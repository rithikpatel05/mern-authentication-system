# Use a lightweight Node.js image
FROM public.ecr.aws/docker/library/node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install frontend dependencies
RUN npm install

# Copy the rest of the React code
COPY . .

# Expose the standard React port
EXPOSE 3000

# Start the React server
CMD ["npm", "start"]