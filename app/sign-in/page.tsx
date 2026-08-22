import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/auth-form';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Sign In' };

export default async function SignInPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  // Already signed in → role-based router handles destination
  if (session?.user) redirect('/dashboard');

  return (
    <main className="min-h-screen bg-[#F8F7F4] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Branding */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-sm">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-primary-foreground" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
          </Link>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to your Pkasemer account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <AuthForm mode="sign-in" redirectTo="/dashboard" />
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/sign-up" className="text-primary font-semibold hover:underline">Sign up</Link>
        </p>
      </div>
    </main>
  );
}
