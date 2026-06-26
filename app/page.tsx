import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import Link from 'next/link';
import { ChevronRight, Zap, Target, TrendingUp } from 'lucide-react';

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session?.user) {
    if (session.user.role === 'admin') redirect('/admin');
    redirect('/dashboard');
  }

  return (
    <div className='min-h-screen bg-white text-foreground'>
      {/* Navigation */}
      <nav className='flex items-center justify-between px-6 sm:px-10 py-5 border-b border-border'>
        <div className='flex items-center gap-3'>
          <img src='/horse-logo.png' alt='Obin Finance' className='w-7 h-7' />
          <span className='text-xl font-bold text-primary tracking-tight'>Obin Finance</span>
        </div>
        <div className='flex gap-2 items-center'>
          <Link
            href='/sign-in'
            className='px-5 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors'
          >
            Sign In
          </Link>
          <Link
            href='/sign-up'
            className='px-5 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors'
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className='max-w-7xl mx-auto px-6 sm:px-10 pt-20 pb-12 slide-up'>
        <div className='flex flex-col items-center text-center space-y-8 max-w-3xl mx-auto'>
          <div className='inline-flex items-center gap-2 px-3 py-1.5 bg-primary/8 border border-primary/20 rounded text-xs font-semibold text-primary uppercase tracking-wider'>
            Master Your Financial Future
          </div>

          <h1 className='text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.08] tracking-tight'>
            Build Wealth Through{' '}
            <span className='text-primary'>Financial Mastery</span>
          </h1>

          <p className='text-lg text-muted-foreground leading-relaxed max-w-xl'>
            Expert-led courses in budgeting, investing, and wealth management — structured for real results.
          </p>

          <div className='flex flex-col sm:flex-row gap-3 pt-2'>
            <Link
              href='/sign-up'
              className='inline-flex items-center gap-2 px-7 py-3 bg-primary text-primary-foreground font-semibold rounded hover:bg-primary/90 transition-colors'
            >
              Start Learning Today
              <ChevronRight className='w-4 h-4' />
            </Link>
            <Link
              href='/sign-in'
              className='inline-flex items-center justify-center px-7 py-3 border border-border bg-white text-foreground font-semibold rounded hover:bg-secondary transition-colors'
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Hero image */}
        <div className='mt-14 fade-in-image'>
          <div className='relative rounded-lg overflow-hidden border border-border shadow-lg bg-white max-w-4xl mx-auto'>
            <img
              src='/images/financial-management-graphic.png'
              alt='Complete financial management framework'
              className='w-full h-auto object-cover aspect-video hover:scale-[1.02] transition-transform duration-500'
            />
            <div className='absolute inset-0 bg-gradient-to-t from-black/8 via-transparent to-transparent pointer-events-none' />
          </div>
        </div>
      </div>

      {/* Value propositions — left-border cards */}
      <div className='max-w-7xl mx-auto px-6 sm:px-10 py-16'>
        <div className='grid sm:grid-cols-3 gap-5'>
          <div className='card-accent p-6 space-y-3'>
            <Zap className='w-5 h-5 text-primary' />
            <h3 className='font-semibold text-foreground'>Learn at Your Pace</h3>
            <p className='text-sm text-muted-foreground'>Flexible courses you can study anytime, anywhere — no rigid schedules.</p>
          </div>
          <div className='card-accent p-6 space-y-3'>
            <Target className='w-5 h-5 text-primary' />
            <h3 className='font-semibold text-foreground'>Expert Instructors</h3>
            <p className='text-sm text-muted-foreground'>Industry leaders with decades of real-world financial experience.</p>
          </div>
          <div className='card-accent p-6 space-y-3'>
            <TrendingUp className='w-5 h-5 text-primary' />
            <h3 className='font-semibold text-foreground'>Complete Curriculum</h3>
            <p className='text-sm text-muted-foreground'>From investment basics to advanced portfolio strategies, end-to-end.</p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className='max-w-7xl mx-auto px-6 sm:px-10'>
        <div className='border-t border-border' />
      </div>

      {/* Why Choose Obin */}
      <div className='max-w-7xl mx-auto px-6 sm:px-10 py-20'>
        <div className='mb-12'>
          <h2 className='text-3xl sm:text-4xl font-bold text-foreground'>Why Choose Obin Finance</h2>
          <p className='mt-3 text-muted-foreground max-w-lg'>
            Practical knowledge, expert guidance, and a community of learners building real financial futures.
          </p>
        </div>

        <div className='grid md:grid-cols-3 gap-6'>
          {[
            {
              src: '/images/learning-african.png',
              alt: 'Young African professionals learning finance together',
              title: 'Expert Learning',
              desc: 'Learn from industry experts with proven track records and real-world results.',
            },
            {
              src: '/images/planning-african.png',
              alt: 'Young African financial advisor planning with client',
              title: 'Strategic Planning',
              desc: 'Build personalised financial plans using frameworks from our comprehensive courses.',
            },
            {
              src: '/images/success-african.png',
              alt: 'Young African professionals celebrating financial success',
              title: 'Proven Success',
              desc: 'Join thousands who have transformed their financial lives through Obin Finance.',
            },
          ].map((card) => (
            <div
              key={card.title}
              className='group border border-border bg-white rounded overflow-hidden hover:border-primary hover:shadow-md transition-all duration-200'
            >
              <div className='h-56 overflow-hidden bg-secondary'>
                <img
                  src={card.src}
                  alt={card.alt}
                  className='w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300'
                />
              </div>
              <div className='p-5 border-t-[3px] border-t-primary'>
                <h3 className='font-semibold text-foreground'>{card.title}</h3>
                <p className='text-sm text-muted-foreground mt-2 leading-relaxed'>{card.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className='max-w-7xl mx-auto px-6 sm:px-10 pb-24'>
        <div className='border border-border border-l-[4px] border-l-primary rounded bg-secondary px-10 py-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8'>
          <div className='max-w-lg'>
            <h2 className='text-2xl sm:text-3xl font-bold text-foreground'>Ready to Master Your Finances?</h2>
            <p className='mt-3 text-muted-foreground'>
              Start your journey today with expert-led courses designed for real financial transformation.
            </p>
          </div>
          <Link
            href='/sign-up'
            className='shrink-0 inline-flex items-center gap-2 px-7 py-3 bg-primary text-primary-foreground font-semibold rounded hover:bg-primary/90 transition-colors'
          >
            Begin Your Journey
            <ChevronRight className='w-4 h-4' />
          </Link>
        </div>
      </div>
    </div>
  );
}
