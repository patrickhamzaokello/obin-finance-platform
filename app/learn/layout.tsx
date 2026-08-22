import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';
import LearnNav from './learn-nav';

export default async function LearnLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect('/sign-in');

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      <LearnNav userName={session.user.name ?? ''} userEmail={session.user.email ?? ''} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}
