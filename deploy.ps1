#!/usr/bin/env pwsh
# Deployment script for Customer Emotion Recognition project

# Load environment variables
$envFile = "./.env"
if (Test-Path $envFile) {
  Write-Host "Loading environment variables from $envFile"
  Get-Content $envFile | ForEach-Object {
    if (!$_.StartsWith("#") -and $_.Contains("=")) {
      $key, $value = $_ -split "=", 2
      [Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
  }
}

# Set default environment to production
if (-not $env:NODE_ENV) {
  $env:NODE_ENV = "production"
}

# Function to check if a command exists
function Test-Command($command) {
  $exists = $null -ne (Get-Command $command -ErrorAction SilentlyContinue)
  return $exists
}

# Check for required tools
if (-not (Test-Command "pnpm")) {
  Write-Host "Error: pnpm not found. Please install pnpm:" -ForegroundColor Red
  Write-Host "npm install -g pnpm" -ForegroundColor Yellow
  exit 1
}

if (-not (Test-Command "turbo")) {
  Write-Host "Installing Turborepo..."
  pnpm install -g turbo
}

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Cyan
pnpm install

# Build shared packages
Write-Host "Building shared packages..." -ForegroundColor Cyan
pnpm --filter="shared-types" build
pnpm --filter="ui" build
# Skip packages that don't exist or are not fully set up
# pnpm --filter="emotion-recognition" build
# pnpm --filter="ai-core" build

# Build backend services
Write-Host "Building backend services..." -ForegroundColor Cyan
pnpm --filter="api-service" build
pnpm --filter="ai-service" build

# Build frontend
Write-Host "Building frontend..." -ForegroundColor Cyan
pnpm --filter="frontend" build

# Set up deployment environment variables
if ($env:NODE_ENV -eq "production") {
  # Update these variables with your actual host domains or IP addresses
  $env:FRONTEND_URL = "https://your-hostname.com" # Replace with your actual domain or IP address
  $env:BACKEND_API_URL = "https://your-hostname.com/api" # Replace with your actual API endpoint
  $env:AI_SERVICE_URL = "https://your-hostname.com/ai-service" # Replace with your actual AI service endpoint
  
  # If deploying to the same server with different ports, you might use:
  # $env:FRONTEND_PORT = "3000"
  # $env:BACKEND_API_PORT = "3001"
  # $env:AI_SERVICE_PORT = "3002"
}

Write-Host "Deployment build completed!" -ForegroundColor Green
Write-Host "To start the services:" -ForegroundColor Yellow
Write-Host "1. Start API service:     pnpm --filter='api-service' start" -ForegroundColor Cyan
Write-Host "2. Start AI service:      pnpm --filter='ai-service' start" -ForegroundColor Cyan
Write-Host "3. Start frontend:        pnpm --filter='frontend' start" -ForegroundColor Cyan
Write-Host "Or use Turborepo:         pnpm start" -ForegroundColor Cyan
