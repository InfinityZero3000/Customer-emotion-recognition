#!/usr/bin/env pwsh
# Script to build all components of the Customer Emotion Recognition System

# Set error action preference
$ErrorActionPreference = "Stop"

# Function to show colored output
function Write-ColoredOutput($message, $color) {
  Write-Host $message -ForegroundColor $color
}

# Function to check if a command exists
function Test-CommandExists($command) {
  return $null -ne (Get-Command $command -ErrorAction SilentlyContinue)
}

# Check for required tools
if (-not (Test-CommandExists "pnpm")) {
  Write-ColoredOutput "Error: pnpm is required. Please install it with: npm install -g pnpm" Red
  exit 1
}

if (-not (Test-CommandExists "node")) {
  Write-ColoredOutput "Error: Node.js is required. Please install it from https://nodejs.org/" Red
  exit 1
}

if (-not (Test-CommandExists "python")) {
  Write-ColoredOutput "Error: Python is required for the FastAPI service. Please install Python 3.8+" Red
  exit 1
}

# Function to execute command and handle errors
function Invoke-StepCommand($stepName, $command, $workingDirectory = $null) {
  Write-ColoredOutput "`n===== $stepName =====" Cyan
  
  $currentDir = Get-Location
  if ($workingDirectory) {
    Set-Location $workingDirectory
  }
  
  try {
    Invoke-Expression $command
    if ($LASTEXITCODE -ne 0) {
      Write-ColoredOutput "Error: $stepName failed with exit code $LASTEXITCODE" Red
      exit $LASTEXITCODE
    }
  }
  catch {
    Write-ColoredOutput "Error in $stepName: $_" Red
    exit 1
  }
  finally {
    if ($workingDirectory) {
      Set-Location $currentDir
    }
  }
  
  Write-ColoredOutput "$stepName completed successfully." Green
}

# Install dependencies
Invoke-StepCommand "Installing Root Dependencies" "pnpm install"

# Build shared packages
Invoke-StepCommand "Building shared-types Package" "pnpm install && pnpm build" "packages/shared-types"
Invoke-StepCommand "Building UI Package" "pnpm install && pnpm build" "packages/ui"

# Build API services
Invoke-StepCommand "Building API Service" "pnpm install && pnpm build" "apps/api-service/nest-service"
Invoke-StepCommand "Building NestJS AI Service" "pnpm install && pnpm build" "apps/ai-service/nestjs-api"

# Setup Python environment for FastAPI service
Invoke-StepCommand "Setting up FastAPI Service" {
  if (-not (Test-Path "venv")) {
    Write-ColoredOutput "Creating Python virtual environment..." Yellow
    python -m venv venv
  }
  
  # Activate virtual environment
  if ($env:OS -match "Windows") {
    .\venv\Scripts\Activate.ps1
  }
  else {
    & ./venv/bin/activate
  }
  
  # Install requirements
  Write-ColoredOutput "Installing Python dependencies..." Yellow
  pip install -r requirements.txt
} "apps/ai-service/fastapi-service"

# Build frontend
Invoke-StepCommand "Building Frontend" "pnpm install && pnpm build" "apps/frontend"

Write-ColoredOutput "`n=============================" Green
Write-ColoredOutput "All components built successfully!" Green
Write-ColoredOutput "Run './run-system.ps1' to start the application." Yellow
Write-ColoredOutput "=============================" Green
