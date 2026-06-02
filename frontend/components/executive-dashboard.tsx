'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface KPICard {
  title: string;
  value: string | number;
  change: number;
  icon: string;
  color: 'blue' | 'green' | 'orange' | 'red' | 'purple';
}

interface ExecutiveDashboardProps {
  kpis: KPICard[];
  alerts: any[];
  opportunities: any[];
}

const colorClasses = {
  blue: 'bg-blue-50 border-blue-200',
  green: 'bg-green-50 border-green-200',
  orange: 'bg-orange-50 border-orange-200',
  red: 'bg-red-50 border-red-200',
  purple: 'bg-purple-50 border-purple-200'
};

const textColorClasses = {
  blue: 'text-blue-900',
  green: 'text-green-900',
  orange: 'text-orange-900',
  red: 'text-red-900',
  purple: 'text-purple-900'
};

export function ExecutiveDashboard({ kpis, alerts, opportunities }: ExecutiveDashboardProps) {
  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-slate-600';
  };

  const getChangeArrow = (change: number) => {
    if (change > 0) return '↑';
    if (change < 0) return '↓';
    return '→';
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <Card key={idx} className={`border ${colorClasses[kpi.color]}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                {kpi.icon} {kpi.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{kpi.value}</div>
              <p className={`text-xs font-medium mt-1 ${getChangeColor(kpi.change)}`}>
                {getChangeArrow(kpi.change)} {Math.abs(kpi.change)}% vs last period
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerts and Opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Critical Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>⚠️</span>
              Critical Alerts
            </CardTitle>
            <CardDescription>Immediate action required</CardDescription>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <p className="text-slate-500 text-sm">✅ No alerts. System running smoothly.</p>
            ) : (
              <div className="space-y-2">
                {alerts.map((alert, idx) => (
                  <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="font-medium text-red-900 text-sm">{alert.title}</h4>
                    <p className="text-xs text-red-700 mt-1">{alert.description}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Opportunities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>💡</span>
              Detected Opportunities
            </CardTitle>
            <CardDescription>AI-suggested growth actions</CardDescription>
          </CardHeader>
          <CardContent>
            {opportunities.length === 0 ? (
              <p className="text-slate-500 text-sm">Analyzing data for opportunities...</p>
            ) : (
              <div className="space-y-2">
                {opportunities.map((opp, idx) => (
                  <div key={idx} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-900 text-sm">{opp.title}</h4>
                    <p className="text-xs text-green-700 mt-1">{opp.description}</p>
                    <p className="text-xs text-green-600 font-medium mt-2">
                      Potential impact: {opp.impact}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>⚡ Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button className="p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-center text-sm font-medium text-blue-900 transition">
              Generate Content
            </button>
            <button className="p-3 bg-green-50 hover:bg-green-100 rounded-lg text-center text-sm font-medium text-green-900 transition">
              Review Analytics
            </button>
            <button className="p-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-center text-sm font-medium text-purple-900 transition">
              Schedule Meeting
            </button>
            <button className="p-3 bg-orange-50 hover:bg-orange-100 rounded-lg text-center text-sm font-medium text-orange-900 transition">
              Adjust Strategy
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
