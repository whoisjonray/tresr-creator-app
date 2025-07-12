# Simplified Dockerfile for fast local development
FROM node:20 AS base

# Set working directory
WORKDIR /app

# Copy package files for efficient caching
COPY package*.json ./

# Install root dependencies
RUN npm install

# Copy client package files and install
COPY client/package*.json ./client/
WORKDIR /app/client
RUN npm install

# Copy server package files and install
WORKDIR /app
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install

# Go back to root and copy source
WORKDIR /app
COPY . .

# Build client for production
RUN npm run build:client

# Expose port
EXPOSE 3002

# Start the server (which serves built client)
CMD ["npm", "run", "start"]