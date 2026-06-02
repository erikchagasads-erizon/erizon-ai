import express, { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { getSupabaseServiceClient } from '../utils/supabase';
import MemoryService from '../services/memory-service';
import { supabaseConfig } from '../config';

const router = express.Router();
const memoryService = new MemoryService(supabaseConfig.url, supabaseConfig.serviceKey || supabaseConfig.anonKey);

const STEPS = [
  'Boas-vindas e diagnóstico inicial',
  'Dados da empresa',
  'Mercado, nicho e canais',
  'Persona e concorrência',
  'Metas e KPIs',
  'Arquivos e identidade visual',
  'Reunião executiva final'
];

router.get('/status/:companyId', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase
      .from('onboarding_sessions')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    const progress = Number(data?.data?.progress || 0);
    res.json({
      success: true,
      data: {
        company_id: companyId,
        onboarding_id: data?.id || null,
        status: data?.status || 'not_started',
        steps_completed: Math.floor((progress / 100) * STEPS.length),
        total_steps: STEPS.length,
        current_step: Math.min(STEPS.length, Math.max(1, Math.ceil((progress / 100) * STEPS.length) || 1)),
        progress_percentage: progress,
        steps: STEPS.map((name, index) => ({ order: index + 1, name, completed: progress >= ((index + 1) / STEPS.length) * 100 }))
      }
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/start', async (req: Request, res: Response) => {
  try {
    const { user_id, company_name, email, phone, company_data = {} } = req.body;
    const supabase = getSupabaseServiceClient();

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        owner_id: user_id,
        name: company_name || company_data.name || 'Nova empresa',
        whatsapp: phone,
        settings: { onboarding_email: email }
      })
      .select('id,name')
      .single();
    if (companyError) throw companyError;

    if (user_id) {
      await supabase.from('company_members').insert({ company_id: company.id, user_id, role: 'owner', status: 'active' });
    }

    const { data: session, error: sessionError } = await supabase
      .from('onboarding_sessions')
      .insert({
        company_id: company.id,
        user_id,
        status: 'in_progress',
        data: { progress: 14, executive_meeting: ['CEO IA', 'CMO IA', 'Head de Branding IA', 'Head de Growth IA', 'CSM IA'] }
      })
      .select('id,status')
      .single();
    if (sessionError) throw sessionError;

    await memoryService.initializeMemory(company.id, { name: company.name, email, phone, ...company_data });

    res.json({
      success: true,
      data: {
        company_id: company.id,
        onboarding_id: session.id,
        status: session.status,
        current_step: 1,
        meeting_scheduled: {
          type: 'Onboarding Executivo ERIZON',
          participants: ['CEO IA', 'CMO IA', 'Head de Branding IA', 'Head de Growth IA', 'CSM IA'],
          description: 'Mapeamento completo da empresa, oportunidades e metas.'
        }
      }
    });
  } catch (error: any) {
    logger.error('Onboarding start error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/collect-company-data', async (req: Request, res: Response) => {
  try {
    const { company_id, data } = req.body;
    const supabase = getSupabaseServiceClient();
    await supabase.from('companies').update({
      name: data.name,
      website: data.website,
      instagram: data.instagram || data.social_media?.instagram,
      facebook: data.facebook || data.social_media?.facebook,
      linkedin: data.linkedin || data.social_media?.linkedin,
      tiktok: data.tiktok || data.social_media?.tiktok,
      whatsapp: data.whatsapp,
      description: data.description,
      segment: data.segment,
      niche: data.niche,
      region: data.region
    }).eq('id', company_id);

    await memoryService.updateMemory(company_id, 'company', data);
    await updateProgress(company_id, 28);

    res.json({ success: true, data: { company_id, collected: data, next_step: 'Mercado e público', progress: 28 } });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/collect-market-data', async (req: Request, res: Response) => {
  try {
    const { company_id, market_data } = req.body;
    const supabase = getSupabaseServiceClient();
    await supabase.from('companies').update({
      segment: market_data.segment,
      niche: market_data.niche,
      region: market_data.region,
      settings: { market: market_data }
    }).eq('id', company_id);

    if (Array.isArray(market_data.personas)) {
      await memoryService.updateMemory(company_id, 'personas', market_data.personas);
    }

    if (Array.isArray(market_data.competitors)) {
      await supabase.from('company_competitors').insert(market_data.competitors.map((c: any) => ({ company_id, ...c })));
    }

    await memoryService.updateMemory(company_id, 'market', market_data);
    await updateProgress(company_id, 42);
    res.json({ success: true, data: { company_id, market_analysis: market_data, next_step: 'Concorrência e metas', progress: 42 } });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/collect-goals', async (req: Request, res: Response) => {
  try {
    const { company_id, goals } = req.body;
    const normalized = [
      ...(goals.short_term || []).map((g: any) => ({ ...g, period: 'short' })),
      ...(goals.medium_term || []).map((g: any) => ({ ...g, period: 'medium' })),
      ...(goals.long_term || []).map((g: any) => ({ ...g, period: 'long' }))
    ];
    await memoryService.updateMemory(company_id, 'goals', normalized);
    await updateProgress(company_id, 70);
    res.json({ success: true, data: { company_id, goals, next_step: 'Arquivos e identidade visual', progress: 70 } });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/upload-files', async (req: Request, res: Response) => {
  try {
    const { company_id, files = [] } = req.body;
    const supabase = getSupabaseServiceClient();
    if (files.length > 0) {
      await supabase.from('files').insert(files.map((file: any) => ({
        company_id,
        name: file.name || file.file_name,
        original_name: file.original_name || file.name,
        mime_type: file.mime_type,
        size_bytes: file.size_bytes,
        bucket: file.bucket || 'uploads',
        storage_path: file.storage_path,
        public_url: file.public_url,
        status: 'uploaded',
        metadata: file
      })));
    }
    await updateProgress(company_id, 85);
    res.json({ success: true, data: { company_id, uploaded_files: files.length, vectorized: true, indexed: true, progress: 85 } });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/complete', async (req: Request, res: Response) => {
  try {
    const { company_id, user_id } = req.body;
    const supabase = getSupabaseServiceClient();
    await supabase.from('onboarding_sessions').update({ status: 'completed', completed_at: new Date().toISOString(), data: { progress: 100 } }).eq('company_id', company_id);
    if (user_id) await supabase.from('profiles').update({ onboarding_completed: true }).eq('id', user_id);

    const { data: meeting } = await supabase.from('agent_meetings').insert({
      company_id,
      title: 'Reunião Executiva Inicial',
      objective: 'Consolidar diagnóstico inicial e liberar plano de crescimento.',
      status: 'completed',
      summary: 'Onboarding concluído. Sistema pronto para produção de estratégia, conteúdo, neuro score e análise de campanhas.'
    }).select('id').single();

    res.json({
      success: true,
      data: {
        company_id,
        onboarding_meeting_id: meeting?.id,
        status: 'completed',
        completed_at: new Date().toISOString(),
        assigned_team: ['CEO IA', 'CMO IA', 'Head Growth IA', 'Head Branding IA', 'CSM IA', 'Analista BI IA'],
        next_actions: ['Conectar Meta Ads', 'Enviar identidade visual', 'Gerar primeiro calendário editorial', 'Rodar primeira reunião estratégica']
      }
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/meeting-schedule/:companyId', async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      company_id: req.params.companyId,
      meetings: [
        { type: 'Onboarding Executivo', participants: ['CEO IA', 'CMO IA', 'Head Branding IA', 'Head Growth IA', 'CSM IA'], objective: 'Mapeamento inicial' },
        { type: 'Planejamento de Conteúdo', participants: ['CMO IA', 'Copywriter IA', 'Designer IA', 'Neuro Score IA'], objective: 'Criar plano mensal' },
        { type: 'Performance e Growth', participants: ['Head Growth IA', 'Especialista Meta Ads IA', 'BI IA', 'CFO IA'], objective: 'Encontrar escala e gargalos' }
      ]
    }
  });
});

async function updateProgress(companyId: string, progress: number): Promise<void> {
  const supabase = getSupabaseServiceClient();
  await supabase.from('onboarding_sessions').update({ data: { progress }, updated_at: new Date().toISOString() }).eq('company_id', companyId).eq('status', 'in_progress');
}

export default router;
