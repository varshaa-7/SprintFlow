'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Project } from '@/types';

const COLORS = ['#6366f1','#f59e0b','#10b981','#3b82f6','#ef4444','#8b5cf6','#06b6d4','#f97316'];

export default function ProjectsPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', color: '#6366f1' });
  const [error, setError] = useState('');

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => api.get('/api/projects').then(r => r.data),
  });

  const createProject = useMutation({
    mutationFn: (data: any) => api.post('/api/projects', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      setShowCreate(false);
      setForm({ name: '', description: '', color: '#6366f1' });
    },
    onError: (err: any) => setError(err.response?.data?.error || 'Error'),
  });

  const deleteProject = useMutation({
    mutationFn: (id: string) => api.delete(`/api/projects/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Organize issues into projects</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(s => !s)}>
          <span>+</span> New Project
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="card p-6 mb-6 animate-slide-up">
          <h2 className="text-sm font-semibold mb-4">Create Project</h2>
          <div className="space-y-4">
            <input className="input" placeholder="Project name" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
            <input className="input" placeholder="Description (optional)" value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <div>
              <label className="text-xs mb-2 block" style={{ color: 'rgba(255,255,255,0.4)' }}>Color</label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map(c => (
                  <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                    className="w-7 h-7 rounded-full transition-all"
                    style={{ background: c, outline: form.color === c ? `3px solid white` : 'none', outlineOffset: 2 }} />
                ))}
              </div>
            </div>
            {error && <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>}
            <div className="flex gap-3">
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => createProject.mutate(form)} disabled={!form.name.trim()}>
                {createProject.isPending ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Projects grid */}
      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
        </div>
      ) : projects.length === 0 ? (
        <div className="card p-12 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
          <p className="text-4xl mb-3">◫</p>
          <p className="text-sm">No projects yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div key={project.id} className="card card-hover p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold"
                  style={{ background: `${project.color}20`, color: project.color }}>
                  ◫
                </div>
                <button onClick={() => confirm(`Delete "${project.name}"?`) && deleteProject.mutate(project.id)}
                  className="text-xs opacity-60 hover:opacity-100 hover:text-red-400 transition-all"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)' }}>
                  ✕
                </button>
              </div>
              <h3 className="font-semibold text-sm mb-1">{project.name}</h3>
              {project.description && (
                <p className="text-xs mb-3 leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>{project.description}</p>
              )}
              <div className="flex items-center gap-2 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--surface-3)', color: 'rgba(255,255,255,0.5)' }}>
                  {project._count?.issues || 0} issues
                </span>
                <div className="w-2 h-2 rounded-full ml-auto" style={{ background: project.color }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
