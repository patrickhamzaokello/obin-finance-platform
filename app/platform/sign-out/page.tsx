'use client';

import { useEffect } from 'react';
import { authClient } from '@/lib/auth-client';

export default function SignOutPage() {
  useEffect(() => {
    authClient.signOut().then(() => { window.location.href = '/platform'; });
  }, []);
  return (
    <div className='min-h-screen bg-[#f4f7f5] flex items-center justify-center'>
      <div className='text-sm text-muted-foreground'>Signing out…</div>
    </div>
  );
}
