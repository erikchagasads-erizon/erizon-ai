# Supabase - ERIZON AI

Esta pasta contém a estrutura SQL completa do banco Supabase da ERIZON AI.

## Arquivos

- `migrations/202606020001_erizon_ai_full_schema.sql`
  - Schema completo: tabelas, índices, funções, triggers, RLS, storage buckets e dados iniciais.

- `schema.sql`
  - Cópia consolidada do schema principal para consulta rápida.

## Como rodar

1. Abra o painel do Supabase.
2. Vá em SQL Editor.
3. Cole o conteúdo de `migrations/202606020001_erizon_ai_full_schema.sql`.
4. Execute.
5. Confira se a extensão `vector` está disponível no seu projeto Supabase.

## Observações importantes

- Tokens sensíveis devem ser salvos criptografados pelo backend.
- As policies RLS assumem que cada arquivo no Storage começa com o `company_id` no path.
  Exemplo: `company-assets/{company_id}/logo.png`
- A dimensão padrão dos embeddings está em `vector(1536)`.
  Se usar outro modelo de embedding, ajuste a dimensão.
