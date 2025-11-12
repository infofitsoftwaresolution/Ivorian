/**
 * View Course Page
 * Admin page to view course details
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { apiClient } from '@/lib/api/client';

export default function ViewCoursePage() {
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const courseId = params?.courseId as string;
  const [loading, setLoading] = useState(true);
  const [courseData, setCourseData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
      return;
    }
    if (!authLoading && currentUser && currentUser.role !== 'super_admin' && currentUser.role !== 'organization_admin') {
      router.push('/dashboard');
    }
  }, [currentUser, router, authLoading]);

  useEffect(() => {
    if (courseId && (currentUser?.role === 'super_admin' || currentUser?.role === 'organization_admin')) {
      loadCourse();
    }
  }, [courseId, currentUser]);

  const loadCourse = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.getCourse(parseInt(courseId));
      setCourseData(response.data);
    } catch (err: any) {
      console.error('Error loading course:', err);
      setError(err?.response?.data?.detail || 'Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-red-600 hover:text-red-800"
          >
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!courseData) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Breadcrumb />
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-6 w-6" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Course Details</h1>
          <p className="text-gray-600">View course information</p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{courseData.title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500">Description</label>
            <p className="mt-1 text-sm text-gray-900">{courseData.description || 'No description'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Status</label>
            <p className="mt-1">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                courseData.status === 'published' ? 'bg-green-100 text-green-800' : 
                courseData.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 
                'bg-gray-100 text-gray-800'
              }`}>
                {courseData.status || 'Draft'}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

