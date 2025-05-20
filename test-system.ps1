#!/usr/bin/env pwsh
# Test script for Customer Emotion Recognition project

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

# Function to test an endpoint
function Test-Endpoint {
    param (
        [string]$ServiceName,
        [string]$Url,
        [string]$Method = "GET",
        [object]$Body = $null
    )
    
    Write-Host "Testing $ServiceName at $Url..." -ForegroundColor Cyan
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            ContentType = "application/json"
            TimeoutSec = 10
            ErrorAction = "Stop"
        }
        
        if ($Body -and $Method -ne "GET") {
            $jsonBody = $Body | ConvertTo-Json -Depth 10
            $params.Body = $jsonBody
        }
        
        $response = Invoke-WebRequest @params
        
        Write-Host "✅ Success! Status: $($response.StatusCode)" -ForegroundColor Green
        
        try {
            $content = $response.Content | ConvertFrom-Json
            Write-Host "Response:" -ForegroundColor Cyan
            Write-Host ($content | ConvertTo-Json -Depth 2) -ForegroundColor Gray
        } catch {
            Write-Host "Response content (not JSON):" -ForegroundColor Cyan
            Write-Host $response.Content.Substring(0, [Math]::Min(500, $response.Content.Length)) -ForegroundColor Gray
            if ($response.Content.Length -gt 500) {
                Write-Host "... (truncated)" -ForegroundColor Gray
            }
        }
        
        return $true
    } catch {
        Write-Host "❌ Failed! Error: $_" -ForegroundColor Red
        return $false
    }
}

# Function to generate a sample emotion payload
function Get-SampleEmotionData {
    $emotions = @("happy", "sad", "angry", "surprise", "neutral")
    $randomEmotion = $emotions | Get-Random
    
    $emotionScores = @{}
    foreach ($emotion in $emotions) {
        $emotionScores[$emotion] = [math]::Round((Get-Random -Minimum 0 -Maximum 100) / 100, 2)
    }
    
    # Make the dominant emotion have the highest score
    $emotionScores[$randomEmotion] = [math]::Round((Get-Random -Minimum 70 -Maximum 100) / 100, 2)
    
    return @{
        emotions = $emotionScores
        dominantEmotion = $randomEmotion
        timestamp = (Get-Date).ToString("o")
    }
}

# 1. Test frontend availability
Write-Host "--------------------------------------------------" -ForegroundColor Yellow
Write-Host "TESTING FRONTEND SERVICE" -ForegroundColor Yellow
Write-Host "--------------------------------------------------" -ForegroundColor Yellow
$frontendUrl = "http://localhost:3000"
$frontendAvailable = Test-Endpoint -ServiceName "Frontend" -Url $frontendUrl
Write-Host ""

# 2. Test API Service
Write-Host "--------------------------------------------------" -ForegroundColor Yellow
Write-Host "TESTING API SERVICE" -ForegroundColor Yellow
Write-Host "--------------------------------------------------" -ForegroundColor Yellow
$apiUrl = "http://localhost:3001"
$apiDocsAvailable = Test-Endpoint -ServiceName "API Documentation" -Url "$apiUrl/api"

# Test emotion history endpoint
$userId = "test-user-$(Get-Random)"
Write-Host "Using test user ID: $userId" -ForegroundColor Cyan
$emotionHistoryAvailable = Test-Endpoint -ServiceName "Emotion History API" -Url "$apiUrl/emotions/history/$userId"
Write-Host ""

# 3. Test AI Service
Write-Host "--------------------------------------------------" -ForegroundColor Yellow
Write-Host "TESTING AI SERVICE" -ForegroundColor Yellow
Write-Host "--------------------------------------------------" -ForegroundColor Yellow
$aiUrl = "http://localhost:5000"
$aiHealthAvailable = Test-Endpoint -ServiceName "AI Service Health" -Url "$aiUrl/health"
Write-Host ""

# 4. Test frontend API routes (which proxy to the backend)
Write-Host "--------------------------------------------------" -ForegroundColor Yellow
Write-Host "TESTING FRONTEND API ROUTES" -ForegroundColor Yellow
Write-Host "--------------------------------------------------" -ForegroundColor Yellow
$frontendEmotionHistoryAvailable = Test-Endpoint -ServiceName "Frontend Emotion History API" -Url "$frontendUrl/api/emotions/history/$userId"

# Test recommendations endpoint with sample emotion data
$sampleEmotion = Get-SampleEmotionData
$recommendationsPayload = @{
    userId = $userId
    currentEmotion = $sampleEmotion
}
Write-Host "Testing with emotion: $($sampleEmotion.dominantEmotion) (confidence: $($sampleEmotion.emotions[$($sampleEmotion.dominantEmotion)]))" -ForegroundColor Cyan
$recommendationsAvailable = Test-Endpoint -ServiceName "Frontend Recommendations API" -Url "$frontendUrl/api/recommendations/predict-preferences" -Method "POST" -Body $recommendationsPayload
Write-Host ""

# 5. Summary
Write-Host "--------------------------------------------------" -ForegroundColor Yellow
Write-Host "TEST SUMMARY" -ForegroundColor Yellow
Write-Host "--------------------------------------------------" -ForegroundColor Yellow
Write-Host "Frontend: $(if ($frontendAvailable) { "✅ Available" } else { "❌ Not Available" })" -ForegroundColor $(if ($frontendAvailable) { "Green" } else { "Red" })
Write-Host "API Service: $(if ($apiDocsAvailable) { "✅ Available" } else { "❌ Not Available" })" -ForegroundColor $(if ($apiDocsAvailable) { "Green" } else { "Red" })
Write-Host "AI Service: $(if ($aiHealthAvailable) { "✅ Available" } else { "❌ Not Available" })" -ForegroundColor $(if ($aiHealthAvailable) { "Green" } else { "Red" })
Write-Host "Frontend API Routes: $(if ($frontendEmotionHistoryAvailable -and $recommendationsAvailable) { "✅ Working" } else { "❌ Not Working" })" -ForegroundColor $(if ($frontendEmotionHistoryAvailable -and $recommendationsAvailable) { "Green" } else { "Red" })
Write-Host ""

# 6. Next steps
Write-Host "--------------------------------------------------" -ForegroundColor Yellow
Write-Host "NEXT STEPS" -ForegroundColor Yellow
Write-Host "--------------------------------------------------" -ForegroundColor Yellow
Write-Host "1. Open the application in your browser: $frontendUrl" -ForegroundColor Cyan
Write-Host "2. Try the emotion detection feature and view personalized recommendations" -ForegroundColor Cyan
Write-Host "3. Check the emotion history to see your recorded emotions" -ForegroundColor Cyan
Write-Host "4. API Documentation is available at: $apiUrl/api" -ForegroundColor Cyan
Write-Host ""

Write-Host "Tests completed! Use the health-check.ps1 script to verify service status at any time." -ForegroundColor Green
