import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCurrentSchool } from '@/lib/school-context';
import { SignUpClient } from './sign-up-client';

export const metadata: Metadata = { title: 'Create Account' };

export default async function SchoolSignUpPage() {
  const [session, school] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    getCurrentSchool(),
  ]);
  if (session?.user) redirect('/dashboard');

  return <SignUpClient schoolName={school?.name ?? 'Learning Platform'} />;
}
