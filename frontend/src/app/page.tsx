'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      router.replace(user ? '/dashboard' : '/login');
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--surface-0)' }}>
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
    </div>
  );
}
