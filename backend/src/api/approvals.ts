import express, { Request, Response } from 'express';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * GET /api/approvals - List pending approvals
 */
router.get('/', (req: Request, res: Response) => {
  const { company_id, status } = req.query;

  logger.info(`📋 Fetching approvals for: ${company_id}`);

  res.json({
    success: true,
    data: {
      items: [
        {
          id: 'approval-1',
          content_id: 'content-1',
          type: 'carousel',
          status: 'pending',
          created_at: new Date().toISOString(),
          preview_url: '/content/carousel-1.jpg',
          caption: 'Sample carousel caption',
          cta: 'Learn More',
          objective: 'Lead Generation',
          neuro_score: 87
        }
      ],
      total: 1,
      pending: 1
    }
  });
});

/**
 * POST /api/approvals/approve - Approve content
 */
router.post('/approve', (req: Request, res: Response) => {
  const { approval_id, notes } = req.body;

  logger.info(`✅ Approving content: ${approval_id}`);

  res.json({
    success: true,
    data: {
      approval_id,
      approved: true,
      approved_at: new Date().toISOString(),
      next_step: 'Ready for publishing'
    }
  });
});

/**
 * POST /api/approvals/reject - Reject content
 */
router.post('/reject', (req: Request, res: Response) => {
  const { approval_id, reason } = req.body;

  logger.info(`❌ Rejecting content: ${approval_id}`);

  res.json({
    success: true,
    data: {
      approval_id,
      rejected: true,
      reason: reason,
      rejected_at: new Date().toISOString()
    }
  });
});

/**
 * POST /api/approvals/request-changes - Request modifications
 */
router.post('/request-changes', (req: Request, res: Response) => {
  const { approval_id, changes } = req.body;

  logger.info(`🔄 Requesting changes: ${approval_id}`);

  res.json({
    success: true,
    data: {
      approval_id,
      status: 'changes_requested',
      changes: changes,
      created_at: new Date().toISOString()
    }
  });
});

/**
 * GET /api/approvals/:approval_id - Get approval details
 */
router.get('/:approval_id', (req: Request, res: Response) => {
  const { approval_id } = req.params;

  logger.info(`📄 Fetching approval: ${approval_id}`);

  res.json({
    success: true,
    data: {
      id: approval_id,
      content: {
        type: 'carousel',
        images: ['image1.jpg', 'image2.jpg', 'image3.jpg'],
        caption: 'Full caption here',
        cta: 'Click here',
        objective: 'Lead Generation'
      },
      neuro_score: 87,
      neuro_breakdown: {
        attention: 8.5,
        contrast: 8.0,
        emotion: 7.5,
        curiosity: 9.0,
        memorization: 7.8,
        scannability: 8.2,
        visualReading: 7.9,
        retention: 8.1
      },
      status: 'pending',
      created_by: 'Designer IA 01',
      created_at: new Date().toISOString()
    }
  });
});

/**
 * POST /api/approvals/bulk-approve - Approve multiple items
 */
router.post('/bulk-approve', (req: Request, res: Response) => {
  const { approval_ids } = req.body;

  logger.info(`✅ Bulk approving ${approval_ids.length} items`);

  res.json({
    success: true,
    data: {
      approved_count: approval_ids.length,
      failed_count: 0,
      results: approval_ids.map((id: string) => ({
        id,
        status: 'approved'
      }))
    }
  });
});

export default router;
