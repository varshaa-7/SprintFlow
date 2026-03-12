'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Stats, Issue } from '@/types';
import { STATUS_CONFIG, PRIORITY_CONFIG, timeAgo } from '@/lib/utils';

export default function DashboardPage() {
  const { user, tenant } = useAuth();

  const { data: stats } = useQuery<Stats>({
    queryKey: ['stats'],
    queryFn: () => api.get('/api/issues/stats').then(r => r.data),
  });

  const { data: issuesData } = useQuery({
    queryKey: ['issues', 'recent'],
    queryFn: () => api.get('/api/issues?limit=8').then(r => r.data),
  });

  const issues: Issue[] = issuesData?.data || [];

  const statusOrder = ['OPEN', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED'] as const;
  const total = stats?.byStatus.reduce((a, b) => a + b._count, 0) || 0;

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Good morning, {user?.name.split(' ')[0]} 👋</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Here's what's happening at <strong style={{ color: 'rgba(255,255,255,0.7)' }}>{tenant?.name}</strong>
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statusOrder.map(status => {
          const cfg = STATUS_CONFIG[status];
          const count = stats?.byStatus.find(s => s.status === status)?._count || 0;
          const pct = total ? Math.round((count / total) * 100) : 0;
          return (
            <div key={status} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className={`badge ${cfg.bg} ${cfg.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  {cfg.label}
                </span>
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{pct}%</span>
              </div>
              <p className="text-3xl font-semibold">{count}</p>
              <div className="mt-3 h-1 rounded-full" style={{ background: 'var(--surface-3)' }}>
                <div className="h-1 rounded-full transition-all" style={{ width: `${pct}%`, background: cfg.dot.replace('bg-', '') === cfg.dot ? 'var(--accent)' : undefined, backgroundColor: 'currentColor' }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Issues */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="text-sm font-semibold">Recent Issues</h2>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {issues.length === 0 ? (
              <div className="p-8 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
                <p className="text-4xl mb-2">◈</p>
                <p className="text-sm">No issues yet. Create your first one!</p>
              </div>
            ) : issues.map((issue) => {
              const statusCfg = STATUS_CONFIG[issue.status];
              const priCfg = PRIORITY_CONFIG[issue.priority];
              return (
                <div key={issue.id} className="px-5 py-3 flex items-start gap-3 hover:bg-white/[0.02] transition-colors">
                  <span className="mt-0.5 text-sm">{priCfg.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{issue.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`badge text-xs ${statusCfg.bg} ${statusCfg.color} px-2 py-0`}>
                        {statusCfg.label}
                      </span>
                      {issue.project && (
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                          {issue.project.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {timeAgo(issue.updatedAt)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority breakdown */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="text-sm font-semibold">By Priority</h2>
          </div>
          <div className="p-5 space-y-4">
            {(['URGENT', 'HIGH', 'MEDIUM', 'LOW'] as const).map(p => {
              const cfg = PRIORITY_CONFIG[p];
              const count = stats?.byPriority.find(s => s.priority === p)?._count || 0;
              const pct = total ? Math.round((count / total) * 100) : 0;
              return (
                <div key={p}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-xs font-medium ${cfg.color}`}>{cfg.icon} {cfg.label}</span>
                    <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.5)' }}>{count}</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: 'var(--surface-3)' }}>
                    <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: 'var(--accent)' }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tenant isolation note */}
          <div className="mx-5 mb-5 p-3 rounded-lg" style={{ background: 'rgba(124,106,247,0.08)', border: '1px solid rgba(124,106,247,0.15)' }}>
            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--accent)' }}>🔒 Tenant Isolated</p>
            <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
              All data shown is strictly scoped to <strong style={{ color: 'rgba(255,255,255,0.6)' }}>{tenant?.name}</strong>. Other organizations cannot access this data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
