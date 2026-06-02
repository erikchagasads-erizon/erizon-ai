import express, { Request, Response } from 'express';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * GET /api/onboarding/status/:companyId - Get onboarding status
 */
router.get('/status/:companyId', (req: Request, res: Response) => {
  const { companyId } = req.params;

  logger.info(`📊 Fetching onboarding status: ${companyId}`);

  res.json({
    success: true,
    data: {
      company_id: companyId,
      status: 'in_progress', // pending, in_progress, completed
      steps_completed: 0,
      total_steps: 7,
      current_step: 1,
      progress_percentage: 14,
      steps: [
        { order: 1, name: 'Welcome & Overview', completed: true },
        { order: 2, name: 'Company Data Collection', completed: false },
        { order: 3, name: 'Market & Audience Analysis', completed: false },
        { order: 4, name: 'Competition Research', completed: false },
        { order: 5, name: 'Goals & Targets Setup', completed: false },
        { order: 6, name: 'File Upload & Branding', completed: false },
        { order: 7, name: 'Finalization & Team Assignment', completed: false }
      ]
    }
  });
});

/**
 * POST /api/onboarding/start - Start onboarding
 */
router.post('/start', (req: Request, res: Response) => {
  const { company_name, email, phone } = req.body;

  logger.info(`🚀 Starting onboarding for: ${company_name}`);

  res.json({
    success: true,
    data: {
      company_id: 'company-' + Date.now(),
      onboarding_id: 'onboarding-' + Date.now(),
      status: 'in_progress',
      current_step: 1,
      meeting_scheduled: {
        type: 'Executive Council Meeting',
        participants: [
          'CEO IA',
          'CMO IA',
          'Head de Branding IA',
          'Head de Growth IA',
          'CSM IA'
        ],
        start_time: new Date(Date.now() + 3600000).toISOString(),
        duration_minutes: 45,
        description: 'Initial company assessment and strategy alignment'
      }
    }
  });
});

/**
 * POST /api/onboarding/collect-company-data - Collect company information
 */
router.post('/collect-company-data', (req: Request, res: Response) => {
  const { company_id, data } = req.body;

  logger.info(`📝 Collecting company data`);

  res.json({
    success: true,
    data: {
      company_id,
      collected: {
        name: data.name,
        website: data.website,
        social_media: data.social_media,
        description: data.description,
        employees: data.employees
      },
      next_step: 'Market & Audience Analysis',
      progress: 28
    }
  });
});

/**
 * POST /api/onboarding/collect-market-data - Collect market info
 */
router.post('/collect-market-data', (req: Request, res: Response) => {
  const { company_id, market_data } = req.body;

  logger.info(`📊 Collecting market analysis`);

  res.json({
    success: true,
    data: {
      company_id,
      market_analysis: {
        segment: market_data.segment,
        niche: market_data.niche,
        region: market_data.region,
        personas: market_data.personas,
        buyer_journey: market_data.buyer_journey
      },
      next_step: 'Competition Research',
      progress: 42
    }
  });
});

/**
 * POST /api/onboarding/collect-goals - Collect business goals
 */
router.post('/collect-goals', (req: Request, res: Response) => {
  const { company_id, goals } = req.body;

  logger.info(`🎯 Setting business goals`);

  res.json({
    success: true,
    data: {
      company_id,
      goals: {
        short_term: goals.short_term,
        medium_term: goals.medium_term,
        long_term: goals.long_term,
        kpis: goals.kpis,
        targets: goals.targets
      },
      next_step: 'File Upload & Branding',
      progress: 70
    }
  });
});

/**
 * POST /api/onboarding/upload-files - Upload branding and assets
 */
router.post('/upload-files', (req: Request, res: Response) => {
  const { company_id, files } = req.body;

  logger.info(`📦 Processing file uploads`);

  res.json({
    success: true,
    data: {
      company_id,
      uploaded_files: files.length,
      file_summary: {
        logos: 1,
        brand_guides: 1,
        media: files.length - 2,
        documents: 0
      },
      vectorized: true,
      indexed: true,
      next_step: 'Finalization & Team Assignment',
      progress: 85
    }
  });
});

/**
 * POST /api/onboarding/complete - Complete onboarding
 */
router.post('/complete', (req: Request, res: Response) => {
  const { company_id } = req.body;

  logger.info(`✅ Completing onboarding: ${company_id}`);

  res.json({
    success: true,
    data: {
      company_id,
      status: 'completed',
      completed_at: new Date().toISOString(),
      assigned_team: {
        account_manager: 'CSM IA 01',
        content_team: ['Designer IA 01', 'Copywriter IA 01', 'Motion IA 01'],
        strategy_team: ['CMO IA', 'Head de Growth IA'],
        analytics: ['Analista BI']
      },
      next_actions: [
        'First Executive Meeting scheduled',
        'Content generation begins',
        'Analytics dashboard initialized',
        'Real-time monitoring active'
      ],
      login_url: `https://erizon.ai/dashboard/${company_id}`,
      message: 'Welcome to ERIZON AI! Your dedicated team is ready to accelerate your growth.'
    }
  });
});

/**
 * GET /api/onboarding/meeting-schedule/:companyId - Get scheduled meetings
 */
router.get('/meeting-schedule/:companyId', (req: Request, res: Response) => {
  const { companyId } = req.params;

  logger.info(`📅 Fetching meeting schedule`);

  res.json({
    success: true,
    data: {
      meetings: [
        {
          id: 'meeting-1',
          type: 'Executive Council Alignment',
          date: new Date(Date.now() + 86400000).toISOString(),
          duration_minutes: 45,
          participants: ['CEO IA', 'CMO IA', 'CFO IA', 'COO IA'],
          objectives: ['Strategic alignment', 'KPI definition', 'Timeline setup']
        },
        {
          id: 'meeting-2',
          type: 'Content Strategy Planning',
          date: new Date(Date.now() + 172800000).toISOString(),
          duration_minutes: 60,
          participants: ['CMO IA', 'Designer IA 01', 'Copywriter IA 01'],
          objectives: ['Content calendar', 'Design guidelines', 'Messaging framework']
        }
      ]
    }
  });
});

export default router;
