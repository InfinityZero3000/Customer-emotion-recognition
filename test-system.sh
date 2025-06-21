#!/bin/bash

# 🧪 Quick System Test Script
echo "🧪 Testing Customer Emotion Recognition System..."
echo ""

# Test if services are running
echo "🔍 Checking service availability..."

# Check PostgreSQL
if nc -z localhost 5432 2>/dev/null; then
    echo "✅ PostgreSQL: Running on port 5432"
else
    echo "❌ PostgreSQL: Not running on port 5432"
fi

# Check FastAPI
if curl -s http://localhost:8000/docs >/dev/null 2>&1; then
    echo "✅ FastAPI AI Service: Running on port 8000"
else
    echo "❌ FastAPI AI Service: Not running on port 8000"
fi

# Check NestJS API
if curl -s http://localhost:3001 >/dev/null 2>&1; then
    echo "✅ NestJS API Service: Running on port 3001"
else
    echo "❌ NestJS API Service: Not running on port 3001"
fi

# Check Frontend
if curl -s http://localhost:3000 >/dev/null 2>&1; then
    echo "✅ Next.js Frontend: Running on port 3000"
else
    echo "❌ Next.js Frontend: Not running on port 3000"
fi

echo ""

# If NestJS is running, run detailed API tests
if curl -s http://localhost:3001 >/dev/null 2>&1; then
    echo "🔬 Running API tests..."
    cd apps/api-service/nest-service
    if [ -f "test-api.js" ]; then
        node test-api.js
    else
        echo "⚠️  test-api.js not found, skipping detailed tests"
    fi
    cd ../../..
else
    echo "⚠️  NestJS API not running, skipping API tests"
fi

echo ""
echo "🎯 Test completed!"
