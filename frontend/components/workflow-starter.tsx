'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface WorkflowStarterProps {
  company_id: string;
  on_workflow_start: (workflow_type: string) => void;
}

export function WorkflowStarter({ company_id, on_workflow_start }: WorkflowStarterProps) {
  const [loading, setLoading] = useState(false);

  const workflows = [
    {
      id: 'executive-meeting',
      name: 'Executive Meeting',
      description: 'Strategic alignment with CEO, CMO, CFO, and leadership',
      icon: '🏢',
      duration: '45 mins',
      agents: 5
    },
    {
      id: 'content-production',
      name: 'Content Production',
      description: 'Create content across all platforms with AI designers and copywriters',
      icon: '📝',
      duration: '60 mins',
      agents: 8
    },
    {
      id: 'traffic-optimization',
      name: 'Traffic Optimization',
      description: 'Optimize ad campaigns across Meta, Google, and LinkedIn',
      icon: '📊',
      duration: '30 mins',
      agents: 6
    },
    {
      id: 'growth-sprint',
      name: 'Growth Sprint',
      description: 'Identify and execute growth opportunities',
      icon: '🚀',
      duration: '90 mins',
      agents: 10
    }
  ];

  const handleStartWorkflow = async (workflowId: string) => {
    setLoading(true);
    try {
      await fetch('/api/workflows/executive-meeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id })
      });
      on_workflow_start(workflowId);
    } catch (error) {
      console.error('Failed to start workflow:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>⚡ Start Workflow</CardTitle>
          <CardDescription>Trigger multi-agent workflows and orchestrations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                className="p-4 border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="text-3xl">{workflow.icon}</div>
                  <span className="text-xs font-medium px-2 py-1 bg-slate-200 text-slate-700 rounded">
                    {workflow.agents} agents
                  </span>
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{workflow.name}</h3>
                <p className="text-sm text-slate-600 mb-3">{workflow.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">⏱️ {workflow.duration}</span>
                  <Button
                    size="sm"
                    onClick={() => handleStartWorkflow(workflow.id)}
                    disabled={loading}
                  >
                    Start
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
