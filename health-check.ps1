#!/usr/bin/env pwsh
# Health check script for Customer Emotion Recognition project services

# Define service URLs
$services = @(
    @{
        Name = "Frontend";
        Url = "http://localhost:3000";
        HealthEndpoint = "";
    },
    @{
        Name = "API Service";
        Url = "http://localhost:3001";
        HealthEndpoint = "api";
    },
    @{
        Name = "AI Service";
        Url = "http://localhost:5000";
        HealthEndpoint = "health";
    }
)

# Check each service
foreach ($service in $services) {
    $url = "$($service.Url)/$($service.HealthEndpoint)"
    Write-Host "Checking $($service.Name) at $url..." -ForegroundColor Cyan
    
    try {
        $response = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 5 -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $($service.Name) is running properly (HTTP 200)" -ForegroundColor Green
        } else {
            Write-Host "⚠️ $($service.Name) returned HTTP $($response.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ $($service.Name) is not running or has an error: $_" -ForegroundColor Red
        
        # Provide startup instructions based on the service
        switch ($service.Name) {
            "Frontend" {
                Write-Host "  To start Frontend: pnpm frontend:dev" -ForegroundColor Yellow
            }
            "API Service" {
                Write-Host "  To start API Service: pnpm api:dev" -ForegroundColor Yellow
            }
            "AI Service" {
                Write-Host "  To start AI Service: pnpm ai:dev" -ForegroundColor Yellow
                Write-Host "  Note: Make sure Python environment is set up correctly" -ForegroundColor Yellow
            }
        }
    }
    
    Write-Host ""
}

Write-Host "Health check completed!" -ForegroundColor Cyan
Write-Host "To start all services: pnpm dev" -ForegroundColor Yellow
