'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/api/client';

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) {
      router.replace('/admin/login');
    }
  }, [router]);

  if (typeof window !== 'undefined' && !getToken()) {
    return null;
  }

  return <>{children}</>;
}
