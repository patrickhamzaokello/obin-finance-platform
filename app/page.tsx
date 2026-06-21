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
        <div className='absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-pulse' />
        <div className='absolute -bottom-40 -left-40 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-pulse' />
        <div className='absolute top-1/2 left-1/2 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse' />
      </div>

      {/* Navigation */}
      <nav className='relative z-10 flex items-center justify-between px-6 sm:px-8 py-6 backdrop-blur-sm border-b border-border/40'>
        <div className='text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent'>
          Obin Finance
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
              <div className='inline-block px-3 py-1 bg-primary/20 border border-primary/40 rounded-full text-sm text-primary font-medium'>
                Master Your Financial Future
              </div>
              <h1 className='text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight tracking-tight'>
                Build Wealth Through{' '}
                <span className='bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent'>
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
                className='px-8 py-3 bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold rounded-lg hover:shadow-lg hover:shadow-primary/20 transition glow-pulse'
              >
                Start Learning Today
                <ChevronRight className='inline-block w-4 h-4 ml-2' />
              </Link>
              <Link
                href='/sign-in'
                className='px-8 py-3 border border-border bg-card/50 hover:bg-card text-foreground font-semibold rounded-lg transition'
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Visual element - animated gradient card */}
          <div className='relative h-96 sm:h-full float-in'>
            <div className='absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20 rounded-2xl blur-3xl' />
            <div className='relative h-full bg-gradient-to-br from-card/40 to-card/20 border border-border/40 rounded-2xl p-8 backdrop-blur-sm overflow-hidden'>
              <div className='absolute inset-0 overflow-hidden'>
                <div className='absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent' />
              </div>
              <div className='relative h-full flex flex-col justify-between'>
                <div>
                  <div className='text-4xl font-bold text-primary mb-2'>$1.2M+</div>
                  <p className='text-sm text-muted-foreground'>Wealth managed through our platform</p>
                </div>
                <div className='space-y-3'>
                  <div className='h-2 bg-border rounded-full overflow-hidden'>
                    <div className='h-full w-3/4 bg-gradient-to-r from-primary to-secondary' />
                  </div>
                  <div className='flex justify-between text-xs text-muted-foreground'>
                    <span>5,000+ students</span>
                    <span>98% satisfaction</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features grid */}
        <div className='grid md:grid-cols-3 gap-6 mt-32 slide-in-left'>
          <div className='group p-6 border border-border/40 rounded-lg hover:border-primary/40 hover:bg-card/50 transition backdrop-blur-sm'>
            <div className='w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/30 transition'>
              <Lock className='w-6 h-6 text-primary' />
            </div>
            <h3 className='text-lg font-semibold mb-2'>Secure & Verified</h3>
            <p className='text-sm text-muted-foreground'>Bank-grade security for all your learning and data</p>
          </div>

          <div className='group p-6 border border-border/40 rounded-lg hover:border-primary/40 hover:bg-card/50 transition backdrop-blur-sm'>
            <div className='w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/30 transition'>
              <Users className='w-6 h-6 text-primary' />
            </div>
            <h3 className='text-lg font-semibold mb-2'>Community Driven</h3>
            <p className='text-sm text-muted-foreground'>Learn alongside thousands of finance enthusiasts</p>
          </div>

          <div className='group p-6 border border-border/40 rounded-lg hover:border-primary/40 hover:bg-card/50 transition backdrop-blur-sm'>
            <div className='w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/30 transition'>
              <TrendingUp className='w-6 h-6 text-primary' />
            </div>
            <h3 className='text-lg font-semibold mb-2'>Real Results</h3>
            <p className='text-sm text-muted-foreground'>Watch your portfolio grow with proven strategies</p>
          </div>
        </div>

        {/* CTA Section */}
        <div className='mt-32 relative'>
          <div className='absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur-2xl' />
          <div className='relative p-12 bg-gradient-to-r from-card/80 to-card/40 border border-border/40 rounded-2xl backdrop-blur-sm text-center'>
            <h2 className='text-3xl sm:text-4xl font-bold mb-4'>
              Ready to Master Your Finances?
            </h2>
            <p className='text-lg text-muted-foreground mb-8 max-w-2xl mx-auto'>
              Join thousands of learners who are taking control of their financial destiny. Start your journey today with our comprehensive, expert-led courses.
            </p>
            <Link
              href='/sign-up'
              className='inline-block px-8 py-4 bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold rounded-lg hover:shadow-lg hover:shadow-primary/30 transition'
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
