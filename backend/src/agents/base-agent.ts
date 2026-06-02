import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

export interface Decision {
  id: string;
  reasoning: string;
  recommendation: string;
  confidence: number;
}

export interface Message {
  from: string;
  to: string | string[];
  subject: string;
  content: any;
  priority: 'critical' | 'high' | 'normal' | 'low';
}

export interface ExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
}

export abstract class BaseAgent {
  id: string;
  name: string;
  role: string;
  department: string;
  expertise: string[];
  status: 'active' | 'busy' | 'idle';

  constructor(
    id: string,
    name: string,
    role: string,
    department: string,
    expertise: string[] = []
  ) {
    this.id = id;
    this.name = name;
    this.role = role;
    this.department = department;
    this.expertise = expertise;
    this.status = 'idle';
  }

  /**
   * Think phase: Analyze context and make decisions
   */
  abstract think(context: any): Promise<Decision>;

  /**
   * Act phase: Execute the decision
   */
  abstract act(decision: Decision): Promise<ExecutionResult>;

  /**
   * Main execution flow
   */
  async execute(context: any): Promise<ExecutionResult> {
    try {
      logger.info(`Agent ${this.name} starting execution`);
      this.status = 'busy';

      const decision = await this.think(context);
      logger.info(`Agent ${this.name} made decision: ${decision.recommendation}`);

      const result = await this.act(decision);
      this.status = 'idle';

      return result;
    } catch (error) {
      logger.error(`Agent ${this.name} execution failed:`, error);
      this.status = 'idle';
      return {
        success: false,
        error: String(error)
      };
    }
  }

  /**
   * Access shared memory
   */
  async accessMemory(): Promise<any> {
    // Implementation in orchestration service
    logger.info(`Agent ${this.name} accessing shared memory`);
    return null;
  }

  /**
   * Communicate with other agents
   */
  async communicateWith(targetAgent: BaseAgent, message: Message): Promise<void> {
    logger.info(`Agent ${this.name} sending message to ${targetAgent.name}: ${message.subject}`);
    // Message queue implementation
  }

  /**
   * Get agent status
   */
  getStatus() {
    return {
      id: this.id,
      name: this.name,
      role: this.role,
      department: this.department,
      status: this.status,
      expertise: this.expertise
    };
  }
}

export default BaseAgent;
