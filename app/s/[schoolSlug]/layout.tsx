import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { school } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ schoolSlug: string }>;
}): Promise<Metadata> {
  const { schoolSlug } = await params;
  const rows = await db.select({ name: school.name }).from(school).where(eq(school.slug, schoolSlug)).limit(1);
  const name = rows[0]?.name ?? 'Learning Platform';
  return {
    title: { default: name, template: `%s · ${name}` },
    description: `Online learning courses from ${name}.`,
  };
}

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
