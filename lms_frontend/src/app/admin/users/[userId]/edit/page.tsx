/**
 * Edit User Page
 * Admin page to edit user details
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  ArrowLeftIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { apiClient } from '@/lib/api/client';

// Form validation schema (password optional for edit)
const userSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  role: z.enum(['student', 'tutor', 'organization_admin', 'super_admin']),
  organization_id: z.union([z.number(), z.string().transform((val) => val === '' ? undefined : Number(val))]).optional(),
  is_active: z.boolean().optional(),
});

type UserFormData = z.infer<typeof userSchema>;

interface Organization {
  id: number;
  name: string;
}

export default function EditUserPage() {
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = params?.userId as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [userData, setUserData] = useState<any>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
  });

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
    if (userId && (currentUser?.role === 'super_admin' || currentUser?.role === 'organization_admin')) {
      loadUser();
      if (currentUser?.role === 'super_admin') {
        loadOrganizations();
      }
    }
  }, [userId, currentUser]);

  const loadOrganizations = async () => {
    try {
      const response = await apiClient.getOrganizations();
      let orgsData: Organization[] = [];
      
      if (Array.isArray(response.data)) {
        orgsData = response.data;
      } else if (response.data?.organizations && Array.isArray(response.data.organizations)) {
        orgsData = response.data.organizations;
      }

      setOrganizations(orgsData);
    } catch (error) {
      console.error('Error loading organizations:', error);
    }
  };

  const loadUser = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await apiClient.getUser(userId);
      
      // Handle different response structures
      let user: any = null;
      if (response.data) {
        if (response.data.id) {
          user = response.data;
        } else if (response.data.user) {
          user = response.data.user;
        } else if (response.data.data) {
          user = response.data.data;
        }
      }

      if (!user) {
        throw new Error('User not found');
      }

      setUserData(user);
      reset({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || 'student',
        organization_id: user.organization_id,
        is_active: user.is_active !== false,
      });
    } catch (error: unknown) {
      console.error('Error loading user:', error);
      const errorMessage = (error && typeof error === 'object' && 'response' in error && 
        error.response && typeof error.response === 'object' && 'data' in error.response &&
        error.response.data && typeof error.response.data === 'object' && 'detail' in error.response.data)
        ? String((error.response.data as { detail?: string }).detail)
        : (error instanceof Error ? error.message : 'Failed to load user data');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: UserFormData) => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const updateData: any = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        role: data.role,
        is_active: data.is_active,
      };

      if (data.phone) {
        updateData.phone = data.phone;
      }

      if (currentUser?.role === 'super_admin' && data.organization_id) {
        updateData.organization_id = data.organization_id;
      }

      await apiClient.updateUser(parseInt(userId), updateData);
      
      setSuccess('User updated successfully!');
      setTimeout(() => {
        router.push('/admin/users');
      }, 1500);
    } catch (error: unknown) {
      console.error('Error updating user:', error);
      const errorMessage = (error && typeof error === 'object' && 'response' in error && 
        error.response && typeof error.response === 'object' && 'data' in error.response &&
        error.response.data && typeof error.response.data === 'object' && 'detail' in error.response.data)
        ? String((error.response.data as { detail?: string }).detail)
        : (error instanceof Error ? error.message : 'Failed to update user. Please try again.');
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!currentUser || (currentUser.role !== 'super_admin' && currentUser.role !== 'organization_admin')) {
    return null;
  }

  if (!userData) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error || 'User not found'}</p>
          <button
            onClick={() => router.push('/admin/users')}
            className="mt-4 text-red-600 hover:text-red-800 underline"
          >
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb />

      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.push('/admin/users')}
          className="text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-6 w-6" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
          <p className="text-gray-600">Update user information</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register('first_name')}
                type="text"
                id="first_name"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              {errors.first_name && (
                <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register('last_name')}
                type="text"
                id="last_name"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              {errors.last_name && (
                <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                {...register('email')}
                type="email"
                id="email"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                {...register('phone')}
                type="tel"
                id="phone"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                {...register('role')}
                id="role"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="student">Student</option>
                <option value="tutor">Tutor</option>
                {currentUser?.role === 'super_admin' && (
                  <>
                    <option value="organization_admin">Organization Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </>
                )}
              </select>
            </div>

            {currentUser?.role === 'super_admin' && (
              <div>
                <label htmlFor="organization_id" className="block text-sm font-medium text-gray-700">
                  Organization
                </label>
                <select
                  {...register('organization_id', { valueAsNumber: true })}
                  id="organization_id"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select Organization</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="flex items-center">
                <input
                  {...register('is_active')}
                  type="checkbox"
                  className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">Active</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push('/admin/users')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <UserIcon className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
