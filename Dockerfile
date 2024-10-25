# Use Node.js 18 as the base image
FROM node:18-slim

# Set working directory
WORKDIR /app

# Install dependencies first (for better caching)
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Create a non-root user
RUN useradd -m nodeuser
RUN chown -R nodeuser:nodeuser /app
USER nodeuser

# Expose application port
EXPOSE 4000

# Start the application
CMD ["npm", "start"]

