'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ email: '', password: '', name: '', tenantName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const router = useRouter();

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form);
      }
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--surface-0)' }}>
      {/* Background grid */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(124,106,247,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(124,106,247,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div className="w-full max-w-md animate-slide-up relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4" style={{ background: 'var(--accent)', boxShadow: '0 0 32px rgba(124,106,247,0.4)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M9 11l3 3L22 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-white">IssueFlow</h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Multi-tenant issue tracking</p>
        </div>

        <div className="card p-8">
          {/* Tabs */}
          <div className="flex rounded-lg p-1 mb-8" style={{ background: 'var(--surface-2)' }}>
            {(['login', 'register'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)} className="flex-1 py-2 rounded-md text-sm font-medium transition-all" style={{
                background: mode === m ? 'var(--surface-4)' : 'transparent',
                color: mode === m ? 'white' : 'rgba(255,255,255,0.4)',
              }}>
                {m === 'login' ? 'Sign In' : 'Create Org'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Your Name</label>
                  <input className="input" value={form.name} onChange={set('name')} placeholder="Jane Smith" required />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Organization Name</label>
                  <input className="input" value={form.tenantName} onChange={set('tenantName')} placeholder="Acme Corporation" required />
                </div>
              </>
            )}
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Email</label>
              <input className="input" type="email" value={form.email} onChange={set('email')} placeholder="you@company.com" required />
            </div>
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Password</label>
              <input className="input" type="password" value={form.password} onChange={set('password')} placeholder="••••••••" required minLength={8} />
            </div>

            {error && (
              <div className="rounded-lg px-4 py-3 text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center py-3 text-sm" style={{ marginTop: '8px' }}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70" />
                  </svg>
                  {mode === 'login' ? 'Signing in...' : 'Creating org...'}
                </span>
              ) : mode === 'login' ? 'Sign In' : 'Create Organization'}
            </button>
          </form>

          {/* Demo accounts */}
          {mode === 'login' && (
            <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
              <p className="text-xs font-medium mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>Demo accounts</p>
              <div className="space-y-2">
                {[
                  { email: 'alice@acme.com', org: 'Acme Corp (PRO)' },
                  { email: 'hank@globex.com', org: 'Globex Industries' },
                  { email: 'peter@initech.com', org: 'Initech Solutions' },
                ].map(demo => (
                  <button key={demo.email} onClick={() => setForm(f => ({ ...f, email: demo.email, password: 'password123' }))}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs transition-all" style={{ background: 'var(--surface-2)', color: 'rgba(255,255,255,0.6)' }}
                  >
                    <span className="font-mono" style={{ color: 'var(--accent)' }}>{demo.email}</span>
                    <span style={{ color: 'rgba(255,255,255,0.3)' }}> — {demo.org}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
