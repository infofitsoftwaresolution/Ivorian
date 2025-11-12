/**
 * View Student Page
 * Admin page to view student details
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { apiClient } from '@/lib/api/client';

export default function ViewStudentPage() {
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const studentId = params?.studentId as string;
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState<any>(null);
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
    if (studentId && (currentUser?.role === 'super_admin' || currentUser?.role === 'organization_admin')) {
      loadStudent();
    }
  }, [studentId, currentUser]);

  const loadStudent = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.getUser(studentId);
      setStudentData(response.data);
    } catch (err: any) {
      console.error('Error loading student:', err);
      setError(err?.response?.data?.detail || 'Failed to load student details');
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

  if (!studentData) {
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
          <h1 className="text-2xl font-bold text-gray-900">Student Details</h1>
          <p className="text-gray-600">View student information</p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500">Name</label>
            <p className="mt-1 text-sm text-gray-900">
              {studentData.first_name} {studentData.last_name}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Email</label>
            <p className="mt-1 text-sm text-gray-900">{studentData.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Status</label>
            <p className="mt-1">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                studentData.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {studentData.is_active ? 'Active' : 'Inactive'}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

