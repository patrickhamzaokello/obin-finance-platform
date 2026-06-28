import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { checkCourseAccess } from '@/app/actions/access-codes';
import { getCourseById } from '@/app/actions/courses';
import LearningClient from './learning-client';
import AccessGate from './access-gate';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ courseId: string }>;
}): Promise<Metadata> {
  const { courseId } = await params;
  const result = await getCourseById(courseId);
  const title = result.success && result.data?.title ? result.data.title : 'Learn';
  return { title };
}

export default async function LearningPage({
  params,
}: {
  params: Promise<{ courseId: string; schoolSlug: string }>;
}) {
  const { courseId } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect('/sign-in');

  // Fetch course metadata server-side (for the gate UI)
  const courseResult = await getCourseById(courseId);
  if (!courseResult.success || !courseResult.data) redirect('/dashboard');
  const course = courseResult.data;

  const hasAccess = await checkCourseAccess(courseId);

  if (!hasAccess) {
    return <AccessGate courseId={courseId} courseTitle={course.title} courseThumbnail={course.thumbnail} />;
  }

  return <LearningClient courseId={courseId} />;
}
