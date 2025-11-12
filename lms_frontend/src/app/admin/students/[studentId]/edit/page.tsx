/**
 * Edit Student Page
 * Admin page to edit student details
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function EditStudentPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      // Redirect to a generic edit page or show coming soon
      alert('Student editing functionality is coming soon. Please use the API directly for now.');
      router.back();
    }
  }, [isLoading, router]);

  return (
    <div className="flex items-center justify-center h-64">
      <LoadingSpinner size="lg" />
    </div>
  );
}

