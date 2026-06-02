import BaseAgent from '../agents/base-agent';
import { logger } from '../utils/logger';
import AIService from '../services/ai-service';
import MemoryService from '../services/memory-service';

export interface AgentDecision {
  agent_id: string;
  agent_name: string;
  decision: string;
  reasoning: string;
  confidence: number;
  timestamp: Date;
}

export interface WorkflowResult {
  workflow_id: string;
  workflow_name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  decisions: AgentDecision[];
  final_output: any;
  metrics: {
    total_duration_ms: number;
    agents_involved: number;
    decisions_made: number;
  };
}

/**
 * Enhanced Agent Orchestrator with AI Integration
 * Manages agent communication, workflow execution, and decision logging
 */
export class EnhancedAgentOrchestrator {
  private agents: Map<string, BaseAgent> = new Map();
  private aiService: AIService;
  private memoryService: MemoryService;
  private currentWorkflow: WorkflowResult | null = null;
  private decisionLog: AgentDecision[] = [];

  constructor(aiService: AIService, memoryService: MemoryService) {
    this.aiService = aiService;
    this.memoryService = memoryService;
    logger.info('🎭 Enhanced Agent Orchestrator initialized');
  }

  /**
   * Register an agent with the orchestrator
   */
  registerAgent(agent: BaseAgent): void {
    this.agents.set(agent.id, agent);
    logger.info(`✅ Agent registered: ${agent.name} (${agent.id})`);
  }

  /**
   * Get all agents or filtered by department
   */
  getAgents(department?: string): BaseAgent[] {
    const agents = Array.from(this.agents.values());
    if (!department) return agents;
    return agents.filter(a => a.department === department);
  }

  /**
   * Execute executive meeting with AI insights
   */
  async executeExecutiveMeeting(companyId: string): Promise<WorkflowResult> {
    const workflowId = 'workflow-' + Date.now();
    const startTime = Date.now();

    logger.info(`🏢 Starting Executive Meeting (${workflowId})`);

    this.currentWorkflow = {
      workflow_id: workflowId,
      workflow_name: 'Executive Meeting',
      status: 'in_progress',
      decisions: [],
      final_output: {},
      metrics: {
        total_duration_ms: 0,
        agents_involved: 0,
        decisions_made: 0
      }
    };

    try {
      // Get company memory
      const memory = await this.memoryService.getMemory(companyId);
      if (!memory) {
        throw new Error('Company memory not found');
      }

      // CEO sets agenda and asks key questions
      const ceoDecision = await this.executiveThinking(
        'CEO IA',
        'Strategic Direction',
        `Based on current metrics and market conditions, what should be our top 3 priorities this quarter?`,
        memory
      );
      this.currentWorkflow.decisions.push(ceoDecision);

      // CMO provides marketing perspective
      const cmoDecision = await this.executiveThinking(
        'CMO IA',
        'Marketing Strategy',
        `What marketing initiatives will drive the most qualified leads?`,
        memory
      );
      this.currentWorkflow.decisions.push(cmoDecision);

      // Growth Head identifies opportunities
      const growthDecision = await this.executiveThinking(
        'Head de Growth IA',
        'Growth Opportunities',
        `Where are the biggest growth opportunities in current market conditions?`,
        memory
      );
      this.currentWorkflow.decisions.push(growthDecision);

      // Log decisions to memory
      await this.memoryService.logDecision(companyId, {
        meeting_type: 'Executive Council',
        decisions: this.currentWorkflow.decisions,
        timestamp: new Date().toISOString()
      });

      this.currentWorkflow.status = 'completed';
      this.currentWorkflow.final_output = {
        priorities: ceoDecision,
        marketing_strategy: cmoDecision,
        growth_opportunities: growthDecision
      };

    } catch (error) {
      logger.error('Executive meeting failed:', error);
      this.currentWorkflow.status = 'failed';
      this.currentWorkflow.final_output = { error: String(error) };
    }

    const duration = Date.now() - startTime;
    this.currentWorkflow.metrics.total_duration_ms = duration;
    this.currentWorkflow.metrics.agents_involved = this.currentWorkflow.decisions.length;
    this.currentWorkflow.metrics.decisions_made = this.currentWorkflow.decisions.length;

    logger.info(`✅ Executive Meeting completed in ${duration}ms`);

    return this.currentWorkflow;
  }

  /**
   * Execute content production workflow with AI
   */
  async executeContentProduction(companyId: string, contentType: string): Promise<WorkflowResult> {
    const workflowId = 'workflow-' + Date.now();
    const startTime = Date.now();

    logger.info(`📝 Starting Content Production (${workflowId}) - Type: ${contentType}`);

    this.currentWorkflow = {
      workflow_id: workflowId,
      workflow_name: 'Content Production',
      status: 'in_progress',
      decisions: [],
      final_output: {},
      metrics: {
        total_duration_ms: 0,
        agents_involved: 0,
        decisions_made: 0
      }
    };

    try {
      const memory = await this.memoryService.getMemory(companyId);
      if (!memory) throw new Error('Company memory not found');

      // Copywriter develops messaging
      const copyDecision = await this.executiveThinking(
        'Copywriter IA 01',
        'Copy Creation',
        `Create compelling copy for ${contentType} that resonates with our target audience`,
        memory
      );
      this.currentWorkflow.decisions.push(copyDecision);

      // Designer creates visual direction
      const designDecision = await this.executiveThinking(
        'Designer IA 01',
        'Visual Design',
        `Design visual direction for ${contentType} aligned with brand guidelines`,
        memory
      );
      this.currentWorkflow.decisions.push(designDecision);

      // Viral expert adds engagement strategy
      const viralDecision = await this.executiveThinking(
        'Viral IA 01',
        'Engagement Strategy',
        `What viral elements and psychology should we use to maximize engagement?`,
        memory
      );
      this.currentWorkflow.decisions.push(viralDecision);

      // Add content to library
      const contentLibraryEntry = {
        type: contentType,
        copy: copyDecision.decision,
        design: designDecision.decision,
        viral_strategy: viralDecision.decision,
        created_at: new Date().toISOString()
      };

      await this.memoryService.addContentToLibrary(companyId, contentLibraryEntry);

      this.currentWorkflow.status = 'completed';
      this.currentWorkflow.final_output = contentLibraryEntry;

    } catch (error) {
      logger.error('Content production failed:', error);
      this.currentWorkflow.status = 'failed';
      this.currentWorkflow.final_output = { error: String(error) };
    }

    const duration = Date.now() - startTime;
    this.currentWorkflow.metrics.total_duration_ms = duration;
    this.currentWorkflow.metrics.agents_involved = this.currentWorkflow.decisions.length;
    this.currentWorkflow.metrics.decisions_made = this.currentWorkflow.decisions.length;

    logger.info(`✅ Content Production completed in ${duration}ms`);

    return this.currentWorkflow;
  }

  /**
   * Execute traffic optimization with AI
   */
  async executeTrafficOptimization(companyId: string): Promise<WorkflowResult> {
    const workflowId = 'workflow-' + Date.now();
    const startTime = Date.now();

    logger.info(`📊 Starting Traffic Optimization (${workflowId})`);

    this.currentWorkflow = {
      workflow_id: workflowId,
      workflow_name: 'Traffic Optimization',
      status: 'in_progress',
      decisions: [],
      final_output: {},
      metrics: {
        total_duration_ms: 0,
        agents_involved: 0,
        decisions_made: 0
      }
    };

    try {
      const memory = await this.memoryService.getMemory(companyId);
      if (!memory) throw new Error('Company memory not found');

      // Meta Ads expert optimizes Facebook/Instagram
      const metaDecision = await this.executiveThinking(
        'Especialista Meta 01',
        'Meta Ads Strategy',
        `Optimize Meta Ads for maximum ROI. Analyze audience data and creative performance.`,
        memory
      );
      this.currentWorkflow.decisions.push(metaDecision);

      // Google Ads expert optimizes search
      const googleDecision = await this.executiveThinking(
        'Especialista Google 01',
        'Google Ads Strategy',
        `Optimize Google Ads campaigns for lead generation and conversion.`,
        memory
      );
      this.currentWorkflow.decisions.push(googleDecision);

      // BI Analyst provides insights
      const biDecision = await this.executiveThinking(
        'Analista BI',
        'Analytics Insights',
        `What insights from current metrics should inform our ad optimization?`,
        memory
      );
      this.currentWorkflow.decisions.push(biDecision);

      this.currentWorkflow.status = 'completed';
      this.currentWorkflow.final_output = {
        meta_strategy: metaDecision,
        google_strategy: googleDecision,
        analytics_insights: biDecision
      };

    } catch (error) {
      logger.error('Traffic optimization failed:', error);
      this.currentWorkflow.status = 'failed';
      this.currentWorkflow.final_output = { error: String(error) };
    }

    const duration = Date.now() - startTime;
    this.currentWorkflow.metrics.total_duration_ms = duration;
    this.currentWorkflow.metrics.agents_involved = this.currentWorkflow.decisions.length;
    this.currentWorkflow.metrics.decisions_made = this.currentWorkflow.decisions.length;

    logger.info(`✅ Traffic Optimization completed in ${duration}ms`);

    return this.currentWorkflow;
  }

  /**
   * Have an agent think through a problem with AI assistance
   */
  private async executiveThinking(
    agentName: string,
    subject: string,
    question: string,
    context: any
  ): Promise<AgentDecision> {
    try {
      // Use RAG to get context-aware answer
      const ragResponse: any = await this.aiService.query(question, context.companyId || context.company_id || context.company?.id || context);

      const decision: AgentDecision = {
        agent_id: agentName.toLowerCase().replace(/\s/g, '-'),
        agent_name: agentName,
        decision: ragResponse.answer || 'Decision made',
        reasoning: `Analysis based on: ${subject}. Context: ${JSON.stringify(context).substring(0, 100)}...`,
        confidence: ragResponse.confidence || 0.85,
        timestamp: new Date()
      };

      logger.info(`🤔 ${agentName}: Decision made (confidence: ${decision.confidence})`);

      return decision;
    } catch (error) {
      logger.error(`${agentName} thinking failed:`, error);

      return {
        agent_id: agentName.toLowerCase().replace(/\s/g, '-'),
        agent_name: agentName,
        decision: 'Unable to make decision',
        reasoning: 'Error occurred during analysis',
        confidence: 0,
        timestamp: new Date()
      };
    }
  }

  /**
   * Get decision log
   */
  getDecisionLog(): AgentDecision[] {
    return this.decisionLog;
  }

  /**
   * Get current workflow status
   */
  getCurrentWorkflow(): WorkflowResult | null {
    return this.currentWorkflow;
  }

  /**
   * Get orchestrator status
   */
  getStatus() {
    return {
      agents_registered: this.agents.size,
      active_workflow: this.currentWorkflow?.workflow_name || null,
      workflow_status: this.currentWorkflow?.status || null,
      total_decisions: this.decisionLog.length,
      timestamp: new Date().toISOString()
    };
  }
}

export default EnhancedAgentOrchestrator;
