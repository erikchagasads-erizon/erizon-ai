import axios, { AxiosInstance } from 'axios';
import { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';
import EncryptionService from './encryption-service';
import { MetaInsightRow } from '../types/meta';

export interface MetaAccountInfo {
  id: string;
  name: string;
  business_name: string;
  currency: string;
  timezone: string;
  campaigns: number;
  ads: number;
  spend: number;
  leads: number;
  roas: number;
}

export interface MetaInsightsSummary {
  spend: number;
  reach: number;
  impressions: number;
  clicks: number;
  leads: number;
  purchases: number;
  purchase_value: number;
  roas: number;
  ctr: number;
  cpc: number;
  cpm: number;
}

export class MetaAdsService {
  private client: AxiosInstance;
  private encryption: EncryptionService;
  private supabase?: SupabaseClient;
  private apiVersion = process.env.META_API_VERSION || 'v20.0';
  private baseUrl = `https://graph.facebook.com/${this.apiVersion}`;

  constructor(encryptionService: EncryptionService, supabase?: SupabaseClient) {
    this.encryption = encryptionService;
    this.supabase = supabase;
    this.client = axios.create({ baseURL: this.baseUrl, timeout: 30000 });
  }

  async validateToken(accessToken: string): Promise<{ valid: boolean; user_id?: string; permissions?: string[]; error?: string }> {
    try {
      logger.info('🔍 Validating Meta access token...');

      const [meResponse, permissionsResponse] = await Promise.all([
        this.client.get('/me', { params: { fields: 'id,name', access_token: accessToken } }),
        this.client.get('/me/permissions', { params: { access_token: accessToken } })
      ]);

      const requiredPermissions = ['ads_read'];
      const recommendedPermissions = [
        'business_management',
        'pages_read_engagement',
        'pages_show_list',
        'instagram_basic',
        'instagram_manage_insights'
      ];
      const grantedPermissions = permissionsResponse.data?.data || [];
      const granted = grantedPermissions
        .filter((p: any) => p.status === 'granted')
        .map((p: any) => p.permission);
      const missingRequired = requiredPermissions.filter((p) => !granted.includes(p));

      return {
        valid: missingRequired.length === 0,
        user_id: meResponse.data.id,
        permissions: granted,
        error: missingRequired.length > 0 ? `Permissões obrigatórias ausentes: ${missingRequired.join(', ')}` : undefined
      };
    } catch (error: any) {
      logger.error('❌ Token validation failed:', error.response?.data || error.message);
      return { valid: false, error: error.response?.data?.error?.message || error.message };
    }
  }

  async validateAdAccount(actId: string, accessToken: string): Promise<{ valid: boolean; account?: MetaAccountInfo; error?: string }> {
    try {
      const accountId = this.normalizeActId(actId);
      logger.info(`🔍 Validating Ad Account: ${accountId}`);

      const response = await this.client.get(`/${accountId}`, {
        params: {
          fields: 'id,account_id,name,currency,timezone_name,account_status,business{name}',
          access_token: accessToken
        }
      });

      const insights = await this.fetchInsights(accountId, accessToken);
      const [campaigns, ads] = await Promise.all([
        this.countEdge(accountId, 'campaigns', accessToken),
        this.countEdge(accountId, 'ads', accessToken)
      ]);

      return {
        valid: true,
        account: {
          id: response.data.id,
          name: response.data.name,
          business_name: response.data.business?.name || 'N/A',
          currency: response.data.currency || 'BRL',
          timezone: response.data.timezone_name || 'America/Sao_Paulo',
          campaigns,
          ads,
          spend: insights.spend,
          leads: insights.leads,
          roas: insights.roas
        }
      };
    } catch (error: any) {
      logger.error('❌ Account validation failed:', error.response?.data || error.message);
      return { valid: false, error: error.response?.data?.error?.message || error.message };
    }
  }

  async fetchInsights(actId: string, accessToken: string, level: 'account' | 'campaign' | 'adset' | 'ad' = 'account'): Promise<MetaInsightsSummary> {
    try {
      const accountId = this.normalizeActId(actId);
      const response = await this.client.get(`/${accountId}/insights`, {
        params: {
          fields: 'date_start,date_stop,spend,reach,impressions,frequency,clicks,inline_link_clicks,ctr,cpc,cpm,actions,action_values,purchase_roas',
          date_preset: 'last_90d',
          level,
          time_increment: level === 'account' ? undefined : 1,
          access_token: accessToken
        }
      });

      return this.summarizeInsights(response.data?.data || []);
    } catch (error: any) {
      logger.error('❌ Failed to fetch insights:', error.response?.data || error.message);
      return this.emptySummary();
    }
  }

  async fetchDailyInsights(actId: string, accessToken: string, level: 'account' | 'campaign' | 'adset' | 'ad' = 'campaign'): Promise<any[]> {
    try {
      const accountId = this.normalizeActId(actId);
      const response = await this.client.get(`/${accountId}/insights`, {
        params: {
          fields: 'campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,date_start,date_stop,spend,reach,impressions,frequency,clicks,inline_link_clicks,ctr,cpc,cpm,actions,action_values,purchase_roas',
          date_preset: 'last_90d',
          level,
          time_increment: 1,
          limit: 500,
          access_token: accessToken
        }
      });
      return response.data?.data || [];
    } catch (error: any) {
      logger.error('❌ Failed to fetch daily insights:', error.response?.data || error.message);
      return [];
    }
  }

  async syncCampaigns(actId: string, accessToken: string, limit: number = 100): Promise<any[]> {
    try {
      const accountId = this.normalizeActId(actId);
      const response = await this.client.get(`/${accountId}/campaigns`, {
        params: {
          fields: 'id,name,status,effective_status,objective,created_time,updated_time,daily_budget,lifetime_budget,start_time,stop_time',
          limit,
          access_token: accessToken
        }
      });
      return response.data?.data || [];
    } catch (error: any) {
      logger.error('❌ Failed to sync campaigns:', error.response?.data || error.message);
      return [];
    }
  }

  async syncAdSets(actId: string, accessToken: string, limit: number = 100): Promise<any[]> {
    try {
      const accountId = this.normalizeActId(actId);
      const response = await this.client.get(`/${accountId}/adsets`, {
        params: {
          fields: 'id,name,campaign_id,status,effective_status,optimization_goal,billing_event,bid_strategy,daily_budget,lifetime_budget,targeting',
          limit,
          access_token: accessToken
        }
      });
      return response.data?.data || [];
    } catch (error: any) {
      logger.error('❌ Failed to sync adsets:', error.response?.data || error.message);
      return [];
    }
  }

  async syncAds(actId: string, accessToken: string, limit: number = 100): Promise<any[]> {
    try {
      const accountId = this.normalizeActId(actId);
      const response = await this.client.get(`/${accountId}/ads`, {
        params: {
          fields: 'id,name,campaign_id,adset_id,creative{id,name,title,body,image_url,video_id,object_story_spec},status,effective_status',
          limit,
          access_token: accessToken
        }
      });
      return response.data?.data || [];
    } catch (error: any) {
      logger.error('❌ Failed to sync ads:', error.response?.data || error.message);
      return [];
    }
  }

  async saveConnection(companyId: string, accessToken: string, actId: string, account: MetaAccountInfo, userId?: string): Promise<string | null> {
    if (!this.supabase) throw new Error('Supabase client is required to save Meta connection');

    const encrypted = this.encryption.encrypt(accessToken);
    const tokenPayload = JSON.stringify(encrypted);

    const { data: connection, error: connectionError } = await this.supabase
      .from('meta_connections')
      .insert({
        company_id: companyId,
        connected_by: userId,
        status: 'connected',
        access_token_encrypted: tokenPayload,
        scopes: ['ads_read'],
        last_sync_at: new Date().toISOString(),
        metadata: { account }
      })
      .select('id')
      .single();

    if (connectionError) throw connectionError;

    const { error: accountError } = await this.supabase.from('meta_ad_accounts').upsert({
      company_id: companyId,
      connection_id: connection.id,
      external_id: account.id,
      act_id: this.normalizeActId(actId),
      name: account.name,
      currency: account.currency,
      timezone_name: account.timezone,
      metadata: account
    });

    if (accountError) throw accountError;
    return connection.id;
  }

  async syncToDatabase(companyId: string, actId: string, accessToken: string): Promise<{ campaigns: number; adsets: number; ads: number; insights: number }> {
    if (!this.supabase) throw new Error('Supabase client is required to sync Meta data');

    const accountId = this.normalizeActId(actId);
    const { data: account } = await this.supabase
      .from('meta_ad_accounts')
      .select('id')
      .eq('company_id', companyId)
      .eq('act_id', accountId)
      .single();

    const campaigns = await this.syncCampaigns(accountId, accessToken);
    const adsets = await this.syncAdSets(accountId, accessToken);
    const ads = await this.syncAds(accountId, accessToken);
    const insights = await this.fetchDailyInsights(accountId, accessToken, 'campaign');

    if (campaigns.length > 0) {
      await this.supabase.from('meta_campaigns').upsert(campaigns.map((c) => ({
        company_id: companyId,
        ad_account_id: account?.id,
        external_id: c.id,
        name: c.name,
        objective: c.objective,
        status: c.status,
        effective_status: c.effective_status,
        daily_budget: c.daily_budget ? Number(c.daily_budget) / 100 : null,
        lifetime_budget: c.lifetime_budget ? Number(c.lifetime_budget) / 100 : null,
        start_time: c.start_time,
        stop_time: c.stop_time,
        raw_data: c
      })));
    }

    const { data: savedCampaigns } = await this.supabase.from('meta_campaigns').select('id,external_id').eq('company_id', companyId);
    const campaignMap = new Map((savedCampaigns || []).map((c: any) => [c.external_id, c.id]));

    if (adsets.length > 0) {
      await this.supabase.from('meta_adsets').upsert(adsets.map((a) => ({
        company_id: companyId,
        campaign_id: campaignMap.get(a.campaign_id),
        external_id: a.id,
        name: a.name,
        optimization_goal: a.optimization_goal,
        billing_event: a.billing_event,
        bid_strategy: a.bid_strategy,
        status: a.status,
        effective_status: a.effective_status,
        daily_budget: a.daily_budget ? Number(a.daily_budget) / 100 : null,
        lifetime_budget: a.lifetime_budget ? Number(a.lifetime_budget) / 100 : null,
        targeting: a.targeting || {},
        raw_data: a
      })));
    }

    const { data: savedAdsets } = await this.supabase.from('meta_adsets').select('id,external_id').eq('company_id', companyId);
    const adsetMap = new Map((savedAdsets || []).map((a: any) => [a.external_id, a.id]));

    if (ads.length > 0) {
      await this.supabase.from('meta_ads').upsert(ads.map((ad) => ({
        company_id: companyId,
        campaign_id: campaignMap.get(ad.campaign_id),
        adset_id: adsetMap.get(ad.adset_id),
        external_id: ad.id,
        creative_id: ad.creative?.id,
        name: ad.name,
        status: ad.status,
        effective_status: ad.effective_status,
        raw_data: ad
      })));

      const creatives = ads.filter((ad) => ad.creative?.id).map((ad) => ({
        company_id: companyId,
        external_id: ad.creative.id,
        name: ad.creative.name,
        body: ad.creative.body,
        title: ad.creative.title,
        image_url: ad.creative.image_url,
        video_id: ad.creative.video_id,
        object_story_spec: ad.creative.object_story_spec || {},
        raw_data: ad.creative
      }));
      if (creatives.length > 0) await this.supabase.from('meta_creatives').upsert(creatives);
    }

    if (insights.length > 0) {
      await this.supabase.from('meta_insights_daily').insert(insights.map((row: any) => this.toInsightRecord(companyId, account?.id, row, 'campaign', campaignMap)));
    }

    return { campaigns: campaigns.length, adsets: adsets.length, ads: ads.length, insights: insights.length };
  }

  async getRecommendations(actId: string, accessToken: string): Promise<{ opportunities: string[]; bottlenecks: string[]; recommendations: string[] }> {
    const insights = await this.fetchInsights(actId, accessToken);
    const campaigns = await this.syncCampaigns(actId, accessToken, 100);

    const opportunities: string[] = [];
    const bottlenecks: string[] = [];
    const recommendations: string[] = [];

    if (insights.roas > 3) opportunities.push('Existe potencial de escala: ROAS acima de 3 nos últimos 90 dias.');
    if (insights.ctr > 1.5) opportunities.push('CTR saudável: criativos podem ser usados como referência para variações.');
    if (insights.roas > 0 && insights.roas < 2) bottlenecks.push('ROAS abaixo do ideal para escala segura.');
    if (insights.cpc > 0 && insights.ctr < 1) bottlenecks.push('CTR baixo com CPC ativo: revisar promessa, criativo e público.');
    if (insights.spend > 0 && insights.leads === 0) bottlenecks.push('Investimento sem leads detectados. Revisar evento, formulário ou landing page.');

    const activeCampaigns = campaigns.filter((c: any) => c.effective_status === 'ACTIVE' || c.status === 'ACTIVE');
    if (activeCampaigns.length < campaigns.length) opportunities.push(`${campaigns.length - activeCampaigns.length} campanhas não ativas podem conter aprendizados reaproveitáveis.`);

    recommendations.push('Criar 3 variações de criativo para os anúncios com CTR abaixo da média.');
    recommendations.push('Separar análise por campanha, conjunto e anúncio antes de escalar orçamento.');
    recommendations.push('Monitorar frequência e pausar criativos com fadiga acima do limite definido.');

    return { opportunities, bottlenecks, recommendations };
  }

  normalizeActId(actId: string): string {
    const clean = String(actId || '').replace('act_', '').trim();
    return `act_${clean}`;
  }

  private async countEdge(accountId: string, edge: 'campaigns' | 'ads', accessToken: string): Promise<number> {
    try {
      const response = await this.client.get(`/${accountId}/${edge}`, {
        params: { fields: 'id', limit: 1, summary: true, access_token: accessToken }
      });
      return response.data?.summary?.total_count || 0;
    } catch {
      return 0;
    }
  }

  private summarizeInsights(rows: MetaInsightRow[]): MetaInsightsSummary {
    const summary = this.emptySummary();

    for (const row of rows) {
      summary.spend += Number(row.spend || 0);
      summary.reach += Number(row.reach || 0);
      summary.impressions += Number(row.impressions || 0);
      summary.clicks += Number(row.clicks || 0);
      summary.leads += this.actionValue(row.actions, ['lead', 'onsite_conversion.lead_grouped', 'offsite_conversion.fb_pixel_lead']);
      summary.purchases += this.actionValue(row.actions, ['purchase', 'omni_purchase', 'offsite_conversion.fb_pixel_purchase']);
      summary.purchase_value += this.actionValue(row.action_values, ['purchase', 'omni_purchase', 'offsite_conversion.fb_pixel_purchase']);
    }

    summary.ctr = summary.impressions > 0 ? (summary.clicks / summary.impressions) * 100 : 0;
    summary.cpc = summary.clicks > 0 ? summary.spend / summary.clicks : 0;
    summary.cpm = summary.impressions > 0 ? (summary.spend / summary.impressions) * 1000 : 0;
    summary.roas = summary.spend > 0 ? summary.purchase_value / summary.spend : this.roasValue(rows);
    return summary;
  }

  private toInsightRecord(companyId: string, adAccountId: string | undefined, row: any, level: string, campaignMap: Map<any, any>): any {
    const leads = this.actionValue(row.actions, ['lead', 'onsite_conversion.lead_grouped', 'offsite_conversion.fb_pixel_lead']);
    const purchases = this.actionValue(row.actions, ['purchase', 'omni_purchase', 'offsite_conversion.fb_pixel_purchase']);
    const purchaseValue = this.actionValue(row.action_values, ['purchase', 'omni_purchase', 'offsite_conversion.fb_pixel_purchase']);
    const spend = Number(row.spend || 0);

    return {
      company_id: companyId,
      ad_account_id: adAccountId,
      campaign_id: campaignMap.get(row.campaign_id),
      date_start: row.date_start,
      date_stop: row.date_stop,
      level,
      spend,
      impressions: Number(row.impressions || 0),
      reach: Number(row.reach || 0),
      frequency: Number(row.frequency || 0),
      clicks: Number(row.clicks || 0),
      inline_link_clicks: Number(row.inline_link_clicks || 0),
      ctr: Number(row.ctr || 0),
      cpc: Number(row.cpc || 0),
      cpm: Number(row.cpm || 0),
      leads,
      purchases,
      purchase_value: purchaseValue,
      roas: spend > 0 ? purchaseValue / spend : 0,
      actions: row.actions || [],
      raw_data: row
    };
  }

  private actionValue(actions: any[] | undefined, names: string[]): number {
    if (!Array.isArray(actions)) return 0;
    return actions
      .filter((action) => names.includes(action.action_type))
      .reduce((sum, action) => sum + Number(action.value || 0), 0);
  }

  private roasValue(rows: MetaInsightRow[]): number {
    const values = rows.flatMap((row) => row.purchase_roas || []).map((item) => Number(item.value || 0));
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private emptySummary(): MetaInsightsSummary {
    return { spend: 0, reach: 0, impressions: 0, clicks: 0, leads: 0, purchases: 0, purchase_value: 0, roas: 0, ctr: 0, cpc: 0, cpm: 0 };
  }
}

export default MetaAdsService;
