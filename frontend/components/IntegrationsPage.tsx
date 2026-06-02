import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  connected: boolean;
  lastSync?: string;
  category: string;
}

export function IntegrationsPageComponent() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/integrations');
      const data = await response.json();
      setIntegrations(data.data.integrations);
    } catch (error) {
      console.error('Failed to fetch integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      connected: 'bg-green-100 text-green-800',
      disconnected: 'bg-gray-100 text-gray-800',
      error: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };

    const labels: Record<string, string> = {
      connected: 'Conectado',
      disconnected: 'Desconectado',
      error: 'Erro',
      pending: 'Pendente'
    };

    return (
      <Badge className={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Integrações</h1>
        <p className="text-gray-600 mt-2">
          Conecte ferramentas externas para potencializar a ERIZON
        </p>
      </div>

      {/* Category Groups */}
      <div className="space-y-8">
        {/* Advertising */}
        <div>
          <h2 className="text-xl font-semibold mb-4">📢 Publicidade</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations
              .filter((i) => i.category === 'advertising')
              .map((integration) => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  onSelect={() => setSelectedIntegration(integration.id)}
                  getStatusIcon={getStatusIcon}
                  getStatusBadge={getStatusBadge}
                />
              ))}
          </div>
        </div>

        {/* Design */}
        <div>
          <h2 className="text-xl font-semibold mb-4">🎨 Design</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations
              .filter((i) => i.category === 'design')
              .map((integration) => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  onSelect={() => setSelectedIntegration(integration.id)}
                  getStatusIcon={getStatusIcon}
                  getStatusBadge={getStatusBadge}
                />
              ))}
          </div>
        </div>

        {/* Video */}
        <div>
          <h2 className="text-xl font-semibold mb-4">🎬 Vídeo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations
              .filter((i) => i.category === 'video')
              .map((integration) => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  onSelect={() => setSelectedIntegration(integration.id)}
                  getStatusIcon={getStatusIcon}
                  getStatusBadge={getStatusBadge}
                />
              ))}
          </div>
        </div>
      </div>

      {/* Help Section */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Todas as credenciais são criptografadas com AES-256. Nenhum token é armazenado em texto puro.
          Você pode desconectar a qualquer momento.
        </AlertDescription>
      </Alert>
    </div>
  );
}

interface IntegrationCardProps {
  integration: Integration;
  onSelect: () => void;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusBadge: (status: string) => React.ReactNode;
}

function IntegrationCard({
  integration,
  onSelect,
  getStatusIcon,
  getStatusBadge
}: IntegrationCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onSelect}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-3xl mb-2">{integration.icon}</div>
            <CardTitle>{integration.name}</CardTitle>
          </div>
          {getStatusIcon(integration.status)}
        </div>
        <CardDescription>{integration.description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Status:</span>
          {getStatusBadge(integration.status)}
        </div>

        {integration.lastSync && (
          <div className="text-xs text-gray-500">
            Última sincronização: {new Date(integration.lastSync).toLocaleString('pt-BR')}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {integration.connected ? (
            <>
              <Button variant="outline" size="sm" className="flex-1">
                Testar
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                Desconectar
              </Button>
            </>
          ) : (
            <Button size="sm" className="w-full">
              Conectar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default IntegrationsPageComponent;
