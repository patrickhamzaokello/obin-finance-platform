import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';

export async function getUserWithRole() {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session?.user?.id) {
    return null;
  }

  try {
    const userData = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (userData.length === 0) {
      return null;
    }

    return {
      ...session.user,
      role: userData[0].role,
    };
  } catch (error) {
    console.error('Error fetching user with role:', error);
    return session.user;
  }
}
