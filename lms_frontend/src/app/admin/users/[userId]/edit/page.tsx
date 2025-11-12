/**
 * Edit User Page
 * Admin page to edit user details
 */

'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function EditUserPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = params?.userId as string;

  useEffect(() => {
    if (!isLoading) {
      // Redirect to a generic edit page or show coming soon
      alert('User editing functionality is coming soon. Please use the API directly for now.');
      router.back();
    }
  }, [isLoading, router]);

  return (
    <div className="flex items-center justify-center h-64">
      <LoadingSpinner size="lg" />
    </div>
  );
}

