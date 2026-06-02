import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import AgentOrchestrator from './services/agent-orchestration';

// Import API routes
import agentsRouter from './api/agents';
import contentRouter from './api/content';
import metricsRouter from './api/metrics';
import aiRouter from './api/ai';
import memoryRouter from './api/memory';
import approvalsRouter from './api/approvals';
import publishingRouter from './api/publishing';
import onboardingRouter from './api/onboarding';
import analyticsRouter from './api/analytics';
import workflowsRouter from './api/workflows';
import agentManagementRouter from './api/agent-management';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Global orchestrator instance
let orchestrator: AgentOrchestrator;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.get('/api/version', (req, res) => {
  res.json({
    version: '1.0.0',
    name: 'ERIZON AI Backend',
    status: 'ready',
    agents_initialized: orchestrator ? orchestrator.getAllAgents().length : 0
  });
});

app.get('/api/orchestrator/stats', (req, res) => {
  if (!orchestrator) {
    return res.status(503).json({
      success: false,
      error: 'Orchestrator not initialized'
    });
  }

  res.json({
    success: true,
    data: orchestrator.getStatistics()
  });
});

app.get('/api/orchestrator/registry', (req, res) => {
  if (!orchestrator) {
    return res.status(503).json({
      success: false,
      error: 'Orchestrator not initialized'
    });
  }

  res.json({
    success: true,
    data: orchestrator.getAgentRegistry()
  });
});

app.post('/api/orchestrator/meeting/executive', async (req, res) => {
  if (!orchestrator) {
    return res.status(503).json({
      success: false,
      error: 'Orchestrator not initialized'
    });
  }

  try {
    const context = req.body.context || {};
    const decisions = await orchestrator.executeExcutiveMeeting(context);

    res.json({
      success: true,
      data: {
        meeting_type: 'Executive Council',
        decisions_made: decisions.length,
        decisions
      }
    });
  } catch (error) {
    logger.error('Executive meeting error:', error);
    res.status(500).json({
      success: false,
      error: String(error)
    });
  }
});

app.post('/api/orchestrator/workflow/content-production', async (req, res) => {
  if (!orchestrator) {
    return res.status(503).json({
      success: false,
      error: 'Orchestrator not initialized'
    });
  }

  try {
    const context = req.body.context || {};
    const output = await orchestrator.executeContentProduction(context);

    res.json({
      success: true,
      data: {
        workflow: 'Content Production',
        items_created: output.length,
        output
      }
    });
  } catch (error) {
    logger.error('Content production error:', error);
    res.status(500).json({
      success: false,
      error: String(error)
    });
  }
});

// API route handlers
app.use('/api/agents', agentsRouter);
app.use('/api/content', contentRouter);
app.use('/api/metrics', metricsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/memory', memoryRouter);
app.use('/api/approvals', approvalsRouter);
app.use('/api/publishing', publishingRouter);
app.use('/api/onboarding', onboardingRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/workflows', workflowsRouter);
app.use('/api/agent-management', agentManagementRouter);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
});

// Start server
async function start() {
  try {
    // Initialize orchestrator
    orchestrator = new AgentOrchestrator();
    await orchestrator.initialize();

    app.listen(PORT, () => {
      logger.info(`🚀 ERIZON AI Backend running on port ${PORT}`);
      logger.info(`📡 API: http://localhost:${PORT}`);
      logger.info(`🏥 Health: http://localhost:${PORT}/health`);
      logger.info(`🤖 Agents: http://localhost:${PORT}/api/agents`);
      logger.info(`📊 Stats: http://localhost:${PORT}/api/orchestrator/stats`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

export default app;
