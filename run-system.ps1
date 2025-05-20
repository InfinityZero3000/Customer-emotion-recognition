#!/usr/bin/env pwsh
# Script to run the entire Customer Emotion Recognition System

# Load environment variables
$envFile = "./.env"
if (Test-Path $envFile) {
  Write-Host "Loading environment variables from $envFile" -ForegroundColor Green
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

# Function to check if port is in use
function Test-PortInUse($port) {
  $inUse = $null -ne (Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue)
  return $inUse
}

# Function to start a service with PM2 or direct execution
function Start-Service($serviceName, $command, $port) {
  if (Test-PortInUse $port) {
    Write-Host "WARNING: Port $port is already in use. Service $serviceName may not start correctly." -ForegroundColor Yellow
  }

  Write-Host "Starting $serviceName on port $port..." -ForegroundColor Cyan
  
  # Check if PM2 is installed and use it if available
  if (Get-Command "pm2" -ErrorAction SilentlyContinue) {
    if ($serviceName -eq "FastAPI") {
      # For Python services
      Write-Host "Using PM2 to run FastAPI service" -ForegroundColor Green
      Start-Process -FilePath "pm2" -ArgumentList "start", "$command", "--name", "$serviceName" -NoNewWindow
    } else {
      # For Node.js services
      Write-Host "Using PM2 to run $serviceName" -ForegroundColor Green
      Start-Process -FilePath "pm2" -ArgumentList "start", "$command", "--name", "$serviceName" -NoNewWindow
    }
  } else {
    # Direct execution (not ideal for production)
    Write-Host "PM2 not found. Running service directly (not recommended for production)." -ForegroundColor Yellow
    if ($serviceName -eq "FastAPI") {
      # Python services need to be handled differently
      $wd = Get-Location
      cd apps/ai-service/fastapi-service
      
      # Check for virtual environment
      if (Test-Path "venv/Scripts/activate.ps1") {
        & ./venv/Scripts/activate.ps1
      }
      
      # Start process
      Start-Process -FilePath "python" -ArgumentList "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "$port" -NoNewWindow
      cd $wd
    } else {
      # For Node.js services
      $commandParts = $command -split " "
      $executable = $commandParts[0]
      $args = $commandParts[1..$commandParts.Length]
      
      Start-Process -FilePath $executable -ArgumentList $args -NoNewWindow
    }
  }
}

# Check for required directories and files
if (-not (Test-Path "apps/api-service/nest-service/dist")) {
  Write-Host "API service build not found. Run 'pnpm build' first." -ForegroundColor Red
  exit 1
}

if (-not (Test-Path "apps/ai-service/nestjs-api/dist")) {
  Write-Host "AI NestJS service build not found. Run 'pnpm build' first." -ForegroundColor Red
  exit 1
}

if (-not (Test-Path "apps/frontend/.next")) {
  Write-Host "Frontend build not found. Run 'pnpm build' first." -ForegroundColor Red
  exit 1
}

# Set service ports
$frontendPort = 3000
$apiPort = 3001
$aiNestjsPort = 3002
$aiFastApiPort = 3003

# Start each service
Start-Service -serviceName "Frontend" -command "cd apps/frontend && pnpm start" -port $frontendPort
Start-Service -serviceName "API" -command "cd apps/api-service/nest-service && node dist/main.js" -port $apiPort
Start-Service -serviceName "AI-NestJS" -command "cd apps/ai-service/nestjs-api && node dist/main.js" -port $aiNestjsPort
Start-Service -serviceName "FastAPI" -command "cd apps/ai-service/fastapi-service && uvicorn main:app --host 0.0.0.0 --port $aiFastApiPort" -port $aiFastApiPort

Write-Host "All services are running. Access the application at:" -ForegroundColor Green
Write-Host "Frontend:      http://localhost:$frontendPort" -ForegroundColor Cyan
Write-Host "API:           http://localhost:$apiPort" -ForegroundColor Cyan
Write-Host "AI NestJS API: http://localhost:$aiNestjsPort" -ForegroundColor Cyan
Write-Host "FastAPI:       http://localhost:$aiFastApiPort" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop all services." -ForegroundColor Yellow

# Keep the script running
try {
  while ($true) {
    Start-Sleep -Seconds 10
  }
} finally {
  Write-Host "Stopping all services..." -ForegroundColor Yellow
  if (Get-Command "pm2" -ErrorAction SilentlyContinue) {
    pm2 delete Frontend API AI-NestJS FastAPI
  } else {
    Write-Host "Please manually stop any running processes." -ForegroundColor Red
  }
}
