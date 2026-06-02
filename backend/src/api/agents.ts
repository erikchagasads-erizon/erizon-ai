import express, { Request, Response } from 'express';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * GET /api/agents - Get all agents
 */
router.get('/', (req: Request, res: Response) => {
  // Mock response - will be connected to orchestrator
  res.json({
    success: true,
    data: {
      total_agents: 36,
      departments: {
        'Executive Council': 7,
        'Marketing Department': 10,
        'Traffic Department': 8,
        'Customer Success': 4,
        'Support': 2,
        'Analytics': 5
      },
      agents: [
        {
          id: 'ceo-ia-01',
          name: 'CEO IA',
          role: 'Chief Executive Officer',
          department: 'Executive Council',
          status: 'active'
        },
        {
          id: 'cmo-ia-01',
          name: 'CMO IA',
          role: 'Chief Marketing Officer',
          department: 'Executive Council',
          status: 'active'
        }
      ]
    }
  });
});

/**
 * GET /api/agents/:id - Get specific agent
 */
router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  logger.info(`Fetching agent: ${id}`);

  res.json({
    success: true,
    data: {
      id,
      name: 'Agent Name',
      role: 'Agent Role',
      department: 'Department',
      status: 'active',
      expertise: []
    }
  });
});

/**
 * GET /api/agents/:id/status - Get agent status
 */
router.get('/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;

  res.json({
    success: true,
    data: {
      id,
      status: 'active',
      last_activity: new Date().toISOString(),
      tasks_completed: 42,
      current_task: 'idle'
    }
  });
});

/**
 * GET /api/agents/department/:dept - Get agents by department
 */
router.get('/department/:dept', (req: Request, res: Response) => {
  const { dept } = req.params;
  logger.info(`Fetching agents for department: ${dept}`);

  res.json({
    success: true,
    data: {
      department: dept,
      agent_count: 5,
      agents: []
    }
  });
});

export default router;
