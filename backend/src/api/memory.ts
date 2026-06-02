import express, { Request, Response } from 'express';
import { logger } from '../utils/logger';
import MemoryService from '../services/memory-service';
import { supabaseConfig } from '../config';

const router = express.Router();
const memoryService = new MemoryService(supabaseConfig.url, supabaseConfig.serviceKey || supabaseConfig.anonKey);

function badRequest(res: Response, message: string) {
  return res.status(400).json({ success: false, error: message });
}

router.get('/:companyId', async (req: Request, res: Response) => {
  const { companyId } = req.params;
  logger.info(`📚 Fetching ERIZON memory for: ${companyId}`);

  const memory = await memoryService.getMemory(companyId);
  if (!memory) return res.status(404).json({ success: false, error: 'Memória não encontrada' });
  return res.json({ success: true, data: memory });
});

router.post('/:companyId/initialize', async (req: Request, res: Response) => {
  const { companyId } = req.params;
  const { company_data } = req.body;
  if (!company_data) return badRequest(res, 'company_data é obrigatório');

  const ok = await memoryService.initializeMemory(companyId, company_data);
  return res.status(ok ? 200 : 500).json({ success: ok, data: { initialized: ok } });
});

router.post('/:companyId/update', async (req: Request, res: Response) => {
  const { companyId } = req.params;
  const { section, data } = req.body;
  if (!section) return badRequest(res, 'section é obrigatório');

  const ok = await memoryService.updateMemory(companyId, section, data);
  return res.status(ok ? 200 : 500).json({ success: ok, data: { updated: ok, section, timestamp: new Date().toISOString() } });
});

router.post('/:companyId/add-content', async (req: Request, res: Response) => {
  const { companyId } = req.params;
  const { content } = req.body;
  if (!content) return badRequest(res, 'content é obrigatório');

  const ok = await memoryService.addContentToLibrary(companyId, content);
  return res.status(ok ? 200 : 500).json({ success: ok, data: { added: ok } });
});

router.post('/:companyId/log-decision', async (req: Request, res: Response) => {
  const { companyId } = req.params;
  const { decision, reasoning, title } = req.body;
  if (!decision && !title) return badRequest(res, 'decision ou title é obrigatório');

  const ok = await memoryService.logDecision(companyId, { title: title || decision, description: reasoning, ...req.body });
  return res.status(ok ? 200 : 500).json({ success: ok, data: { logged: ok, timestamp: new Date().toISOString() } });
});

router.get('/:companyId/summary', async (req: Request, res: Response) => {
  const { companyId } = req.params;
  const summary = await memoryService.getSummary(companyId);
  if (!summary) return res.status(404).json({ success: false, error: 'Resumo não encontrado' });
  return res.json({ success: true, data: summary });
});

router.get('/:companyId/search', async (req: Request, res: Response) => {
  const { companyId } = req.params;
  const query = String(req.query.query || '');
  if (!query) return badRequest(res, 'query é obrigatório');

  const results = await memoryService.searchMemory(companyId, query);
  return res.json({ success: true, data: { results, count: results.length } });
});

export default router;
