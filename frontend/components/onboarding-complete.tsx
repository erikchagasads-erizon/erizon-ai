'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface OnboardingCompleteProps {
  company_id: string;
  company_name: string;
  account_manager: string;
  next_meeting: string;
}

export function OnboardingComplete({
  company_id,
  company_name,
  account_manager,
  next_meeting
}: OnboardingCompleteProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <Card className="border-2 border-green-200 bg-green-50">
        <CardHeader className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <CardTitle className="text-3xl">Welcome to ERIZON AI!</CardTitle>
          <CardDescription className="text-lg mt-2">
            Your dedicated AI team is ready to accelerate your growth
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Confirmation */}
          <div className="bg-white p-6 rounded-lg border border-green-200">
            <h3 className="font-semibold text-slate-900 mb-4">Onboarding Complete ✅</h3>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Company:</span> {company_name}
              </p>
              <p>
                <span className="font-medium">Company ID:</span> <code className="bg-slate-100 px-2 py-1 rounded">{company_id}</code>
              </p>
              <p>
                <span className="font-medium">Your Account Manager:</span> {account_manager}
              </p>
            </div>
          </div>

          {/* Team Assignment */}
          <div className="bg-white p-6 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-slate-900 mb-4">Your ERIZON AI Team</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-blue-50 rounded">
                <div className="font-medium text-blue-900">🎬 Content Creation</div>
                <div className="text-xs text-blue-700 mt-1">Designer, Motion, Copywriter</div>
              </div>
              <div className="p-3 bg-purple-50 rounded">
                <div className="font-medium text-purple-900">📊 Analytics</div>
                <div className="text-xs text-purple-700 mt-1">BI Analyst, Data Team</div>
              </div>
              <div className="p-3 bg-green-50 rounded">
                <div className="font-medium text-green-900">🚀 Growth</div>
                <div className="text-xs text-green-700 mt-1">Growth IA, Head Growth</div>
              </div>
              <div className="p-3 bg-orange-50 rounded">
                <div className="font-medium text-orange-900">📢 Marketing</div>
                <div className="text-xs text-orange-700 mt-1">CMO IA, Traffic Experts</div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-white p-6 rounded-lg border border-yellow-200">
            <h3 className="font-semibold text-slate-900 mb-4">What Happens Next</h3>
            <ol className="space-y-2 text-sm list-decimal list-inside">
              <li className="text-slate-700">
                <span className="font-medium">Executive Meeting</span> - Strategic alignment & planning
              </li>
              <li className="text-slate-700">
                <span className="font-medium">Content Strategy</span> - Your team creates first content
              </li>
              <li className="text-slate-700">
                <span className="font-medium">Dashboard Activation</span> - Real-time analytics
              </li>
              <li className="text-slate-700">
                <span className="font-medium">First Results</span> - Within 7 days
              </li>
            </ol>
          </div>

          {/* Meeting Reminder */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg">
            <h3 className="font-semibold mb-2">📅 First Executive Meeting</h3>
            <p className="text-sm mb-4 opacity-90">
              {next_meeting}
            </p>
            <p className="text-xs opacity-75">
              Featuring: CEO IA, CMO IA, Head de Branding, Head de Growth
            </p>
          </div>

          {/* CTA */}
          <div className="flex gap-3">
            <Button className="flex-1" variant="outline">
              📖 Read Onboarding Guide
            </Button>
            <Button className="flex-1 bg-green-600 hover:bg-green-700">
              🚀 Go to Dashboard
            </Button>
          </div>

          {/* Support */}
          <div className="text-center p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-600">
              Need help? Email <span className="font-medium">support@erizonai.com</span> or message your CSM directly
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
