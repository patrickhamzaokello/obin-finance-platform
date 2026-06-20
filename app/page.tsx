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
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4'>
      <div className='max-w-2xl w-full text-center'>
        <h1 className='text-5xl font-bold text-gray-900 mb-6'>Obin Finance</h1>
        <p className='text-xl text-gray-700 mb-4'>Learn finance at your own pace with our comprehensive courses</p>
        <p className='text-lg text-gray-600 mb-8'>Master financial concepts from basics to advanced strategies</p>

        <div className='flex gap-4 justify-center'>
          <Link
            href='/sign-in'
            className='px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition'
          >
            Sign In
          </Link>
          <Link
            href='/sign-up'
            className='px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition'
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
