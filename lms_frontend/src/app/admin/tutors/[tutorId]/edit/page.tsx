/**
 * Edit Tutor Page
 * Organization Admin can edit tutor details and reset password
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
  KeyIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { apiClient, ApiError } from '@/lib/api/client';

// Form validation schema
const tutorSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  bio: z.string().optional(),
  expertise: z.string().optional(),
  experience_years: z.number().min(0).max(50).optional().or(z.string().transform((val) => val === '' ? undefined : Number(val))),
  hourly_rate: z.number().min(0).optional().or(z.string().transform((val) => val === '' ? undefined : Number(val))),
  is_active: z.boolean().optional(),
});

type TutorFormData = z.infer<typeof tutorSchema>;

interface Tutor {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  bio?: string;
  expertise?: string;
  experience_years?: number;
  hourly_rate?: number;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_login?: string;
}

export default function EditTutorPage() {
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const tutorId = params?.tutorId as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tutorData, setTutorData] = useState<Tutor | null>(null);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetPasswordError, setResetPasswordError] = useState('');
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TutorFormData>({
    resolver: zodResolver(tutorSchema),
  });

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
      return;
    }
    if (!authLoading && currentUser && currentUser.role !== 'organization_admin') {
      router.push('/dashboard');
    }
  }, [currentUser, router, authLoading]);

  useEffect(() => {
    if (tutorId && currentUser?.role === 'organization_admin') {
      loadTutor();
    }
  }, [tutorId, currentUser]);

  const loadTutor = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await apiClient.getUser(tutorId);
      
      // Handle different response structures
      let tutor: any = null;
      if (response.data) {
        if (response.data.id) {
          tutor = response.data;
        } else if (response.data.user) {
          tutor = response.data.user;
        } else if (response.data.data) {
          tutor = response.data.data;
        }
      }

      if (!tutor) {
        throw new Error('Tutor not found');
      }

      // Verify this tutor belongs to the organization
      if (tutor.organization_id !== currentUser?.organization_id) {
        throw new Error('You can only edit tutors in your organization');
      }

      setTutorData(tutor);
      reset({
        first_name: tutor.first_name || '',
        last_name: tutor.last_name || '',
        email: tutor.email || '',
        phone: tutor.phone || '',
        bio: tutor.bio || '',
        expertise: tutor.expertise || '',
        experience_years: tutor.experience_years,
        hourly_rate: tutor.hourly_rate,
        is_active: tutor.is_active !== false,
      });
    } catch (err: unknown) {
      console.error('Error loading tutor:', err);
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load tutor data');
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: TutorFormData) => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const updateData: any = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        is_active: data.is_active,
      };

      if (data.phone) {
        updateData.phone = data.phone;
      }
      if (data.bio) {
        updateData.bio = data.bio;
      }
      if (data.expertise) {
        updateData.expertise = data.expertise;
      }
      if (data.experience_years !== undefined) {
        updateData.experience_years = data.experience_years;
      }
      if (data.hourly_rate !== undefined) {
        updateData.hourly_rate = data.hourly_rate;
      }

      await apiClient.updateUser(tutorId, updateData);
      
      setSuccess('Tutor updated successfully!');
      setTimeout(() => {
        router.push('/admin/tutors');
      }, 1500);
    } catch (err: unknown) {
      console.error('Error updating tutor:', err);
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to update tutor. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      setResettingPassword(true);
      setResetPasswordError('');
      setResetPasswordSuccess('');
      setGeneratedPassword('');

      const resetData: { new_password?: string; send_email: boolean } = {
        send_email: false, // Don't send email since it might fail in sandbox mode
      };

      // If user provided a password, use it; otherwise generate one
      if (newPassword.trim()) {
        resetData.new_password = newPassword.trim();
      }

      const response = await apiClient.resetUserPassword(tutorId, resetData);
      
      // Extract password from response
      const password = response.data?.password || response.data?.data?.password;
      
      if (password) {
        setGeneratedPassword(password);
        setResetPasswordSuccess('Password reset successfully!');
        setNewPassword(''); // Clear the input
        setShowPasswordReset(false);
      } else {
        setResetPasswordSuccess('Password reset successfully!');
        setNewPassword('');
        setShowPasswordReset(false);
      }
    } catch (err: unknown) {
      console.error('Error resetting password:', err);
      if (err instanceof ApiError) {
        setResetPasswordError(err.message);
      } else if (err instanceof Error) {
        setResetPasswordError(err.message);
      } else {
        setResetPasswordError('Failed to reset password. Please try again.');
      }
    } finally {
      setResettingPassword(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'organization_admin') {
    return null;
  }

  if (!tutorData) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error || 'Tutor not found'}</p>
          <button
            onClick={() => router.push('/admin/tutors')}
            className="mt-4 text-red-600 hover:text-red-800 underline"
          >
            Back to Tutors
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
          onClick={() => router.push('/admin/tutors')}
          className="text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-6 w-6" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Tutor</h1>
          <p className="text-gray-600">Update tutor information</p>
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

      {resetPasswordSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-semibold mb-2">{resetPasswordSuccess}</p>
          {generatedPassword && (
            <div className="mt-3 p-3 bg-white rounded border border-green-300">
              <p className="text-sm text-gray-700 mb-1">New Password:</p>
              <div className="flex items-center space-x-2">
                <code className="flex-1 px-3 py-2 bg-gray-100 rounded font-mono text-lg font-bold">
                  {showPassword ? generatedPassword : '•'.repeat(generatedPassword.length)}
                </code>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="px-3 py-2 text-gray-600 hover:text-gray-900"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedPassword);
                    alert('Password copied to clipboard!');
                  }}
                  className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Share this password with the tutor. They will be prompted to change it on first login.
              </p>
            </div>
          )}
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

            <div className="md:col-span-2">
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                Bio
              </label>
              <textarea
                {...register('bio')}
                id="bio"
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="expertise" className="block text-sm font-medium text-gray-700">
                Expertise
              </label>
              <input
                {...register('expertise')}
                type="text"
                id="expertise"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="experience_years" className="block text-sm font-medium text-gray-700">
                Experience (Years)
              </label>
              <input
                {...register('experience_years', { valueAsNumber: true })}
                type="number"
                id="experience_years"
                min="0"
                max="50"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="hourly_rate" className="block text-sm font-medium text-gray-700">
                Hourly Rate
              </label>
              <input
                {...register('hourly_rate', { valueAsNumber: true })}
                type="number"
                id="hourly_rate"
                min="0"
                step="0.01"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

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

          {/* Password Reset Section */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Password Management</h3>
                <p className="text-sm text-gray-500">Reset the tutor's password</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordReset(!showPasswordReset);
                  setResetPasswordError('');
                  setResetPasswordSuccess('');
                  setGeneratedPassword('');
                  setNewPassword('');
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <KeyIcon className="h-4 w-4 mr-2" />
                {showPasswordReset ? 'Cancel' : 'Reset Password'}
              </button>
            </div>

            {showPasswordReset && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                {resetPasswordError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-800 text-sm">{resetPasswordError}</p>
                  </div>
                )}

                <div>
                  <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-2">
                    New Password (Optional)
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Leave empty to generate a temporary password. Password must be at least 8 characters with uppercase, lowercase, and a digit.
                  </p>
                  <input
                    type="password"
                    id="new_password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Leave empty to auto-generate"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={resettingPassword}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                >
                  {resettingPassword ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <KeyIcon className="h-4 w-4 mr-2" />
                      Reset Password
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.push('/admin/tutors')}
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
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

