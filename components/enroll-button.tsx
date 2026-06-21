'use client';

import { useState } from 'react';
import { enrollCourse } from '@/app/actions/courses';
import { useRouter } from 'next/navigation';

interface EnrollButtonProps {
  courseId: string;
  isEnrolled: boolean;
}

export function EnrollButton({ courseId, isEnrolled }: EnrollButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleEnroll = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await enrollCourse(courseId);
      if (result.success) {
        // Refresh the page to reflect enrollment status
        router.refresh();
        // Navigate to the course learning page
        setTimeout(() => {
          router.push(`/learning/${courseId}`);
        }, 500);
      } else {
        setError(result.error || 'Failed to enroll in course');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('[v0] Enrollment error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (isEnrolled) {
    return (
      <button
        onClick={() => router.push(`/learning/${courseId}`)}
        className="w-full px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 transition-colors"
      >
        Continue Learning
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleEnroll}
        disabled={loading}
        className="w-full px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Enrolling...' : 'Enroll Now'}
      </button>
      {error && <p className="text-sm text-destructive text-center">{error}</p>}
    </div>
  );
}
