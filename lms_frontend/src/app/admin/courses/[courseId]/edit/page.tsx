/**
 * Admin Course Edit Page
 * Redirects to tutor course edit (same functionality)
 */

'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function AdminCourseEditPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params?.courseId as string;
  const { isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && courseId) {
      // Redirect to tutor course edit (same functionality)
      router.replace(`/tutor/courses/${courseId}/edit`);
    }
  }, [isLoading, courseId, router]);

  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Redirecting to course editor...</p>
      </div>
    </div>
  );
}

