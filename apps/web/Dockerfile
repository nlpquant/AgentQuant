# Use official Node.js runtime as base image
FROM node:22-alpine

# Set working directory in container
WORKDIR /app

# Copy web app package.json and package-lock.json (if exists)
COPY apps/web/package.json ./
COPY apps/web/package-lock.json* ./

# Install dependencies using npm (including dev dependencies for build)
RUN npm install

# Copy web app source code (excluding node_modules)
COPY apps/web/app ./app
COPY apps/web/components ./components
COPY apps/web/hooks ./hooks
COPY apps/web/public ./public
COPY apps/web/types ./types
COPY apps/web/*.json ./
COPY apps/web/*.js ./
COPY apps/web/*.ts ./
COPY apps/web/*.config.* ./
COPY apps/web/.prettierrc ./

# Build the application
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Define the command to run the application
CMD ["npm", "start"]