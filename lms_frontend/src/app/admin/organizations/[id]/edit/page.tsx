/**
 * Edit Organization Page
 * Super Admin page for editing organization information
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/hooks/useAuth';
import { 
  BuildingOfficeIcon, 
  ArrowLeftIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Breadcrumb from '@/components/ui/Breadcrumb';

interface OrganizationFormData {
  name: string;
  description: string;
  website: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  industry: string;
  size: string;
  is_active: boolean;
}

export default function EditOrganizationPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const organizationId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [organization, setOrganization] = useState<OrganizationFormData | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<OrganizationFormData>();

  // Check if user is super admin
  useEffect(() => {
    console.log('EditOrganizationPage: Auth check - authLoading:', authLoading, 'user:', user);
    if (!authLoading && !user) {
      console.log('EditOrganizationPage: No user found, redirecting to login');
      router.push('/login');
      return;
    }
    if (!authLoading && user && user.role !== 'super_admin') {
      console.log('EditOrganizationPage: Redirecting - user:', user, 'role:', user?.role);
      router.push('/dashboard');
    }
  }, [user, router, authLoading]);

  useEffect(() => {
    console.log('EditOrganizationPage: Data loading check - authLoading:', authLoading, 'user role:', user?.role);
    if (!authLoading && user?.role === 'super_admin' && organizationId) {
      console.log('EditOrganizationPage: Starting data load for org ID:', organizationId);
      loadOrganization();
    }
  }, [user, authLoading, organizationId]);

  const loadOrganization = async () => {
    try {
      console.log('EditOrganizationPage: Loading organization...');
      setLoading(true);
      
      // Add a small delay to simulate API call
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // TODO: Replace with actual API call
      // const response = await apiClient.getOrganization(organizationId);
      
      // Mock data for now
      const mockOrganization: OrganizationFormData = {
        name: "Tech Academy",
        description: "Leading technology education provider specializing in software development, data science, and digital transformation. We offer comprehensive training programs for individuals and corporate teams.",
        website: "https://techacademy.com",
        contact_email: "admin@techacademy.com",
        contact_phone: "+1-555-0123",
        address: "123 Tech Street, Silicon Valley, CA 94025",
        industry: "Technology",
        size: "51-200",
        is_active: true
      };

      setOrganization(mockOrganization);
      reset(mockOrganization); // Set form data
      console.log('EditOrganizationPage: Data loaded successfully');
    } catch (error) {
      console.error('Error loading organization:', error);
      setError('Failed to load organization data');
    } finally {
      setLoading(false);
      console.log('EditOrganizationPage: Loading completed');
    }
  };

  const onSubmit = async (data: OrganizationFormData) => {
    try {
      console.log('EditOrganizationPage: Submitting form data:', data);
      setSaving(true);
      setError('');
      
      // Add a small delay to simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // TODO: Replace with actual API call
      // await apiClient.updateOrganization(organizationId, data);
      
      console.log('EditOrganizationPage: Organization updated successfully');
      
      // Redirect to organization detail page
      router.push(`/admin/organizations/${organizationId}`);
    } catch (err: any) {
      console.error('Error updating organization:', err);
      setError(err.message || 'Failed to update organization');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    router.push(`/admin/organizations/${organizationId}`);
  };

  // Show loading while checking authentication or loading data
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">
            {authLoading ? 'Loading authentication...' : 'Loading organization...'}
          </p>
        </div>
      </div>
    );
  }

  // Don't render if not super admin
  if (!user || user.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Show error if organization not found
  if (!organization) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Organization not found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The organization you're trying to edit doesn't exist.
          </p>
          <div className="mt-6">
            <button
              onClick={() => router.push('/admin/organizations')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Organizations
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb />

      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={handleBack}
          className="p-2 text-gray-400 hover:text-gray-600"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Organization</h1>
          <p className="text-gray-600">Update organization information and settings</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Organization Name *
              </label>
              <input
                type="text"
                {...register('name', { required: 'Organization name is required' })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                placeholder="Enter organization name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Industry *
              </label>
              <select
                {...register('industry', { required: 'Industry is required' })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
              >
                <option value="">Select industry</option>
                <option value="Technology">Technology</option>
                <option value="Business">Business</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Education">Education</option>
                <option value="Finance">Finance</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Retail">Retail</option>
                <option value="Arts">Arts</option>
                <option value="Other">Other</option>
              </select>
              {errors.industry && (
                <p className="mt-1 text-sm text-red-600">{errors.industry.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Company Size *
              </label>
              <select
                {...register('size', { required: 'Company size is required' })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
              >
                <option value="">Select size</option>
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="201-500">201-500 employees</option>
                <option value="501-1000">501-1000 employees</option>
                <option value="1000+">1000+ employees</option>
              </select>
              {errors.size && (
                <p className="mt-1 text-sm text-red-600">{errors.size.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <div className="mt-1">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    {...register('is_active')}
                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700">
              Description *
            </label>
            <textarea
              {...register('description', { required: 'Description is required' })}
              rows={4}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
              placeholder="Enter organization description"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Contact Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Website *
              </label>
              <input
                type="url"
                {...register('website', { 
                  required: 'Website is required',
                  pattern: {
                    value: /^https?:\/\/.+/,
                    message: 'Please enter a valid URL starting with http:// or https://'
                  }
                })}
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
                {...register('contact_email', { 
                  required: 'Contact email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Please enter a valid email address'
                  }
                })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                placeholder="contact@example.com"
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
                placeholder="+1-555-0123"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <input
                type="text"
                {...register('address')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                placeholder="Enter organization address"
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleBack}
            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">Saving...</span>
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
