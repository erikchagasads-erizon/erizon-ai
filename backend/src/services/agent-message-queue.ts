import { logger } from '../utils/logger';
import AIService from './ai-service';
import MemoryService from './memory-service';

export interface WorkflowEvent {
  workflow_id: string;
  event_type: 'started' | 'agent_thinking' | 'decision_made' | 'completed' | 'failed';
  agent: string;
  timestamp: Date;
  data: any;
}

/**
 * Real-time message queue for agent communication
 * Enables async, event-driven agent interactions
 */
export class AgentMessageQueue {
  private queue: WorkflowEvent[] = [];
  private listeners: Map<string, (event: WorkflowEvent) => void> = new Map();
  private aiService: AIService;
  private memoryService: MemoryService;

  constructor(aiService: AIService, memoryService: MemoryService) {
    this.aiService = aiService;
    this.memoryService = memoryService;
    logger.info('💬 Agent Message Queue initialized');
  }

  /**
   * Send a message to the queue
   */
  async sendMessage(event: WorkflowEvent): Promise<void> {
    this.queue.push(event);
    logger.info(`📨 Message queued: ${event.event_type} by ${event.agent}`);

    // Notify all listeners
    for (const listener of this.listeners.values()) {
      listener(event);
    }

    // Process message immediately if it's a decision
    if (event.event_type === 'decision_made') {
      await this.processDecision(event);
    }
  }

  /**
   * Subscribe to messages
   */
  subscribe(agent: string, listener: (event: WorkflowEvent) => void): () => void {
    const key = `${agent}-${Date.now()}`;
    this.listeners.set(key, listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(key);
    };
  }

  /**
   * Process a decision and notify relevant agents
   */
  private async processDecision(event: WorkflowEvent): Promise<void> {
    logger.info(`⚙️ Processing decision from ${event.agent}`);

    // Find related agents that should act on this decision
    // This could trigger a cascade of agent actions

    // Broadcast to all listeners
    for (const listener of this.listeners.values()) {
      listener(event);
    }
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Get queue history
   */
  getHistory(limit: number = 100): WorkflowEvent[] {
    return this.queue.slice(-limit);
  }

  /**
   * Clear old messages
   */
  clearHistory(olderThanMs: number = 3600000): void {
    const cutoff = Date.now() - olderThanMs;
    this.queue = this.queue.filter(e => e.timestamp.getTime() > cutoff);
    logger.info(`🧹 Cleared old messages (${this.queue.length} remaining)`);
  }

  /**
   * Broadcast a system message to all agents
   */
  async broadcast(message: string, data: any = {}): Promise<void> {
    const event: WorkflowEvent = {
      workflow_id: 'broadcast-' + Date.now(),
      event_type: 'started',
      agent: 'SYSTEM',
      timestamp: new Date(),
      data: { message, ...data }
    };

    await this.sendMessage(event);
  }
}

export default AgentMessageQueue;
