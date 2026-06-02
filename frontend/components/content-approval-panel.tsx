'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ApprovalItem {
  id: string;
  content_id: string;
  type: 'carousel' | 'reel' | 'story' | 'feed';
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  preview_url: string;
  caption: string;
  cta: string;
  objective: string;
  neuro_score: number;
  created_at: string;
  created_by: string;
}

interface ContentApprovalPanelProps {
  items: ApprovalItem[];
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onRequestChanges: (id: string, feedback: string) => void;
}

const typeEmojis = {
  carousel: '📸',
  reel: '🎬',
  story: '📱',
  feed: '🖼️'
};

export function ContentApprovalPanel({
  items,
  onApprove,
  onReject,
  onRequestChanges
}: ContentApprovalPanelProps) {
  const pendingItems = items.filter(item => item.status === 'pending');

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>✅ Content Approval Queue</span>
            <span className="bg-blue-100 text-blue-900 px-3 py-1 rounded-full text-sm font-bold">
              {pendingItems.length} Pending
            </span>
          </CardTitle>
          <CardDescription>Review and approve generated content before publishing</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingItems.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500">✨ All content approved! Nothing pending.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingItems.map((item, idx) => (
                <div key={item.id} className="border border-slate-200 rounded-lg overflow-hidden hover:border-slate-300 transition">
                  {/* Header */}
                  <div className="bg-slate-50 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{typeEmojis[item.type]}</span>
                      <div>
                        <h3 className="font-medium text-slate-900">{item.type.toUpperCase()}</h3>
                        <p className="text-xs text-slate-500">
                          by {item.created_by} • {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">{item.neuro_score}</div>
                      <p className="text-xs text-slate-500">Neuro Score</p>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="p-4 bg-white space-y-3">
                    {/* Preview Image */}
                    <div className="bg-slate-100 rounded-lg h-48 overflow-hidden flex items-center justify-center">
                      <div className="text-center text-slate-400">
                        <p>📷 Preview Image</p>
                        <p className="text-xs mt-1">{item.preview_url}</p>
                      </div>
                    </div>

                    {/* Content Details */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-slate-500">Objective</span>
                        <p className="font-medium text-slate-900">{item.objective}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">CTA</span>
                        <p className="font-medium text-slate-900">{item.cta}</p>
                      </div>
                    </div>

                    {/* Caption */}
                    <div>
                      <span className="text-xs text-slate-500">Caption</span>
                      <p className="text-slate-900 text-sm leading-relaxed">{item.caption}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="bg-slate-50 p-4 flex gap-2 justify-end">
                    <button
                      onClick={() => onReject(item.id, 'Not approved')}
                      className="px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 font-medium text-sm transition"
                    >
                      ❌ Reject
                    </button>
                    <button
                      onClick={() => onRequestChanges(item.id, 'Please revise')}
                      className="px-4 py-2 text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 font-medium text-sm transition"
                    >
                      🔄 Changes
                    </button>
                    <button
                      onClick={() => onApprove(item.id)}
                      className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 font-medium text-sm transition"
                    >
                      ✅ Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
