import GroqClient from './groq-client';
import VectorStore from './vector-store';
import RAGEngine from './rag-engine';
import MemoryService from './memory-service';
import NeuroScoreEngine from './neuro-score-engine';
import { logger } from '../utils/logger';

export class AIService {
  private groq: GroqClient;
  private vectorStore: VectorStore;
  private rag: RAGEngine;
  private memory: MemoryService;
  private neuroScore: NeuroScoreEngine;

  constructor(
    groqApiKey: string,
    supabaseUrl: string,
    supabaseKey: string
  ) {
    logger.info('🚀 Initializing AI Service...');

    try {
      this.groq = new GroqClient(groqApiKey);
      this.vectorStore = new VectorStore(supabaseUrl, supabaseKey);
      this.rag = new RAGEngine(this.groq, this.vectorStore);
      this.memory = new MemoryService(supabaseUrl, supabaseKey);
      this.neuroScore = new NeuroScoreEngine();

      logger.info('✅ AI Service fully initialized');
    } catch (error) {
      logger.error('Failed to initialize AI Service:', error);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const groqReady = await this.groq.healthCheck();
      logger.info(`🏥 AI Service health: ${groqReady ? '✅' : '❌'}`);
      return groqReady;
    } catch (error) {
      logger.error('Health check failed:', error);
      return false;
    }
  }

  /**
   * Query with RAG
   */
  async query(question: string, companyId: string) {
    const memory = await this.memory.getMemory(companyId);
    if (!memory) {
      return { error: 'Company memory not found' };
    }

    return this.rag.query(question, {
      companyId,
      company: memory.company,
      market: memory.market,
      personas: memory.personas,
      metrics: memory.metrics
    });
  }

  /**
   * Generate content
   */
  async generateContent(contentType: string, brief: string, companyId: string) {
    const memory = await this.memory.getMemory(companyId);
    if (!memory) {
      return { error: 'Company memory not found' };
    }

    const ragResponse = await this.rag.generateContent(contentType, brief, {
      companyId,
      company: memory.company,
      brand: memory.brand,
      market: memory.market
    });

    // Add content to library
    await this.memory.addContentToLibrary(companyId, {
      type: contentType,
      brief,
      content: ragResponse.answer,
      generated_at: new Date().toISOString()
    });

    return ragResponse;
  }

  /**
   * Analyze content with Neuro Score
   */
  analyzeContent(content: any) {
    return this.neuroScore.analyzeContent(content);
  }

  /**
   * Get shared memory
   */
  async getMemory(companyId: string) {
    return this.memory.getMemory(companyId);
  }

  /**
   * Initialize memory for company
   */
  async initializeMemory(companyId: string, companyData: any) {
    return this.memory.initializeMemory(companyId, companyData);
  }

  /**
   * Log decision in memory
   */
  async logDecision(companyId: string, decision: any) {
    return this.memory.logDecision(companyId, decision);
  }

  /**
   * Update metrics in memory
   */
  async updateMetrics(companyId: string, metrics: any) {
    return this.memory.updateMetrics(companyId, metrics);
  }

  /**
   * Get AI service status
   */
  getStatus() {
    return {
      groq: 'ready',
      vector_store: 'ready',
      rag_engine: 'ready',
      memory_service: 'ready',
      neuro_score: 'ready',
      timestamp: new Date().toISOString()
    };
  }
}

export default AIService;
