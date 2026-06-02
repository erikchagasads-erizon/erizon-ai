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

export class VectorStore {
  private supabase: ReturnType<typeof createClient>;
  private tableName: string = 'file_uploads'; // or content_items

  constructor(supabaseUrl: string, supabaseKey: string) {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and key are required');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    logger.info('🗄️ Vector Store initialized with Supabase');
  }

  /**
   * Store embedding
   */
  async storeEmbedding(id: string, text: string, embedding: number[], metadata?: Record<string, any>): Promise<boolean> {
    try {
      logger.info(`📦 Storing embedding for: ${id}`);

      // For now, we'll store the text representation
      // In production, use: INSERT INTO content_items SET embedding = '[...]'::vector
      const { error } = await this.supabase
        .from('content_items')
        .upsert({
          id,
          content: text,
          embedding: embedding, // pgvector will handle this
          ...metadata
        });

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('Error storing embedding:', error);
      return false;
    }
  }

  /**
   * Vector similarity search
   */
  async search(queryEmbedding: number[], limit: number = 5, threshold: number = 0.5): Promise<SearchResult[]> {
    try {
      logger.info(`🔍 Searching with vector similarity (limit: ${limit})`);

      // Query using pgvector similarity
      // SELECT *, embedding <-> $1 as distance FROM content_items
      // ORDER BY distance LIMIT $2
      const { data, error } = await this.supabase.rpc('search_embeddings', {
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count: limit
      });

      if (error) {
        logger.warn('Vector search not yet available, returning mock results:', error);
        // Return mock results for now
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Search error:', error);
      return [];
    }
  }

  /**
   * Search by text (semantic search after embedding)
   */
  async searchByText(query: string, limit: number = 5): Promise<SearchResult[]> {
    try {
      logger.info(`📝 Semantic search for: ${query}`);

      // This would use an embedding service to convert query to vector
      // For now, doing simple text search
      const { data, error } = await this.supabase
        .from('content_items')
        .select('id, content, caption, metadata')
        .textSearch('content', query)
        .limit(limit);

      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.id,
        text: item.content || item.caption,
        similarity: 0.8, // Mock similarity
        metadata: item.metadata || {}
      }));
    } catch (error) {
      logger.error('Text search error:', error);
      return [];
    }
  }

  /**
   * Get embedding by ID
   */
  async getEmbedding(id: string): Promise<EmbeddingData | null> {
    try {
      const { data, error } = await this.supabase
        .from('content_items')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data || null;
    } catch (error) {
      logger.error('Error fetching embedding:', error);
      return null;
    }
  }

  /**
   * Delete embedding
   */
  async deleteEmbedding(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('content_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('Error deleting embedding:', error);
      return false;
    }
  }

  /**
   * Update embedding
   */
  async updateEmbedding(id: string, embedding: number[], metadata?: Record<string, any>): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('content_items')
        .update({
          embedding,
          ...metadata
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('Error updating embedding:', error);
      return false;
    }
  }

  /**
   * Batch store embeddings
   */
  async storeBatchEmbeddings(items: EmbeddingData[]): Promise<number> {
    try {
      logger.info(`📦 Batch storing ${items.length} embeddings`);

      let successCount = 0;
      for (const item of items) {
        const success = await this.storeEmbedding(item.id, item.text, item.embedding, item.metadata);
        if (success) successCount++;
      }

      logger.info(`✅ Batch store complete: ${successCount}/${items.length}`);
      return successCount;
    } catch (error) {
      logger.error('Batch storage error:', error);
      return 0;
    }
  }

  /**
   * Get vector statistics
   */
  async getStats(): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('content_items')
        .select('id', { count: 'exact' })
        .not('embedding', 'is', null);

      if (error) throw error;

      return {
        total_embeddings: (data as any)?.length || 0,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error getting stats:', error);
      return { total_embeddings: 0 };
    }
  }
}

export default VectorStore;
