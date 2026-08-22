import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/auth-form';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Play } from 'lucide-react';

export const metadata: Metadata = { title: 'Sign In' };

interface Props {
  searchParams: Promise<{ next?: string; course?: string; courseTitle?: string }>;
}

export default async function SignInPage({ searchParams }: Props) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user) redirect('/dashboard');

  const params = await searchParams;
  const next = params.next ?? '/dashboard';
  const courseTitle = params.courseTitle ? decodeURIComponent(params.courseTitle) : null;

  return (
    <main className="min-h-screen bg-[#F8F7F4] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Branding */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 justify-center mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-sm">
              <Play size={16} fill="white" color="white" />
            </div>
            <span className="font-extrabold text-xl text-foreground tracking-tight">Pkasemer</span>
          </Link>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Welcome back</h1>
          {courseTitle ? (
            <p className="text-sm text-muted-foreground mt-1">
              Sign in to enroll in <span className="font-semibold text-foreground">{courseTitle}</span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground mt-1">Sign in to your Pkasemer account</p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <AuthForm
            mode="sign-in"
            redirectTo={next}
            signUpHref={`/sign-up${courseTitle ? `?next=${encodeURIComponent(next)}&courseTitle=${encodeURIComponent(courseTitle)}` : next !== '/dashboard' ? `?next=${encodeURIComponent(next)}` : ''}`}
          />
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Don&apos;t have an account?{' '}
          <Link
            href={`/sign-up${courseTitle ? `?next=${encodeURIComponent(next)}&courseTitle=${encodeURIComponent(courseTitle)}` : next !== '/dashboard' ? `?next=${encodeURIComponent(next)}` : ''}`}
            className="text-primary font-semibold hover:underline"
          >
            Sign up free
          </Link>
        </p>
      </div>
    </main>
  );
}
