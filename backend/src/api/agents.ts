import express, { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { AGENT_SYSTEM_PROMPTS } from '../prompts/agents';

const router = express.Router();

const agents = Object.values(AGENT_SYSTEM_PROMPTS).map((agent, index) => ({
  id: agent.key.toLowerCase().replace(/_/g, '-'),
  key: agent.key,
  name: agent.name,
  role: agent.name,
  department: agent.department,
  status: 'active',
  order: index + 1,
  output_schema: agent.outputSchema
}));

router.get('/', (_req: Request, res: Response) => {
  const departments = agents.reduce((acc: Record<string, number>, agent) => {
    acc[agent.department] = (acc[agent.department] || 0) + 1;
    return acc;
  }, {});

  res.json({
    success: true,
    data: {
      total_agents: agents.length,
      departments,
      agents
    }
  });
});

router.get('/department/:dept', (req: Request, res: Response) => {
  const { dept } = req.params;
  logger.info(`Fetching agents for department: ${dept}`);

  const normalized = dept.toLowerCase();
  const filtered = agents.filter(agent => agent.department.toLowerCase().includes(normalized));

  res.json({
    success: true,
    data: {
      department: dept,
      agent_count: filtered.length,
      agents: filtered
    }
  });
});

router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const agent = agents.find(item => item.id === id || item.key === id.toUpperCase());

  if (!agent) return res.status(404).json({ success: false, error: 'Agente não encontrado' });

  const prompt = AGENT_SYSTEM_PROMPTS[agent.key as keyof typeof AGENT_SYSTEM_PROMPTS];
  res.json({
    success: true,
    data: {
      ...agent,
      system_prompt: prompt.systemPrompt
    }
  });
});

router.get('/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const agent = agents.find(item => item.id === id || item.key === id.toUpperCase());

  if (!agent) return res.status(404).json({ success: false, error: 'Agente não encontrado' });

  res.json({
    success: true,
    data: {
      id: agent.id,
      status: 'active',
      last_activity: new Date().toISOString(),
      current_task: 'idle',
      department: agent.department
    }
  });
});

export default router;
