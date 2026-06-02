import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

export interface EmbeddingData {
  id: string;
  text: string;
  embedding: number[];
  metadata: Record<string, any>;
  created_at: string;
}

export interface SearchResult {
  id: string;
  text: string;
  similarity: number;
  metadata: Record<string, any>;
}

/**
 * VectorStore aligned with Supabase schema.
 * Stores content inside knowledge_documents + knowledge_chunks.embedding
 * and searches through RPC match_knowledge_chunks.
 */
export class VectorStore {
  private supabase: ReturnType<typeof createClient>;

  constructor(supabaseUrl: string, supabaseKey: string) {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and key are required');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    logger.info('🗄️ Vector Store initialized with knowledge_chunks');
  }

  async storeEmbedding(id: string, text: string, embedding: number[], metadata: Record<string, any> = {}): Promise<boolean> {
    try {
      const companyId = metadata.company_id || metadata.companyId;
      if (!companyId) throw new Error('metadata.company_id is required to store embeddings');

      logger.info(`📦 Storing knowledge chunk embedding for: ${id}`);

      const documentId = metadata.document_id || metadata.documentId || id;
      const documentTitle = metadata.title || metadata.document_title || `Documento ${id}`;

      const { error: docError } = await this.supabase
        .from('knowledge_documents')
        .upsert({
          id: documentId,
          company_id: companyId,
          title: documentTitle,
          source_type: metadata.source_type || 'manual',
          content: text,
          summary: metadata.summary || null,
          metadata
        });

      if (docError) throw docError;

      const { error: chunkError } = await this.supabase
        .from('knowledge_chunks')
        .upsert({
          id,
          company_id: companyId,
          document_id: documentId,
          chunk_index: metadata.chunk_index ?? 0,
          content: text,
          token_count: metadata.token_count || null,
          embedding,
          metadata
        });

      if (chunkError) throw chunkError;
      return true;
    } catch (error) {
      logger.error('Error storing embedding:', error);
      return false;
    }
  }

  async search(
    queryEmbedding: number[],
    limit: number = 5,
    threshold: number = 0.5,
    companyId?: string
  ): Promise<SearchResult[]> {
    try {
      if (!companyId) {
        logger.warn('Vector search requires companyId. Returning empty result.');
        return [];
      }

      logger.info(`🔍 Searching knowledge_chunks with vector similarity (limit: ${limit})`);

      const { data, error } = await this.supabase.rpc('match_knowledge_chunks', {
        query_embedding: queryEmbedding,
        target_company_id: companyId,
        match_threshold: threshold,
        match_count: limit
      });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.id,
        text: item.content,
        similarity: Number(item.similarity || 0),
        metadata: {
          ...(item.metadata || {}),
          document_id: item.document_id
        }
      }));
    } catch (error) {
      logger.error('Vector search error:', error);
      return [];
    }
  }

  async searchByText(query: string, limit: number = 5, companyId?: string): Promise<SearchResult[]> {
    try {
      logger.info(`📝 Text memory search for: ${query}`);

      let request = this.supabase
        .from('knowledge_chunks')
        .select('id, content, metadata, document_id')
        .ilike('content', `%${query}%`)
        .limit(limit);

      if (companyId) request = request.eq('company_id', companyId);

      const { data, error } = await request;
      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.id,
        text: item.content,
        similarity: 0.65,
        metadata: {
          ...(item.metadata || {}),
          document_id: item.document_id
        }
      }));
    } catch (error) {
      logger.error('Text search error:', error);
      return [];
    }
  }

  async getEmbedding(id: string): Promise<EmbeddingData | null> {
    try {
      const { data, error } = await this.supabase
        .from('knowledge_chunks')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        text: data.content,
        embedding: data.embedding || [],
        metadata: data.metadata || {},
        created_at: data.created_at
      };
    } catch (error) {
      logger.error('Error fetching embedding:', error);
      return null;
    }
  }

  async deleteEmbedding(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('knowledge_chunks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('Error deleting embedding:', error);
      return false;
    }
  }

  async updateEmbedding(id: string, embedding: number[], metadata: Record<string, any> = {}): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('knowledge_chunks')
        .update({ embedding, metadata })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('Error updating embedding:', error);
      return false;
    }
  }

  async storeBatchEmbeddings(items: EmbeddingData[]): Promise<number> {
    let successCount = 0;
    for (const item of items) {
      const success = await this.storeEmbedding(item.id, item.text, item.embedding, item.metadata);
      if (success) successCount++;
    }
    logger.info(`✅ Batch store complete: ${successCount}/${items.length}`);
    return successCount;
  }

  async getStats(companyId?: string): Promise<any> {
    try {
      let request = this.supabase
        .from('knowledge_chunks')
        .select('id', { count: 'exact' })
        .not('embedding', 'is', null);

      if (companyId) request = request.eq('company_id', companyId);

      const { count, error } = await request;
      if (error) throw error;

      return {
        total_embeddings: count || 0,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error getting stats:', error);
      return { total_embeddings: 0 };
    }
  }
}

export default VectorStore;
