'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface OnboardingStepProps {
  step: number;
  total_steps: number;
  title: string;
  description: string;
  on_complete: (data: any) => void;
}

export function OnboardingForm({ step, total_steps, title, description, on_complete }: OnboardingStepProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>({});

  const handleInputChange = (field: string, value: any) => {
    setData({ ...data, [field]: value });
  };

  const handleNext = () => {
    setLoading(true);
    setTimeout(() => {
      on_complete(data);
      setLoading(false);
    }, 1000);
  };

  const progress_percentage = (step / total_steps) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progress_percentage}%` }}
            ></div>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Step {step} of {total_steps}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 1 && <Step1CompanyData data={data} onChange={handleInputChange} />}
        {step === 2 && <Step2MarketData data={data} onChange={handleInputChange} />}
        {step === 3 && <Step3GoalsData data={data} onChange={handleInputChange} />}

        <div className="flex gap-3 justify-end">
          <Button variant="outline" disabled={loading}>
            Back
          </Button>
          <Button onClick={handleNext} disabled={loading}>
            {loading ? 'Processing...' : step === total_steps ? 'Complete' : 'Next'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Step1CompanyData({ data, onChange }: any) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium">Company Name</label>
        <input
          type="text"
          placeholder="Your company name"
          className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={data.name || ''}
          onChange={(e) => onChange('name', e.target.value)}
        />
      </div>

      <div>
        <label className="text-sm font-medium">Website</label>
        <input
          type="url"
          placeholder="https://example.com"
          className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={data.website || ''}
          onChange={(e) => onChange('website', e.target.value)}
        />
      </div>

      <div>
        <label className="text-sm font-medium">Instagram</label>
        <input
          type="text"
          placeholder="@yourcompany"
          className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={data.instagram || ''}
          onChange={(e) => onChange('instagram', e.target.value)}
        />
      </div>

      <div>
        <label className="text-sm font-medium">Description</label>
        <textarea
          placeholder="Brief description of your business"
          className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          value={data.description || ''}
          onChange={(e) => onChange('description', e.target.value)}
        />
      </div>
    </div>
  );
}

function Step2MarketData({ data, onChange }: any) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium">Market Segment</label>
        <input
          type="text"
          placeholder="e.g., SaaS, E-commerce, Services"
          className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={data.segment || ''}
          onChange={(e) => onChange('segment', e.target.value)}
        />
      </div>

      <div>
        <label className="text-sm font-medium">Niche/Specialty</label>
        <input
          type="text"
          placeholder="What makes you unique?"
          className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={data.niche || ''}
          onChange={(e) => onChange('niche', e.target.value)}
        />
      </div>

      <div>
        <label className="text-sm font-medium">Geographic Region</label>
        <input
          type="text"
          placeholder="Where do you operate?"
          className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={data.region || ''}
          onChange={(e) => onChange('region', e.target.value)}
        />
      </div>

      <div>
        <label className="text-sm font-medium">Target Personas</label>
        <textarea
          placeholder="Describe your ideal customers..."
          className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          value={data.personas || ''}
          onChange={(e) => onChange('personas', e.target.value)}
        />
      </div>
    </div>
  );
}

function Step3GoalsData({ data, onChange }: any) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium">Short-term Goals (3 months)</label>
        <textarea
          placeholder="What do you want to achieve in 3 months?"
          className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={2}
          value={data.short_term || ''}
          onChange={(e) => onChange('short_term', e.target.value)}
        />
      </div>

      <div>
        <label className="text-sm font-medium">Medium-term Goals (6 months)</label>
        <textarea
          placeholder="Goals for 6 months ahead?"
          className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={2}
          value={data.medium_term || ''}
          onChange={(e) => onChange('medium_term', e.target.value)}
        />
      </div>

      <div>
        <label className="text-sm font-medium">Long-term Vision (1 year+)</label>
        <textarea
          placeholder="Your long-term vision..."
          className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={2}
          value={data.long_term || ''}
          onChange={(e) => onChange('long_term', e.target.value)}
        />
      </div>

      <div>
        <label className="text-sm font-medium">Key Metrics (Leads, Sales, Revenue)</label>
        <input
          type="text"
          placeholder="e.g., 100 leads/month, $50k revenue"
          className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={data.kpis || ''}
          onChange={(e) => onChange('kpis', e.target.value)}
        />
      </div>
    </div>
  );
}
