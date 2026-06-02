import express, { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { getSupabaseServiceClient } from '../utils/supabase';
import EncryptionService from '../services/encryption-service';
import MetaAdsService from '../services/meta-ads-service';

const router = express.Router();
const encryption = new EncryptionService();

function metaService(): MetaAdsService {
  return new MetaAdsService(encryption, getSupabaseServiceClient());
}

function assertCompanyId(companyId: unknown): string {
  if (!companyId || typeof companyId !== 'string') {
    throw new Error('company_id é obrigatório');
  }
  return companyId;
}

router.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      integrations: [
        { id: 'meta-ads', name: 'Meta Ads', description: 'Conecte sua conta Meta Ads para análises avançadas reais', icon: '📘', status: 'available', category: 'advertising' },
        { id: 'canva', name: 'Canva', description: 'Conecte templates e brand kits para criação de artes', icon: '🎨', status: 'available', category: 'design' },
        { id: 'capcut', name: 'CapCut', description: 'Gere pacote assistido para edição manual no CapCut', icon: '🎬', status: 'assisted_export', category: 'video' }
      ]
    }
  });
});

router.post('/meta-ads/validate', async (req: Request, res: Response) => {
  try {
    const { access_token, act_id } = req.body;
    if (!access_token) throw new Error('access_token é obrigatório');

    const service = metaService();
    const token = await service.validateToken(access_token);
    if (!token.valid) return res.status(400).json({ success: false, error: token.error, data: { token_valid: false } });

    if (!act_id) {
      return res.json({
        success: true,
        data: {
          token_valid: true,
          permissions: token.permissions,
          next_step: 'Informe o act_id da conta de anúncios'
        }
      });
    }

    const account = await service.validateAdAccount(act_id, access_token);
    if (!account.valid) return res.status(400).json({ success: false, error: account.error, data: { account_valid: false } });

    const insights = await service.fetchInsights(act_id, access_token);
    const recommendations = await service.getRecommendations(act_id, access_token);

    res.json({
      success: true,
      data: {
        token_valid: true,
        permissions: token.permissions,
        account: account.account,
        insights: { last_90_days: insights },
        recommendations
      }
    });
  } catch (error: any) {
    logger.error('Meta validation error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/meta-ads/connect', async (req: Request, res: Response) => {
  try {
    const { company_id, access_token, act_id, user_id } = req.body;
    const companyId = assertCompanyId(company_id);
    if (!access_token || !act_id) throw new Error('access_token e act_id são obrigatórios');

    const service = metaService();
    const token = await service.validateToken(access_token);
    if (!token.valid) return res.status(400).json({ success: false, error: token.error });

    const accountResult = await service.validateAdAccount(act_id, access_token);
    if (!accountResult.valid || !accountResult.account) return res.status(400).json({ success: false, error: accountResult.error });

    const connectionId = await service.saveConnection(companyId, access_token, act_id, accountResult.account, user_id);
    const sync = await service.syncToDatabase(companyId, act_id, access_token);

    res.json({
      success: true,
      data: {
        connection_id: connectionId,
        status: 'connected',
        account: accountResult.account,
        sync,
        connected_at: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logger.error('Meta connect error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});


router.post('/meta-ads/sync', async (req: Request, res: Response) => {
  try {
    const { company_id, access_token, act_id } = req.body;
    const companyId = assertCompanyId(company_id);
    if (!access_token || !act_id) throw new Error('access_token e act_id são obrigatórios para sincronização manual');

    const sync = await metaService().syncToDatabase(companyId, act_id, access_token);
    res.json({ success: true, data: { sync, synced_at: new Date().toISOString() } });
  } catch (error: any) {
    logger.error('Meta sync error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/meta-ads/status', async (req: Request, res: Response) => {
  try {
    const companyId = assertCompanyId(req.query.company_id);
    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase
      .from('meta_connections')
      .select('id,status,last_sync_at,metadata,meta_ad_accounts(act_id,name,currency,timezone_name)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    res.json({ success: true, data: data || { connected: false, status: 'disconnected' } });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/meta-ads/analysis', async (req: Request, res: Response) => {
  try {
    const companyId = assertCompanyId(req.query.company_id);
    const supabase = getSupabaseServiceClient();

    const { data: insights, error } = await supabase
      .from('meta_insights_daily')
      .select('spend,impressions,reach,clicks,leads,purchases,purchase_value,roas,ctr,cpc,cpm,date_start')
      .eq('company_id', companyId)
      .gte('date_start', new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10));

    if (error) throw error;

    const rows = insights || [];
    const spend = rows.reduce((s: number, r: any) => s + Number(r.spend || 0), 0);
    const leads = rows.reduce((s: number, r: any) => s + Number(r.leads || 0), 0);
    const purchaseValue = rows.reduce((s: number, r: any) => s + Number(r.purchase_value || 0), 0);
    const roas = spend > 0 ? purchaseValue / spend : 0;
    const avgCtr = rows.length ? rows.reduce((s: number, r: any) => s + Number(r.ctr || 0), 0) / rows.length : 0;
    const avgCpc = rows.length ? rows.reduce((s: number, r: any) => s + Number(r.cpc || 0), 0) / rows.length : 0;

    const marketingScore = Math.max(0, Math.min(100, Math.round((avgCtr * 10) + (roas * 15) + (leads > 0 ? 25 : 5))));
    const bottlenecks = [];
    if (avgCtr < 1) bottlenecks.push('CTR médio abaixo de 1%; revisar criativos e promessa.');
    if (roas > 0 && roas < 2) bottlenecks.push('ROAS abaixo de 2; escalar agora pode aumentar desperdício.');
    if (spend > 0 && leads === 0) bottlenecks.push('Investimento detectado sem leads atribuídos.');

    res.json({
      success: true,
      data: {
        marketing_score: marketingScore,
        growth_score: roas >= 3 ? 85 : roas >= 2 ? 70 : 45,
        performance_score: marketingScore,
        scalability: roas >= 3 && avgCtr >= 1 ? 'Alta' : roas >= 2 ? 'Média' : 'Baixa',
        summary: { spend, leads, purchase_value: purchaseValue, roas, avg_ctr: avgCtr, avg_cpc: avgCpc },
        opportunities: [
          roas >= 3 ? 'Campanhas com potencial de escala controlada.' : 'Há oportunidade de melhorar criativos antes de escalar.',
          'Criar variações de criativos com base nos melhores anúncios.',
          'Separar análise por campanha/conjunto/anúncio para encontrar desperdício.'
        ],
        bottlenecks,
        recommendations: [
          'Pausar ou revisar anúncios com CTR baixo e CPC alto.',
          'Testar 3 novos ganchos criativos por semana.',
          'Criar relatório semanal de ROAS, CAC, CTR, CPC e frequência.'
        ]
      }
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/meta-ads/disconnect', async (req: Request, res: Response) => {
  try {
    const companyId = assertCompanyId(req.body.company_id);
    const supabase = getSupabaseServiceClient();
    const { error } = await supabase.from('meta_connections').update({ status: 'disconnected' }).eq('company_id', companyId);
    if (error) throw error;
    res.json({ success: true, data: { disconnected: true } });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/canva/connect', async (req: Request, res: Response) => {
  try {
    const { company_id, access_token, refresh_token, user_id } = req.body;
    const companyId = assertCompanyId(company_id);
    const supabase = getSupabaseServiceClient();

    const payload: Record<string, any> = {
      company_id: companyId,
      connected_by: user_id,
      status: access_token ? 'connected' : 'disconnected',
      metadata: { mode: access_token ? 'token' : 'oauth_pending' }
    };

    if (access_token) payload.access_token_encrypted = JSON.stringify(encryption.encrypt(access_token));
    if (refresh_token) payload.refresh_token_encrypted = JSON.stringify(encryption.encrypt(refresh_token));

    const { data, error } = await supabase.from('canva_connections').insert(payload).select('id,status').single();
    if (error) throw error;

    res.json({
      success: true,
      data: {
        ...data,
        oauth_url: process.env.CANVA_OAUTH_URL || 'https://www.canva.com/api/oauth/authorize',
        next_step: access_token ? 'Conexão salva. Sincronize templates e brand kits.' : 'Redirecione o cliente para OAuth do Canva.'
      }
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/capcut/export-package', async (req: Request, res: Response) => {
  try {
    const { company_id, content_item_id, roteiro, cenas, legendas, assets } = req.body;
    const companyId = assertCompanyId(company_id);
    const supabase = getSupabaseServiceClient();

    const packageData = {
      roteiro: roteiro || 'Roteiro ainda não informado',
      cenas: cenas || [],
      legendas: legendas || [],
      assets: assets || [],
      instrucoes: [
        'Importe os assets no CapCut.',
        'Use o roteiro como guia de narração ou texto na tela.',
        'Aplique cortes rápidos nos 3 primeiros segundos.',
        'Finalize com CTA claro.'
      ]
    };

    const { data, error } = await supabase.from('content_assets').insert({
      company_id: companyId,
      content_item_id,
      asset_type: 'document',
      metadata: { type: 'capcut_assisted_package', package: packageData }
    }).select('id').single();

    if (error) throw error;
    res.json({ success: true, data: { package_id: data.id, package: packageData } });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/status', async (req: Request, res: Response) => {
  try {
    const companyId = assertCompanyId(req.query.company_id);
    const supabase = getSupabaseServiceClient();
    const [meta, canva] = await Promise.all([
      supabase.from('meta_connections').select('status,last_sync_at').eq('company_id', companyId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('canva_connections').select('status,last_sync_at').eq('company_id', companyId).order('created_at', { ascending: false }).limit(1).maybeSingle()
    ]);

    res.json({
      success: true,
      data: {
        integrations: [
          { id: 'meta-ads', name: 'Meta Ads', status: meta.data?.status || 'disconnected', last_sync: meta.data?.last_sync_at || null, error: meta.error?.message || null },
          { id: 'canva', name: 'Canva', status: canva.data?.status || 'disconnected', last_sync: canva.data?.last_sync_at || null, error: canva.error?.message || null },
          { id: 'capcut', name: 'CapCut', status: 'assisted_export', last_sync: null, error: null }
        ]
      }
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
