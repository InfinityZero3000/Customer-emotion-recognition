#!/bin/bash

# Simplified Development Startup Script
# This script starts essential services for development without complex dependencies

set -e

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

echo_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
AI_SERVICE_PORT=8000
STREAMING_SERVICE_PORT=8080
FRONTEND_PORT=3000

echo_info "🚀 Starting Simplified Development Environment"
echo_info "=============================================="

# Install dependencies
echo_info "Installing dependencies..."
if command -v pnpm >/dev/null 2>&1; then
    pnpm install --frozen-lockfile
else
    npm install
fi

# Start AI Service
echo_info "Starting AI Service..."
cd apps/ai-service/fastapi-service
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt >/dev/null 2>&1 || echo_info "Python dependencies may need manual installation"
fi
python websocket_main.py &
AI_PID=$!
cd ../../..

# Start Streaming Service
echo_info "Starting Streaming Service..."
node simple-streaming-server.js &
STREAMING_PID=$!

# Start Frontend
echo_info "Starting Frontend..."
cd apps/frontend
if command -v pnpm >/dev/null 2>&1; then
    pnpm run dev &
else
    npm run dev &
fi
FRONTEND_PID=$!
cd ../..

# Wait a bit for services to start
sleep 5

echo ""
echo_success "🎉 Development environment started!"
echo_info "=================================="
echo ""
echo "📱 Frontend: http://localhost:$FRONTEND_PORT"
echo "🤖 AI Service: http://localhost:$AI_SERVICE_PORT/docs"
echo "📡 Streaming: ws://localhost:$STREAMING_SERVICE_PORT"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Cleanup function
cleanup() {
    echo_info "Stopping services..."
    kill $AI_PID 2>/dev/null || true
    kill $STREAMING_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo_success "All services stopped"
    exit 0
}

trap cleanup INT TERM

# Keep script running
wait
