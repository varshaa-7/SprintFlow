'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { initials, timeAgo } from '@/lib/utils';

const ROLE_CONFIG = {
  OWNER:  { color: 'text-yellow-400', bg: 'bg-yellow-400/10', label: 'Owner' },
  ADMIN:  { color: 'text-purple-400', bg: 'bg-purple-400/10', label: 'Admin' },
  MEMBER: { color: 'text-blue-400',   bg: 'bg-blue-400/10',   label: 'Member' },
};

export default function TeamPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState({ email: '', name: '', role: 'MEMBER' });
  const [showInvite, setShowInvite] = useState(false);
  const [result, setResult] = useState<any>(null);

  const { data: tenant } = useQuery({
    queryKey: ['tenant'],
    queryFn: () => api.get('/api/tenants/me').then(r => r.data),
  });

  const invite = useMutation({
    mutationFn: (data: any) => api.post('/api/tenants/invite', data),
    onSuccess: (res) => {
      setResult(res.data);
      qc.invalidateQueries({ queryKey: ['tenant'] });
    },
  });

  const canInvite = user?.role === 'OWNER' || user?.role === 'ADMIN';

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Team</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {tenant?._count?.users || 0} members in your organization
          </p>
        </div>
        {canInvite && (
          <button className="btn btn-primary" onClick={() => setShowInvite(s => !s)}>
            + Invite Member
          </button>
        )}
      </div>

      {/* Invite form */}
      {showInvite && canInvite && (
        <div className="card p-6 mb-6 animate-slide-up">
          <h2 className="text-sm font-semibold mb-4">Invite Team Member</h2>
          {result ? (
            <div className="rounded-lg p-4" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <p className="text-sm text-green-400 font-medium mb-2">✓ Member added!</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Temporary password: <code className="font-mono px-1 py-0.5 rounded" style={{ background: 'var(--surface-3)' }}>{result.tempPassword}</code></p>
              <button className="btn btn-ghost text-xs mt-3" onClick={() => { setResult(null); setForm({ email: '', name: '', role: 'MEMBER' }); }}>
                Invite another
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input className="input" placeholder="Full name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                <input className="input" type="email" placeholder="Email address" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <select className="input w-48" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
              <div className="flex gap-3">
                <button className="btn btn-ghost" onClick={() => setShowInvite(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={() => invite.mutate(form)} disabled={!form.email || !form.name || invite.isPending}>
                  {invite.isPending ? 'Inviting...' : 'Add Member'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Members list */}
      <div className="card overflow-hidden">
        {tenant?.users?.map((member: any, i: number) => {
          const roleCfg = ROLE_CONFIG[member.role as keyof typeof ROLE_CONFIG];
          return (
            <div key={member.id} className="flex items-center gap-4 px-5 py-4" style={{ borderBottom: i < tenant.users.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background: member.id === user?.id ? 'var(--accent)' : 'var(--surface-4)', color: 'white' }}>
                {initials(member.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{member.name}</p>
                  {member.id === user?.id && <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>(you)</span>}
                </div>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{member.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Joined {timeAgo(member.createdAt)}</span>
                <span className={`badge text-xs ${roleCfg.bg} ${roleCfg.color}`}>{roleCfg.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Labels */}
      {tenant?.labels?.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold mb-4">Organization Labels</h2>
          <div className="flex flex-wrap gap-2">
            {tenant.labels.map((label: any) => (
              <span key={label.id} className="badge text-xs px-3 py-1" style={{ background: `${label.color}20`, color: label.color, border: `1px solid ${label.color}30` }}>
                {label.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
