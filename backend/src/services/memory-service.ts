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

export class MemoryService {
  private supabase: ReturnType<typeof createClient>;

  constructor(supabaseUrl: string, supabaseKey: string) {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and key are required');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    logger.info('💾 Memory Service initialized');
  }

  /**
   * Initialize company memory
   */
  async initializeMemory(companyId: string, companyData: any): Promise<boolean> {
    try {
      logger.info(`📝 Initializing memory for company: ${companyId}`);

      const { error } = await this.supabase
        .from('shared_memory')
        .insert({
          company_id: companyId,
          company_profile: companyData,
          market_analysis: {},
          personas_data: [],
          brand_guidelines: {},
          business_goals: { short_term: [], medium_term: [], long_term: [] },
          content_library: [],
          decision_history: [],
          last_updated: new Date().toISOString()
        });

      if (error) throw error;
      logger.info(`✅ Memory initialized for ${companyId}`);
      return true;
    } catch (error) {
      logger.error('Error initializing memory:', error);
      return false;
    }
  }

  /**
   * Get shared memory for company
   */
  async getMemory(companyId: string): Promise<SharedMemory | null> {
    try {
      const { data, error } = await this.supabase
        .from('shared_memory')
        .select('*')
        .eq('company_id', companyId)
        .single();

      if (error) throw error;

      return {
        companyId,
        company: data?.company_profile || {},
        market: data?.market_analysis || {},
        personas: data?.personas_data || [],
        brand: data?.brand_guidelines || {},
        goals: data?.business_goals || {},
        metrics: data?.metrics || {},
        contentLibrary: data?.content_library || [],
        decisionHistory: data?.decision_history || [],
        lastUpdated: new Date(data?.last_updated)
      };
    } catch (error) {
      logger.error('Error fetching memory:', error);
      return null;
    }
  }

  /**
   * Update memory section
   */
  async updateMemory(companyId: string, section: keyof SharedMemory, data: any): Promise<boolean> {
    try {
      logger.info(`🔄 Updating ${section} for ${companyId}`);

      const updateData: Record<string, any> = {};
      
      switch (section) {
        case 'company':
          updateData.company_profile = data;
          break;
        case 'market':
          updateData.market_analysis = data;
          break;
        case 'personas':
          updateData.personas_data = data;
          break;
        case 'brand':
          updateData.brand_guidelines = data;
          break;
        case 'goals':
          updateData.business_goals = data;
          break;
        case 'metrics':
          updateData.metrics = data;
          break;
        case 'contentLibrary':
          updateData.content_library = data;
          break;
        case 'decisionHistory':
          updateData.decision_history = data;
          break;
      }

      updateData.last_updated = new Date().toISOString();

      const { error } = await this.supabase
        .from('shared_memory')
        .update(updateData)
        .eq('company_id', companyId);

      if (error) throw error;
      logger.info(`✅ Updated ${section}`);
      return true;
    } catch (error) {
      logger.error(`Error updating ${section}:`, error);
      return false;
    }
  }

  /**
   * Add to content library
   */
  async addContentToLibrary(companyId: string, content: any): Promise<boolean> {
    try {
      const memory = await this.getMemory(companyId);
      if (!memory) return false;

      const updatedLibrary = [...memory.contentLibrary, content];
      return this.updateMemory(companyId, 'contentLibrary', updatedLibrary);
    } catch (error) {
      logger.error('Error adding content to library:', error);
      return false;
    }
  }

  /**
   * Log decision
   */
  async logDecision(companyId: string, decision: any): Promise<boolean> {
    try {
      const memory = await this.getMemory(companyId);
      if (!memory) return false;

      const updatedHistory = [...memory.decisionHistory, {
        ...decision,
        timestamp: new Date().toISOString()
      }];

      return this.updateMemory(companyId, 'decisionHistory', updatedHistory);
    } catch (error) {
      logger.error('Error logging decision:', error);
      return false;
    }
  }

  /**
   * Update metrics
   */
  async updateMetrics(companyId: string, metrics: any): Promise<boolean> {
    try {
      return this.updateMemory(companyId, 'metrics', metrics);
    } catch (error) {
      logger.error('Error updating metrics:', error);
      return false;
    }
  }

  /**
   * Get memory summary
   */
  async getSummary(companyId: string): Promise<any> {
    try {
      const memory = await this.getMemory(companyId);
      if (!memory) return null;

      return {
        company_name: memory.company.name,
        personas_count: memory.personas.length,
        content_count: memory.contentLibrary.length,
        decisions_count: memory.decisionHistory.length,
        goals: memory.goals,
        last_updated: memory.lastUpdated
      };
    } catch (error) {
      logger.error('Error getting summary:', error);
      return null;
    }
  }

  /**
   * Search memory
   */
  async searchMemory(companyId: string, query: string): Promise<any[]> {
    try {
      logger.info(`🔍 Searching memory for: ${query}`);

      const memory = await this.getMemory(companyId);
      if (!memory) return [];

      const results: any[] = [];

      // Search in content library
      const matchingContent = memory.contentLibrary.filter(item =>
        JSON.stringify(item).toLowerCase().includes(query.toLowerCase())
      );
      results.push(...matchingContent);

      // Search in decisions
      const matchingDecisions = memory.decisionHistory.filter(item =>
        JSON.stringify(item).toLowerCase().includes(query.toLowerCase())
      );
      results.push(...matchingDecisions);

      return results;
    } catch (error) {
      logger.error('Memory search error:', error);
      return [];
    }
  }

  /**
   * Clear memory (for testing)
   */
  async clearMemory(companyId: string): Promise<boolean> {
    try {
      logger.warn(`⚠️ Clearing memory for ${companyId}`);

      const { error } = await this.supabase
        .from('shared_memory')
        .delete()
        .eq('company_id', companyId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('Error clearing memory:', error);
      return false;
    }
  }
}

export default MemoryService;
