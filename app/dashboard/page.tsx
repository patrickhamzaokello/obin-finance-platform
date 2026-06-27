import { redirect } from 'next/navigation';
import { isPlatformOwner } from '@/lib/school-context';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// On the apex domain /dashboard has no school context.
// Platform owners → /platform/admin. Everyone else → /sign-in.
export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect('/platform');
  if (await isPlatformOwner()) redirect('/platform/admin');
  redirect('/platform');
}
