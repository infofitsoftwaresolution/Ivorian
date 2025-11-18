/**
 * Tutor Root Page
 * Redirects to tutor dashboard
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function TutorPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to tutor dashboard
    router.replace('/tutor/dashboard');
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

