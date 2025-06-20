#!/bin/bash

# Integrated System Startup Script
# This script starts all services in the correct order with proper dependencies

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
POSTGRES_HOST=${POSTGRES_HOST:-localhost}
POSTGRES_PORT=${POSTGRES_PORT:-5432}
POSTGRES_DB=${POSTGRES_DB:-emotion_recognition}
POSTGRES_USER=${POSTGRES_USER:-postgres}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-password}

REDIS_HOST=${REDIS_HOST:-localhost}
REDIS_PORT=${REDIS_PORT:-6379}

AI_SERVICE_PORT=${AI_SERVICE_PORT:-8000}
STREAMING_SERVICE_PORT=${STREAMING_SERVICE_PORT:-8080}
FRONTEND_PORT=${FRONTEND_PORT:-3000}
NESTJS_PORT=${NESTJS_PORT:-3001}

echo_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

echo_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

echo_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_service() {
    local service_name=$1
    local host=$2
    local port=$3
    local max_attempts=${4:-30}
    local attempt=1

    echo_info "Checking $service_name at $host:$port..."
    
    while [ $attempt -le $max_attempts ]; do
        if nc -z $host $port 2>/dev/null; then
            echo_success "$service_name is ready!"
            return 0
        fi
        
        echo "Attempt $attempt/$max_attempts: $service_name not ready, waiting..."
        sleep 2
        ((attempt++))
    done
    
    echo_error "$service_name failed to start after $max_attempts attempts"
    return 1
}

install_dependencies() {
    echo_info "Installing dependencies..."
    
    # Install root dependencies
    if [ -f "package.json" ]; then
        pnpm install
    fi
    
    # Install Python dependencies for AI service
    if [ -d "apps/ai-service/fastapi-service" ]; then
        cd apps/ai-service/fastapi-service
        if [ -f "requirements.txt" ]; then
            echo_info "Installing Python dependencies..."
            pip install -r requirements.txt
        fi
        cd ../../..
    fi
    
    echo_success "Dependencies installed"
}

setup_database() {
    echo_info "Setting up vector database..."
    
    # Check if PostgreSQL is running
    if ! nc -z $POSTGRES_HOST $POSTGRES_PORT; then
        echo_error "PostgreSQL is not running on $POSTGRES_HOST:$POSTGRES_PORT"
        echo_info "Please start PostgreSQL and ensure pgvector extension is available"
        return 1
    fi
    
    # Run database setup script
    if [ -f "setup-vector-db.sh" ]; then
        chmod +x setup-vector-db.sh
        DB_HOST=$POSTGRES_HOST DB_PORT=$POSTGRES_PORT DB_NAME=$POSTGRES_DB \
        DB_USER=$POSTGRES_USER DB_PASSWORD=$POSTGRES_PASSWORD \
        ./setup-vector-db.sh
    else
        echo_warning "Database setup script not found, skipping..."
    fi
    
    echo_success "Database setup completed"
}

check_redis() {
    echo_info "Checking Redis connection..."
    
    if ! nc -z $REDIS_HOST $REDIS_PORT; then
        echo_warning "Redis is not running on $REDIS_HOST:$REDIS_PORT"
        echo_info "Starting Redis with Docker..."
        
        docker run -d --name emotion-redis -p $REDIS_PORT:6379 redis:7-alpine || {
            echo_error "Failed to start Redis container"
            return 1
        }
        
        # Wait for Redis to be ready
        check_service "Redis" $REDIS_HOST $REDIS_PORT 15
    else
        echo_success "Redis is already running"
    fi
}

start_ai_service() {
    echo_info "Starting AI Service (FastAPI)..."
    
    cd apps/ai-service/fastapi-service
    
    # Set environment variables
    export DB_HOST=$POSTGRES_HOST
    export DB_PORT=$POSTGRES_PORT
    export DB_NAME=$POSTGRES_DB
    export DB_USER=$POSTGRES_USER
    export DB_PASSWORD=$POSTGRES_PASSWORD
    
    # Start FastAPI with WebSocket support
    python websocket_main.py &
    AI_SERVICE_PID=$!
    
    cd ../../..
    
    # Wait for AI service to be ready
    check_service "AI Service" localhost $AI_SERVICE_PORT
    
    echo_success "AI Service started (PID: $AI_SERVICE_PID)"
}

start_streaming_service() {
    echo_info "Starting Streaming Service..."
    
    # Start simple streaming service
    STREAMING_PORT=$STREAMING_SERVICE_PORT \
    node simple-streaming-server.js &
    STREAMING_SERVICE_PID=$!
    
    # Wait for streaming service to be ready
    check_service "Streaming Service" localhost $STREAMING_SERVICE_PORT
    
    echo_success "Streaming Service started (PID: $STREAMING_SERVICE_PID)"
}

start_nestjs_service() {
    echo_info "Starting NestJS API Service..."
    
    cd apps/api-service/nest-service
    
    # Set environment variables
    export DATABASE_URL="postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@$POSTGRES_HOST:$POSTGRES_PORT/$POSTGRES_DB"
    export REDIS_URL="redis://$REDIS_HOST:$REDIS_PORT"
    export AI_SERVICE_URL="http://localhost:$AI_SERVICE_PORT"
    
    # Start NestJS service
    pnpm run start:dev &
    NESTJS_SERVICE_PID=$!
    
    cd ../../..
    
    # Wait for NestJS service to be ready
    check_service "NestJS Service" localhost $NESTJS_PORT
    
    echo_success "NestJS Service started (PID: $NESTJS_SERVICE_PID)"
}

start_frontend() {
    echo_info "Starting Frontend (Next.js)..."
    
    cd apps/frontend
    
    # Set environment variables
    export NEXT_PUBLIC_AI_SERVICE_URL="http://localhost:$AI_SERVICE_PORT"
    export NEXT_PUBLIC_STREAMING_WS_URL="ws://localhost:$STREAMING_SERVICE_PORT"
    export NEXT_PUBLIC_NESTJS_API_URL="http://localhost:$NESTJS_PORT"
    
    # Start Next.js development server
    pnpm run dev &
    FRONTEND_PID=$!
    
    cd ../..
    
    # Wait for frontend to be ready
    check_service "Frontend" localhost $FRONTEND_PORT
    
    echo_success "Frontend started (PID: $FRONTEND_PID)"
}

create_service_monitor() {
    echo_info "Creating service monitor script..."
    
    cat > monitor-services.sh << EOF
#!/bin/bash

# Service Monitor Script
# This script monitors all running services and provides status information

check_service_status() {
    local service_name=\$1
    local port=\$2
    local pid=\$3
    
    if nc -z localhost \$port 2>/dev/null; then
        echo -e "✅ \$service_name (:\$port) - Running"
    else
        echo -e "❌ \$service_name (:\$port) - Not responding"
    fi
}

echo "=== Emotion Recognition System Status ==="
echo "Timestamp: \$(date)"
echo ""

check_service_status "PostgreSQL" "$POSTGRES_PORT"
check_service_status "Redis" "$REDIS_PORT" 
check_service_status "AI Service" "$AI_SERVICE_PORT" "$AI_SERVICE_PID"
check_service_status "Streaming Service" "$STREAMING_SERVICE_PORT" "$STREAMING_SERVICE_PID"
check_service_status "NestJS API" "$NESTJS_PORT" "$NESTJS_SERVICE_PID"
check_service_status "Frontend" "$FRONTEND_PORT" "$FRONTEND_PID"

echo ""
echo "Service URLs:"
echo "  Frontend: http://localhost:$FRONTEND_PORT"
echo "  AI Service: http://localhost:$AI_SERVICE_PORT"
echo "  NestJS API: http://localhost:$NESTJS_PORT"
echo "  Streaming WebSocket: ws://localhost:$STREAMING_SERVICE_PORT"
echo ""
echo "Logs:"
echo "  AI Service PID: $AI_SERVICE_PID"
echo "  Streaming Service PID: $STREAMING_SERVICE_PID"
echo "  NestJS Service PID: $NESTJS_SERVICE_PID"
echo "  Frontend PID: $FRONTEND_PID"
EOF

    chmod +x monitor-services.sh
    echo_success "Service monitor created: ./monitor-services.sh"
}

cleanup() {
    echo_info "Cleaning up processes..."
    
    # Kill background processes
    if [ ! -z "$AI_SERVICE_PID" ]; then
        kill $AI_SERVICE_PID 2>/dev/null || true
    fi
    if [ ! -z "$STREAMING_SERVICE_PID" ]; then
        kill $STREAMING_SERVICE_PID 2>/dev/null || true
    fi
    if [ ! -z "$NESTJS_SERVICE_PID" ]; then
        kill $NESTJS_SERVICE_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    
    echo_success "Cleanup completed"
}

# Set up signal handlers for graceful cleanup
trap cleanup EXIT
trap cleanup INT
trap cleanup TERM

main() {
    echo_info "🚀 Starting Emotion Recognition System Integration"
    echo_info "================================================"
    
    # Step 1: Install dependencies
    install_dependencies
    
    # Step 2: Check and setup database
    setup_database
    
    # Step 3: Check and start Redis
    check_redis
    
    # Step 4: Start AI Service
    start_ai_service
    
    # Step 5: Start Streaming Service
    start_streaming_service
    
    # Step 6: Start NestJS Service
    start_nestjs_service
    
    # Step 7: Start Frontend
    start_frontend
    
    # Step 8: Create monitoring script
    create_service_monitor
    
    echo ""
    echo_success "🎉 All services started successfully!"
    echo_info "================================================"
    echo ""
    echo "🌐 Access your application:"
    echo "   Frontend: http://localhost:$FRONTEND_PORT"
    echo "   AI Service API: http://localhost:$AI_SERVICE_PORT/docs"
    echo "   NestJS API: http://localhost:$NESTJS_PORT"
    echo ""
    echo "📊 Monitor services: ./monitor-services.sh"
    echo ""
    echo "Press Ctrl+C to stop all services"
    echo ""
    
    # Keep the script running
    wait
}

# Parse command line arguments
case "${1:-start}" in
    "start")
        main
        ;;
    "stop")
        cleanup
        ;;
    "status")
        if [ -f "monitor-services.sh" ]; then
            ./monitor-services.sh
        else
            echo_error "System not started. Run './integrated-startup.sh start' first."
        fi
        ;;
    "restart")
        cleanup
        sleep 3
        main
        ;;
    *)
        echo "Usage: $0 {start|stop|status|restart}"
        echo ""
        echo "  start   - Start all services (default)"
        echo "  stop    - Stop all services"
        echo "  status  - Check service status"
        echo "  restart - Restart all services"
        exit 1
        ;;
esac
