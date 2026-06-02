-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Companies Table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  website VARCHAR(255),
  description TEXT,
  segment VARCHAR(100),
  niche VARCHAR(100),
  region VARCHAR(100),
  products TEXT[] DEFAULT '{}',
  services TEXT[] DEFAULT '{}',
  social_media JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'viewer',
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

-- Personas Table
CREATE TABLE personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  age INTEGER,
  profession VARCHAR(100),
  income VARCHAR(100),
  description TEXT,
  pain_points TEXT[] DEFAULT '{}',
  desires TEXT[] DEFAULT '{}',
  behaviors TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Competitors Table
CREATE TABLE competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  website VARCHAR(255),
  positioning TEXT,
  strengths TEXT[] DEFAULT '{}',
  weaknesses TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Brand Guidelines Table
CREATE TABLE brand_guidelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
  logo_url VARCHAR(255),
  palette_primary VARCHAR(7),
  palette_secondary VARCHAR(7),
  palette_accent TEXT[] DEFAULT '{}',
  fonts TEXT[] DEFAULT '{}',
  tone_of_voice TEXT,
  visual_style TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Content Items Table
CREATE TABLE content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255),
  description TEXT,
  content TEXT,
  images TEXT[] DEFAULT '{}',
  videos TEXT[] DEFAULT '{}',
  caption TEXT,
  cta VARCHAR(255),
  objective TEXT,
  strategic_justification TEXT,
  neuro_score DECIMAL(5,2),
  status VARCHAR(50) DEFAULT 'draft',
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP,
  published_at TIMESTAMP,
  platforms TEXT[] DEFAULT '{}',
  embedding vector(1536)
);

-- Content Approvals Table
CREATE TABLE content_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  submitted_by VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  reviewed_by VARCHAR(255),
  feedback TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP
);

-- Performance Metrics Table
CREATE TABLE performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  reach BIGINT DEFAULT 0,
  impressions BIGINT DEFAULT 0,
  followers BIGINT DEFAULT 0,
  engagement BIGINT DEFAULT 0,
  engagement_rate DECIMAL(10,2) DEFAULT 0,
  ctr DECIMAL(10,2) DEFAULT 0,
  cpc DECIMAL(10,2) DEFAULT 0,
  leads INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  cac DECIMAL(10,2) DEFAULT 0,
  roi DECIMAL(10,2) DEFAULT 0,
  roas DECIMAL(10,2) DEFAULT 0,
  revenue DECIMAL(15,2) DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agents Table
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(100) NOT NULL,
  department VARCHAR(100),
  expertise TEXT[] DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shared Memory Table
CREATE TABLE shared_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
  company_profile JSONB,
  market_analysis JSONB,
  personas_data JSONB DEFAULT '[]',
  brand_guidelines JSONB,
  business_goals JSONB,
  content_library JSONB DEFAULT '[]',
  decision_history JSONB DEFAULT '[]',
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- File Uploads Table
CREATE TABLE file_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50),
  file_size BIGINT,
  category VARCHAR(50),
  url VARCHAR(255) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  uploaded_by VARCHAR(255),
  embedding vector(1536)
);

-- Plans Table
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  period_start TIMESTAMP,
  period_end TIMESTAMP,
  objectives TEXT[] DEFAULT '{}',
  strategies JSONB DEFAULT '[]',
  content_plan JSONB DEFAULT '[]',
  budget DECIMAL(15,2),
  expected_metrics JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255)
);

-- Indexes
CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_content_items_company_id ON content_items(company_id);
CREATE INDEX idx_content_items_status ON content_items(status);
CREATE INDEX idx_content_items_created_at ON content_items(created_at DESC);
CREATE INDEX idx_performance_metrics_company_id ON performance_metrics(company_id);
CREATE INDEX idx_agents_company_id ON agents(company_id);
CREATE INDEX idx_shared_memory_company_id ON shared_memory(company_id);
CREATE INDEX idx_file_uploads_company_id ON file_uploads(company_id);
CREATE INDEX idx_plans_company_id ON plans(company_id);

-- Vector indexes for content and files
CREATE INDEX idx_content_embedding ON content_items USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_file_embedding ON file_uploads USING ivfflat (embedding vector_cosine_ops);

-- Timestamps trigger function
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply timestamp triggers
CREATE TRIGGER update_companies_timestamp BEFORE UPDATE ON companies
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_brand_guidelines_timestamp BEFORE UPDATE ON brand_guidelines
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_shared_memory_timestamp BEFORE UPDATE ON shared_memory
FOR EACH ROW EXECUTE FUNCTION update_timestamp();
