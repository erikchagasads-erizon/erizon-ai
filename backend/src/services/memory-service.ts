import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

export interface SharedMemory {
  companyId: string;
  company: Record<string, any>;
  market: Record<string, any>;
  personas: Record<string, any>[];
  brand: Record<string, any>;
  goals: Record<string, any>;
  metrics: Record<string, any>;
  contentLibrary: Record<string, any>[];
  decisionHistory: Record<string, any>[];
  lastUpdated: Date;
}

const SECTION_EVENT_MAP: Record<string, string> = {
  company: 'company_memory_updated',
  market: 'market_memory_updated',
  personas: 'personas_memory_updated',
  brand: 'brand_memory_updated',
  goals: 'goals_memory_updated',
  metrics: 'metrics_memory_updated',
  contentLibrary: 'content_memory_updated',
  decisionHistory: 'decision_memory_updated'
};

/**
 * MemoryService aligned with ERIZON Supabase schema.
 * Uses companies, company_personas, company_goals, company_brand_assets,
 * content_items, strategic_decisions, metrics_daily and memory_events.
 */
export class MemoryService {
  private supabase: ReturnType<typeof createClient>;

  constructor(supabaseUrl: string, supabaseKey: string) {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and key are required');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    logger.info('💾 Memory Service initialized with ERIZON schema');
  }

  async initializeMemory(companyId: string, companyData: any): Promise<boolean> {
    try {
      logger.info(`📝 Initializing ERIZON memory for company: ${companyId}`);

      const { error: companyError } = await this.supabase
        .from('companies')
        .upsert({
          id: companyId,
          name: companyData?.name || companyData?.company_name || 'Empresa sem nome',
          website: companyData?.website || null,
          instagram: companyData?.instagram || null,
          facebook: companyData?.facebook || null,
          linkedin: companyData?.linkedin || null,
          tiktok: companyData?.tiktok || null,
          whatsapp: companyData?.whatsapp || null,
          segment: companyData?.segment || null,
          niche: companyData?.niche || null,
          region: companyData?.region || null,
          description: companyData?.description || null,
          settings: companyData?.settings || {}
        });

      if (companyError) throw companyError;

      await this.recordMemoryEvent(companyId, 'system', 'system', 'memory_initialized', 'Memória inicial criada', companyData);
      logger.info(`✅ Memory initialized for ${companyId}`);
      return true;
    } catch (error) {
      logger.error('Error initializing memory:', error);
      return false;
    }
  }

  async getMemory(companyId: string): Promise<SharedMemory | null> {
    try {
      const [companyRes, personasRes, goalsRes, brandRes, contentRes, decisionsRes, metricsRes] = await Promise.all([
        this.supabase.from('companies').select('*').eq('id', companyId).maybeSingle(),
        this.supabase.from('company_personas').select('*').eq('company_id', companyId),
        this.supabase.from('company_goals').select('*').eq('company_id', companyId),
        this.supabase.from('company_brand_assets').select('*').eq('company_id', companyId),
        this.supabase.from('content_items').select('*').eq('company_id', companyId).order('created_at', { ascending: false }).limit(50),
        this.supabase.from('strategic_decisions').select('*').eq('company_id', companyId).order('created_at', { ascending: false }).limit(50),
        this.supabase.from('metrics_daily').select('*').eq('company_id', companyId).order('metric_date', { ascending: false }).limit(30)
      ]);

      if (companyRes.error) throw companyRes.error;

      const company = companyRes.data || {};
      const metrics = (metricsRes.data || []).reduce((acc: Record<string, any>, row: any) => {
        acc[row.metric_date] = row.metrics || {};
        return acc;
      }, {});

      return {
        companyId,
        company,
        market: {
          segment: company.segment,
          niche: company.niche,
          region: company.region
        },
        personas: personasRes.data || [],
        brand: {
          assets: brandRes.data || [],
          settings: company.settings || {}
        },
        goals: {
          items: goalsRes.data || []
        },
        metrics,
        contentLibrary: contentRes.data || [],
        decisionHistory: decisionsRes.data || [],
        lastUpdated: new Date(company.updated_at || company.created_at || Date.now())
      };
    } catch (error) {
      logger.error('Error fetching ERIZON memory:', error);
      return null;
    }
  }

  async updateMemory(companyId: string, section: keyof SharedMemory, data: any): Promise<boolean> {
    try {
      logger.info(`🔄 Updating memory section ${section} for ${companyId}`);

      switch (section) {
        case 'company':
        case 'market':
        case 'brand': {
          const companyPayload: Record<string, any> = {};
          if (section === 'company') Object.assign(companyPayload, data);
          if (section === 'market') {
            companyPayload.segment = data?.segment;
            companyPayload.niche = data?.niche;
            companyPayload.region = data?.region;
          }
          if (section === 'brand') companyPayload.settings = data;

          const { error } = await this.supabase.from('companies').update(companyPayload).eq('id', companyId);
          if (error) throw error;
          break;
        }
        case 'metrics': {
          const { error } = await this.supabase.from('metrics_daily').upsert({
            company_id: companyId,
            metric_date: new Date().toISOString().slice(0, 10),
            source: 'manual_memory_update',
            metrics: data
          });
          if (error) throw error;
          break;
        }
        case 'contentLibrary': {
          const items = Array.isArray(data) ? data : [data];
          for (const item of items) await this.addContentToLibrary(companyId, item);
          break;
        }
        case 'decisionHistory': {
          const items = Array.isArray(data) ? data : [data];
          for (const item of items) await this.logDecision(companyId, item);
          break;
        }
        case 'goals': {
          const goals = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
          if (goals.length) {
            const { error } = await this.supabase.from('company_goals').insert(goals.map((goal: any) => ({
              company_id: companyId,
              title: goal.title || goal.name || 'Meta sem título',
              description: goal.description || null,
              period: goal.period || 'short',
              target_value: goal.target_value || goal.target || null,
              metric: goal.metric || null,
              due_date: goal.due_date || null,
              status: goal.status || 'active'
            })));
            if (error) throw error;
          }
          break;
        }
        case 'personas': {
          const personas = Array.isArray(data) ? data : [];
          if (personas.length) {
            const { error } = await this.supabase.from('company_personas').insert(personas.map((persona: any) => ({
              company_id: companyId,
              name: persona.name || 'Persona sem nome',
              description: persona.description || null,
              pains: persona.pains || persona.dores || [],
              desires: persona.desires || persona.desejos || [],
              demographics: persona.demographics || {},
              buying_triggers: persona.buying_triggers || [],
              objections: persona.objections || []
            })));
            if (error) throw error;
          }
          break;
        }
      }

      await this.recordMemoryEvent(companyId, 'system', 'system', SECTION_EVENT_MAP[String(section)] || 'memory_updated', `Seção ${String(section)} atualizada`, data);
      return true;
    } catch (error) {
      logger.error(`Error updating ${String(section)}:`, error);
      return false;
    }
  }

  async addContentToLibrary(companyId: string, content: any): Promise<boolean> {
    try {
      const { error } = await this.supabase.from('content_items').insert({
        company_id: companyId,
        content_type: content.content_type || content.type || 'feed',
        title: content.title || 'Conteúdo sem título',
        caption: content.caption || content.text || content.content || null,
        cta: content.cta || null,
        objective: content.objective || null,
        strategic_justification: content.strategic_justification || content.justification || null,
        status: content.status || 'draft',
        platform: content.platform || null,
        metadata: content.metadata || content
      });
      if (error) throw error;
      await this.recordMemoryEvent(companyId, 'system', 'system', 'content_added', 'Conteúdo adicionado à memória', content);
      return true;
    } catch (error) {
      logger.error('Error adding content to library:', error);
      return false;
    }
  }

  async logDecision(companyId: string, decision: any): Promise<boolean> {
    try {
      const { error } = await this.supabase.from('strategic_decisions').insert({
        company_id: companyId,
        title: decision.title || decision.decision || 'Decisão estratégica',
        description: decision.description || decision.reasoning || decision.rationale || null,
        category: decision.category || 'general',
        priority: decision.priority || 'medium',
        status: decision.status || 'approved',
        expected_impact: decision.expected_impact || {}
      });
      if (error) throw error;
      await this.recordMemoryEvent(companyId, 'agent', decision.agent_id || 'executive_board', 'decision_logged', decision.title || 'Decisão registrada', decision);
      return true;
    } catch (error) {
      logger.error('Error logging decision:', error);
      return false;
    }
  }

  async updateMetrics(companyId: string, metrics: any): Promise<boolean> {
    return this.updateMemory(companyId, 'metrics', metrics);
  }

  async getSummary(companyId: string): Promise<any> {
    const memory = await this.getMemory(companyId);
    if (!memory) return null;

    return {
      company_name: memory.company.name,
      personas_count: memory.personas.length,
      content_count: memory.contentLibrary.length,
      decisions_count: memory.decisionHistory.length,
      goals_count: Array.isArray(memory.goals.items) ? memory.goals.items.length : 0,
      last_updated: memory.lastUpdated
    };
  }

  async searchMemory(companyId: string, query: string): Promise<any[]> {
    try {
      const term = `%${query}%`;
      const [eventsRes, docsRes, contentRes, decisionsRes] = await Promise.all([
        this.supabase.from('memory_events').select('*').eq('company_id', companyId).ilike('content', term).limit(20),
        this.supabase.from('knowledge_documents').select('*').eq('company_id', companyId).or(`title.ilike.${term},content.ilike.${term},summary.ilike.${term}`).limit(20),
        this.supabase.from('content_items').select('*').eq('company_id', companyId).or(`title.ilike.${term},caption.ilike.${term},objective.ilike.${term}`).limit(20),
        this.supabase.from('strategic_decisions').select('*').eq('company_id', companyId).or(`title.ilike.${term},description.ilike.${term}`).limit(20)
      ]);

      return [
        ...(eventsRes.data || []).map((item: any) => ({ type: 'memory_event', ...item })),
        ...(docsRes.data || []).map((item: any) => ({ type: 'knowledge_document', ...item })),
        ...(contentRes.data || []).map((item: any) => ({ type: 'content_item', ...item })),
        ...(decisionsRes.data || []).map((item: any) => ({ type: 'strategic_decision', ...item }))
      ];
    } catch (error) {
      logger.error('Memory search error:', error);
      return [];
    }
  }

  private async recordMemoryEvent(companyId: string, actorType: string, actorId: string, eventType: string, title: string, payload: any): Promise<void> {
    const content = typeof payload === 'string' ? payload : JSON.stringify(payload ?? {});
    const { error } = await this.supabase.from('memory_events').insert({
      company_id: companyId,
      actor_type: actorType,
      actor_id: actorId,
      event_type: eventType,
      title,
      content,
      metadata: typeof payload === 'object' && payload !== null ? payload : {}
    });
    if (error) logger.warn('Could not write memory event:', error);
  }
}

export default MemoryService;
