'use client';

import { LogOut } from 'lucide-react';
import { authClient } from '@/lib/auth-client';

interface SignOutButtonProps {
  className?: string;
}

export function SignOutButton({ className }: SignOutButtonProps) {
  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.href = '/sign-in';
  };

  return (
    <button onClick={handleSignOut} className={className}>
      <LogOut size={13} />
      <span className="hidden sm:inline">Sign out</span>
    </button>
  );
}
