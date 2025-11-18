/**
 * Create Organization Page
 * Super Admin can create new organizations with admin users
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { apiClient } from '@/lib/api/client';

// Form validation schema
const organizationSchema = z.object({
  // Organization details
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  website: z.string().url('Please enter a valid website URL'),
  contact_email: z.string().email('Please enter a valid email address'),
  contact_phone: z.string().optional(),
  address: z.string().optional(),
  industry: z.string().min(1, 'Please select an industry'),
  size: z.string().min(1, 'Please select organization size'),
  
  // Admin user details
  admin_email: z.string().email('Please enter a valid email address'),
  admin_password: z.string().min(8, 'Password must be at least 8 characters'),
  admin_first_name: z.string().min(1, 'First name is required'),
  admin_last_name: z.string().min(1, 'Last name is required'),
});

type OrganizationFormData = z.infer<typeof organizationSchema>;

const industryOptions = [
  'Technology',
  'Education',
  'Healthcare',
  'Finance',
  'Manufacturing',
  'Retail',
  'Consulting',
  'Non-profit',
  'Government',
  'Other'
];

const sizeOptions = [
  '1-10',
  '11-50',
  '51-200',
  '201-500',
  '501-1000',
  '1000+'
];

export default function CreateOrganization() {
  const { user, isLoading, refreshUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [successData, setSuccessData] = useState<{email: string; password: string} | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      industry: '',
      size: '',
    }
  });

  // Check if user is super admin and redirect if not
  useEffect(() => {
    if (!isLoading && user && user.role !== 'super_admin' && !isRedirecting) {
      setIsRedirecting(true);
      router.push('/dashboard');
    }
  }, [user, router, isRedirecting, isLoading]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if redirecting or not super admin
  if (isRedirecting || (user && user.role !== 'super_admin')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: OrganizationFormData) => {
    try {
      setLoading(true);
      setError('');

      // Prepare data for backend API - flatten the structure to match OrganizationRegister schema
      const organizationData = {
        name: data.name,
        description: data.description,
        website: data.website,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone || '',
        address: data.address || '',
        industry: data.industry,
        size: data.size,
        admin_email: data.admin_email,
        admin_password: data.admin_password,
        admin_first_name: data.admin_first_name,
        admin_last_name: data.admin_last_name,
      };

      // Call backend API
      const response = await apiClient.registerOrganization(organizationData);
      
      // Store success data to show credentials
      if (response.data?.admin_user && response.data?.temp_password) {
        setSuccessData({
          email: response.data.admin_user.email,
          password: response.data.temp_password
        });
      }
      
      // Refresh user authentication state
      await refreshUser();
      
      // Don't redirect immediately - show success message with credentials first
      // User can click to continue to organizations list

    } catch (err: any) {
      console.error('Error creating organization:', err);
      setError(err.message || 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb />

      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.back()}
          className="p-2 text-gray-400 hover:text-gray-600"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Organization</h1>
          <p className="text-gray-600">Create a new organization with admin user</p>
        </div>
      </div>

      {/* Success Message with Credentials */}
      {successData && (
        <div className="bg-green-50 border border-green-200 rounded-md p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-4">✅ Organization Created Successfully!</h3>
          <p className="text-green-700 mb-4">The organization admin user has been created. Please save these credentials:</p>
          <div className="bg-white rounded-md p-4 mb-4 space-y-2">
            <div>
              <span className="font-medium text-gray-700">Email: </span>
              <span className="text-gray-900 font-mono">{successData.email}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Password: </span>
              <span className="text-gray-900 font-mono">{successData.password}</span>
            </div>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => {
                setSuccessData(null);
                router.push('/admin/organizations?created=true');
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Go to Organizations List
            </button>
            <button
              onClick={() => {
                setSuccessData(null);
                reset();
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Create Another Organization
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Form - Hide if success */}
      {!successData && (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Organization Details */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Organization Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Organization Name *
              </label>
              <input
                type="text"
                {...register('name')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                placeholder="Enter organization name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Website *
              </label>
              <input
                type="url"
                {...register('website')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                placeholder="https://example.com"
              />
              {errors.website && (
                <p className="mt-1 text-sm text-red-600">{errors.website.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Contact Email *
              </label>
              <input
                type="email"
                {...register('contact_email')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                placeholder="contact@organization.com"
              />
              {errors.contact_email && (
                <p className="mt-1 text-sm text-red-600">{errors.contact_email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Contact Phone
              </label>
              <input
                type="tel"
                {...register('contact_phone')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Industry *
              </label>
              <select
                {...register('industry')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
              >
                <option value="">Select industry</option>
                {industryOptions.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
              {errors.industry && (
                <p className="mt-1 text-sm text-red-600">{errors.industry.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Organization Size *
              </label>
              <select
                {...register('size')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
              >
                <option value="">Select size</option>
                {sizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size} employees
                  </option>
                ))}
              </select>
              {errors.size && (
                <p className="mt-1 text-sm text-red-600">{errors.size.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <textarea
                {...register('address')}
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                placeholder="Enter organization address"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Description *
              </label>
              <textarea
                {...register('description')}
                rows={4}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                placeholder="Describe the organization's mission and activities"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Admin User Details */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Admin User Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                First Name *
              </label>
              <input
                type="text"
                {...register('admin_first_name')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                placeholder="Enter first name"
              />
              {errors.admin_first_name && (
                <p className="mt-1 text-sm text-red-600">{errors.admin_first_name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Last Name *
              </label>
              <input
                type="text"
                {...register('admin_last_name')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                placeholder="Enter last name"
              />
              {errors.admin_last_name && (
                <p className="mt-1 text-sm text-red-600">{errors.admin_last_name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email Address *
              </label>
              <input
                type="email"
                {...register('admin_email')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                placeholder="admin@organization.com"
              />
              {errors.admin_email && (
                <p className="mt-1 text-sm text-red-600">{errors.admin_email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password *
              </label>
              <input
                type="password"
                {...register('admin_password')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                placeholder="Enter password (min 8 characters)"
              />
              {errors.admin_password && (
                <p className="mt-1 text-sm text-red-600">{errors.admin_password.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Creating...
              </>
            ) : (
              'Create Organization'
            )}
          </button>
        </div>
      </form>
      )}
    </div>
  );
}
