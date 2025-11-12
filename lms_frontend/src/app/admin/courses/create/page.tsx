/**
 * Admin Courses Create Page
 * Redirects to tutor courses create (same functionality)
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function AdminCoursesCreatePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      // Redirect to tutor courses create (same functionality)
      router.replace('/tutor/courses/create');
    }
  }, [isLoading, router]);

  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Redirecting to course creation...</p>
      </div>
    </div>
  );
}

