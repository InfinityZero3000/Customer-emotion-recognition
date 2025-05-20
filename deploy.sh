#!/bin/bash
# Deployment script for Customer Emotion Recognition project

# Load environment variables
if [ -f ./.env ]; then
  echo "Loading environment variables from .env"
  export $(grep -v '^#' .env | xargs)
fi

# Set default environment to production
if [ -z "$NODE_ENV" ]; then
  export NODE_ENV="production"
fi

# Check for required tools
if ! command -v pnpm &> /dev/null; then
  echo "Error: pnpm not found. Please install pnpm:"
  echo "npm install -g pnpm"
  exit 1
fi

if ! command -v turbo &> /dev/null; then
  echo "Installing Turborepo..."
  pnpm install -g turbo
fi

# Install dependencies
echo "Installing dependencies..."
pnpm install

# Build shared packages
echo "Building shared packages..."
pnpm --filter="shared-types" build
pnpm --filter="ui" build
pnpm --filter="emotion-recognition" build
pnpm --filter="ai-core" build

# Build backend services
echo "Building backend services..."
pnpm --filter="api-service" build
pnpm --filter="ai-service" build

# Build frontend
echo "Building frontend..."
pnpm --filter="frontend" build

# Set up deployment environment variables
if [ "$NODE_ENV" = "production" ]; then
  # Uncomment and update these variables for production deployment
  # export FRONTEND_URL="https://your-production-domain.com"
  # export BACKEND_API_URL="https://api.your-production-domain.com"
  # export AI_SERVICE_URL="https://ai-service.your-production-domain.com"
  echo
fi

echo "Deployment build completed!"
echo "To start the services:"
echo "1. Start API service:     pnpm --filter='api-service' start"
echo "2. Start AI service:      pnpm --filter='ai-service' start"
echo "3. Start frontend:        pnpm --filter='frontend' start"
echo "Or use Turborepo:         pnpm start"
