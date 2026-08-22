import { redirect } from 'next/navigation';

// Redirect old /learning/[courseId] → /learn/[courseId]
export default async function LearningRedirect({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  redirect(`/learn/${courseId}`);
}
