# ERIZON AI - Development Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Git

### Installation

```bash
# 1. Clone repository
git clone https://github.com/seu-usuario/erizon-ai.git
cd erizon-ai

# 2. Install dependencies
npm run install:all

# 3. Setup environment
cp backend/.env.example backend/.env.local
cp frontend/.env.example frontend/.env.local

# 4. Start development environment
docker-compose up -d

# 5. Run database migrations
npm run db:migrate

# 6. Start development servers
npm run dev
```

### Running Services

#### Backend (Node.js + Express)
```bash
cd backend
npm run dev
# Server: http://localhost:3001
# Health: http://localhost:3001/health
```

#### Frontend (Next.js)
```bash
cd frontend
npm run dev
# App: http://localhost:3000
```

## 📁 Project Structure

```
erizon-ai/
├── shared/               # Shared types & utilities
├── backend/              # API & AI services
│   ├── src/
│   │   ├── api/         # REST endpoints
│   │   ├── agents/      # Agent implementations
│   │   ├── services/    # Business logic
│   │   └── utils/
│   └── package.json
├── frontend/             # Next.js application
│   ├── app/
│   ├── components/
│   └── package.json
├── infrastructure/       # Docker, CI/CD, DB
└── docs/                # Documentation
```

## 🤖 Architecture Overview

### Multi-Agent System
- **Executive Council**: 7 strategic agents (CEO, CMO, CRO, etc.)
- **Marketing Dept**: 10 specialists (Designers, Copywriters, etc.)
- **Traffic Dept**: 8 specialists (Meta, Google, LinkedIn Ads, etc.)
- **Support Dept**: Customer Success & Support agents

### Shared Memory
All agents access the same memory through:
- **Supabase PostgreSQL** - Primary data store
- **pgvector** - Vector embeddings
- **RAG Engine** - Semantic search & retrieval

### Communication
- Agents communicate through message queue
- All decisions logged for audit trail
- Real-time updates via WebSocket

## 📝 Creating New Agents

### 1. Define Agent Type
```typescript
// backend/src/agents/my-agent.ts
import { BaseAgent } from './base-agent';

export class MyAgent extends BaseAgent {
  constructor() {
    super('my-agent-01', 'My Agent', 'Specialist Role', 'Department');
  }

  async think(context: Context): Promise<Decision> {
    // Think phase: analyze context
    return decision;
  }

  async act(decision: Decision): Promise<Result> {
    // Act phase: execute decision
    return result;
  }
}
```

### 2. Register Agent
```typescript
// backend/src/services/agent-orchestration.ts
const agent = new MyAgent();
orchestrator.register(agent);
```

### 3. Communicate with Other Agents
```typescript
await agent.communicateWith(otherAgent, {
  subject: 'Analysis Complete',
  content: analysisData,
  priority: 'high'
});
```

## 🧠 Using Shared Memory

```typescript
// Access shared memory
const memory = await agent.accessMemory();

// Read company data
const company = memory.company;
const personas = memory.personas;

// Update metrics
memory.metrics.reach += 1000;
memory.metrics.engagement += 50;

// Save back to database using ERIZON schema
await supabase
  .from('metrics_daily')
  .upsert({
    company_id: companyId,
    metric_date: new Date().toISOString().slice(0, 10),
    source: 'manual_update',
    metrics: memory.metrics
  });
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `POST /api/auth/logout` - Logout

### Companies
- `GET /api/companies/:id` - Get company
- `PUT /api/companies/:id` - Update company
- `POST /api/companies/:id/onboarding` - Start onboarding

### Content
- `GET /api/content` - List content
- `POST /api/content` - Create content
- `GET /api/content/:id` - Get content
- `PUT /api/content/:id` - Update content
- `POST /api/content/:id/approve` - Approve content
- `POST /api/content/:id/publish` - Publish content

### Metrics
- `GET /api/metrics` - Get current metrics
- `POST /api/metrics/update` - Update metrics

### Agents
- `GET /api/agents` - List active agents
- `POST /api/agents/:id/task` - Assign task to agent

## 🧪 Testing

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

## 📦 Building & Deployment

```bash
# Build all packages
npm run build

# Build specific package
npm run build:backend
npm run build:frontend

# Deploy to production
npm run deploy
```

## 🔄 Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/my-feature
```

## 📚 Documentation

- [Architecture](./ARCHITECTURE.md)
- [API Reference](./API.md)
- [Agent System](./AGENTS.md)
- [Database Schema](./DATABASE.md)

## 🐛 Troubleshooting

### Port already in use
```bash
# Kill process on port 3001
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Database connection error
- Check Supabase credentials in .env
- Verify database is running
- Check network connectivity

### Frontend not loading
- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `npm install`
- Check if backend is running

## 🤝 Contributing

1. Read this guide completely
2. Create feature branch
3. Follow coding standards
4. Test thoroughly
5. Submit PR with description

## 📞 Support

For questions or issues:
1. Check existing documentation
2. Search GitHub issues
3. Ask in development channel
4. Contact Arquiteto Chefe
