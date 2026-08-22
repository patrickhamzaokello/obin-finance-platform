import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/auth-form';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Play } from 'lucide-react';

export const metadata: Metadata = { title: 'Create Account' };

interface Props {
  searchParams: Promise<{ next?: string; courseTitle?: string }>;
}

export default async function SignUpPage({ searchParams }: Props) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user) redirect('/dashboard');

  const params = await searchParams;
  const next = params.next ?? '/dashboard';
  const courseTitle = params.courseTitle ? decodeURIComponent(params.courseTitle) : null;

  return (
    <main className="min-h-screen bg-[#F8F7F4] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 justify-center mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-sm">
              <Play size={16} fill="white" color="white" />
            </div>
            <span className="font-extrabold text-xl text-foreground tracking-tight">Pkasemer</span>
          </Link>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Create your account</h1>
          {courseTitle ? (
            <p className="text-sm text-muted-foreground mt-1">
              to enroll in <span className="font-semibold text-foreground">{courseTitle}</span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground mt-1">Join thousands of learners on Pkasemer</p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <AuthForm mode="sign-up" redirectTo={next} signInHref={`/sign-in${next !== '/dashboard' ? `?next=${encodeURIComponent(next)}${courseTitle ? `&courseTitle=${encodeURIComponent(courseTitle)}` : ''}` : ''}`} />
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Already have an account?{' '}
          <Link
            href={`/sign-in${next !== '/dashboard' ? `?next=${encodeURIComponent(next)}${courseTitle ? `&courseTitle=${encodeURIComponent(courseTitle)}` : ''}` : ''}`}
            className="text-primary font-semibold hover:underline"
          >
            Sign in
          </Link>
        </p>

        <p className="text-[11px] text-muted-foreground/60 text-center mt-3">
          By signing up you agree to our{' '}
          <Link href="/contact" className="underline hover:text-muted-foreground">terms</Link>
          {' '}and{' '}
          <Link href="/contact" className="underline hover:text-muted-foreground">privacy policy</Link>.
        </p>
      </div>
    </main>
  );
}
