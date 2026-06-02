import { BaseAgent, Message } from '../agents/base-agent';
import { logger } from '../utils/logger';
import { CEOAgent, CMOAgent, CROAgent, CFOAgent, COOAgent, HeadBrandingAgent, HeadGrowthAgent } from '../agents/executive-council';
import { DesignerAgent, MotionDesignerAgent, VideomakerAgent, CopywriterAgent, ViralExpertAgent } from '../agents/marketing-department';
import { MetaAdsSpecialistAgent, GoogleAdsSpecialistAgent, LinkedInAdsSpecialistAgent, TikTokAdsSpecialistAgent, BIAnalystAgent, MarketBenchmarkSpecialistAgent } from '../agents/traffic-department';
import { CSMAgent, SupportAnalystAgent, DataAnalystAgent } from '../agents/support-department';

export class AgentOrchestrator {
  private agents: Map<string, BaseAgent> = new Map();
  private messageQueue: Message[] = [];
  private decisionLog: any[] = [];

  /**
   * Initialize all agents
   */
  async initialize(): Promise<void> {
    logger.info('Initializing Agent Orchestrator...');

    // Executive Council (7 agents)
    this.registerAgent(new CEOAgent());
    this.registerAgent(new CMOAgent());
    this.registerAgent(new CROAgent());
    this.registerAgent(new CFOAgent());
    this.registerAgent(new COOAgent());
    this.registerAgent(new HeadBrandingAgent());
    this.registerAgent(new HeadGrowthAgent());

    // Marketing Department (10 agents)
    this.registerAgent(new DesignerAgent(1));
    this.registerAgent(new DesignerAgent(2));
    this.registerAgent(new MotionDesignerAgent(1));
    this.registerAgent(new MotionDesignerAgent(2));
    this.registerAgent(new VideomakerAgent(1));
    this.registerAgent(new VideomakerAgent(2));
    this.registerAgent(new CopywriterAgent(1));
    this.registerAgent(new CopywriterAgent(2));
    this.registerAgent(new ViralExpertAgent(1));
    this.registerAgent(new ViralExpertAgent(2));

    // Traffic Department (8 agents)
    this.registerAgent(new MetaAdsSpecialistAgent(1));
    this.registerAgent(new MetaAdsSpecialistAgent(2));
    this.registerAgent(new MetaAdsSpecialistAgent(3));
    this.registerAgent(new GoogleAdsSpecialistAgent(1));
    this.registerAgent(new GoogleAdsSpecialistAgent(2));
    this.registerAgent(new LinkedInAdsSpecialistAgent());
    this.registerAgent(new TikTokAdsSpecialistAgent());
    this.registerAgent(new BIAnalystAgent());
    this.registerAgent(new MarketBenchmarkSpecialistAgent());

    // Support Department (11 agents)
    this.registerAgent(new CSMAgent(1));
    this.registerAgent(new CSMAgent(2));
    this.registerAgent(new CSMAgent(3));
    this.registerAgent(new CSMAgent(4));
    this.registerAgent(new SupportAnalystAgent(1));
    this.registerAgent(new SupportAnalystAgent(2));
    this.registerAgent(new DataAnalystAgent(1));
    this.registerAgent(new DataAnalystAgent(2));
    this.registerAgent(new DataAnalystAgent(3));
    this.registerAgent(new DataAnalystAgent(4));
    this.registerAgent(new DataAnalystAgent(5));

    logger.info(`✅ Agent Orchestrator initialized with ${this.agents.size} agents`);
    this.logAgentRegistry();
  }

  /**
   * Register a single agent
   */
  private registerAgent(agent: BaseAgent): void {
    this.agents.set(agent.id, agent);
    logger.info(`📋 Registered agent: ${agent.name} (${agent.role})`);
  }

  /**
   * Get agent by ID
   */
  getAgent(id: string): BaseAgent | undefined {
    return this.agents.get(id);
  }

  /**
   * Get all agents
   */
  getAllAgents(): BaseAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get agents by department
   */
  getAgentsByDepartment(department: string): BaseAgent[] {
    return Array.from(this.agents.values()).filter(
      agent => agent.department === department
    );
  }

  /**
   * Get agent status overview
   */
  getAgentRegistry(): any {
    const registry: Record<string, any> = {};

    this.agents.forEach((agent) => {
      if (!registry[agent.department]) {
        registry[agent.department] = [];
      }
      registry[agent.department].push(agent.getStatus());
    });

    return registry;
  }

  /**
   * Log agent registry
   */
  private logAgentRegistry(): void {
    const registry = this.getAgentRegistry();
    logger.info('Agent Registry:');
    Object.entries(registry).forEach(([dept, agents]: [string, any]) => {
      logger.info(`  ${dept}: ${agents.length} agents`);
    });
  }

  /**
   * Executive council meeting
   * All executive leaders meet to make strategic decisions
   */
  async executeExcutiveMeeting(context: any): Promise<any> {
    logger.info('🏢 Executive Council Meeting Started');

    const executives = [
      'ceo-ia-01',
      'cmo-ia-01',
      'cro-ia-01',
      'cfo-ia-01',
      'coo-ia-01',
      'branding-ia-01',
      'growth-ia-01'
    ];

    const decisions: any[] = [];

    for (const executiveId of executives) {
      const agent = this.getAgent(executiveId);
      if (!agent) continue;

      const result = await agent.execute(context);
      decisions.push({
        agent: agent.name,
        role: agent.role,
        result
      });
    }

    logger.info('✅ Executive Council Meeting Concluded');
    return decisions;
  }

  /**
   * Content production workflow
   * Marketing team creates content collaboratively
   */
  async executeContentProduction(context: any): Promise<any> {
    logger.info('📱 Content Production Workflow Started');

    const productionTeam = [
      'designer-ia-01',
      'designer-ia-02',
      'motion-ia-01',
      'videomaker-ia-01',
      'copywriter-ia-01',
      'viral-ia-01'
    ];

    const contentOutput: any[] = [];

    for (const agentId of productionTeam) {
      const agent = this.getAgent(agentId);
      if (!agent) continue;

      const result = await agent.execute(context);
      contentOutput.push({
        agent: agent.name,
        role: agent.role,
        output: result
      });
    }

    logger.info('✅ Content Production Completed');
    return contentOutput;
  }

  /**
   * Traffic optimization workflow
   * Ads specialists analyze and optimize campaigns
   */
  async executeTrafficOptimization(context: any): Promise<any> {
    logger.info('📊 Traffic Optimization Workflow Started');

    const trafficTeam = [
      'meta-specialist-ia-01',
      'google-specialist-ia-01',
      'linkedin-specialist-ia-01',
      'tiktok-specialist-ia-01',
      'bi-analyst-ia-01',
      'benchmark-specialist-ia-01'
    ];

    const optimizations: any[] = [];

    for (const agentId of trafficTeam) {
      const agent = this.getAgent(agentId);
      if (!agent) continue;

      const result = await agent.execute(context);
      optimizations.push({
        agent: agent.name,
        platform: agent.role,
        optimization: result
      });
    }

    logger.info('✅ Traffic Optimization Completed');
    return optimizations;
  }

  /**
   * Daily standup
   * All agents report status
   */
  async executeDailyStandup(): Promise<any> {
    logger.info('📅 Daily Standup Started');

    const agentStatuses = Array.from(this.agents.values()).map(agent => ({
      name: agent.name,
      department: agent.department,
      status: agent.status,
      role: agent.role
    }));

    logger.info(`✅ Daily Standup Completed - ${this.agents.size} agents reporting`);
    return agentStatuses;
  }

  /**
   * Send message between agents
   */
  async sendMessage(message: Message): Promise<void> {
    this.messageQueue.push(message);
    logger.info(`💬 Message queued from ${message.from} to ${message.to}`);
  }

  /**
   * Process message queue
   */
  async processMessageQueue(): Promise<void> {
    logger.info(`Processing ${this.messageQueue.length} queued messages`);

    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (!message) continue;

      logger.info(`📬 Delivering message: ${message.subject}`);
      // Message delivery logic would go here
    }
  }

  /**
   * Get orchestrator statistics
   */
  getStatistics(): any {
    const departments = new Set(Array.from(this.agents.values()).map(a => a.department));
    const roles = new Set(Array.from(this.agents.values()).map(a => a.role));

    return {
      total_agents: this.agents.size,
      departments: Array.from(departments),
      roles: Array.from(roles),
      message_queue_size: this.messageQueue.length,
      decision_log_size: this.decisionLog.length
    };
  }

  /**
   * Log decision
   */
  logDecision(decision: any): void {
    this.decisionLog.push({
      timestamp: new Date(),
      ...decision
    });
  }

  /**
   * Shutdown orchestrator
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down Agent Orchestrator...');
    this.agents.clear();
    this.messageQueue = [];
    logger.info('✅ Agent Orchestrator shutdown complete');
  }
}

export default AgentOrchestrator;
