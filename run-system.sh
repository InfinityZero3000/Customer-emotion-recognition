#!/bin/bash

# 🚀 Customer Emotion Recognition System - Startup Script
# This script starts all services in the correct order

echo "🎯 Starting Customer Emotion Recognition System..."
echo "📅 $(date)"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Function to check if port is available
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null; then
        echo "⚠️  Port $1 is already in use"
        return 1
    else
        echo "✅ Port $1 is available"
        return 0
    fi
}

# Function to wait for service
wait_for_service() {
    local host=$1
    local port=$2
    local service_name=$3
    local max_attempts=30
    local attempt=1

    echo "⏳ Waiting for $service_name to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if nc -z $host $port 2>/dev/null; then
            echo "✅ $service_name is ready!"
            return 0
        fi
        
        echo "   Attempt $attempt/$max_attempts - $service_name not ready yet..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo "❌ $service_name failed to start within expected time"
    return 1
}

echo "🔍 Checking system requirements..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi
echo "✅ Node.js $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi
echo "✅ npm $(npm --version)"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    exit 1
fi
echo "✅ Docker $(docker --version)"

echo ""
echo "🔧 Installing dependencies..."

# Install root dependencies
echo "📦 Installing workspace dependencies..."
npm install --silent

# Install NestJS dependencies
echo "📦 Installing NestJS API dependencies..."
cd apps/api-service/nest-service
npm install --silent
cd ../../..

# Install FastAPI dependencies
echo "📦 Installing FastAPI dependencies..."
cd apps/ai-service/fastapi-service
if [ -f "requirements.txt" ]; then
    pip3 install -r requirements.txt --quiet
fi
cd ../../..

# Install Frontend dependencies
echo "📦 Installing Frontend dependencies..."
cd apps/frontend
if [ -f "package.json" ]; then
    npm install --silent
fi
cd ../..

echo ""
echo "🐳 Starting Docker services..."

# Start database and Redis
docker-compose -f docker-compose.dev.yml up -d postgres redis

# Wait for database to be ready
wait_for_service localhost 5432 "PostgreSQL"

echo ""
echo "🚀 Starting application services..."

# Start FastAPI service
echo "🤖 Starting AI Service (FastAPI)..."
cd apps/ai-service/fastapi-service
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
FASTAPI_PID=$!
cd ../../..

# Wait a bit for FastAPI to start
sleep 3
wait_for_service localhost 8000 "FastAPI AI Service"

# Start NestJS API
echo "🔗 Starting API Service (NestJS)..."
cd apps/api-service/nest-service
npm run start:dev &
NESTJS_PID=$!
cd ../../..

# Wait for NestJS to start
sleep 5
wait_for_service localhost 3001 "NestJS API Service"

# Start Frontend
echo "🌐 Starting Frontend (Next.js)..."
cd apps/frontend
npm run dev &
FRONTEND_PID=$!
cd ../..

# Wait for Frontend to start
sleep 5
wait_for_service localhost 3000 "Next.js Frontend"

echo ""
echo "🎉 All services are running!"
echo ""
echo "📊 Service URLs:"
echo "   🌐 Frontend:     http://localhost:3000"
echo "   🔗 NestJS API:   http://localhost:3001"
echo "   📚 API Docs:     http://localhost:3001/api"
echo "   🤖 FastAPI AI:   http://localhost:8000"
echo "   📖 AI Docs:      http://localhost:8000/docs"
echo "   🐘 PostgreSQL:   localhost:5432"
echo "   🔴 Redis:        localhost:6379"
echo ""
echo "🧪 To test the system:"
echo "   cd apps/api-service/nest-service && node test-api.js"
echo ""
echo "🛑 To stop all services:"
echo "   Press Ctrl+C, then run: docker-compose -f docker-compose.dev.yml down"
echo ""

# Save PIDs for cleanup
echo $FASTAPI_PID > .fastapi.pid
echo $NESTJS_PID > .nestjs.pid  
echo $FRONTEND_PID > .frontend.pid

# Wait for user interrupt
trap 'echo ""; echo "🛑 Shutting down services..."; kill $FASTAPI_PID $NESTJS_PID $FRONTEND_PID 2>/dev/null; docker-compose -f docker-compose.dev.yml down; rm -f .*.pid; echo "✅ All services stopped"; exit 0' INT

echo "⌨️  Press Ctrl+C to stop all services"
wait
