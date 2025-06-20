<div align="center">

# 🎭 CUSTOMER EMOTION RECOGNITION SYSTEM

*AI-Powered Real-time Emotion Detection for E-commerce Personalization*

[![last commit](https://img.shields.io/github/last-commit/JenniferZero/Customer-emotion-recognition?color=blue&label=last%20commit&style=flat-square)](https://github.com/JenniferZero/Customer-emotion-recognition)
[![typescript](https://img.shields.io/badge/typescript-37.7%25-blue?style=flat-square)](https://github.com/JenniferZero/Customer-emotion-recognition)
[![languages](https://img.shields.io/badge/languages-4-blue?style=flat-square)](https://github.com/JenniferZero/Customer-emotion-recognition)

## 🚀 Quick Start

```bash
# One-command setup
git clone https://github.com/your-username/Customer-emotion-recognition.git
cd Customer-emotion-recognition
chmod +x integrated-startup.sh
./integrated-startup.sh start
```

**Then visit**: http://localhost:3000 🎉

*Built with cutting-edge technologies:*

<div style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin: 20px 0;">

![Next.js 15](https://img.shields.io/badge/Next.js%2015-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React 18](https://img.shields.io/badge/React%2018-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind%20CSS%20v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)

![YOLO](https://img.shields.io/badge/YOLO-00FFFF?style=for-the-badge&logo=yolo&logoColor=black)
![LangChain](https://img.shields.io/badge/LangChain-000000?style=for-the-badge&logo=chainlink&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![WebSocket](https://img.shields.io/badge/WebSocket-010101?style=for-the-badge&logo=socket.io&logoColor=white)

![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Turborepo](https://img.shields.io/badge/Turborepo-000000?style=for-the-badge&logo=turbo&logoColor=white)
![pgvector](https://img.shields.io/badge/pgvector-316192?style=for-the-badge&logo=postgresql&logoColor=white)

</div>

---

## 🌟 What's New in v2.0

### ✨ **Real-time Streaming Architecture**
- **WebSocket Integration**: Live emotion updates across all connected clients
- **Event-Driven System**: Seamless communication between all services
- **Zero-latency Updates**: Instant product recommendations based on emotions

### 🧠 **Advanced AI Pipeline**
- **YOLO Emotion Detection**: State-of-the-art computer vision for face emotion recognition
- **LangChain Agent Routing**: Intelligent service routing based on emotional context
- **Vector Database**: Similarity search for personalized recommendations using pgvector

### 🏗️ **Enterprise Architecture**
- **Microservices Design**: Scalable, maintainable service architecture
- **Auto-scaling Ready**: Kubernetes deployment configurations included
- **Comprehensive Caching**: Redis-powered caching for optimal performance

### 🎯 **Enhanced User Experience** 
- **Real-time Dashboard**: Live emotion analysis with beautiful visualizations
- **Emotion History**: Track emotional patterns and trends over time
- **Smart Recommendations**: AI-powered product suggestions based on emotional state
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white)
![pandas](https://img.shields.io/badge/pandas-150458?style=for-the-badge&logo=pandas&logoColor=white)
![Pydantic](https://img.shields.io/badge/Pydantic-E92063?style=for-the-badge&logo=pydantic&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-323330?style=for-the-badge&logo=jest&logoColor=white)
![YAML](https://img.shields.io/badge/YAML-CB171E?style=for-the-badge&logo=yaml&logoColor=white)

</div>

</div>

## Table of Contents

• [Overview](#overview)

• [Getting Started](#getting-started)

  • [Prerequisites](#prerequisites)

  • [Installation](#installation)

  • [Usage](#usage)

• [Testing](#testing)

## Overview

Customer-emotion-recognition is an all-in-one developer toolset designed to facilitate the creation of emotion-aware e-commerce experiences. It combines real-time emotion detection, personalized product recommendations, and streamlined deployment workflows into a cohesive architecture. The core features include:

• 🧪 ⚡ **System Health Checks**: Quickly verify the readiness of frontend, API, and AI services to ensure smooth operation.

• 🚀 📦 **Automated Service Orchestration**: Simplify startup, build, and deployment processes across multiple components with scripts and configuration files.

• 🎯 🧠 **AI-Driven Emotion Analysis**: Leverage advanced models for facial emotion detection and user preference prediction to enhance personalization.

• 📦 🔗 **Shared Types & UI Components**: Maintain consistency and reusability with shared data structures and UI elements across the project.

• ⚙️ 🔧 **Dependency & Workflow Management**: Use monorepo tools like pnpm and Turbo for reliable builds, caching, and dependency control.

• 🌐 💻 **API Endpoints & Integration**: Seamlessly connect frontend, backend, and AI services for a scalable, real-time customer engagement platform.

## Getting Started

### Prerequisites

Before running this project, ensure you have the following installed:

- **Node.js** 18+ 
- **pnpm** 8+ (`npm install -g pnpm`)
- **Python** 3.9+ (for AI service)
- **Git** for version control

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/JenniferZero/Customer-emotion-recognition.git
   cd customer-emotion-recognition
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Build shared packages**:
   ```bash
   pnpm build
   ```

4. **Set up environment variables**:
   - Copy `.env.example` to `.env` (or use the existing `.env` file)
   - Update the variables according to your setup

5. **Set up Python environment for AI service**:
   ```bash
   cd apps/ai-service/fastapi-service
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

### Usage

#### Development Mode

1. **Start all services in development mode**:
   ```bash
   pnpm dev
   ```

   This will start:
   - Frontend: http://localhost:3000
   - API Service: http://localhost:3001
   - AI Service: http://localhost:5000

2. **Alternatively, run individual services**:
   ```bash
   # Frontend
   pnpm --filter="frontend" dev

   # API Service
   pnpm --filter="api-service" dev

   # AI Service
   pnpm --filter="ai-service" dev
   ```

#### Production Mode

1. **Build all services for production**:
   ```bash
   # Windows PowerShell
   ./deploy.ps1
   
   # Unix/Linux/Mac
   chmod +x ./deploy.sh && ./deploy.sh
   ```

2. **Start services in production mode**:
   ```bash
   pnpm start
   ```

## Testing

Run comprehensive tests across all services:

```bash
# Run all tests
pnpm test

# Run frontend tests
pnpm --filter="frontend" test

# Run API service tests
pnpm --filter="api-service" test
```

## 🏗️ Architecture

The project is structured as a monorepo using Turborepo and pnpm workspaces, consisting of:

### Frontend (Next.js)
- Emotion detection UI with webcam integration
- Product recommendations display
- Emotion history visualization
- Responsive layout with dark mode support

### API Service (NestJS)
- Product recommendation generation
- Emotion history storage and retrieval
- User preference tracking
- RESTful API with Swagger documentation

### AI Service (FastAPI)
- Real-time emotion recognition
- Face detection using YOLO models
- Emotion classification and confidence scoring
- API for emotion data processing

## 📝 API Documentation

- **API Service Swagger**: http://localhost:3001/api
- **AI Service API docs**: http://localhost:5000/docs

## 🧩 Project Structure

```
customer-emotion-recognition/
├── apps/                      # Application services
│   ├── frontend/              # Next.js frontend application
│   ├── api-service/           # NestJS recommendation API service
│   └── ai-service/            # FastAPI emotion detection service
├── packages/                  # Shared packages
│   ├── shared-types/          # TypeScript types used across services
│   ├── ui/                    # Shared UI components
│   ├── emotion-recognition/   # Emotion detection algorithms
│   └── ai-core/               # Core AI utilities
└── README.md                  # Project documentation
```

## 📚 Tech Stack

- **Frontend**: Next.js 15 with App Router, SSR/SSG/ISR capabilities, TailwindCSS v4
- **Backend (API)**: NestJS, TypeScript
- **Backend (AI)**: FastAPI, Python, YOLO, LangChain, LangGraph
- **Dashboard**: Medusa.js
- **Database**: PostgreSQL with vector DB capabilities
- **Monorepo Management**: Turborepo, pnpm

## 📊 Project Status

### ✅ COMPLETED:
1. Set up monorepo structure with Turborepo and pnpm
2. Implemented FastAPI backend service for emotion detection with YOLO
3. Created shared UI components and types
4. Implemented frontend components for emotion detection
5. Implemented NestJS backend service for recommendations
6. Integrated frontend with both FastAPI and NestJS backends
7. Created main page with integrated components
8. Added proper error handling and fallback mechanisms

### ⏳ PENDING:
1. Set up admin dashboard with Medusa.js
2. Implement CI/CD deployment
3. Add database integration with PostgreSQL and vector capabilities
4. Set up authentication and user management
5. Add product details pages and browsing
6. Deploy services to cloud providers

## 🔮 Future Roadmap

1. Enhanced emotion detection using more sophisticated models
2. A/B testing framework for recommendation algorithms
3. Integration with popular e-commerce platforms
4. User behavior analytics dashboard
5. Multi-language support
6. Mobile application

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).
