# 🚀 Quick Start Guide - Emotion Recognition System

## Prerequisites

### Required Software
- **Node.js** (v18 or higher)
- **Python** (v3.8 or higher)
- **pnpm** (recommended package manager)
- **PostgreSQL** (v14 or higher with pgvector extension)
- **Redis** (v6 or higher)
- **Docker & Docker Compose** (optional, for containerized setup)

### System Requirements
- **RAM**: Minimum 8GB (16GB recommended for AI processing)
- **CPU**: Multi-core processor (4+ cores recommended)
- **Storage**: At least 5GB free space
- **Camera**: Webcam for real-time emotion detection

## 🔧 Installation Methods

### Method 1: Automated Setup (Recommended)

```bash
# Clone the repository
git clone https://github.com/your-username/Customer-emotion-recognition.git
cd Customer-emotion-recognition

# Make setup script executable
chmod +x integrated-startup.sh

# Start all services with dependencies
./integrated-startup.sh start
```

### Method 2: Docker Compose Setup

```bash
# Clone the repository
git clone https://github.com/your-username/Customer-emotion-recognition.git
cd Customer-emotion-recognition

# Start with Docker Compose
docker-compose -f docker-compose.dev.yml up -d

# Check service status
docker-compose -f docker-compose.dev.yml ps
```

### Method 3: Manual Setup

#### Step 1: Install Dependencies
```bash
# Install Node.js dependencies
pnpm install

# Install Python dependencies
cd apps/ai-service/fastapi-service
pip install -r requirements.txt
cd ../../..
```

#### Step 2: Setup Database
```bash
# Start PostgreSQL and Redis (if not already running)
# macOS with Homebrew:
brew services start postgresql
brew services start redis

# Ubuntu/Debian:
sudo systemctl start postgresql
sudo systemctl start redis

# Setup vector database
chmod +x setup-vector-db.sh
./setup-vector-db.sh
```

#### Step 3: Start Services Manually
```bash
# Terminal 1: AI Service
cd apps/ai-service/fastapi-service
python websocket_main.py

# Terminal 2: Streaming Service
cd packages/streaming
pnpm build && node dist/index.js

# Terminal 3: NestJS API
cd apps/api-service/nest-service
pnpm run start:dev

# Terminal 4: Frontend
cd apps/frontend
pnpm run dev
```

## 🌐 Access Points

After successful startup, access the application at:

- **Frontend Application**: http://localhost:3000
- **AI Service API Documentation**: http://localhost:8000/docs
- **NestJS API**: http://localhost:3001
- **Streaming WebSocket**: ws://localhost:8080

## 🎯 First Time Usage

### 1. Camera Permission
- Open http://localhost:3000
- Allow camera access when prompted
- Click "Start Camera" to begin emotion detection

### 2. Real-time Emotion Detection
- Your webcam feed will appear with real-time emotion analysis
- Dominant emotion and confidence levels are displayed
- Product recommendations appear based on detected emotions

### 3. Features to Try
- **Emotion History**: View your recent emotion patterns
- **Product Recommendations**: See personalized suggestions
- **User Pattern Analysis**: Track your emotional trends
- **Real-time Streaming**: Multiple browser tabs sync in real-time

## 🔍 Troubleshooting

### Common Issues

#### Camera Not Working
```bash
# Check camera permissions in browser
# Chrome: Settings > Privacy and Security > Site Settings > Camera
# Firefox: Preferences > Privacy & Security > Permissions > Camera
```

#### Database Connection Error
```bash
# Check PostgreSQL status
brew services list | grep postgresql  # macOS
sudo systemctl status postgresql      # Linux

# Verify pgvector extension
psql -d emotion_recognition -c "SELECT * FROM pg_extension WHERE extname='vector';"
```

#### Redis Connection Error
```bash
# Check Redis status
brew services list | grep redis  # macOS
sudo systemctl status redis      # Linux

# Test Redis connection
redis-cli ping
```

#### AI Service Not Starting
```bash
# Check Python dependencies
cd apps/ai-service/fastapi-service
pip list | grep -E "(fastapi|uvicorn|opencv|torch)"

# Check for missing models
ls -la models/
```

#### Port Conflicts
```bash
# Check if ports are already in use
lsof -i :3000  # Frontend
lsof -i :8000  # AI Service
lsof -i :8080  # Streaming
lsof -i :3001  # NestJS API
```

### Service Health Checks

#### Monitor All Services
```bash
# Use the monitoring script
./monitor-services.sh

# Or check individual services
curl http://localhost:8000/health  # AI Service
curl http://localhost:3001/health  # NestJS API
curl http://localhost:3000/api/health  # Frontend
```

#### View Logs
```bash
# AI Service logs
tail -f apps/ai-service/fastapi-service/logs/app.log

# Frontend logs
cd apps/frontend && pnpm run dev  # Check terminal output

# Database logs (macOS)
tail -f /usr/local/var/log/postgresql@14.log
```

## 🎛️ Configuration

### Environment Variables

Create `.env` files in relevant directories:

#### AI Service (`apps/ai-service/fastapi-service/.env`)
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=emotion_recognition
DB_USER=postgres
DB_PASSWORD=password
REDIS_URL=redis://localhost:6379
MODEL_PATH=./models
```

#### Frontend (`apps/frontend/.env.local`)
```env
NEXT_PUBLIC_AI_SERVICE_URL=http://localhost:8000
NEXT_PUBLIC_STREAMING_WS_URL=ws://localhost:8080
NEXT_PUBLIC_NESTJS_API_URL=http://localhost:3001
```

#### NestJS (`apps/api-service/nest-service/.env`)
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/emotion_recognition
REDIS_URL=redis://localhost:6379
AI_SERVICE_URL=http://localhost:8000
```

## 🚀 Development Workflow

### Making Changes

#### Frontend Development
```bash
cd apps/frontend
pnpm run dev  # Hot reload enabled
```

#### AI Service Development
```bash
cd apps/ai-service/fastapi-service
# Edit Python files - FastAPI auto-reloads
python websocket_main.py --reload
```

#### Package Development
```bash
# Shared types
cd packages/shared-types
pnpm run dev  # Watch mode

# UI components
cd packages/ui
pnpm run dev  # Watch mode
```

### Testing

#### Run All Tests
```bash
# Frontend tests
cd apps/frontend && pnpm test

# AI Service tests
cd apps/ai-service/fastapi-service && python -m pytest

# Integration tests
pnpm run test:integration
```

#### Manual Testing
1. Open http://localhost:3000
2. Allow camera access
3. Verify emotion detection works
4. Check product recommendations appear
5. Test WebSocket real-time updates
6. Verify database storage (check pgAdmin or psql)

## 📊 Monitoring & Analytics

### System Status
- Service health endpoints provide status information
- Monitor script shows real-time service status
- Database analytics views provide usage insights

### Performance Monitoring
- AI service response times
- WebSocket connection stability
- Database query performance
- Memory and CPU usage

## 🔒 Security Notes

### Development Security
- Default passwords are for development only
- Camera access requires user permission
- WebSocket connections are not authenticated in dev mode
- Database connections use default credentials

### Production Considerations
- Change all default passwords
- Enable HTTPS/WSS for production
- Implement proper authentication
- Set up proper CORS policies
- Use environment variables for all secrets

## 🆘 Getting Help

### Debug Mode
```bash
# Start with debug logging
DEBUG=true ./integrated-startup.sh start

# Enable verbose AI service logging
cd apps/ai-service/fastapi-service
LOG_LEVEL=DEBUG python websocket_main.py
```

### Log Locations
- AI Service: Console output
- Frontend: Browser console + terminal
- Database: PostgreSQL logs
- Redis: Redis logs

### Support Resources
- GitHub Issues: Report bugs and feature requests
- Documentation: Check README.md files in each service
- API Documentation: http://localhost:8000/docs

---

## 🎉 Success Indicators

You know everything is working when:
1. ✅ All services show "Running" in monitor script
2. ✅ Frontend loads at http://localhost:3000
3. ✅ Camera feed appears and emotions are detected
4. ✅ Product recommendations update based on emotions
5. ✅ Real-time updates work across browser tabs
6. ✅ Emotion history is saved and displayed

**Congratulations! Your emotion recognition system is now running!** 🎭🚀
