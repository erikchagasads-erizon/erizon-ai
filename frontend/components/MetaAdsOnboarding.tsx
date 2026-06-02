import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, AlertCircle, Copy } from 'lucide-react';

type OnboardingStep = 'presentation' | 'token' | 'act_id' | 'validation' | 'summary' | 'authorization';

interface MetaAccountInfo {
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

export function MetaAdsOnboarding({ companyId }: { companyId?: string }) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('presentation');
  const [accessToken, setAccessToken] = useState('');
  const [actId, setActId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountInfo, setAccountInfo] = useState<MetaAccountInfo | null>(null);
  const [allowMonitoring, setAllowMonitoring] = useState(true);

  const handleTokenSubmit = async () => {
    if (!accessToken) {
      setError('Por favor, informe seu access token');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/integrations/meta-ads/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: accessToken })
      });

      if (!response.ok) {
        throw new Error('Token inválido');
      }

      setCurrentStep('act_id');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao validar token');
    } finally {
      setLoading(false);
    }
  };

  const handleActIdSubmit = async () => {
    if (!actId) {
      setError('Por favor, informe seu Act ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/integrations/meta-ads/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: accessToken, act_id: actId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Act ID inválido');
      }

      setAccountInfo(data.data.account);
      setCurrentStep('summary');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao validar conta');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorizationComplete = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/integrations/meta-ads/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId || localStorage.getItem('erizon_company_id') || '',
          access_token: accessToken,
          act_id: actId,
          allow_monitoring: allowMonitoring
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao autorizar');
      }

      setCurrentStep('summary');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao autorizar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {[
            { step: 'presentation', label: 'Apresentação' },
            { step: 'token', label: 'Token' },
            { step: 'act_id', label: 'Act ID' },
            { step: 'validation', label: 'Validação' },
            { step: 'summary', label: 'Resumo' },
            { step: 'authorization', label: 'Autorização' }
          ].map((item, index) => (
            <div key={item.step} className="flex items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                  currentStep === item.step
                    ? 'bg-blue-500 text-white'
                    : ['presentation', 'token', 'act_id', 'validation', 'summary', 'authorization'].indexOf(
                        item.step
                      ) <
                      [
                        'presentation',
                        'token',
                        'act_id',
                        'validation',
                        'summary',
                        'authorization'
                      ].indexOf(currentStep)
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {index + 1}
              </div>
              {index < 5 && <div className="h-1 flex-1 mx-2 bg-gray-200" />}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <Card>
        {/* Step 1: Presentation */}
        {currentStep === 'presentation' && (
          <>
            <CardHeader>
              <CardTitle>📘 Conectar Meta Ads</CardTitle>
              <CardDescription>
                Vamos configurar sua conta Meta Ads para análises avançadas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">O que a ERIZON poderá analisar:</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'Campanhas',
                    'Conjuntos de anúncios',
                    'Anúncios',
                    'Criativos',
                    'Leads',
                    'Conversões',
                    'CTR',
                    'CPC',
                    'CPM',
                    'Frequência',
                    'ROAS',
                    'CAC',
                    'Receita estimada',
                    'Tendências de crescimento',
                    'Oportunidades ocultas',
                    'Gargalos de performance'
                  ].map((item) => (
                    <div key={item} className="flex items-center">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  ✅ Nenhuma alteração será realizada em sua conta sem autorização.
                  <br />
                  ✅ A ERIZON utilizará acesso somente para leitura e análise estratégica.
                </AlertDescription>
              </Alert>

              <Button size="lg" className="w-full" onClick={() => setCurrentStep('token')}>
                Continuar para o Token
              </Button>
            </CardContent>
          </>
        )}

        {/* Step 2: Token */}
        {currentStep === 'token' && (
          <>
            <CardHeader>
              <CardTitle>🔑 Seu Access Token Meta</CardTitle>
              <CardDescription>Cole abaixo seu Meta Access Token</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Access Token</label>
                <Input
                  type="password"
                  placeholder="Colar seu token aqui..."
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  className="font-mono"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <h4 className="font-semibold text-sm mb-3">Como obter seu token:</h4>
                <ol className="text-sm space-y-2 list-decimal list-inside">
                  <li>Acesse Meta Developers (developers.facebook.com)</li>
                  <li>Gere um User Access Token</li>
                  <li>Selecione estas permissões:</li>
                </ol>
                <div className="mt-3 bg-white rounded p-2 space-y-1 text-xs font-mono">
                  <div>• ads_read</div>
                  <div>• business_management</div>
                  <div>• read_insights</div>
                  <div>• pages_read_engagement</div>
                  <div>• pages_show_list</div>
                  <div>• instagram_basic</div>
                  <div>• instagram_manage_insights</div>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setCurrentStep('presentation')}>
                  Voltar
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleTokenSubmit}
                  disabled={loading || !accessToken}
                >
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Validar Token
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {/* Step 3: Act ID */}
        {currentStep === 'act_id' && (
          <>
            <CardHeader>
              <CardTitle>🔢 ID da Conta de Anúncios</CardTitle>
              <CardDescription>Informe o ID da sua conta de anúncios</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Act ID</label>
                <Input
                  placeholder="act_123456789012345"
                  value={actId}
                  onChange={(e) => setActId(e.target.value.toUpperCase())}
                  className="font-mono"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded p-4 text-sm">
                <p className="font-semibold mb-2">Onde encontrar seu Act ID:</p>
                <p>
                  Acesse Ads Manager → Configurações da conta → Informações da conta.
                  <br />
                  Será algo como: <code className="bg-white px-2 py-1 rounded">act_123456789012345</code>
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setCurrentStep('token')}>
                  Voltar
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleActIdSubmit}
                  disabled={loading || !actId}
                >
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Validar Conta
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {/* Step 4: Validation */}
        {currentStep === 'validation' && (
          <>
            <CardHeader>
              <CardTitle>⏳ Validando Conta...</CardTitle>
              <CardDescription>Estamos verificando as permissões e dados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
              <p className="text-center text-sm text-gray-600">
                Por favor, aguarde enquanto validamos sua conta...
              </p>
            </CardContent>
          </>
        )}

        {/* Step 5: Summary */}
        {currentStep === 'summary' && accountInfo && (
          <>
            <CardHeader>
              <CardTitle>✅ Conta Detectada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded p-4">
                  <p className="text-sm text-gray-600">Business</p>
                  <p className="font-semibold">{accountInfo.business_name}</p>
                </div>
                <div className="bg-gray-50 rounded p-4">
                  <p className="text-sm text-gray-600">Conta</p>
                  <p className="font-semibold">{accountInfo.name}</p>
                </div>
                <div className="bg-gray-50 rounded p-4">
                  <p className="text-sm text-gray-600">Moeda</p>
                  <p className="font-semibold">{accountInfo.currency}</p>
                </div>
                <div className="bg-gray-50 rounded p-4">
                  <p className="text-sm text-gray-600">Fuso Horário</p>
                  <p className="font-semibold">{accountInfo.timezone}</p>
                </div>
                <div className="bg-gray-50 rounded p-4">
                  <p className="text-sm text-gray-600">Campanhas</p>
                  <p className="font-semibold">{accountInfo.campaigns}</p>
                </div>
                <div className="bg-gray-50 rounded p-4">
                  <p className="text-sm text-gray-600">Anúncios</p>
                  <p className="font-semibold">{accountInfo.ads}</p>
                </div>
                <div className="bg-gray-50 rounded p-4">
                  <p className="text-sm text-gray-600">Investimento (90 dias)</p>
                  <p className="font-semibold">R$ {accountInfo.spend.toLocaleString('pt-BR')}</p>
                </div>
                <div className="bg-gray-50 rounded p-4">
                  <p className="text-sm text-gray-600">Leads</p>
                  <p className="font-semibold">{accountInfo.leads}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setCurrentStep('act_id')}>
                  Voltar
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => setCurrentStep('authorization')}
                >
                  Continuar
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {/* Step 6: Authorization */}
        {currentStep === 'authorization' && (
          <>
            <CardHeader>
              <CardTitle>🔐 Autorizar Monitoramento</CardTitle>
              <CardDescription>
                Permita que a ERIZON monitore continuamente sua conta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <p className="font-semibold mb-3">A ERIZON poderá gerar:</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                    Alertas automáticos
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                    Insights diários
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                    Relatórios semanais
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                    Recomendações de otimização
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                    Detecção de desperdício de verba
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                    Oportunidades de escala
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowMonitoring}
                    onChange={(e) => setAllowMonitoring(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="ml-2 text-sm">Desejo permitir monitoramento contínuo</span>
                </label>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setCurrentStep('summary')}>
                  Voltar
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleAuthorizationComplete}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Concluir Conexão
                </Button>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}

export default MetaAdsOnboarding;
