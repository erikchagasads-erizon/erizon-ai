'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AgentInfo {
  id: string;
  name: string;
  department: string;
  role: string;
  status: 'active' | 'idle' | 'busy';
  specialization: string;
  decisions_today: number;
  accuracy: number;
}

interface AgentDirectoryProps {
  agents: AgentInfo[];
  on_task_assign: (agent_id: string) => void;
}

export function AgentDirectory({ agents, on_task_assign }: AgentDirectoryProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return '🟢 Active';
      case 'idle':
        return '⚪ Idle';
      case 'busy':
        return '🔴 Busy';
      default:
        return '❓ Unknown';
    }
  };

  const getDepartmentColor = (dept: string) => {
    const colors: { [key: string]: string } = {
      'Executive Council': 'bg-purple-100 text-purple-900',
      'Marketing': 'bg-pink-100 text-pink-900',
      'Traffic': 'bg-blue-100 text-blue-900',
      'Support': 'bg-green-100 text-green-900'
    };
    return colors[dept] || 'bg-slate-100 text-slate-900';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>👥 Agent Directory</span>
          <span className="text-sm font-normal text-slate-500">{agents.length} agents</span>
        </CardTitle>
        <CardDescription>All AI agents and their current status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-slate-900">{agent.name}</h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-slate-200 text-slate-700">
                      {getStatusBadge(agent.status)}
                    </span>
                  </div>
                  <div className="flex gap-2 flex-wrap mb-2">
                    <span className={`text-xs px-2 py-1 rounded ${getDepartmentColor(agent.department)}`}>
                      {agent.department}
                    </span>
                    <span className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-800">
                      {agent.role}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">{agent.specialization}</p>
                  <div className="flex gap-4 text-xs">
                    <span className="text-slate-600">
                      📊 {agent.decisions_today} decisions today
                    </span>
                    <span className="text-slate-600">
                      ✅ {(agent.accuracy * 100).toFixed(0)}% accuracy
                    </span>
                  </div>
                </div>
                <Button
                  onClick={() => on_task_assign(agent.id)}
                  size="sm"
                  className="ml-2"
                  disabled={agent.status === 'busy'}
                >
                  Assign Task
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
