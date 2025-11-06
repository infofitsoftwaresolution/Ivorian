/**
 * Tutor Layout
 * Layout wrapper for tutor-specific pages with role-based access control
 */

'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import MainLayout from '@/components/layout/MainLayout';

interface TutorLayoutProps {
  children: React.ReactNode;
}

export default function TutorLayout({ children }: TutorLayoutProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Check if user is tutor and redirect if not
  useEffect(() => {
    if (!isLoading && user && user.role !== 'tutor' && !isRedirecting) {
      setIsRedirecting(true);
      // Redirect to role-specific dashboard instead of generic dashboard
      switch (user.role) {
        case 'super_admin':
          router.push('/admin/platform');
          break;
        case 'organization_admin':
          router.push('/admin/organization');
          break;
        case 'student':
          router.push('/student/dashboard');
          break;
        default:
          router.push('/dashboard');
      }
    }
  }, [user, router, isRedirecting, isLoading]);

  // Show loading while checking authentication
  if (isLoading || isRedirecting) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">
            {isLoading ? 'Loading...' : 'Redirecting...'}
          </p>
        </div>
      </div>
    );
  }

  // Don't render if not tutor
  if (!user || user.role !== 'tutor') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <MainLayout>
      {children}
    </MainLayout>
  );
}
