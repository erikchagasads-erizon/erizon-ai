-- =========================================================
-- ERIZON AI - SUPABASE DATABASE SCHEMA
-- SaaS + Multiagentes + RAG + Meta Ads + Canva + BI
-- PostgreSQL / Supabase
-- =========================================================

-- =========================================================
-- 01. EXTENSIONS
-- =========================================================
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";
create extension if not exists "vector";
create extension if not exists "pg_trgm";

-- =========================================================
-- 02. HELPERS
-- =========================================================
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
security definer
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.current_user_id()
returns uuid
language sql
stable
as $$
  select auth.uid();
$$;

-- =========================================================
-- 03. CORE
-- =========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  email text,
  phone text,
  role text default 'user' check (role in ('user','admin','super_admin')),
  onboarding_completed boolean default false,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,
  name text not null,
  legal_name text,
  document_number text,
  website text,
  instagram text,
  facebook text,
  linkedin text,
  tiktok text,
  whatsapp text,
  segment text,
  niche text,
  region text,
  description text,
  status text default 'active' check (status in ('active','inactive','trial','suspended','archived')),
  settings jsonb default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text default 'member' check (role in ('owner','admin','member','viewer','client')),
  status text default 'active' check (status in ('active','invited','inactive','removed')),
  permissions jsonb default '{}'::jsonb,
  invited_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(company_id, user_id)
);

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  price_monthly numeric(12,2) default 0,
  price_yearly numeric(12,2) default 0,
  limits jsonb default '{}'::jsonb,
  features jsonb default '{}'::jsonb,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  plan_id uuid references public.plans(id) on delete set null,
  status text default 'trialing' check (status in ('trialing','active','past_due','canceled','paused','expired')),
  provider text,
  provider_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at timestamptz,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  theme text default 'dark',
  language text default 'pt-BR',
  notifications jsonb default '{}'::jsonb,
  preferences jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, company_id)
);

-- =========================================================
-- 04. SECURITY HELPERS
-- =========================================================
create or replace function public.is_company_member(target_company_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.company_members cm
    where cm.company_id = target_company_id
      and cm.user_id = auth.uid()
      and cm.status = 'active'
  );
$$;

create or replace function public.is_company_admin(target_company_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.company_members cm
    where cm.company_id = target_company_id
      and cm.user_id = auth.uid()
      and cm.status = 'active'
      and cm.role in ('owner','admin')
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- =========================================================
-- 05. ONBOARDING
-- =========================================================
create table if not exists public.onboarding_sessions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text default 'in_progress' check (status in ('in_progress','completed','abandoned')),
  started_at timestamptz default now(),
  completed_at timestamptz,
  summary text,
  data jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.onboarding_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.onboarding_sessions(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  question_key text not null,
  question text,
  answer jsonb,
  agent_name text,
  created_at timestamptz default now()
);

create table if not exists public.company_goals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  description text,
  period text check (period in ('short','medium','long')),
  target_value numeric(14,2),
  metric text,
  due_date date,
  status text default 'active' check (status in ('active','completed','paused','canceled')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.company_personas (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  description text,
  pains jsonb default '[]'::jsonb,
  desires jsonb default '[]'::jsonb,
  demographics jsonb default '{}'::jsonb,
  buying_triggers jsonb default '[]'::jsonb,
  objections jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.company_competitors (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  website text,
  instagram text,
  strengths jsonb default '[]'::jsonb,
  weaknesses jsonb default '[]'::jsonb,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.company_channels (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  channel text not null,
  url text,
  username text,
  status text default 'active',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.company_brand_assets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  asset_type text not null check (asset_type in ('logo','brand_manual','palette','font','catalog','image','video','other')),
  name text not null,
  file_url text,
  storage_path text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =========================================================
-- 06. FILES + RAG MEMORY
-- =========================================================
create table if not exists public.file_categories (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  category_id uuid references public.file_categories(id) on delete set null,
  uploaded_by uuid references public.profiles(id) on delete set null,
  name text not null,
  original_name text,
  mime_type text,
  size_bytes bigint,
  bucket text,
  storage_path text,
  public_url text,
  status text default 'uploaded' check (status in ('uploaded','processing','processed','failed','archived')),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.file_processing_jobs (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references public.files(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  job_type text not null,
  status text default 'pending' check (status in ('pending','running','completed','failed')),
  error_message text,
  result jsonb default '{}'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  file_id uuid references public.files(id) on delete set null,
  title text not null,
  source_type text default 'upload' check (source_type in ('upload','manual','integration','web','agent')),
  content text,
  summary text,
  metadata jsonb default '{}'::jsonb,
  status text default 'active' check (status in ('active','archived','deleted')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  document_id uuid not null references public.knowledge_documents(id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  token_count integer,
  embedding vector(1536),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  unique(document_id, chunk_index)
);

create table if not exists public.knowledge_embeddings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  chunk_id uuid not null references public.knowledge_chunks(id) on delete cascade,
  provider text,
  model text,
  dimensions integer default 1536,
  embedding vector(1536),
  created_at timestamptz default now()
);

create table if not exists public.memory_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  actor_type text check (actor_type in ('user','agent','system')),
  actor_id text,
  event_type text not null,
  title text,
  content text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.vector_search_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  query text,
  match_count integer,
  similarity_threshold numeric,
  results jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

create or replace function public.match_knowledge_chunks(
  query_embedding vector(1536),
  target_company_id uuid,
  match_threshold float default 0.70,
  match_count int default 10
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  similarity float,
  metadata jsonb
)
language sql
stable
as $$
  select
    kc.id,
    kc.document_id,
    kc.content,
    1 - (kc.embedding <=> query_embedding) as similarity,
    kc.metadata
  from public.knowledge_chunks kc
  where kc.company_id = target_company_id
    and kc.embedding is not null
    and (1 - (kc.embedding <=> query_embedding)) > match_threshold
  order by kc.embedding <=> query_embedding
  limit match_count;
$$;

-- =========================================================
-- 07. AGENTS + EXECUTIVE BOARD
-- =========================================================
create table if not exists public.agent_roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  department text,
  description text,
  system_prompt text,
  tools jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  role_id uuid references public.agent_roles(id) on delete set null,
  name text not null,
  title text,
  department text,
  model_provider text default 'groq',
  model_name text,
  temperature numeric(3,2) default 0.7,
  is_global boolean default false,
  is_active boolean default true,
  memory_scope text default 'company',
  config jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.agent_meetings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  objective text,
  status text default 'scheduled' check (status in ('scheduled','running','completed','failed','canceled')),
  summary text,
  result jsonb default '{}'::jsonb,
  started_at timestamptz,
  ended_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.agent_meeting_participants (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.agent_meetings(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete cascade,
  role_in_meeting text,
  created_at timestamptz default now(),
  unique(meeting_id, agent_id)
);

create table if not exists public.agent_messages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  meeting_id uuid references public.agent_meetings(id) on delete cascade,
  agent_id uuid references public.agents(id) on delete set null,
  user_id uuid references public.profiles(id) on delete set null,
  sender_type text not null check (sender_type in ('agent','user','system')),
  content text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.agent_decisions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  meeting_id uuid references public.agent_meetings(id) on delete set null,
  decision text not null,
  rationale text,
  approved_by_agent_id uuid references public.agents(id) on delete set null,
  status text default 'approved' check (status in ('draft','approved','rejected','implemented')),
  impact_score integer check (impact_score between 0 and 100),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.agent_tasks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  agent_id uuid references public.agents(id) on delete set null,
  assigned_to_user_id uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  priority text default 'medium' check (priority in ('low','medium','high','critical')),
  status text default 'pending' check (status in ('pending','running','completed','failed','canceled')),
  due_at timestamptz,
  result jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.agent_execution_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  agent_id uuid references public.agents(id) on delete set null,
  task_id uuid references public.agent_tasks(id) on delete set null,
  action text not null,
  input jsonb default '{}'::jsonb,
  output jsonb default '{}'::jsonb,
  status text default 'success' check (status in ('success','error','warning')),
  error_message text,
  duration_ms integer,
  created_at timestamptz default now()
);

create table if not exists public.executive_board_sessions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  meeting_id uuid references public.agent_meetings(id) on delete set null,
  title text not null,
  agenda jsonb default '[]'::jsonb,
  summary text,
  final_plan jsonb default '{}'::jsonb,
  status text default 'draft' check (status in ('draft','running','completed','archived')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.executive_board_votes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.executive_board_sessions(id) on delete cascade,
  agent_id uuid references public.agents(id) on delete set null,
  vote text not null check (vote in ('approve','reject','abstain','revise')),
  reason text,
  created_at timestamptz default now()
);

create table if not exists public.strategic_decisions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  session_id uuid references public.executive_board_sessions(id) on delete set null,
  title text not null,
  description text,
  category text,
  priority text default 'medium',
  status text default 'approved',
  expected_impact jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =========================================================
-- 08. MARKETING + CONTENT
-- =========================================================
create table if not exists public.content_plans (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  period_type text check (period_type in ('annual','quarterly','monthly','weekly')),
  start_date date,
  end_date date,
  strategy jsonb default '{}'::jsonb,
  status text default 'draft' check (status in ('draft','active','completed','archived')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.content_calendar (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  plan_id uuid references public.content_plans(id) on delete set null,
  date date not null,
  channel text,
  theme text,
  objective text,
  notes text,
  status text default 'planned',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  calendar_id uuid references public.content_calendar(id) on delete set null,
  content_type text not null check (content_type in ('story','feed','carousel','reels','video','ad','email','landing_page')),
  title text not null,
  caption text,
  cta text,
  objective text,
  strategic_justification text,
  status text default 'draft' check (status in ('draft','in_review','approved','changes_requested','rejected','published','scheduled')),
  platform text,
  publish_at timestamptz,
  neuro_score integer check (neuro_score between 0 and 100),
  metadata jsonb default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.content_versions (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  version_number integer not null,
  caption text,
  cta text,
  asset_data jsonb default '{}'::jsonb,
  change_notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  unique(content_item_id, version_number)
);

create table if not exists public.content_assets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  content_item_id uuid references public.content_items(id) on delete cascade,
  file_id uuid references public.files(id) on delete set null,
  asset_type text check (asset_type in ('image','video','audio','document','html','other')),
  url text,
  storage_path text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.content_approvals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  requested_by uuid references public.profiles(id) on delete set null,
  reviewed_by uuid references public.profiles(id) on delete set null,
  status text default 'pending' check (status in ('pending','approved','changes_requested','rejected')),
  feedback text,
  reviewed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.content_comments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  comment text not null,
  created_at timestamptz default now()
);

create table if not exists public.content_delivery_pages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  slug text unique not null,
  html_content text,
  download_enabled boolean default true,
  public_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.daily_content_batches (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  batch_date date not null,
  status text default 'generated' check (status in ('generated','in_review','approved','published','failed')),
  summary text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(company_id, batch_date)
);

create table if not exists public.daily_stories (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.daily_content_batches(id) on delete cascade,
  content_item_id uuid references public.content_items(id) on delete cascade,
  story_order integer not null default 1,
  created_at timestamptz default now()
);

create table if not exists public.daily_feed_posts (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.daily_content_batches(id) on delete cascade,
  content_item_id uuid references public.content_items(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists public.daily_carousels (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.daily_content_batches(id) on delete cascade,
  content_item_id uuid references public.content_items(id) on delete cascade,
  slide_count integer default 1,
  created_at timestamptz default now()
);

create table if not exists public.daily_reels (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.daily_content_batches(id) on delete cascade,
  content_item_id uuid references public.content_items(id) on delete cascade,
  duration_seconds integer,
  created_at timestamptz default now()
);

-- =========================================================
-- 09. NEURO SCORE
-- =========================================================
create table if not exists public.neuro_score_criteria (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  weight numeric(5,2) default 1,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.neuro_analyses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  content_item_id uuid references public.content_items(id) on delete set null,
  file_id uuid references public.files(id) on delete set null,
  analysis_type text check (analysis_type in ('image','story','reels','video','carousel','ad')),
  status text default 'pending' check (status in ('pending','running','completed','failed')),
  final_score integer check (final_score between 0 and 100),
  engagement_potential text,
  conversion_potential text,
  ignore_risk text,
  summary text,
  result jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.neuro_scores (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.neuro_analyses(id) on delete cascade,
  criterion_id uuid references public.neuro_score_criteria(id) on delete set null,
  criterion_name text not null,
  score integer not null check (score between 0 and 100),
  explanation text,
  created_at timestamptz default now()
);

create table if not exists public.neuro_recommendations (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.neuro_analyses(id) on delete cascade,
  priority text default 'medium' check (priority in ('low','medium','high','critical')),
  recommendation text not null,
  expected_impact text,
  status text default 'open' check (status in ('open','applied','ignored')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function public.calculate_neuro_score(target_analysis_id uuid)
returns integer
language plpgsql
security definer
as $$
declare
  result_score integer;
begin
  select coalesce(round(avg(score))::int, 0)
  into result_score
  from public.neuro_scores
  where analysis_id = target_analysis_id;

  update public.neuro_analyses
  set final_score = result_score, updated_at = now()
  where id = target_analysis_id;

  return result_score;
end;
$$;

-- =========================================================
-- 10. META ADS
-- =========================================================
create table if not exists public.meta_connections (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  connected_by uuid references public.profiles(id) on delete set null,
  status text default 'connected' check (status in ('connected','disconnected','expired','error')),
  access_token_encrypted text,
  token_expires_at timestamptz,
  scopes jsonb default '[]'::jsonb,
  last_sync_at timestamptz,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.meta_businesses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  connection_id uuid references public.meta_connections(id) on delete cascade,
  external_id text not null,
  name text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(company_id, external_id)
);

create table if not exists public.meta_ad_accounts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  connection_id uuid references public.meta_connections(id) on delete cascade,
  business_id uuid references public.meta_businesses(id) on delete set null,
  external_id text not null,
  act_id text not null,
  name text,
  currency text,
  timezone_name text,
  account_status integer,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(company_id, act_id)
);

create table if not exists public.meta_campaigns (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  ad_account_id uuid references public.meta_ad_accounts(id) on delete cascade,
  external_id text not null,
  name text,
  objective text,
  status text,
  effective_status text,
  daily_budget numeric(14,2),
  lifetime_budget numeric(14,2),
  start_time timestamptz,
  stop_time timestamptz,
  raw_data jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(company_id, external_id)
);

create table if not exists public.meta_adsets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  campaign_id uuid references public.meta_campaigns(id) on delete cascade,
  external_id text not null,
  name text,
  optimization_goal text,
  billing_event text,
  bid_strategy text,
  status text,
  effective_status text,
  daily_budget numeric(14,2),
  lifetime_budget numeric(14,2),
  targeting jsonb default '{}'::jsonb,
  raw_data jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(company_id, external_id)
);

create table if not exists public.meta_ads (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  adset_id uuid references public.meta_adsets(id) on delete cascade,
  campaign_id uuid references public.meta_campaigns(id) on delete cascade,
  external_id text not null,
  creative_id text,
  name text,
  status text,
  effective_status text,
  raw_data jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(company_id, external_id)
);

create table if not exists public.meta_creatives (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  ad_id uuid references public.meta_ads(id) on delete cascade,
  external_id text not null,
  name text,
  body text,
  title text,
  image_url text,
  video_id text,
  object_story_spec jsonb default '{}'::jsonb,
  raw_data jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(company_id, external_id)
);

create table if not exists public.meta_insights_daily (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  ad_account_id uuid references public.meta_ad_accounts(id) on delete cascade,
  campaign_id uuid references public.meta_campaigns(id) on delete cascade,
  adset_id uuid references public.meta_adsets(id) on delete cascade,
  ad_id uuid references public.meta_ads(id) on delete cascade,
  date_start date not null,
  date_stop date not null,
  level text not null check (level in ('account','campaign','adset','ad')),
  spend numeric(14,4) default 0,
  impressions bigint default 0,
  reach bigint default 0,
  frequency numeric(14,4),
  clicks bigint default 0,
  inline_link_clicks bigint default 0,
  ctr numeric(14,6),
  cpc numeric(14,6),
  cpm numeric(14,6),
  leads bigint default 0,
  purchases bigint default 0,
  purchase_value numeric(14,4) default 0,
  roas numeric(14,6),
  actions jsonb default '[]'::jsonb,
  raw_data jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.meta_leads (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  ad_id uuid references public.meta_ads(id) on delete set null,
  external_id text not null,
  form_id text,
  lead_data jsonb default '{}'::jsonb,
  created_time timestamptz,
  created_at timestamptz default now(),
  unique(company_id, external_id)
);

create table if not exists public.meta_sync_jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  connection_id uuid references public.meta_connections(id) on delete cascade,
  job_type text not null,
  status text default 'pending' check (status in ('pending','running','completed','failed')),
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  result jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.meta_alerts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  severity text default 'medium' check (severity in ('low','medium','high','critical')),
  title text not null,
  description text,
  entity_type text,
  entity_id uuid,
  status text default 'open' check (status in ('open','resolved','ignored')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.meta_recommendations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  description text,
  priority text default 'medium',
  expected_impact text,
  status text default 'open',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =========================================================
-- 11. CANVA + GOOGLE ADS
-- =========================================================
create table if not exists public.canva_connections (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  connected_by uuid references public.profiles(id) on delete set null,
  status text default 'connected' check (status in ('connected','disconnected','expired','error')),
  access_token_encrypted text,
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  scopes jsonb default '[]'::jsonb,
  last_sync_at timestamptz,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.canva_templates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  connection_id uuid references public.canva_connections(id) on delete cascade,
  external_id text not null,
  name text,
  thumbnail_url text,
  design_type text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(company_id, external_id)
);

create table if not exists public.canva_designs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  template_id uuid references public.canva_templates(id) on delete set null,
  content_item_id uuid references public.content_items(id) on delete set null,
  external_id text,
  name text,
  edit_url text,
  view_url text,
  status text default 'draft',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.canva_exports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  design_id uuid references public.canva_designs(id) on delete cascade,
  export_format text,
  export_url text,
  status text default 'pending' check (status in ('pending','running','completed','failed')),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.canva_brand_kits (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  connection_id uuid references public.canva_connections(id) on delete cascade,
  external_id text,
  name text,
  colors jsonb default '[]'::jsonb,
  fonts jsonb default '[]'::jsonb,
  logos jsonb default '[]'::jsonb,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.canva_sync_jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  connection_id uuid references public.canva_connections(id) on delete cascade,
  status text default 'pending' check (status in ('pending','running','completed','failed')),
  result jsonb default '{}'::jsonb,
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.google_connections (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  connected_by uuid references public.profiles(id) on delete set null,
  status text default 'connected',
  access_token_encrypted text,
  refresh_token_encrypted text,
  customer_id text,
  last_sync_at timestamptz,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.google_campaigns (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  connection_id uuid references public.google_connections(id) on delete cascade,
  external_id text not null,
  name text,
  status text,
  channel_type text,
  raw_data jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(company_id, external_id)
);

create table if not exists public.google_insights_daily (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  campaign_id uuid references public.google_campaigns(id) on delete cascade,
  insight_date date not null,
  cost numeric(14,4) default 0,
  impressions bigint default 0,
  clicks bigint default 0,
  conversions numeric(14,4) default 0,
  conversion_value numeric(14,4) default 0,
  raw_data jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- =========================================================
-- 12. GROWTH + BI + FINANCE + CS
-- =========================================================
create table if not exists public.growth_opportunities (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  description text,
  source text,
  impact_score integer check (impact_score between 0 and 100),
  effort_score integer check (effort_score between 0 and 100),
  priority text default 'medium',
  status text default 'open',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.growth_experiments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  hypothesis text,
  metric text,
  start_date date,
  end_date date,
  status text default 'planned',
  result jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.growth_hypotheses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  hypothesis text not null,
  evidence jsonb default '[]'::jsonb,
  confidence integer check (confidence between 0 and 100),
  status text default 'open',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.growth_reports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  period_start date,
  period_end date,
  summary text,
  data jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.growth_actions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  opportunity_id uuid references public.growth_opportunities(id) on delete set null,
  title text not null,
  description text,
  status text default 'todo',
  due_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.kpis (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  key text not null,
  value numeric(18,4),
  target numeric(18,4),
  period text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(company_id, key, period)
);

create table if not exists public.metrics_daily (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  metric_date date not null,
  source text,
  metrics jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  unique(company_id, metric_date, source)
);

create table if not exists public.metrics_weekly (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  week_start date not null,
  source text,
  metrics jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  unique(company_id, week_start, source)
);

create table if not exists public.metrics_monthly (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  month_start date not null,
  source text,
  metrics jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  unique(company_id, month_start, source)
);

create table if not exists public.dashboard_snapshots (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  snapshot_date date default current_date,
  marketing_score integer,
  branding_score integer,
  growth_score integer,
  neuro_score integer,
  performance_score integer,
  data jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.executive_reports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  report_type text,
  period_start date,
  period_end date,
  summary text,
  content jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  severity text default 'medium',
  title text not null,
  description text,
  source text,
  status text default 'open',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.customer_success_tasks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  description text,
  assigned_to uuid references public.profiles(id) on delete set null,
  status text default 'todo',
  due_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.customer_success_notes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  note text not null,
  created_at timestamptz default now()
);

create table if not exists public.customer_health_scores (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  score integer check (score between 0 and 100),
  status text,
  reasons jsonb default '[]'::jsonb,
  calculated_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  opened_by uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  status text default 'open',
  priority text default 'medium',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null,
  message text not null,
  created_at timestamptz default now()
);

create table if not exists public.financial_metrics (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  metric_date date not null,
  revenue numeric(14,2) default 0,
  spend numeric(14,2) default 0,
  profit numeric(14,2) default 0,
  data jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.cac_records (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  record_date date not null,
  channel text,
  spend numeric(14,2) default 0,
  customers integer default 0,
  cac numeric(14,4),
  created_at timestamptz default now()
);

create table if not exists public.ltv_records (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  record_date date not null,
  ltv numeric(14,4),
  data jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.roi_records (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  record_date date not null,
  investment numeric(14,2),
  return_value numeric(14,2),
  roi numeric(14,6),
  created_at timestamptz default now()
);

create table if not exists public.roas_records (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  record_date date not null,
  ad_spend numeric(14,2),
  revenue numeric(14,2),
  roas numeric(14,6),
  created_at timestamptz default now()
);

-- =========================================================
-- 13. PUBLISHING + SYSTEM
-- =========================================================
create table if not exists public.social_connections (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  platform text not null,
  account_name text,
  external_id text,
  access_token_encrypted text,
  refresh_token_encrypted text,
  status text default 'connected',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.scheduled_posts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  content_item_id uuid references public.content_items(id) on delete cascade,
  social_connection_id uuid references public.social_connections(id) on delete set null,
  platform text not null,
  scheduled_at timestamptz not null,
  status text default 'scheduled' check (status in ('scheduled','publishing','published','failed','canceled')),
  external_post_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.publishing_jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  scheduled_post_id uuid references public.scheduled_posts(id) on delete cascade,
  status text default 'pending',
  attempts integer default 0,
  error_message text,
  result jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.publishing_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  job_id uuid references public.publishing_jobs(id) on delete cascade,
  message text,
  level text default 'info',
  data jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  message text,
  type text default 'info',
  read_at timestamptz,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  table_name text,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz default now()
);

create table if not exists public.integration_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  integration text not null,
  action text not null,
  status text default 'success',
  request jsonb default '{}'::jsonb,
  response jsonb default '{}'::jsonb,
  error_message text,
  created_at timestamptz default now()
);

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  name text not null,
  key_hash text not null,
  last_used_at timestamptz,
  expires_at timestamptz,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.encrypted_credentials (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  provider text not null,
  credential_key text not null,
  encrypted_value text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(company_id, provider, credential_key)
);

create table if not exists public.webhooks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  provider text not null,
  event_type text not null,
  payload jsonb default '{}'::jsonb,
  processed_at timestamptz,
  status text default 'received',
  created_at timestamptz default now()
);

create table if not exists public.cron_jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  name text not null,
  schedule text not null,
  function_name text,
  status text default 'active',
  last_run_at timestamptz,
  next_run_at timestamptz,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =========================================================
-- 14. SCORE FUNCTIONS
-- =========================================================
create or replace function public.calculate_marketing_score(target_company_id uuid)
returns integer
language plpgsql
security definer
as $$
declare
  score integer;
begin
  select least(100, greatest(0, coalesce(round(
    (coalesce(avg(ctr),0) * 10) + 
    (case when coalesce(sum(leads),0) > 0 then 30 else 10 end) +
    (case when coalesce(avg(cpc),0) > 0 then 30 else 10 end)
  ), 0)::int))
  into score
  from public.meta_insights_daily
  where company_id = target_company_id
    and date_start >= current_date - interval '30 days';

  return coalesce(score, 0);
end;
$$;

create or replace function public.calculate_growth_score(target_company_id uuid)
returns integer
language plpgsql
security definer
as $$
declare
  score integer;
begin
  select least(100, greatest(0, coalesce(round(avg(impact_score)), 0)::int))
  into score
  from public.growth_opportunities
  where company_id = target_company_id
    and status in ('open','active');

  return coalesce(score, 0);
end;
$$;

create or replace function public.calculate_customer_health_score(target_company_id uuid)
returns integer
language plpgsql
security definer
as $$
declare
  latest_score integer;
begin
  select score into latest_score
  from public.customer_health_scores
  where company_id = target_company_id
  order by calculated_at desc
  limit 1;

  return coalesce(latest_score, 50);
end;
$$;

-- =========================================================
-- 15. INDEXES
-- =========================================================
create index if not exists idx_companies_owner_id on public.companies(owner_id);
create index if not exists idx_company_members_company_id on public.company_members(company_id);
create index if not exists idx_company_members_user_id on public.company_members(user_id);
create index if not exists idx_content_items_company_status on public.content_items(company_id, status);
create index if not exists idx_content_items_publish_at on public.content_items(publish_at);
create index if not exists idx_meta_insights_company_date on public.meta_insights_daily(company_id, date_start);
create index if not exists idx_meta_campaigns_external on public.meta_campaigns(company_id, external_id);
create index if not exists idx_meta_adsets_external on public.meta_adsets(company_id, external_id);
create index if not exists idx_meta_ads_external on public.meta_ads(company_id, external_id);
create index if not exists idx_meta_ad_accounts_act_id on public.meta_ad_accounts(company_id, act_id);
create index if not exists idx_knowledge_chunks_company on public.knowledge_chunks(company_id);
create index if not exists idx_knowledge_chunks_embedding on public.knowledge_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index if not exists idx_files_company_status on public.files(company_id, status);
create index if not exists idx_notifications_user_read on public.notifications(user_id, read_at);
create index if not exists idx_audit_logs_company_created on public.audit_logs(company_id, created_at);
create index if not exists idx_metrics_daily_company_date on public.metrics_daily(company_id, metric_date);
create index if not exists idx_scheduled_posts_status_time on public.scheduled_posts(status, scheduled_at);

-- =========================================================
-- 16. UPDATED_AT TRIGGERS
-- =========================================================
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles','companies','company_members','plans','subscriptions','user_settings',
    'onboarding_sessions','company_goals','company_personas','company_competitors','company_channels','company_brand_assets',
    'file_categories','files','file_processing_jobs','knowledge_documents',
    'agent_roles','agents','agent_meetings','agent_decisions','agent_tasks',
    'executive_board_sessions','strategic_decisions',
    'content_plans','content_calendar','content_items','content_approvals','content_delivery_pages',
    'daily_content_batches','neuro_score_criteria','neuro_analyses','neuro_recommendations',
    'meta_connections','meta_businesses','meta_ad_accounts','meta_campaigns','meta_adsets','meta_ads','meta_creatives','meta_insights_daily','meta_sync_jobs','meta_alerts','meta_recommendations',
    'canva_connections','canva_templates','canva_designs','canva_exports','canva_brand_kits','canva_sync_jobs',
    'google_connections','google_campaigns','growth_opportunities','growth_experiments','growth_hypotheses','growth_actions',
    'kpis','executive_reports','alerts','customer_success_tasks','support_tickets',
    'social_connections','scheduled_posts','publishing_jobs','api_keys','encrypted_credentials','cron_jobs'
  ]
  loop
    execute format('drop trigger if exists update_%I_updated_at on public.%I', t, t);
    execute format('create trigger update_%I_updated_at before update on public.%I for each row execute function public.update_updated_at_column()', t, t);
  end loop;
end;
$$;

-- =========================================================
-- 17. ROW LEVEL SECURITY
-- =========================================================
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles','companies','company_members','plans','subscriptions','user_settings',
    'onboarding_sessions','onboarding_answers','company_goals','company_personas','company_competitors','company_channels','company_brand_assets',
    'file_categories','files','file_processing_jobs','knowledge_documents','knowledge_chunks','knowledge_embeddings','memory_events','vector_search_logs',
    'agent_roles','agents','agent_meetings','agent_meeting_participants','agent_messages','agent_decisions','agent_tasks','agent_execution_logs',
    'executive_board_sessions','executive_board_votes','strategic_decisions',
    'content_plans','content_calendar','content_items','content_versions','content_assets','content_approvals','content_comments','content_delivery_pages',
    'daily_content_batches','daily_stories','daily_feed_posts','daily_carousels','daily_reels',
    'neuro_score_criteria','neuro_analyses','neuro_scores','neuro_recommendations',
    'meta_connections','meta_businesses','meta_ad_accounts','meta_campaigns','meta_adsets','meta_ads','meta_creatives','meta_insights_daily','meta_leads','meta_sync_jobs','meta_alerts','meta_recommendations',
    'canva_connections','canva_templates','canva_designs','canva_exports','canva_brand_kits','canva_sync_jobs',
    'google_connections','google_campaigns','google_insights_daily',
    'growth_opportunities','growth_experiments','growth_hypotheses','growth_reports','growth_actions',
    'kpis','metrics_daily','metrics_weekly','metrics_monthly','dashboard_snapshots','executive_reports','alerts',
    'customer_success_tasks','customer_success_notes','customer_health_scores','support_tickets','support_messages',
    'financial_metrics','cac_records','ltv_records','roi_records','roas_records',
    'social_connections','scheduled_posts','publishing_jobs','publishing_logs',
    'notifications','audit_logs','integration_logs','api_keys','encrypted_credentials','webhooks','cron_jobs'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end;
$$;

-- Profiles policies
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
for select using (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
for update using (id = auth.uid()) with check (id = auth.uid());

-- Plans are public readable
drop policy if exists "plans_read_all" on public.plans;
create policy "plans_read_all" on public.plans
for select using (true);

-- Companies and members
drop policy if exists "companies_member_select" on public.companies;
create policy "companies_member_select" on public.companies
for select using (public.is_company_member(id) or owner_id = auth.uid());

drop policy if exists "companies_owner_insert" on public.companies;
create policy "companies_owner_insert" on public.companies
for insert with check (owner_id = auth.uid() or created_by = auth.uid());

drop policy if exists "companies_admin_update" on public.companies;
create policy "companies_admin_update" on public.companies
for update using (public.is_company_admin(id) or owner_id = auth.uid())
with check (public.is_company_admin(id) or owner_id = auth.uid());

drop policy if exists "company_members_select" on public.company_members;
create policy "company_members_select" on public.company_members
for select using (public.is_company_member(company_id) or user_id = auth.uid());

drop policy if exists "company_members_admin_manage" on public.company_members;
create policy "company_members_admin_manage" on public.company_members
for all using (public.is_company_admin(company_id))
with check (public.is_company_admin(company_id));

-- Generic company_id policies
do $$
declare
  t text;
begin
  foreach t in array array[
    'subscriptions','user_settings',
    'onboarding_sessions','onboarding_answers','company_goals','company_personas','company_competitors','company_channels','company_brand_assets',
    'file_categories','files','file_processing_jobs','knowledge_documents','knowledge_chunks','knowledge_embeddings','memory_events','vector_search_logs',
    'agents','agent_meetings','agent_messages','agent_decisions','agent_tasks','agent_execution_logs',
    'executive_board_sessions','strategic_decisions',
    'content_plans','content_calendar','content_items','content_assets','content_approvals','content_comments','content_delivery_pages',
    'daily_content_batches','neuro_analyses',
    'meta_connections','meta_businesses','meta_ad_accounts','meta_campaigns','meta_adsets','meta_ads','meta_creatives','meta_insights_daily','meta_leads','meta_sync_jobs','meta_alerts','meta_recommendations',
    'canva_connections','canva_templates','canva_designs','canva_exports','canva_brand_kits','canva_sync_jobs',
    'google_connections','google_campaigns','google_insights_daily',
    'growth_opportunities','growth_experiments','growth_hypotheses','growth_reports','growth_actions',
    'kpis','metrics_daily','metrics_weekly','metrics_monthly','dashboard_snapshots','executive_reports','alerts',
    'customer_success_tasks','customer_success_notes','customer_health_scores','support_tickets',
    'financial_metrics','cac_records','ltv_records','roi_records','roas_records',
    'social_connections','scheduled_posts','publishing_jobs','publishing_logs',
    'notifications','audit_logs','integration_logs','api_keys','encrypted_credentials','webhooks','cron_jobs'
  ]
  loop
    execute format('drop policy if exists "%s_member_select" on public.%I', t, t);
    execute format('create policy "%s_member_select" on public.%I for select using (public.is_company_member(company_id))', t, t);

    execute format('drop policy if exists "%s_member_insert" on public.%I', t, t);
    execute format('create policy "%s_member_insert" on public.%I for insert with check (public.is_company_member(company_id))', t, t);

    execute format('drop policy if exists "%s_admin_update" on public.%I', t, t);
    execute format('create policy "%s_admin_update" on public.%I for update using (public.is_company_admin(company_id)) with check (public.is_company_admin(company_id))', t, t);

    execute format('drop policy if exists "%s_admin_delete" on public.%I', t, t);
    execute format('create policy "%s_admin_delete" on public.%I for delete using (public.is_company_admin(company_id))', t, t);
  end loop;
end;
$$;

-- Public/global reference tables
drop policy if exists "agent_roles_read_all" on public.agent_roles;
create policy "agent_roles_read_all" on public.agent_roles
for select using (true);

drop policy if exists "neuro_criteria_read_all" on public.neuro_score_criteria;
create policy "neuro_criteria_read_all" on public.neuro_score_criteria
for select using (true);

-- Child tables without company_id: access through parent
drop policy if exists "agent_meeting_participants_member_select" on public.agent_meeting_participants;
create policy "agent_meeting_participants_member_select" on public.agent_meeting_participants
for select using (
  exists (
    select 1 from public.agent_meetings m
    where m.id = meeting_id and public.is_company_member(m.company_id)
  )
);

drop policy if exists "executive_board_votes_member_select" on public.executive_board_votes;
create policy "executive_board_votes_member_select" on public.executive_board_votes
for select using (
  exists (
    select 1 from public.executive_board_sessions s
    where s.id = session_id and public.is_company_member(s.company_id)
  )
);

drop policy if exists "content_versions_member_select" on public.content_versions;
create policy "content_versions_member_select" on public.content_versions
for select using (
  exists (
    select 1 from public.content_items ci
    where ci.id = content_item_id and public.is_company_member(ci.company_id)
  )
);

drop policy if exists "neuro_scores_member_select" on public.neuro_scores;
create policy "neuro_scores_member_select" on public.neuro_scores
for select using (
  exists (
    select 1 from public.neuro_analyses na
    where na.id = analysis_id and public.is_company_member(na.company_id)
  )
);

drop policy if exists "neuro_recommendations_member_select" on public.neuro_recommendations;
create policy "neuro_recommendations_member_select" on public.neuro_recommendations
for select using (
  exists (
    select 1 from public.neuro_analyses na
    where na.id = analysis_id and public.is_company_member(na.company_id)
  )
);

drop policy if exists "support_messages_member_select" on public.support_messages;
create policy "support_messages_member_select" on public.support_messages
for select using (
  exists (
    select 1 from public.support_tickets st
    where st.id = ticket_id and public.is_company_member(st.company_id)
  )
);

-- =========================================================
-- 18. STORAGE BUCKETS + POLICIES
-- =========================================================
insert into storage.buckets (id, name, public)
values 
  ('company-assets', 'company-assets', false),
  ('content-assets', 'content-assets', false),
  ('brand-assets', 'brand-assets', false),
  ('uploads', 'uploads', false),
  ('video-assets', 'video-assets', false),
  ('reports', 'reports', false)
on conflict (id) do nothing;

drop policy if exists "storage_company_member_read" on storage.objects;
create policy "storage_company_member_read" on storage.objects
for select using (
  bucket_id in ('company-assets','content-assets','brand-assets','uploads','video-assets','reports')
  and exists (
    select 1 from public.company_members cm
    where cm.user_id = auth.uid()
      and cm.status = 'active'
      and (storage.foldername(name))[1] = cm.company_id::text
  )
);

drop policy if exists "storage_company_member_insert" on storage.objects;
create policy "storage_company_member_insert" on storage.objects
for insert with check (
  bucket_id in ('company-assets','content-assets','brand-assets','uploads','video-assets','reports')
  and exists (
    select 1 from public.company_members cm
    where cm.user_id = auth.uid()
      and cm.status = 'active'
      and (storage.foldername(name))[1] = cm.company_id::text
  )
);

drop policy if exists "storage_company_admin_update" on storage.objects;
create policy "storage_company_admin_update" on storage.objects
for update using (
  bucket_id in ('company-assets','content-assets','brand-assets','uploads','video-assets','reports')
  and exists (
    select 1 from public.company_members cm
    where cm.user_id = auth.uid()
      and cm.status = 'active'
      and cm.role in ('owner','admin')
      and (storage.foldername(name))[1] = cm.company_id::text
  )
);

drop policy if exists "storage_company_admin_delete" on storage.objects;
create policy "storage_company_admin_delete" on storage.objects
for delete using (
  bucket_id in ('company-assets','content-assets','brand-assets','uploads','video-assets','reports')
  and exists (
    select 1 from public.company_members cm
    where cm.user_id = auth.uid()
      and cm.status = 'active'
      and cm.role in ('owner','admin')
      and (storage.foldername(name))[1] = cm.company_id::text
  )
);

-- =========================================================
-- 19. SEED DATA
-- =========================================================
insert into public.neuro_score_criteria (name, description, weight)
values
  ('Atenção', 'Capacidade de capturar atenção nos primeiros segundos.', 1.2),
  ('Contraste', 'Força visual, destaque e diferenciação.', 1.0),
  ('Emoção', 'Potencial emocional e conexão humana.', 1.1),
  ('Curiosidade', 'Gatilho de abertura, promessa e tensão narrativa.', 1.0),
  ('Memorização', 'Facilidade de lembrar a mensagem.', 0.9),
  ('Escaneabilidade', 'Leitura rápida e organização visual.', 1.0),
  ('Leitura visual', 'Clareza da hierarquia visual.', 1.0),
  ('Retenção', 'Potencial de manter o usuário assistindo/lendo.', 1.2)
on conflict (name) do nothing;

insert into public.agent_roles (name, department, description)
values
  ('CEO IA', 'Conselho Executivo', 'Direcionamento estratégico, visão de longo prazo e aprovação final.'),
  ('CMO IA', 'Marketing', 'Estratégia de marketing, posicionamento, branding, conteúdo e aquisição.'),
  ('CRO IA', 'Receita', 'Funis, conversão, vendas e performance comercial.'),
  ('CFO IA', 'Financeiro', 'CAC, ROI, LTV, rentabilidade e eficiência de investimento.'),
  ('COO IA', 'Operações', 'Processos, eficiência, fluxos internos e escalabilidade.'),
  ('Head de Branding IA', 'Branding', 'Marca, percepção de valor e diferenciação.'),
  ('Head de Growth IA', 'Growth', 'Crescimento acelerado, experimentação e novos canais.'),
  ('Analista BI IA', 'BI', 'Métricas, relatórios, alertas e recomendações.'),
  ('Neuro Score IA', 'Neuro Score', 'Avaliação de criativos antes da publicação.'),
  ('CSM IA', 'Customer Success', 'Relacionamento, sucesso do cliente e acompanhamento.')
on conflict (name) do nothing;

insert into public.plans (name, slug, description, price_monthly, features, limits)
values
  ('Starter', 'starter', 'Plano inicial para validação.', 197.00, '{"meta_ads":true,"neuro_score":true}'::jsonb, '{"companies":1,"users":2}'::jsonb),
  ('Growth', 'growth', 'Plano de crescimento com multiagentes.', 497.00, '{"meta_ads":true,"canva":true,"multi_agents":true}'::jsonb, '{"companies":3,"users":10}'::jsonb),
  ('Scale', 'scale', 'Plano avançado para operação completa.', 997.00, '{"all":true}'::jsonb, '{"companies":10,"users":50}'::jsonb)
on conflict (slug) do nothing;

-- =========================================================
-- END
-- =========================================================
