/**
 * Student Layout
 * Layout wrapper for student-specific pages with role-based access control
 */

'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import MainLayout from '@/components/layout/MainLayout';

interface StudentLayoutProps {
  children: React.ReactNode;
}

export default function StudentLayout({ children }: StudentLayoutProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Check if user is student and redirect if not
  useEffect(() => {
    if (!isLoading && user && user.role !== 'student' && !isRedirecting) {
      setIsRedirecting(true);
      router.push('/dashboard');
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

  // Don't render if not student
  if (!user || user.role !== 'student') {
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