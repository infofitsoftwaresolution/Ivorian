/**
 * Main Dashboard Page
 * Redirects users to their role-specific dashboards
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Breadcrumb from '@/components/ui/Breadcrumb';

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    console.log('Dashboard useEffect triggered');
    console.log('isLoading:', isLoading);
    console.log('isAuthenticated:', isAuthenticated);
    console.log('user:', user);
    console.log('user?.role:', user?.role);
    
    if (!isLoading && isAuthenticated && user && !isRedirecting) {
      console.log('Dashboard: User role is:', user.role);
      console.log('Dashboard: User data:', user);
      
      setIsRedirecting(true);
      
      // Redirect based on user role
      switch (user.role) {
        case 'super_admin':
          console.log('Dashboard: Redirecting super admin to platform');
          router.push('/admin/platform');
          break;
        case 'organization_admin':
          console.log('Dashboard: Redirecting org admin to organization dashboard');
          router.push('/admin/organization');
          break;
        case 'tutor':
          console.log('Dashboard: Redirecting tutor to tutor dashboard');
          router.push('/tutor/dashboard');
          break;
        case 'student':
          console.log('Dashboard: Redirecting student to student dashboard');
          router.push('/student/dashboard');
          break;
        default:
          console.log('Dashboard: Unknown role, staying on overview page');
          // Don't redirect, stay on this page and show overview
          setIsRedirecting(false);
          break;
      }
    }
  }, [isLoading, isAuthenticated, user, router, isRedirecting]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // If redirecting, show loading
  if (isRedirecting) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Redirecting you to your dashboard...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, this should be handled by MainLayout
  if (!isAuthenticated) {
    return null;
  }

  // Show welcome message for users with unknown roles
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb />
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.first_name}!</h1>
          <p className="text-gray-600">Role: {user?.role || 'Unknown'}</p>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Dashboard</h2>
        <p className="text-gray-600">
          You're currently on the main dashboard. Your role ({user?.role || 'Unknown'}) doesn't have a specific dashboard configured yet.
        </p>
      </div>
    </div>
  );
}
