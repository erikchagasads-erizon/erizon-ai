# ERIZON AI - Architecture Overview

## System Design

ERIZON AI is a multi-agent system designed to operate as a complete company. The architecture consists of:

### 1. Agent Layer
- **Executive Council**: Strategic decision-makers
- **Departments**: Specialists organized by function
- **Agents**: Individual AI workers with specific expertise

### 2. Memory Layer
- **Shared Memory**: All agents access the same context
- **Vector Store**: Semantic search via embeddings
- **RAG Engine**: Context retrieval for LLM prompts

### 3. Orchestration Layer
- **Agent Manager**: Lifecycle management
- **Message Queue**: Inter-agent communication
- **Workflow Engine**: Task scheduling

### 4. Integration Layer
- **AI Models**: GROQ (primary), DeepSeek (backup)
- **External APIs**: Meta, Google, LinkedIn, TikTok
- **File Storage**: Supabase Storage for assets

### 5. Frontend Layer
- **Dashboard**: Executive view
- **Content Manager**: Creation & approval
- **Analytics**: Real-time metrics
- **Settings**: Configuration

## Agent System

### Base Agent Class
```
Agent
├── id (unique identifier)
├── name
├── role
├── department
├── expertise
├── status
└── Methods:
    ├── think(context) -> Decision
    ├── act(decision) -> Result
    ├── communicateWith(agent, message)
    └── accessMemory()
```

### Executive Council
```
CEO IA
├── CMO IA
├── CRO IA
├── CFO IA
├── COO IA
├── Head de Branding IA
└── Head de Growth IA
```

### Marketing Department
```
Designers (2)
Motion Designers (2)
Videomakers (2)
Copywriters (2)
Viral Experts (2)
```

### Traffic Department
```
Meta Ads (3 specialists)
Google Ads (2 specialists)
LinkedIn Ads (1 specialist)
TikTok Ads (1 specialist)
BI Analyst (1)
Benchmark Specialist (1)
```

## Memory System

### Shared Memory Structure
```json
{
  "company_id": "uuid",
  "company": {
    "name": "Company Name",
    "website": "https://...",
    "segment": "B2B SaaS",
    "personas": [...],
    "competitors": [...]
  },
  "market": {
    "trends": [...],
    "opportunities": [...],
    "threats": [...]
  },
  "brand": {
    "palette": { "primary": "#000000" },
    "fonts": [...],
    "tone": "professional"
  },
  "goals": {
    "short_term": [...],
    "medium_term": [...],
    "long_term": [...]
  },
  "metrics": {
    "reach": 10000,
    "engagement": 500,
    "followers": 2000,
    "roi": 3.5
  },
  "content_library": [...],
  "decision_history": [...]
}
```

### Embedding Strategy
- **Content**: Title + Caption → Vector
- **Documents**: Full text → Vector
- **Brand Docs**: Extracted features → Vector
- **Search**: Query → Vector → Similarity Match

## Workflow: From Client to Content

```
1. Client Onboarding
   └─ Executive Meeting (CEO, CMO, Branding, Growth, CSM)
   └─ Data Collection
   └─ File Upload → Vector Indexing

2. Memory Initialization
   └─ Company Profile Vector
   └─ Personas Vector
   └─ Brand Guidelines Vector
   └─ Competitor Analysis Vector

3. Daily Content Generation
   ├─ Growth Agent: Identify opportunities
   ├─ Marketing Team: Generate ideas
   │  ├─ Designers: Visual concepts
   │  ├─ Copywriters: Text & CTAs
   │  ├─ Motion Designers: Animations
   │  └─ Viral Experts: Trends analysis
   └─ Neuro Score: Evaluate content

4. Approval Workflow
   ├─ Content Queue Display
   ├─ CMO Review
   ├─ Feedback Loop
   └─ Revision or Approval

5. Publication
   ├─ Platform Scheduling
   ├─ Multi-Platform Distribution
   └─ Metrics Tracking

6. Analytics & Optimization
   ├─ Real-time Metrics
   ├─ Performance Analysis
   ├─ Alerts Generation
   └─ Recommendations
```

## Technology Stack

### Frontend
- **Framework**: Next.js 15
- **UI**: React 19 + Tailwind CSS + Shadcn UI
- **State**: Zustand
- **Data**: TanStack Query
- **Real-time**: Socket.io

### Backend
- **Runtime**: Node.js
- **Framework**: Express
- **Language**: TypeScript
- **Database**: PostgreSQL (Supabase)
- **Vector Store**: pgvector
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage

### AI & ML
- **Primary LLM**: GROQ (Mixtral 8x7B)
- **Embeddings**: Llama-2-7b
- **RAG Framework**: LlamaIndex
- **Vector Search**: pgvector + Supabase

### Infrastructure
- **Hosting**: Vercel (Frontend) + Supabase (Backend)
- **CI/CD**: GitHub Actions
- **Containers**: Docker
- **Development**: Docker Compose

## Data Flow

```
┌─────────────────┐
│   User Input    │
└────────┬────────┘
         │
         ▼
┌──────────────────────┐
│   Next.js Frontend   │
│   (Dashboard, UI)    │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│   Express API        │
│   (Rest Endpoints)   │
└────────┬─────────────┘
         │
         ├─────────────────┐
         │                 │
         ▼                 ▼
┌──────────────────┐  ┌──────────────────┐
│  Supabase DB     │  │  GROQ LLM API    │
│  (PostgreSQL)    │  │  (AI Processing) │
└──────┬───────────┘  └────────┬─────────┘
       │                       │
       ├───────────┬───────────┤
       │           │           │
       ▼           ▼           ▼
┌─────────────────────────────────────┐
│     Agent System                    │
│  (30+ Specialized Agents)           │
│  - Executive Council                │
│  - Marketing Department             │
│  - Traffic Department               │
│  - Support & Analytics              │
└──────────┬────────────────────────┘
           │
           ▼
┌──────────────────────┐
│  Content Generation  │
│  + Neuro Score       │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Approval Queue      │
│  (Human Review)      │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Multi-Platform      │
│  Publishing          │
└──────────────────────┘
```

## Security Considerations

1. **Authentication**: Supabase Auth with JWT
2. **Authorization**: Row-level security (RLS) in PostgreSQL
3. **API Keys**: Secure environment variables
4. **Data Encryption**: Supabase SSL/TLS
5. **Rate Limiting**: Implement per-user/IP limits
6. **Audit Trail**: Log all agent decisions and API calls

## Performance Optimization

1. **Caching**: Redis for frequently accessed data
2. **Pagination**: Implement cursor-based pagination
3. **Vector Search**: Use pgvector indexes
4. **Batch Processing**: Process content in parallel
5. **CDN**: Serve images from Supabase CDN
6. **Lazy Loading**: Load components on demand

## Scalability

1. **Horizontal Scaling**: Multiple Backend instances
2. **Database**: Supabase handles scaling
3. **Vector Search**: Optimize indexes for scale
4. **Agent Pool**: Increase agents for throughput
5. **Message Queue**: Implement Bull/RabbitMQ for async tasks
6. **Monitoring**: CloudWatch/Datadog for observability
