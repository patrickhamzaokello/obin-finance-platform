import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import Link from 'next/link';
import { ChevronRight, Zap, Target, TrendingUp, Lock, Users } from 'lucide-react';

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session?.user) {
    if (session.user.role === 'admin') {
      redirect('/admin');
    }
    redirect('/dashboard');
  }

  return (
    <div className='min-h-screen bg-background text-foreground overflow-hidden'>
      {/* Animated gradient background */}
      <div className='absolute inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse' />
        <div className='absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse' />
        <div className='absolute top-1/2 left-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse' />
      </div>

      {/* Navigation */}
      <nav className='relative z-10 flex items-center justify-between px-6 sm:px-8 py-6 border-b border-border'>
        <div className='flex items-center gap-3'>
          <img src='/horse-logo.png' alt='Obin Finance' className='w-8 h-8' />
          <span className='text-2xl font-bold text-primary'>Obin Finance</span>
        </div>
        <div className='flex gap-4 items-center'>
          <Link
            href='/sign-in'
            className='px-6 py-2 text-sm font-medium text-foreground hover:text-primary transition'
          >
            Sign In
          </Link>
          <Link
            href='/sign-up'
            className='px-6 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition'
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Main content */}
      <div className='relative z-20 max-w-7xl mx-auto px-6 sm:px-8 py-20 sm:py-32'>
        {/* Hero section */}
        <div className='grid lg:grid-cols-2 gap-12 items-center mb-20 slide-up'>
          <div className='space-y-8'>
            <div className='space-y-4'>
              <div className='inline-block px-3 py-1 bg-primary/10 border border-primary/30 rounded-full text-sm text-primary font-medium'>
                Master Your Financial Future
              </div>
              <h1 className='text-5xl sm:text-6xl lg:text-6xl font-bold leading-tight tracking-tight'>
                Build Wealth Through{' '}
                <span className='text-primary'>
                  Financial Mastery
                </span>
              </h1>
            </div>

            <p className='text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-md'>
              Transform your financial future with expert-led courses. From investment fundamentals to advanced portfolio strategies, take control of your wealth.
            </p>

            <div className='space-y-3'>
              <div className='flex items-center gap-3 text-muted-foreground'>
                <Zap className='w-5 h-5 text-primary flex-shrink-0' />
                <span>Learn at your own pace, anytime, anywhere</span>
              </div>
              <div className='flex items-center gap-3 text-muted-foreground'>
                <Target className='w-5 h-5 text-primary flex-shrink-0' />
                <span>Industry-expert instructors with real-world experience</span>
              </div>
              <div className='flex items-center gap-3 text-muted-foreground'>
                <TrendingUp className='w-5 h-5 text-primary flex-shrink-0' />
                <span>From basics to advanced investment strategies</span>
              </div>
            </div>

            <div className='flex flex-col sm:flex-row gap-4 pt-4'>
              <Link
                href='/sign-up'
                className='px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:shadow-lg hover:shadow-primary/20 transition glow-pulse'
              >
                Start Learning Today
                <ChevronRight className='inline-block w-4 h-4 ml-2' />
              </Link>
              <Link
                href='/sign-in'
                className='px-8 py-3 border border-border bg-secondary hover:bg-secondary/80 text-foreground font-semibold rounded-lg transition'
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Hero image */}
          <div className='float-in rounded-2xl overflow-hidden border border-border shadow-2xl'>
            <img src='/images/hero-african.png' alt='Young African finance professional analyzing market data' className='w-full h-full object-cover' />
          </div>
        </div>

        {/* Why Choose Obin - with imagery */}
        <div className='mt-32 mb-20'>
          <h2 className='text-4xl font-bold text-center mb-4'>Why Choose Obin Finance</h2>
          <p className='text-center text-muted-foreground max-w-2xl mx-auto mb-16'>Learn from industry experts, plan your financial future with confidence, and achieve your wealth goals</p>
          
          <div className='grid md:grid-cols-3 gap-8'>
            {/* Learning */}
            <div className='group overflow-hidden rounded-xl border border-border hover:border-primary transition hover:shadow-xl duration-300'>
              <div className='h-64 overflow-hidden bg-secondary'>
                <img src='/images/learning-african.png' alt='Young African professionals learning finance together' className='w-full h-full object-cover group-hover:scale-105 transition duration-300' />
              </div>
              <div className='p-6'>
                <h3 className='text-xl font-semibold mb-2'>Expert Learning</h3>
                <p className='text-sm text-muted-foreground'>Learn from industry experts with decades of real-world financial experience and proven track records</p>
              </div>
            </div>

            {/* Planning */}
            <div className='group overflow-hidden rounded-xl border border-border hover:border-primary transition hover:shadow-xl duration-300'>
              <div className='h-64 overflow-hidden bg-secondary'>
                <img src='/images/planning-african.png' alt='Young African financial advisor planning with client' className='w-full h-full object-cover group-hover:scale-105 transition duration-300' />
              </div>
              <div className='p-6'>
                <h3 className='text-xl font-semibold mb-2'>Strategic Planning</h3>
                <p className='text-sm text-muted-foreground'>Create personalized financial plans with our comprehensive courses and practical investment strategies</p>
              </div>
            </div>

            {/* Success */}
            <div className='group overflow-hidden rounded-xl border border-border hover:border-primary transition hover:shadow-xl duration-300'>
              <div className='h-64 overflow-hidden bg-secondary'>
                <img src='/images/success-african.png' alt='Young African professionals celebrating financial success' className='w-full h-full object-cover group-hover:scale-105 transition duration-300' />
              </div>
              <div className='p-6'>
                <h3 className='text-xl font-semibold mb-2'>Proven Success</h3>
                <p className='text-sm text-muted-foreground'>Join thousands of successful students who have transformed their financial lives through Obin Finance</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className='mt-32 relative'>
          <div className='absolute inset-0 bg-primary/5 rounded-2xl blur-2xl' />
          <div className='relative p-12 bg-white border border-border rounded-2xl text-center'>
            <h2 className='text-3xl sm:text-4xl font-bold mb-4'>
              Ready to Master Your Finances?
            </h2>
            <p className='text-lg text-muted-foreground mb-8 max-w-2xl mx-auto'>
              Join thousands of learners who are taking control of their financial destiny. Start your journey today with our comprehensive, expert-led courses.
            </p>
            <Link
              href='/sign-up'
              className='inline-block px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:shadow-lg hover:shadow-primary/30 transition'
            >
              Begin Your Learning Journey
              <ChevronRight className='inline-block w-4 h-4 ml-2' />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
