import GroqClient, { GroqResponse } from './groq-client';
import VectorStore, { SearchResult } from './vector-store';
import { logger } from '../utils/logger';

export interface RAGContext {
  query: string;
  documents: SearchResult[];
  memory: Record<string, any>;
}

export interface RAGResponse {
  answer: string;
  sources: SearchResult[];
  confidence: number;
  model: string;
}

export class RAGEngine {
  private groq: GroqClient;
  private vectorStore: VectorStore;
  private maxContextLength: number = 3000; // Max tokens for context

  constructor(groq: GroqClient, vectorStore: VectorStore) {
    this.groq = groq;
    this.vectorStore = vectorStore;
    logger.info('🧠 RAG Engine initialized');
  }

  /**
   * Main RAG query function
   */
  async query(question: string, companyContext: Record<string, any>): Promise<RAGResponse> {
    try {
      logger.info(`🔍 RAG Query: ${question.substring(0, 100)}...`);

      // 1. Retrieve relevant documents
      const documents = await this.vectorStore.searchByText(question, 5);
      logger.info(`📄 Retrieved ${documents.length} relevant documents`);

      // 2. Build context from retrieved documents
      const context = this.buildContext(question, documents, companyContext);

      // 3. Generate answer using GROQ with context
      const answer = await this.generateAnswer(question, context);

      // 4. Calculate confidence based on source relevance
      const confidence = this.calculateConfidence(documents);

      return {
        answer: answer.content,
        sources: documents,
        confidence,
        model: answer.model
      };
    } catch (error) {
      logger.error('RAG query error:', error);
      return {
        answer: 'Unable to process query at this time.',
        sources: [],
        confidence: 0,
        model: 'groq'
      };
    }
  }

  /**
   * Build RAG context from documents
   */
  private buildContext(query: string, documents: SearchResult[], memory: Record<string, any>): string {
    let context = '';

    // Add company context
    if (memory.company) {
      context += `Company: ${memory.company.name}\n`;
      context += `Segment: ${memory.company.segment}\n\n`;
    }

    // Add retrieved documents
    if (documents.length > 0) {
      context += 'Relevant Information:\n';
      documents.forEach((doc, index) => {
        context += `${index + 1}. ${doc.text.substring(0, 200)}...\n`;
      });
      context += '\n';
    }

    // Add market context
    if (memory.market) {
      context += `Market Trends: ${(memory.market.trends || []).join(', ')}\n`;
    }

    return context;
  }

  /**
   * Generate answer with RAG context
   */
  private async generateAnswer(question: string, context: string): Promise<GroqResponse> {
    const systemPrompt = `You are ERIZON AI, a strategic business consultant and growth specialist.
You have access to company data, market information, and historical decisions.
Provide accurate, actionable recommendations based on the context provided.`;

    const prompt = `
Based on the following context, answer this question:

CONTEXT:
${context}

QUESTION:
${question}

ANSWER:`;

    return this.groq.complete(prompt, systemPrompt);
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(documents: SearchResult[]): number {
    if (documents.length === 0) return 0;

    // Average similarity of top documents
    const avgSimilarity = documents.reduce((sum, doc) => sum + doc.similarity, 0) / documents.length;

    // Convert to confidence (0-1)
    return Math.min(avgSimilarity, 1);
  }

  /**
   * Generate content with RAG
   */
  async generateContent(contentType: string, brief: string, memory: Record<string, any>): Promise<RAGResponse> {
    try {
      logger.info(`📝 Generating ${contentType} with RAG`);

      // Search for similar past content
      const pastContent = await this.vectorStore.searchByText(brief, 3);

      const context = this.buildContext(`Generate ${contentType}`, pastContent, memory);

      const systemPrompt = `You are a creative content specialist for ERIZON AI.
Generate compelling, brand-aligned content based on company guidelines and market insights.`;

      const prompt = `
Content Type: ${contentType}

Brief: ${brief}

Reference Materials:
${context}

Generate engaging content:`;

      const answer = await this.groq.complete(prompt, systemPrompt);

      return {
        answer: answer.content,
        sources: pastContent,
        confidence: this.calculateConfidence(pastContent),
        model: answer.model
      };
    } catch (error) {
      logger.error('Content generation error:', error);
      return {
        answer: '',
        sources: [],
        confidence: 0,
        model: 'groq'
      };
    }
  }

  /**
   * Analytics query with RAG
   */
  async analyzeMetrics(question: string, metrics: Record<string, any>, memory: Record<string, any>): Promise<RAGResponse> {
    try {
      logger.info(`📊 Analyzing metrics: ${question.substring(0, 100)}...`);

      const enrichedMemory = {
        ...memory,
        current_metrics: metrics
      };

      return this.query(question, enrichedMemory);
    } catch (error) {
      logger.error('Metrics analysis error:', error);
      return {
        answer: 'Unable to analyze metrics.',
        sources: [],
        confidence: 0,
        model: 'groq'
      };
    }
  }

  /**
   * Decision support with RAG
   */
  async supportDecision(decision: string, context: Record<string, any>): Promise<RAGResponse> {
    try {
      logger.info(`🎯 Supporting decision: ${decision.substring(0, 100)}...`);

      const prompt = `
As ERIZON AI, provide strategic support for this decision:

Decision: ${decision}

Provide:
1. Pros and cons
2. Key risks
3. Success factors
4. Recommendation`;

      const answer = await this.groq.complete(prompt);

      return {
        answer: answer.content,
        sources: [],
        confidence: 0.85,
        model: answer.model
      };
    } catch (error) {
      logger.error('Decision support error:', error);
      return {
        answer: 'Unable to provide decision support.',
        sources: [],
        confidence: 0,
        model: 'groq'
      };
    }
  }

  /**
   * Batch processing with RAG
   */
  async processBatch(queries: string[], memory: Record<string, any>): Promise<RAGResponse[]> {
    try {
      logger.info(`🔄 Processing ${queries.length} queries`);

      const results: RAGResponse[] = [];
      for (const query of queries) {
        const result = await this.query(query, memory);
        results.push(result);
      }

      return results;
    } catch (error) {
      logger.error('Batch processing error:', error);
      return [];
    }
  }
}

export default RAGEngine;
