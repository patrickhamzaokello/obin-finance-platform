'use client';

import { useEffect } from 'react';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

export default function SignOutPage() {
  const router = useRouter();
  useEffect(() => {
    authClient.signOut().then(() => router.push('/platform'));
  }, [router]);
  return (
    <div className='min-h-screen bg-[#f4f7f5] flex items-center justify-center'>
      <div className='text-sm text-muted-foreground'>Signing out…</div>
    </div>
  );
}
