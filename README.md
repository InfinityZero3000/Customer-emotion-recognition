<div align="center">

# CUSTOMER-EMOTION-RECOGNITION

*Unlock Customer Insights, Drive Personalized Experiences*

[![last commit](https://img.shields.io/github/last-commit/nguyenhuuthang/customer-emotion-recognition?color=blue&label=last%20commit&style=flat-square)](https://github.com/nguyenhuuthang/customer-emotion-recognition)
[![typescript](https://img.shields.io/badge/typescript-37.7%25-blue?style=flat-square)](https://github.com/nguyenhuuthang/customer-emotion-recognition)
[![languages](https://img.shields.io/badge/languages-4-blue?style=flat-square)](https://github.com/nguyenhuuthang/customer-emotion-recognition)

---

*Built with the tools and technologies:*

![JSON](https://img.shields.io/badge/JSON-black?style=flat-square&logo=json)
![Markdown](https://img.shields.io/badge/Markdown-black?style=flat-square&logo=markdown)
![npm](https://img.shields.io/badge/npm-red?style=flat-square&logo=npm)
![Autoprefixer](https://img.shields.io/badge/Autoprefixer-orange?style=flat-square&logo=autoprefixer)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-red?style=flat-square&logo=sqlalchemy)
![PostCSS](https://img.shields.io/badge/PostCSS-orange?style=flat-square&logo=postcss)
![Prettier](https://img.shields.io/badge/Prettier-orange?style=flat-square&logo=prettier)
![GNU Bash](https://img.shields.io/badge/GNU%20Bash-green?style=flat-square&logo=gnu-bash)
![FastAPI](https://img.shields.io/badge/FastAPI-teal?style=flat-square&logo=fastapi)

![LangChain](https://img.shields.io/badge/LangChain-black?style=flat-square&logo=chainlink)
![Turbo](https://img.shields.io/badge/Turbo-teal?style=flat-square&logo=turbo)

![React](https://img.shields.io/badge/React-blue?style=flat-square&logo=react)
![NumPy](https://img.shields.io/badge/NumPy-blue?style=flat-square&logo=numpy)
![Python](https://img.shields.io/badge/Python-blue?style=flat-square&logo=python)
![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=flat-square&logo=typescript)
![tsnode](https://img.shields.io/badge/tsnode-blue?style=flat-square&logo=ts-node)
![ESLint](https://img.shields.io/badge/ESLint-purple?style=flat-square&logo=eslint)
![pandas](https://img.shields.io/badge/pandas-purple?style=flat-square&logo=pandas)
![Pydantic](https://img.shields.io/badge/Pydantic-red?style=flat-square&logo=pydantic)
![Jest](https://img.shields.io/badge/Jest-red?style=flat-square&logo=jest)
![YAML](https://img.shields.io/badge/YAML-red?style=flat-square&logo=yaml)

</div>

---

## Table of Contents

• [Overview](#overview)

• [Getting Started](#getting-started)

  • [Prerequisites](#prerequisites)

  • [Installation](#installation)

  • [Usage](#usage)

• [Testing](#testing)

---

## Overview

Customer-emotion-recognition is an all-in-one developer toolset designed to facilitate the creation of emotion-aware e-commerce experiences. It combines real-time emotion detection, personalized product recommendations, and streamlined deployment workflows into a cohesive architecture. The core features include:

• 🧪 ⚡ **System Health Checks**: Quickly verify the readiness of frontend, API, and AI services to ensure smooth operation.

• 🚀 📦 **Automated Service Orchestration**: Simplify startup, build, and deployment processes across multiple components with scripts and configuration files.

• 🎯 🧠 **AI-Driven Emotion Analysis**: Leverage advanced models for facial emotion detection and user preference prediction to enhance personalization.

• 📦 🔗 **Shared Types & UI Components**: Maintain consistency and reusability with shared data structures and UI elements across the project.

• ⚙️ 🔧 **Dependency & Workflow Management**: Use monorepo tools like pnpm and Turbo for reliable builds, caching, and dependency control.

• 🌐 💻 **API Endpoints & Integration**: Seamlessly connect frontend, backend, and AI services for a scalable, real-time customer engagement platform.

---

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
   git clone https://github.com/nguyenhuuthang/customer-emotion-recognition.git
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

---

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

---

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

---

## 📝 API Documentation

- **API Service Swagger**: http://localhost:3001/api
- **AI Service API docs**: http://localhost:5000/docs

---

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

---

## 📚 Tech Stack

- **Frontend**: Next.js 15 with App Router, SSR/SSG/ISR capabilities, TailwindCSS v4
- **Backend (API)**: NestJS, TypeScript
- **Backend (AI)**: FastAPI, Python, YOLO, LangChain, LangGraph
- **Dashboard**: Medusa.js
- **Database**: PostgreSQL with vector DB capabilities
- **Monorepo Management**: Turborepo, pnpm

---

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

---

## 🔮 Future Roadmap

1. Enhanced emotion detection using more sophisticated models
2. A/B testing framework for recommendation algorithms
3. Integration with popular e-commerce platforms
4. User behavior analytics dashboard
5. Multi-language support
6. Mobile application

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

---

## 📄 License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).
