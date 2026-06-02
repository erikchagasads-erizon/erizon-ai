# 🚀 ERIZON AI 3.0

**Uma empresa completa operada por Inteligência Artificial.**

Transformando qualquer empresa em uma operação altamente previsível de crescimento utilizando Inteligência Artificial de ponta.

## 📋 O que é ERIZON AI?

ERIZON AI não é um chatbot. É uma plataforma completa de crescimento empresarial que funciona como uma **empresa real operada por IA**, com:

- ✅ **Conselho Executivo de IA** (CEO, CMO, CRO, CFO, COO, Heads)
- ✅ **Múltiplos Departamentos** (Marketing, Traffic, Growth, Customer Success, etc)
- ✅ **30+ Agentes Especializados** (Designers, Copywriters, Analistas, etc)
- ✅ **Memória Compartilhada** (todos acessam o mesmo contexto)
- ✅ **Orquestração Automática** (reuniões, planejamentos, decisões)
- ✅ **Produção de Conteúdo Diária** (Stories, Feeds, Reels, Carrosséis)
- ✅ **Neuro Score Proprietário** (avaliação de conteúdo 0-100)
- ✅ **Dashboard Executivo** (KPIs em tempo real)
- ✅ **Publicação Multi-Plataforma** (Instagram, Facebook, LinkedIn, TikTok)

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                  ERIZON AI PLATFORM                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────┐         ┌──────────────────┐    │
│  │  EXECUTIVE COUNCIL│         │  DEPARTMENTS     │    │
│  ├──────────────────┤         ├──────────────────┤    │
│  │ • CEO IA         │         │ • Marketing      │    │
│  │ • CMO IA         │         │ • Traffic        │    │
│  │ • CRO IA         │         │ • Growth         │    │
│  │ • CFO IA         │         │ • Customer Suc.  │    │
│  │ • COO IA         │         │ • Support        │    │
│  │ • Head Branding  │         │ • Analytics      │    │
│  │ • Head Growth    │         │ • Technology     │    │
│  └──────────────────┘         └──────────────────┘    │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │         SHARED MEMORY SYSTEM (RAG)               │  │
│  │  • Company Profile  • Market Data  • Brand       │  │
│  │  • Personas         • Competitors  • Content     │  │
│  │  • Performance      • Decisions    • History     │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │      VECTOR STORE + EMBEDDINGS (Supabase)       │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 🛠️ Stack Técnico

### Frontend
- **Next.js 15** + React 19 + TypeScript
- **Tailwind CSS** + **Shadcn UI**
- Zustand (State Management)
- TanStack Query (Data Fetching)
- Socket.io (Real-time)

### Backend
- **Node.js** + Express + TypeScript
- **Supabase** (PostgreSQL + Auth + Vectors + Edge Functions)
- **GROQ API** (IA Principal)
- LlamaIndex (RAG Framework)

### Infrastructure
- **Vercel** (Frontend Hosting)
- **Supabase** (Backend + Database)
- **GitHub** (CI/CD)
- Docker (Development)

### AI Models
- **GROQ** (Primary - Mixtral/Llama)
- **DeepSeek** (Alternative)
- **Llama** (Embeddings)

## 📁 Estrutura do Projeto

```
erizon-ai/
├── frontend/                 # Next.js Application
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── types/
│   ├── styles/
│   └── package.json
│
├── backend/                  # Node.js API + Supabase
│   ├── src/
│   │   ├── api/             # API Routes
│   │   ├── agents/          # Agent Implementations
│   │   ├── services/        # Business Logic
│   │   ├── middleware/
│   │   ├── utils/
│   │   ├── types/
│   │   └── index.ts
│   └── package.json
│
├── shared/                   # Shared Types & Utils
│   ├── types/
│   ├── utils/
│   └── package.json
│
├── infrastructure/           # IaC & DevOps
│   ├── docker-compose.yml
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   ├── .github/workflows/
│   ├── supabase/
│   │   └── migrations/
│   └── docs/
│
├── docs/                     # Documentation
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── AGENTS.md
│   ├── DATABASE.md
│   └── DEVELOPMENT.md
│
└── README.md
```

## 🚀 Quick Start

### Pré-requisitos
- Node.js 18+
- npm/pnpm/yarn
- Docker & Docker Compose
- Git

### Setup Local

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/erizon-ai.git
cd erizon-ai

# 2. Setup de dependências
npm run install:all

# 3. Configure variáveis de ambiente
cp .env.example .env.local

# 4. Start desenvolvimento
docker-compose up -d
npm run dev
```

## 📊 Fases de Desenvolvimento

- **Fase 1** (2 sem): Foundation & Architecture ⏳
- **Fase 2** (3 sem): Agent System & Orchestration
- **Fase 3** (2 sem): Vector Memory & RAG
- **Fase 4** (2.5 sem): Frontend Core UI
- **Fase 5** (3 sem): Content Production System
- **Fase 6** (2 sem): Executive Dashboard
- **Fase 7** (2 sem): Automated Workflows
- **Fase 8** (2 sem): Publishing & Distribution

**Total**: ~17 semanas de desenvolvimento

## 📚 Documentação

- [Arquitetura](./docs/ARCHITECTURE.md)
- [API Reference](./docs/API.md)
- [Sistema de Agentes](./docs/AGENTS.md)
- [Banco de Dados](./docs/DATABASE.md)
- [Guia de Desenvolvimento](./docs/DEVELOPMENT.md)

## 🤝 Contribuindo

Todos os agentes trabalham em conjunto através de orquestração automática. Veja [DEVELOPMENT.md](./docs/DEVELOPMENT.md) para contribuir.

## 📜 Licença

Proprietary - ERIZON AI 2026

## 📞 Suporte

Para dúvidas sobre o sistema, contacte o Arquiteto Chefe ou abra uma issue no GitHub.

---

**ERIZON AI — Transformando empresas em máquinas de crescimento com IA.**
