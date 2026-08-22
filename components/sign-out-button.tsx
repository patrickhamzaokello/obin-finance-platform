'use client';

import { authClient } from '@/lib/auth-client';
import { LogOut } from 'lucide-react';

export function SignOutButton({ className }: { className?: string }) {
  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.href = '/sign-in';
  };

  return (
    <button onClick={handleSignOut} className={className}>
      <LogOut size={14} /> Sign out
    </button>
  );
}
