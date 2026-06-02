'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, BarChart } from 'recharts';

interface AnalyticsDashboardProps {
  metrics: any;
  topContent: any[];
  audience: any;
}

export function AnalyticsDashboard({ metrics, topContent, audience }: AnalyticsDashboardProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-slate-600';
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Reach"
          value={formatNumber(metrics.reach)}
          change={metrics.reach_change}
          icon="📍"
        />
        <MetricCard
          title="Impressions"
          value={formatNumber(metrics.impressions)}
          change={metrics.impressions_change}
          icon="👁️"
        />
        <MetricCard
          title="Engagement Rate"
          value={metrics.engagement_rate + '%'}
          change={metrics.engagement_rate_change}
          icon="💬"
        />
        <MetricCard
          title="Followers Gained"
          value={metrics.followers_gained}
          change={metrics.followers_gained_change}
          icon="👥"
        />
      </div>

      {/* Platform Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>📱 Performance by Platform</CardTitle>
          <CardDescription>Comparing metrics across your active channels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(metrics.by_platform).map(([platform, data]: [string, any]) => (
              <div key={platform} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-xl">
                    {platform === 'instagram' && '📸'}
                    {platform === 'facebook' && '👍'}
                    {platform === 'linkedin' && '💼'}
                  </span>
                  <div>
                    <h4 className="font-medium capitalize text-slate-900">{platform}</h4>
                    <p className="text-xs text-slate-500">
                      {data.reach.toLocaleString()} reach • {data.engagement_rate}% engagement
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">{data.followers_gained}</div>
                  <p className="text-xs text-green-600">followers gained</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Content */}
      <Card>
        <CardHeader>
          <CardTitle>🏆 Top Performing Content</CardTitle>
          <CardDescription>Your best-performing pieces this period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topContent.map((content, idx) => (
              <div key={idx} className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {content.type}
                      </span>
                      <h4 className="font-medium text-slate-900">{content.title}</h4>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      📍 {formatNumber(content.reach)} reach • 💬 {content.engagement} engagements
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">{content.engagement_rate}%</div>
                    <p className="text-xs text-slate-500">engagement rate</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Audience Insights */}
      <Card>
        <CardHeader>
          <CardTitle>👤 Audience Insights</CardTitle>
          <CardDescription>Who is engaging with your content</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Age Groups */}
            <div>
              <h4 className="font-medium text-slate-900 mb-3">Age Distribution</h4>
              <div className="space-y-2">
                {audience.demographics.age_groups.map((group: any, idx: number) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">{group.range}</span>
                      <span className="font-medium">{group.percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${group.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gender */}
            <div>
              <h4 className="font-medium text-slate-900 mb-3">Gender</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>♂️ Male</span>
                  <span className="font-medium">{audience.demographics.gender.male}%</span>
                </div>
                <div className="flex justify-between">
                  <span>♀️ Female</span>
                  <span className="font-medium">{audience.demographics.gender.female}%</span>
                </div>
                <div className="flex justify-between">
                  <span>⚖️ Other</span>
                  <span className="font-medium">{audience.demographics.gender.other}%</span>
                </div>
              </div>
            </div>

            {/* Top Interests */}
            <div>
              <h4 className="font-medium text-slate-900 mb-3">Top Interests</h4>
              <div className="flex flex-wrap gap-2">
                {audience.interests.map((interest: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ title, value, change, icon }: any) {
  const changeColor = change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-slate-600';

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-slate-500 text-sm">{title}</p>
            <div className="mt-2">
              <div className="text-2xl font-bold text-slate-900">{value}</div>
              <p className={`text-xs font-medium mt-1 ${changeColor}`}>
                {change > 0 ? '↑' : change < 0 ? '↓' : '→'} {Math.abs(change)}%
              </p>
            </div>
          </div>
          <div className="text-3xl">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
