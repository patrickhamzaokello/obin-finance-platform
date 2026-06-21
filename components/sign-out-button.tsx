'use client';

import { signOut } from '@/app/actions/auth';

interface SignOutButtonProps {
  className?: string;
}

export function SignOutButton({ className }: SignOutButtonProps) {
  return (
    <button
      onClick={() => signOut()}
      className={className}
    >
      Sign Out
    </button>
  );
}
