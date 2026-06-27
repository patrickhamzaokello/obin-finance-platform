import { isPlatformOwner } from '@/lib/school-context';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Building2, GraduationCap, BarChart2, Shield,
  ArrowRight, CheckCircle2, Globe,
} from 'lucide-react';

export default async function PlatformLandingPage() {
  // Owners go straight to the dashboard
  if (await isPlatformOwner()) redirect('/platform/admin');

  return (
    <div className='min-h-screen bg-white'>

      {/* Nav */}
      <header className='border-b border-border bg-white sticky top-0 z-10'>
        <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between'>
          <div className='flex items-center gap-2.5'>
            <div className='w-7 h-7 rounded bg-primary flex items-center justify-center'>
              <GraduationCap size={15} className='text-primary-foreground' />
            </div>
            <span className='text-base font-bold text-foreground'>EduPlatform</span>
          </div>
          <Link
            href='/sign-in'
            className='inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded hover:bg-primary/90 transition-colors'
          >
            Admin sign in
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className='bg-[#f4f7f5] border-b border-border'>
        <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center'>
          <div className='inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary text-xs font-semibold rounded-full mb-6'>
            <Globe size={12} /> Multi-school learning platform
          </div>
          <h1 className='text-4xl sm:text-5xl font-bold text-foreground tracking-tight leading-tight'>
            Launch your school's<br />
            <span className='text-primary'>online learning experience</span>
          </h1>
          <p className='text-lg text-muted-foreground mt-5 max-w-2xl mx-auto leading-relaxed'>
            Give every school their own branded platform — courses, learners, and progress tracking,
            all under one roof. You manage the platform; schools manage their content.
          </p>
          <div className='flex items-center justify-center gap-3 mt-8'>
            <Link
              href='/sign-in'
              className='inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded hover:bg-primary/90 transition-colors'
            >
              Get started <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20'>
        <h2 className='text-2xl font-bold text-foreground text-center mb-12'>
          Everything you need to run multiple schools
        </h2>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
          {[
            {
              icon: Building2,
              title: 'School management',
              desc: 'Create and manage unlimited schools, each with its own subdomain, branding, and admin team.',
            },
            {
              icon: GraduationCap,
              title: 'Course builder',
              desc: 'Build rich courses with video lessons (YouTube or uploaded), PDF resources, and progress tracking.',
            },
            {
              icon: BarChart2,
              title: 'Progress analytics',
              desc: 'Track learner progress, module completion, and enrollment across every school in real time.',
            },
            {
              icon: Shield,
              title: 'Role-based access',
              desc: 'Platform owner, school admins, and learners — each sees only what they need.',
            },
            {
              icon: Globe,
              title: 'Custom subdomains',
              desc: 'Every school gets its own subdomain (school.yourplatform.com) for a professional experience.',
            },
            {
              icon: CheckCircle2,
              title: 'Completion tracking',
              desc: 'Learners mark modules complete and track their journey through every course they enroll in.',
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className='bg-white border border-border rounded p-6 border-l-[3px] border-l-primary hover:shadow-sm transition-shadow'>
              <div className='w-9 h-9 rounded bg-primary/10 flex items-center justify-center mb-4'>
                <Icon size={17} className='text-primary' />
              </div>
              <h3 className='text-sm font-semibold text-foreground mb-1.5'>{title}</h3>
              <p className='text-sm text-muted-foreground leading-relaxed'>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className='bg-primary'>
        <div className='max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center'>
          <h2 className='text-2xl font-bold text-primary-foreground mb-3'>Ready to get started?</h2>
          <p className='text-primary-foreground/80 mb-8'>Sign in to the platform admin to manage your schools.</p>
          <Link
            href='/sign-in'
            className='inline-flex items-center gap-2 px-6 py-3 bg-white text-primary font-semibold rounded hover:bg-white/90 transition-colors'
          >
            Sign in <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className='border-t border-border py-6 text-center text-xs text-muted-foreground'>
        © {new Date().getFullYear()} EduPlatform. All rights reserved.
      </footer>

    </div>
  );
}
