'use client';

import { AuthForm } from '@/components/auth-form';
import { joinSchool } from '@/app/actions/courses';
import { BookOpen } from 'lucide-react';

export function SignUpClient({ schoolName }: { schoolName: string }) {
  return (
    <main className="min-h-screen bg-[#F5F5F7] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-sm">
            <BookOpen className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">{schoolName}</h1>
          <p className="text-sm text-muted-foreground mt-1">Join as a fan and start learning</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <AuthForm
            mode="sign-up"
            redirectTo="/dashboard"
            signInHref="/sign-in"
            signUpHref="/sign-up"
            onSuccess={async () => { await joinSchool(); }}
          />
        </div>
      </div>
    </main>
  );
}
