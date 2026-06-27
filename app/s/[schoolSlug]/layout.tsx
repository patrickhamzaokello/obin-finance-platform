import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { school } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export default async function SchoolLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ schoolSlug: string }>;
}) {
  const { schoolSlug } = await params;
  const rows = await db.select().from(school).where(eq(school.slug, schoolSlug)).limit(1);
  if (!rows.length) notFound();

  return <>{children}</>;
}
