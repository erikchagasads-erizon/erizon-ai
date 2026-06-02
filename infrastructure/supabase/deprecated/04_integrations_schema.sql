-- ===============================================
-- INTEGRATIONS SCHEMA - PHASE 4
-- ===============================================

-- Meta Ads Connections
CREATE TABLE IF NOT EXISTS meta_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Account info
  act_id VARCHAR(50) NOT NULL UNIQUE,
  account_name VARCHAR(255) NOT NULL,
  business_name VARCHAR(255),
  
  -- Encrypted credentials (AES-256)
  access_token_encrypted TEXT NOT NULL,
  token_iv VARCHAR(24) NOT NULL,
  token_auth_tag VARCHAR(32) NOT NULL,
  
  -- Configuration
  currency VARCHAR(3) DEFAULT 'USD',
  timezone VARCHAR(50) DEFAULT 'UTC',
  sync_frequency VARCHAR(20) DEFAULT 'daily',
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'connected',
  last_sync TIMESTAMP,
  last_error TEXT,
  error_count INT DEFAULT 0,
  
  -- Permissions & monitoring
  permissions JSONB,
  monitoring_enabled BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_status CHECK (status IN ('connected', 'error', 'expired'))
);

-- Meta Campaigns (synced daily)
CREATE TABLE IF NOT EXISTS meta_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_connection_id UUID NOT NULL REFERENCES meta_connections(id) ON DELETE CASCADE,
  
  -- Campaign data
  campaign_id VARCHAR(50) NOT NULL,
  campaign_name VARCHAR(255) NOT NULL,
  objective VARCHAR(50),
  status VARCHAR(20),
  
  -- Budget info
  daily_budget DECIMAL(12, 2),
  lifetime_budget DECIMAL(12, 2),
  
  -- Dates
  created_time TIMESTAMP,
  updated_time TIMESTAMP,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  
  -- Sync tracking
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(meta_connection_id, campaign_id)
);

-- Meta Ad Sets
CREATE TABLE IF NOT EXISTS meta_adsets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_campaign_id UUID NOT NULL REFERENCES meta_campaigns(id) ON DELETE CASCADE,
  
  adset_id VARCHAR(50) NOT NULL,
  adset_name VARCHAR(255) NOT NULL,
  status VARCHAR(20),
  
  -- Targeting & Budget
  daily_budget DECIMAL(12, 2),
  billing_event VARCHAR(50),
  optimization_goal VARCHAR(50),
  
  created_time TIMESTAMP,
  updated_time TIMESTAMP,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(meta_campaign_id, adset_id)
);

-- Meta Ads
CREATE TABLE IF NOT EXISTS meta_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_adset_id UUID NOT NULL REFERENCES meta_adsets(id) ON DELETE CASCADE,
  
  ad_id VARCHAR(50) NOT NULL,
  ad_name VARCHAR(255) NOT NULL,
  status VARCHAR(20),
  
  -- Creative info
  creative_data JSONB,
  
  created_time TIMESTAMP,
  updated_time TIMESTAMP,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(meta_adset_id, ad_id)
);

-- Daily Insights (aggregated metrics)
CREATE TABLE IF NOT EXISTS meta_insights_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_connection_id UUID NOT NULL REFERENCES meta_connections(id) ON DELETE CASCADE,
  
  -- Date
  date_start DATE NOT NULL,
  date_end DATE NOT NULL,
  
  -- Performance metrics
  spend DECIMAL(12, 2),
  impressions BIGINT,
  reach BIGINT,
  clicks BIGINT,
  ctr DECIMAL(5, 2),
  cpc DECIMAL(8, 2),
  cpm DECIMAL(8, 2),
  frequency DECIMAL(5, 2),
  
  -- Conversions
  leads BIGINT,
  purchases BIGINT,
  revenue DECIMAL(12, 2),
  
  -- Efficiency
  roas DECIMAL(8, 2),
  roi DECIMAL(8, 2),
  
  -- Metadata
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(meta_connection_id, date_start, date_end)
);

-- Meta Leads
CREATE TABLE IF NOT EXISTS meta_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_connection_id UUID NOT NULL REFERENCES meta_connections(id) ON DELETE CASCADE,
  
  lead_id VARCHAR(100) NOT NULL UNIQUE,
  lead_data JSONB,
  created_time TIMESTAMP,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alerts & Anomalies
CREATE TABLE IF NOT EXISTS meta_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_connection_id UUID NOT NULL REFERENCES meta_connections(id) ON DELETE CASCADE,
  
  alert_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20),
  message TEXT,
  data JSONB,
  
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_severity CHECK (severity IN ('critical', 'high', 'medium', 'low'))
);

-- Recommendations
CREATE TABLE IF NOT EXISTS meta_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_connection_id UUID NOT NULL REFERENCES meta_connections(id) ON DELETE CASCADE,
  
  recommendation_type VARCHAR(50),
  title VARCHAR(255),
  description TEXT,
  impact_score INT,
  priority VARCHAR(20),
  
  implemented BOOLEAN DEFAULT false,
  implemented_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_priority CHECK (priority IN ('critical', 'high', 'medium', 'low'))
);

-- Canva Integrations
CREATE TABLE IF NOT EXISTS canva_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- OAuth tokens
  access_token_encrypted TEXT NOT NULL,
  token_iv VARCHAR(24) NOT NULL,
  token_auth_tag VARCHAR(32) NOT NULL,
  
  refresh_token_encrypted TEXT,
  refresh_token_iv VARCHAR(24),
  refresh_token_auth_tag VARCHAR(32),
  
  -- Config
  brand_templates JSONB,
  brand_colors JSONB,
  brand_fonts JSONB,
  
  -- Status
  status VARCHAR(20) DEFAULT 'connected',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CapCut Exports
CREATE TABLE IF NOT EXISTS capcut_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES content_queue(id) ON DELETE CASCADE,
  
  -- Export info
  export_type VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending',
  
  -- Content
  scripts JSONB,
  scenes JSONB,
  captions JSONB,
  images JSONB,
  music_suggestions JSONB,
  
  -- File
  zip_url TEXT,
  zip_expires_at TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  downloaded_at TIMESTAMP
);

-- Sync Logs
CREATE TABLE IF NOT EXISTS integration_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  integration_type VARCHAR(50),
  integration_id UUID,
  
  status VARCHAR(20),
  records_synced INT,
  error_message TEXT,
  
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  duration_ms INT,
  
  INDEX (integration_type, started_at)
);

-- ===============================================
-- INDEXES FOR PERFORMANCE
-- ===============================================

CREATE INDEX IF NOT EXISTS idx_meta_connections_company ON meta_connections(company_id);
CREATE INDEX IF NOT EXISTS idx_meta_connections_user ON meta_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_meta_insights_connection_date ON meta_insights_daily(meta_connection_id, date_start, date_end);
CREATE INDEX IF NOT EXISTS idx_meta_leads_connection ON meta_leads(meta_connection_id);
CREATE INDEX IF NOT EXISTS idx_meta_alerts_connection ON meta_alerts(meta_connection_id, created_at);
CREATE INDEX IF NOT EXISTS idx_canva_connections_company ON canva_connections(company_id);
CREATE INDEX IF NOT EXISTS idx_capcut_exports_company ON capcut_exports(company_id);
CREATE INDEX IF NOT EXISTS idx_integration_sync_logs_type ON integration_sync_logs(integration_type);

-- ===============================================
-- FUNCTIONS FOR INTEGRATION MANAGEMENT
-- ===============================================

-- Update last_sync timestamp
CREATE OR REPLACE FUNCTION update_meta_last_sync()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE meta_connections 
  SET last_sync = CURRENT_TIMESTAMP 
  WHERE id = NEW.meta_connection_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_meta_last_sync
AFTER INSERT ON meta_insights_daily
FOR EACH ROW
EXECUTE FUNCTION update_meta_last_sync();
