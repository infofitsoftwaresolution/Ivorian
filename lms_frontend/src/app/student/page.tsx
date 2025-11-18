/**
 * Student Root Page
 * Redirects to student dashboard
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function StudentPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to student dashboard
    router.replace('/student/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}

