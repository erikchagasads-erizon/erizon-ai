'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AIQueryProps {
  companyId: string;
}

export function AIQueryPanel({ companyId }: AIQueryProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);

  const handleQuery = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: query,
          company_id: companyId
        })
      });

      const data = await res.json();
      setResponse(data.data);
    } catch (error) {
      console.error('Query failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>🤖 Ask ERIZON AI</CardTitle>
        <CardDescription>
          Query your data with AI-powered insights
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question about your business..."
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <Button onClick={handleQuery} disabled={loading}>
            {loading ? 'Thinking...' : 'Ask'}
          </Button>
        </div>

        {response && (
          <div className="p-4 bg-slate-50 rounded-lg space-y-3">
            <div>
              <h4 className="font-medium mb-2">Answer</h4>
              <p className="text-slate-700">{response.answer}</p>
            </div>

            {response.sources && response.sources.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Sources</h4>
                <ul className="text-sm space-y-1">
                  {response.sources.map((source: any, idx: number) => (
                    <li key={idx} className="text-slate-600">
                      📄 {source.text.substring(0, 100)}...
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="text-xs text-slate-500">
              Confidence: {(response.confidence * 100).toFixed(0)}%
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
