'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface NeuroScoreProps {
  score: number;
  breakdown: {
    attention: number;
    contrast: number;
    emotion: number;
    curiosity: number;
    memorization: number;
    scannability: number;
    visualReading: number;
    retention: number;
  };
  engagementPotential: 'very_high' | 'high' | 'medium' | 'low';
  suggestions: string[];
}

export function NeuroScoreCard({ score, breakdown, engagementPotential, suggestions }: NeuroScoreProps) {
  const getScoreColor = (value: number) => {
    if (value >= 80) return 'text-green-500';
    if (value >= 60) return 'text-yellow-500';
    if (value >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getEngagementColor = (potential: string) => {
    switch (potential) {
      case 'very_high':
        return 'bg-green-100 text-green-800';
      case 'high':
        return 'bg-blue-100 text-blue-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-red-100 text-red-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>🧠 Neuro Score</span>
          <span className={`text-3xl font-bold ${getScoreColor(score)}`}>
            {score}
          </span>
        </CardTitle>
        <CardDescription>
          AI-powered content analysis based on neuroscience principles
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Engagement Potential */}
        <div className="flex items-center justify-between">
          <span className="font-medium">Engagement Potential</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEngagementColor(engagementPotential)}`}>
            {engagementPotential.replace('_', ' ')}
          </span>
        </div>

        {/* Breakdown Grid */}
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(breakdown).map(([key, value]) => (
            <div key={key} className="p-2 bg-slate-100 rounded">
              <div className="text-xs font-medium text-slate-600">
                {key.replace(/([A-Z])/g, ' $1').title()}
              </div>
              <div className="text-lg font-bold text-slate-900">{value.toFixed(1)}</div>
              <div className="w-full bg-slate-300 rounded-full h-1 mt-1">
                <div
                  className="bg-blue-500 h-1 rounded-full"
                  style={{ width: `${(value / 10) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-sm mb-2">💡 Suggestions for Improvement</h4>
            <ul className="text-sm space-y-1">
              {suggestions.map((suggestion, idx) => (
                <li key={idx} className="text-slate-700">
                  • {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
