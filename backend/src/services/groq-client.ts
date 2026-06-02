import { Groq } from 'groq-sdk';
import { logger } from '../utils/logger';

export interface GroqMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface GroqResponse {
  success: boolean;
  content: string;
  tokens?: {
    input: number;
    output: number;
  };
  model: string;
}

export class GroqClient {
  private client: Groq;
  private model: string;
  private conversationHistory: GroqMessage[] = [];

  constructor(apiKey: string = process.env.GROQ_API_KEY || '', model: string = 'mixtral-8x7b-32768') {
    if (!apiKey) {
      throw new Error('GROQ_API_KEY environment variable is required');
    }

    this.client = new Groq({ apiKey });
    this.model = model;
    logger.info(`🧠 GROQ Client initialized with model: ${model}`);
  }

  /**
   * Simple completion - single request
   */
  async complete(prompt: string, systemPrompt?: string): Promise<GroqResponse> {
    try {
      logger.info(`📝 GROQ completion request: ${prompt.substring(0, 100)}...`);

      const messages: GroqMessage[] = [];
      
      if (systemPrompt) {
        messages.push({
          role: 'system',
          content: systemPrompt
        });
      }

      messages.push({
        role: 'user',
        content: prompt
      });

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: messages as any,
        temperature: 0.7,
        max_tokens: 2048,
      });

      const content = response.choices[0]?.message?.content || '';

      return {
        success: true,
        content,
        model: this.model,
        tokens: {
          input: response.usage?.prompt_tokens || 0,
          output: response.usage?.completion_tokens || 0
        }
      };
    } catch (error) {
      logger.error('GROQ completion error:', error);
      return {
        success: false,
        content: '',
        model: this.model
      };
    }
  }

  /**
   * Streaming completion
   */
  async completeStream(prompt: string, onChunk: (chunk: string) => void, systemPrompt?: string): Promise<string> {
    try {
      logger.info(`📡 GROQ streaming request: ${prompt.substring(0, 100)}...`);

      const messages: GroqMessage[] = [];
      
      if (systemPrompt) {
        messages.push({
          role: 'system',
          content: systemPrompt
        });
      }

      messages.push({
        role: 'user',
        content: prompt
      });

      let fullContent = '';

      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages: messages as any,
        temperature: 0.7,
        max_tokens: 2048,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullContent += content;
          onChunk(content);
        }
      }

      return fullContent;
    } catch (error) {
      logger.error('GROQ streaming error:', error);
      throw error;
    }
  }

  /**
   * Chat with conversation history
   */
  async chat(userMessage: string, systemPrompt?: string): Promise<GroqResponse> {
    try {
      logger.info(`💬 GROQ chat: ${userMessage.substring(0, 100)}...`);

      // Add user message to history
      this.conversationHistory.push({
        role: 'user',
        content: userMessage
      });

      // Prepare messages with system prompt if provided
      const messages: GroqMessage[] = [];
      if (systemPrompt) {
        messages.push({
          role: 'system',
          content: systemPrompt
        });
      }

      // Add conversation history
      messages.push(...this.conversationHistory);

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: messages as any,
        temperature: 0.7,
        max_tokens: 2048,
      });

      const assistantMessage = response.choices[0]?.message?.content || '';

      // Add assistant message to history
      this.conversationHistory.push({
        role: 'assistant',
        content: assistantMessage
      });

      return {
        success: true,
        content: assistantMessage,
        model: this.model,
        tokens: {
          input: response.usage?.prompt_tokens || 0,
          output: response.usage?.completion_tokens || 0
        }
      };
    } catch (error) {
      logger.error('GROQ chat error:', error);
      return {
        success: false,
        content: '',
        model: this.model
      };
    }
  }

  /**
   * Generate embeddings via prompt analysis (since we don't have embedding API)
   * For now, we'll use a hash-based approach and later replace with proper embeddings
   */
  async analyzeForEmbedding(text: string): Promise<string> {
    try {
      // Create a semantic analysis of the text
      const analysisPrompt = `Analyze this text and provide a semantic summary in 50 words:

Text: "${text}"

Semantic summary:`;

      const response = await this.complete(analysisPrompt);
      return response.content;
    } catch (error) {
      logger.error('Embedding analysis error:', error);
      return '';
    }
  }

  /**
   * Generate content with specific format
   */
  async generateContent(prompt: string, context: any): Promise<GroqResponse> {
    const systemPrompt = `You are ERIZON AI - a marketing and growth specialist. 
Your responses should be:
- Clear and actionable
- Data-driven
- Customer-focused
- Strategic and tactical
- Aligned with brand guidelines`;

    const enhancedPrompt = `
Context:
${JSON.stringify(context, null, 2)}

Request:
${prompt}

Generate a response:`;

    return this.complete(enhancedPrompt, systemPrompt);
  }

  /**
   * Generate agent-specific response
   */
  async generateAgentResponse(agentRole: string, task: string, context: any): Promise<GroqResponse> {
    const systemPrompt = `You are a specialist ${agentRole} in ERIZON AI. 
Your expertise includes all aspects of ${agentRole}.
Provide professional, data-driven recommendations.`;

    const enhancedPrompt = `
Task: ${task}

Company Context:
${JSON.stringify(context.company, null, 2)}

Market Context:
${JSON.stringify(context.market, null, 2)}

Provide your recommendation:`;

    return this.complete(enhancedPrompt, systemPrompt);
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
    logger.info('✅ Conversation history cleared');
  }

  /**
   * Get conversation history
   */
  getHistory(): GroqMessage[] {
    return this.conversationHistory;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.complete('Say "GROQ is ready" in one sentence.');
      return response.success;
    } catch (error) {
      logger.error('GROQ health check failed:', error);
      return false;
    }
  }
}

export default GroqClient;
