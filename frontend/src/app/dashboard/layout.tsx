'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { initials } from '@/lib/utils';

const NAV = [
  { href: '/dashboard', label: 'Overview', icon: '⬡' },
  { href: '/dashboard/issues', label: 'Issues', icon: '◈' },
  { href: '/dashboard/projects', label: 'Projects', icon: '◫' },
  { href: '/dashboard/team', label: 'Team', icon: '◎' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, tenant, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [user, isLoading, router]);

  if (isLoading || !user || !tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--surface-0)' }}>
        <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  const PLAN_COLOR: Record<string, string> = {
    FREE: 'rgba(100,116,139,0.4)',
    PRO: 'rgba(124,106,247,0.4)',
    ENTERPRISE: 'rgba(245,158,11,0.4)',
  };

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--surface-0)' }}>
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 flex flex-col" style={{ background: 'var(--surface-1)', borderRight: '1px solid var(--border)' }}>
        {/* Tenant header */}
        <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: 'var(--accent)', color: 'white' }}>
              {initials(tenant.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{tenant.name}</p>
              <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: PLAN_COLOR[tenant.plan] || PLAN_COLOR.FREE, color: 'rgba(255,255,255,0.7)' }}>
                {tenant.plan}
              </span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ href, label, icon }) => (
            <Link key={href} href={href} className={`sidebar-link ${pathname === href ? 'active' : ''}`}>
              <span className="text-base">{icon}</span>
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        {/* User footer */}
        <div className="p-3" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: 'var(--surface-4)', color: 'rgba(255,255,255,0.7)' }}>
              {initials(user.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{user.name}</p>
              <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>{user.role}</p>
            </div>
            <button onClick={logout} className="text-xs px-2 py-1 rounded" style={{ color: 'rgba(255,255,255,0.3)', background: 'transparent', border: 'none', cursor: 'pointer' }}
              title="Sign out">
              ↩
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
