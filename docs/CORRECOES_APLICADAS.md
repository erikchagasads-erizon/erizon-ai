# Correções aplicadas no projeto ERIZON AI

## Banco e Supabase
- A pasta `supabase/` foi colocada dentro da raiz do projeto `Erizon-ai/`.
- Mantidos os arquivos:
  - `supabase/migrations/202606020001_erizon_ai_full_schema.sql`
  - `supabase/schema.sql`
  - `supabase/README.md`

## Backend x Supabase
- `MemoryService` deixou de usar a tabela inexistente `shared_memory`.
- Agora usa:
  - `companies`
  - `company_personas`
  - `company_goals`
  - `company_brand_assets`
  - `metrics_daily`
  - `content_items`
  - `agent_decisions`
  - `memory_events`
  - `knowledge_documents`
  - `knowledge_chunks`

## RAG e vetores
- `VectorStore` deixou de usar `content_items.embedding` e RPC inexistente `search_embeddings`.
- Agora usa:
  - `knowledge_documents`
  - `knowledge_chunks.embedding`
  - RPC `match_knowledge_chunks`

## Integrações
- Criado cliente Supabase backend em `backend/src/utils/supabase.ts`.
- Corrigida API de integrações e montada rota `/api/integrations` no `index.ts`.
- Meta Ads agora possui fluxo real de:
  - validar token
  - validar act_id
  - buscar insights reais
  - sincronizar campanhas, conjuntos, anúncios e criativos
  - salvar nas tabelas `meta_*`
  - gerar análise baseada em dados salvos
- Base URL Meta corrigida para `graph.facebook.com`.
- Tokens são criptografados antes de salvar.

## Canva e CapCut
- Canva recebeu endpoint inicial seguro para conexão e armazenamento criptografado.
- CapCut foi tratado como exportação assistida, sem depender de API não oficial.

## Onboarding
- Onboarding deixou de ser apenas mock.
- Agora cria empresa, sessão, membro proprietário, memória inicial e salva progresso no Supabase.

## Agentes
- Criado arquivo `backend/src/prompts/agents.ts` com system prompts operacionais para agentes principais.

## Segurança
- CORS limitado ao `FRONTEND_URL`.
- Body parser limitado a `25mb`.
- Variáveis de segurança adicionadas ao `.env.example`.

## Observação
Este pacote não instala dependências. Para validar localmente, rode:

```bash
npm install
npm run build
```

Depois aplique o SQL em `supabase/migrations/202606020001_erizon_ai_full_schema.sql` no Supabase.
