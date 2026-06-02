# ERIZON AI — PROMPTS QUE AINDA FALTAM APLICAR

## Diagnóstico rápido

O projeto já tem boa base de frontend, backend, agentes, integrações e SQL Supabase. Porém, ainda faltam prompts operacionais para transformar a arquitetura em comportamento real.

Hoje há agentes como CEO, CMO, CRO, CFO, COO, Branding, Growth, Designers, Copywriters e outros, mas várias decisões ainda estão genéricas ou hardcoded. Também há desalinhamento entre alguns serviços do backend e o schema Supabase novo.

---

## 1. Prompt de alinhamento Backend x Supabase

```text
Analise todo o backend do projeto ERIZON AI e alinhe os nomes das tabelas, campos, funções RPC e relacionamentos com o schema Supabase existente em supabase/migrations/202606020001_erizon_ai_full_schema.sql.

Corrija principalmente:
- MemoryService usando shared_memory, pois o schema atual usa knowledge_documents, knowledge_chunks, memory_events e tabelas relacionadas.
- VectorStore usando content_items para embeddings, pois o schema correto usa knowledge_chunks.embedding e a função match_knowledge_chunks.
- RPC search_embeddings, que deve ser trocada por match_knowledge_chunks.
- Qualquer campo inexistente no banco.
- Qualquer tabela inexistente no banco.
- Tipagens TypeScript incompatíveis com o schema.
- Inserções, updates e selects que não batem com as tabelas SQL.

Objetivo:
Deixar backend, Supabase e RAG funcionando juntos sem erro de tabela inexistente.
```

---

## 2. Prompt de System Prompts dos agentes

```text
Crie system prompts completos para todos os agentes da ERIZON AI.

Agentes:
- CEO IA
- CMO IA
- CRO IA
- CFO IA
- COO IA
- Head de Branding IA
- Head de Growth IA
- Designer IA
- Motion Designer IA
- Videomaker IA
- Copywriter IA
- Viral IA
- Especialista Meta Ads
- Especialista Google Ads
- Analista BI
- CSM IA
- Suporte IA
- Tech Lead IA
- QA IA
- Neuro Score IA

Cada prompt deve conter:
- Identidade do agente
- Missão
- Responsabilidades
- Dados que deve consultar
- Como deve tomar decisão
- Como deve se comunicar com outros agentes
- Formato de resposta em JSON
- Critérios de qualidade
- O que nunca deve fazer

Os prompts devem ser salvos em uma estrutura reutilizável no backend, de preferência em:
backend/src/prompts/agents.ts
```

---

## 3. Prompt de onboarding executivo

```text
Implemente o onboarding executivo obrigatório da ERIZON AI.

Fluxo:
1. Primeiro login bloqueia acesso ao dashboard.
2. CEO IA, CMO IA, Head Branding IA, Head Growth IA e CSM IA conduzem a reunião inicial.
3. O sistema coleta dados da empresa, mercado, público, concorrentes, metas e arquivos.
4. Ao final, gera um diagnóstico inicial da empresa.
5. Salva tudo no Supabase.
6. Cria memória inicial no RAG.
7. Libera o dashboard somente após onboarding_completed = true.

Gerar:
- Backend routes
- Frontend pages/components
- Validações
- Salvamento no Supabase
- Estado de progresso
- Resumo final
```

---

## 4. Prompt de Meta Ads Insights real

```text
Corrija e implemente a integração Meta Ads de forma funcional.

Objetivo:
Permitir que o cliente informe access token e act_id, validar a conta e sincronizar insights reais.

Implementar:
- Validação do token
- Validação do act_id
- Coleta de campanhas
- Coleta de conjuntos
- Coleta de anúncios
- Coleta de criativos
- Coleta de insights por dia, nível account/campaign/adset/ad
- Salvamento nas tabelas meta_*
- Geração de recomendações com IA
- Alertas automáticos
- Tratamento de erro de permissão
- Criptografia do token
- Tela de status da conexão

Revisar endpoint, campos da API, paginação, rate limits e versionamento.
Nunca salvar token em texto puro.
```

---

## 5. Prompt de Canva

```text
Implemente a integração Canva na ERIZON AI.

Objetivo:
Permitir que o cliente conecte sua conta Canva, acesse templates autorizados, use brand kit e gere designs a partir dos conteúdos aprovados.

Implementar:
- OAuth Canva
- Salvar conexão criptografada
- Listar templates
- Listar brand kits quando permitido
- Criar design a partir de template
- Preencher template com legenda, headline, CTA e imagem
- Gerar link editável
- Salvar canva_designs e canva_exports
- Botão "Editar no Canva"
- Botão "Exportar"
- Tratamento de erro de permissão
```

---

## 6. Prompt de CapCut / vídeo assistido

```text
Implemente módulo de vídeo assistido para CapCut.

Observação:
Não depender de API não oficial do CapCut.

Criar fluxo:
- Gerar roteiro de Reels
- Gerar cenas
- Gerar legenda falada
- Gerar texto na tela
- Gerar orientação de cortes
- Gerar trilha sugerida
- Gerar pacote ZIP com assets
- Exportar estrutura para o cliente editar no CapCut manualmente
- Permitir integração futura com API de renderização de vídeo
```

---

## 7. Prompt de produção diária de conteúdo

```text
Implemente o motor de produção diária da ERIZON AI.

Todos os dias, para cada empresa ativa:
- Gerar 3 stories
- Gerar 1 feed
- Gerar 1 carrossel
- Gerar 1 reels
- Gerar legenda
- Gerar CTA
- Gerar objetivo
- Gerar justificativa estratégica
- Rodar Neuro Score
- Enviar para aprovação

Salvar em:
- daily_content_batches
- content_items
- content_approvals
- neuro_analyses
```

---

## 8. Prompt de aprovação e entrega em HTML

```text
Implemente o módulo Conteúdos para Aprovação.

Cada item deve mostrar:
- Preview
- Legenda
- CTA
- Objetivo
- Neuro Score
- Justificativa estratégica

Ações:
- Aprovar
- Solicitar alteração
- Rejeitar

Após aprovação:
- Criar página HTML individual
- Exibir imagem/vídeo
- Botão baixar imagem
- Botão baixar vídeo
- Botão copiar legenda
- Botão publicar/agendar

Salvar em:
- content_approvals
- content_delivery_pages
- scheduled_posts
```

---

## 9. Prompt de Neuro Score com IA multimodal

```text
Evolua o Neuro Score para análise real com IA.

Hoje o motor usa atributos manuais. Transforme para:
- Analisar imagem
- Analisar vídeo quando possível
- Analisar legenda
- Analisar CTA
- Analisar hierarquia visual
- Analisar retenção
- Analisar potencial de engajamento
- Analisar risco de ignorar

Retornar:
- Nota final 0 a 100
- Pontuação por critério
- Diagnóstico
- Sugestões específicas
- Versão melhorada do criativo/copy quando possível

Salvar tudo nas tabelas neuro_*.
```

---

## 10. Prompt de reuniões internas automáticas

```text
Implemente o sistema de reuniões internas automáticas entre agentes.

Fluxo:
1. CEO IA convoca reunião.
2. CMO apresenta marketing.
3. Growth apresenta oportunidades.
4. Branding apresenta posicionamento.
5. BI apresenta métricas.
6. Neuro Score apresenta riscos.
7. CFO avalia investimento.
8. CRO avalia conversão.
9. COO avalia execução.
10. Todos votam.
11. CEO consolida a decisão.
12. Sistema salva plano final.

Salvar em:
- agent_meetings
- agent_meeting_participants
- agent_messages
- executive_board_sessions
- executive_board_votes
- strategic_decisions
```

---

## 11. Prompt de segurança e produção

```text
Faça uma auditoria de segurança e produção na ERIZON AI.

Verificar:
- Tokens em texto puro
- Variáveis .env
- RLS Supabase
- Service role exposto no frontend
- Logs com dados sensíveis
- CORS
- Rate limit
- Validação Zod
- Sanitização de inputs
- Erros de autenticação
- Uploads inseguros
- Tamanho máximo de arquivo
- Permissões por company_id
- Proteção de rotas
- Separação frontend/backend

Corrigir todos os problemas encontrados.
```

---

## Ordem recomendada de aplicação

1. Alinhamento Backend x Supabase
2. Segurança e produção
3. System prompts dos agentes
4. Onboarding executivo
5. Meta Ads Insights real
6. RAG/memória vetorial
7. Produção diária de conteúdo
8. Neuro Score IA
9. Aprovação + HTML
10. Canva
11. Vídeo/CapCut assistido
12. Reuniões internas automáticas
