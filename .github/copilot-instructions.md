<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Copilot Instructions

## Project Overview
This is a customer emotion recognition system for e-commerce websites. The system identifies customer emotions and predicts product categories they might like, automatically displaying these predictions on the website.

## Technologies
- **Frontend**: Next.js 15 with App Router, SSR/SSG/ISR capabilities, and TailwindCSS v4 for styling and animations
- **Backend**: NestJS and FastAPI
- **Dashboard**: Medusa.js
- **AI**: YOLO for emotion detection, LangChain for AI agent implementation
- **Database**: PostgreSQL with vector DB capabilities

## Code Guidelines
- Use Tailwind CSS for styling and animations (no external animation libraries like framer-motion)
- Implement streaming responses when appropriate
- Use the Next.js Session API correctly
- Optimize for SEO
- Follow monorepo structure with Turborepo
- Implement event-driven architecture
- Account for auto-scaling and load balancing
- Structure code for CI/CD deployment

## AI Implementation Guidelines
- Prefer real-time or fast response time solutions
- Structure LangChain implementations with clear templates, pipelines, RAG, streaming, config, caching, and memory
- Use LangGraph for agent routing to appropriate services
- Integrate YOLO for real-time emotion detection

## Database Guidelines
- Use PostgreSQL with vector capabilities for AI embeddings
- Implement proper database scaling practices
- Design schemas that support the event-driven architecture
