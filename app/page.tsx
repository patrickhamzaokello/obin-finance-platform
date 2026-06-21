import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import Link from 'next/link';

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session?.user) {
    if (session.user.role === 'admin') {
      redirect('/admin');
    }
    redirect('/dashboard');
  }

  return (
    <div className='min-h-screen bg-white flex items-center justify-center px-4'>
      <div className='max-w-2xl w-full text-center border-2 border-border p-8'>
        <h1 className='text-5xl font-bold text-foreground mb-6'>Obin Finance</h1>
        <p className='text-xl text-foreground mb-4'>Learn finance at your own pace with our comprehensive courses</p>
        <p className='text-lg text-muted-foreground mb-8'>Master financial concepts from basics to advanced strategies</p>

        <div className='flex gap-4 justify-center'>
          <Link
            href='/sign-in'
            className='px-8 py-3 bg-primary text-primary-foreground font-semibold border-2 border-primary hover:bg-primary/90 transition'
          >
            Sign In
          </Link>
          <Link
            href='/sign-up'
            className='px-8 py-3 bg-white text-foreground font-semibold border-2 border-border hover:bg-secondary transition'
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
