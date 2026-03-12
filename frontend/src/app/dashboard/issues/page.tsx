'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Issue, Status, Priority } from '@/types';
import { STATUS_CONFIG, PRIORITY_CONFIG, timeAgo, initials } from '@/lib/utils';

const STATUSES: Status[] = ['OPEN', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED'];
const PRIORITIES: Priority[] = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'];

function CreateIssueModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
 const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM', status: 'OPEN', projectId: '', assignedToId: '' });
  const [error, setError] = useState('');

  const { data: projects = [] } = useQuery<any[]>({
  queryKey: ['projects'],
  queryFn: () => api.get('/api/projects').then(r => r.data),
});

const { data: members = [] } = useQuery<any[]>({
  queryKey: ['tenant-members'],
  queryFn: () => api.get('/api/tenants/me').then(r => r.data.users),
});

  const mutation = useMutation({
    mutationFn: (data: any) => api.post('/api/issues', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['issues'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      onClose();
    },
    onError: (err: any) => setError(err.response?.data?.error || 'Failed to create issue'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="card w-full max-w-lg animate-slide-up">
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-sm font-semibold">New Issue</h2>
          <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>×</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <input className="input text-base font-medium" style={{ fontSize: 15 }} placeholder="Issue title..." value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />
          </div>
          <div>
            <textarea className="input" rows={3} placeholder="Description (optional)..." value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              style={{ resize: 'vertical', fontFamily: 'inherit' }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Status</label>
              <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Priority</label>
              <select className="input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_CONFIG[p].icon} {PRIORITY_CONFIG[p].label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Assign to</label>
            <select className="input" value={form.assignedToId}
              onChange={e => setForm(f => ({ ...f, assignedToId: e.target.value }))}>
              <option value="">Unassigned</option>
              {members.map((m: any) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Project</label>
            <select className="input" value={form.projectId}
              onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))}>
              <option value="">No project</option>
              {projects.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
          {error && <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>}
        </div>
        <div className="px-6 pb-6 flex justify-end gap-3">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!form.title.trim() || mutation.isPending}
            onClick={() => {
            const payload: any = { title: form.title, description: form.description, priority: form.priority, status: form.status };
            if (form.projectId) payload.projectId = form.projectId;
            if (form.assignedToId) payload.assignedToId = form.assignedToId;
            mutation.mutate(payload);
          }}>
            {mutation.isPending ? 'Creating...' : 'Create Issue'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function IssuesPage() {
  const [filters, setFilters] = useState<{ status?: string; priority?: string }>({});
  const [showCreate, setShowCreate] = useState(false);
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const params = new URLSearchParams({ page: String(page), limit: '15', ...filters });
  const { data, isLoading } = useQuery({
    queryKey: ['issues', filters, page],
    queryFn: () => api.get(`/api/issues?${params}`).then(r => r.data),
  });

  const issues: Issue[] = data?.data || [];
  const meta = data?.meta;

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Status }) => api.patch(`/api/issues/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['issues'] }),
  });

  const deleteIssue = useMutation({
    mutationFn: (id: string) => api.delete(`/api/issues/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['issues'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Issues</h1>
          {meta && <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{meta.total} total</p>}
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <span className="text-lg leading-none">+</span> New Issue
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <select className="input w-auto" style={{ minWidth: 140 }} value={filters.status || ''} onChange={e => { setFilters(f => ({ ...f, status: e.target.value || undefined })); setPage(1); }}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
        </select>
        <select className="input w-auto" style={{ minWidth: 140 }} value={filters.priority || ''} onChange={e => { setFilters(f => ({ ...f, priority: e.target.value || undefined })); setPage(1); }}>
          <option value="">All Priorities</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>)}
        </select>
        {(filters.status || filters.priority) && (
          <button className="btn btn-ghost text-xs" onClick={() => { setFilters({}); setPage(1); }}>Clear filters</button>
        )}
      </div>

      {/* Issues table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
            <div className="w-6 h-6 rounded-full border-2 animate-spin mx-auto" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          </div>
        ) : issues.length === 0 ? (
          <div className="p-12 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
            <p className="text-4xl mb-3">◈</p>
            <p className="text-sm">No issues found</p>
            <button className="btn btn-primary mt-4 text-sm" onClick={() => setShowCreate(true)}>Create first issue</button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Priority', 'Title', 'Status', 'Project', 'Assignee', 'Updated', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {issues.map((issue, i) => {
                const statusCfg = STATUS_CONFIG[issue.status];
                const priCfg = PRIORITY_CONFIG[issue.priority];
                return (
                  <tr key={issue.id} className="hover:bg-white/[0.02] transition-colors" style={{ borderBottom: i < issues.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <td className="px-4 py-3">
                      <span title={priCfg.label}>{priCfg.icon}</span>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="font-medium truncate">{issue.title}</p>
                      {issue.description && (
                        <p className="text-xs truncate mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{issue.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <select className="text-xs rounded-lg px-2 py-1 cursor-pointer border-0 outline-none" style={{ background: 'var(--surface-3)', color: 'rgba(255,255,255,0.7)' }}
                        value={issue.status} onChange={e => updateStatus.mutate({ id: issue.id, status: e.target.value as Status })}>
                        {STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {issue.project ? (
                        <span className="text-xs px-2 py-1 rounded-full" style={{ background: `${issue.project.color}20`, color: issue.project.color }}>
                          {issue.project.name}
                        </span>
                      ) : <span style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {issue.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'var(--surface-4)', color: 'rgba(255,255,255,0.6)' }}>
                            {initials(issue.assignedTo.name)}
                          </div>
                          <span className="text-xs truncate max-w-[80px]" style={{ color: 'rgba(255,255,255,0.6)' }}>{issue.assignedTo.name}</span>
                        </div>
                      ) : <span style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      {timeAgo(issue.updatedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => { if (confirm('Delete this issue?')) deleteIssue.mutate(issue.id); }}
                        className="text-xs opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                        style={{ color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer' }}>
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Page {page} of {meta.pages} ({meta.total} issues)
          </p>
          <div className="flex gap-2">
            <button className="btn btn-ghost text-xs" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <button className="btn btn-ghost text-xs" disabled={page === meta.pages} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        </div>
      )}

      {showCreate && <CreateIssueModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
