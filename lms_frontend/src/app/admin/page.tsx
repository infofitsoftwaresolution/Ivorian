/**
 * Admin Root Page
 * Redirects to platform dashboard for super admins
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user?.role === 'super_admin') {
        router.replace('/admin/platform');
      } else if (user?.role === 'organization_admin') {
        router.replace('/admin/organization');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}

