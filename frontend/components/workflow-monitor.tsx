'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface WorkflowEvent {
  agent: string;
  action: string;
  timestamp: string;
  status: 'pending' | 'active' | 'completed';
}

interface WorkflowMonitorProps {
  workflow_id: string;
  workflow_name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  agents: string[];
  events: WorkflowEvent[];
  progress: number;
}

export function WorkflowMonitor({
  workflow_id,
  workflow_name,
  status,
  agents,
  events,
  progress
}: WorkflowMonitorProps) {
  const getStatusColor = (s: string) => {
    switch (s) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
  };

  const getEventIcon = (action: string) => {
    if (action.includes('thinking')) return '🤔';
    if (action.includes('decision')) return '✅';
    if (action.includes('created')) return '✨';
    if (action.includes('optimized')) return '⚡';
    return '📌';
  };

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <span>🔄</span>
              {workflow_name}
            </CardTitle>
            <CardDescription>Workflow ID: {workflow_id}</CardDescription>
          </div>
          <div className={`px-4 py-2 rounded-full font-medium border ${getStatusColor(status)}`}>
            {status.toUpperCase()}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-600">Progress</span>
            <span className="font-bold text-slate-900">{progress}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Agents Involved */}
        <div>
          <h3 className="font-semibold text-slate-900 mb-3">👥 Agents Involved ({agents.length})</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {agents.map((agent, idx) => (
              <div key={idx} className="p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                <div className="font-medium text-blue-900">{agent}</div>
                <div className="text-xs text-blue-700">Active</div>
              </div>
            ))}
          </div>
        </div>

        {/* Event Timeline */}
        <div>
          <h3 className="font-semibold text-slate-900 mb-3">📍 Event Timeline</h3>
          <div className="space-y-3">
            {events.map((event, idx) => (
              <div key={idx} className="flex gap-4 pb-3 border-b border-slate-200 last:border-b-0">
                <div className="flex-shrink-0 pt-1">
                  <div className="text-2xl">{getEventIcon(event.action)}</div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-slate-900">{event.action}</h4>
                    <span className="text-xs text-slate-500">{event.timestamp}</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">by {event.agent}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1">
            📊 View Details
          </Button>
          <Button variant="outline" className="flex-1">
            ⏸️ Pause
          </Button>
          {status === 'in_progress' && (
            <Button variant="destructive" className="flex-1">
              ❌ Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
