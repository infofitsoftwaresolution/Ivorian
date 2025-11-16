/**
 * Edit Student Page
 * Allows tutors to edit student information
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api/client';
import { 
  ArrowLeftIcon,
  EnvelopeIcon,
  UserIcon,
  PhoneIcon,
  KeyIcon
} from '@heroicons/react/24/outline';
import Breadcrumb from '@/components/ui/Breadcrumb';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import SuccessToast from '@/components/ui/SuccessToast';

interface StudentFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  password?: string;
  confirm_password?: string;
}

export default function EditStudent() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const studentId = parseInt(params.id as string);

  const [formData, setFormData] = useState<StudentFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ title: '', message: '' });

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        setLoading(true);
        setError('');
        console.log(`[EditStudent] Fetching student data for student ID: ${studentId}`);
        
        const response = await apiClient.getUser(studentId.toString());
        console.log('[EditStudent] Student data received:', response.data);
        
        const student = response.data;
        setFormData({
          first_name: student.first_name || '',
          last_name: student.last_name || '',
          email: student.email || '',
          phone: student.phone || '',
          password: '',
          confirm_password: ''
        });
      } catch (error: any) {
        console.error('[EditStudent] Error fetching student:', error);
        if (error?.status === 404) {
          setError('Student not found.');
        } else if (error?.status === 401 || error?.status === 403) {
          setError('You do not have permission to edit this student.');
          setTimeout(() => router.push('/tutor/students'), 2000);
        } else {
          setError('Failed to load student details. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      fetchStudent();
    }
  }, [studentId, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.first_name.trim()) {
      setError('First name is required');
      return false;
    }
    if (!formData.last_name.trim()) {
      setError('Last name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (formData.password && formData.password.length > 0) {
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters long');
        return false;
      }
      if (!/[A-Z]/.test(formData.password)) {
        setError('Password must contain at least one uppercase letter');
        return false;
      }
      if (!/[a-z]/.test(formData.password)) {
        setError('Password must contain at least one lowercase letter');
        return false;
      }
      if (!/[0-9]/.test(formData.password)) {
        setError('Password must contain at least one digit');
        return false;
      }
      if (formData.password !== formData.confirm_password) {
        setError('Passwords do not match');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      // Prepare update data (only include password if provided)
      const updateData: any = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone?.trim() || undefined
      };

      // Only include password if it's provided
      if (formData.password && formData.password.trim() !== '') {
        updateData.password = formData.password;
      }

      console.log('[EditStudent] Updating student with data:', updateData);
      
      const response = await apiClient.updateUser(studentId.toString(), updateData);
      console.log('[EditStudent] Student updated successfully:', response.data);
      
      setSuccessMessage({
        title: 'Student Updated Successfully!',
        message: `${formData.first_name} ${formData.last_name}'s information has been updated.`
      });
      setShowSuccessToast(true);
      
      // Redirect after showing toast
      setTimeout(() => {
        router.push(`/tutor/students/${studentId}`);
      }, 2000);
      
    } catch (error: any) {
      console.error('[EditStudent] Error updating student:', error);
      if (error?.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else if (error?.status === 403) {
        setError('You do not have permission to update this student.');
      } else if (error?.status === 400) {
        setError(`Validation error: ${error?.message || 'Please check your input and try again.'}`);
      } else {
        setError(`Failed to update student: ${error?.message || 'Please try again.'}`);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push(`/tutor/students/${studentId}`)}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Student Details
          </button>
          <div className="border-l border-gray-300 pl-4">
            <h1 className="text-2xl font-bold text-gray-900">Edit Student</h1>
            <p className="text-gray-600">Update student information</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Student Information</h2>
          <p className="text-sm text-gray-500">Update the student's details below</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-md font-medium text-gray-900 flex items-center">
              <UserIcon className="h-5 w-5 mr-2" />
              Personal Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <PhoneIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="+1234567890"
                />
              </div>
            </div>
          </div>

          {/* Password Section */}
          <div className="space-y-4 border-t border-gray-200 pt-6">
            <h3 className="text-md font-medium text-gray-900 flex items-center">
              <KeyIcon className="h-5 w-5 mr-2" />
              Change Password (Optional)
            </h3>
            <p className="text-sm text-gray-500">
              Leave password fields empty to keep the current password
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Leave empty to keep current password"
                />
                {formData.password && (
                  <p className="mt-1 text-xs text-gray-500">
                    Must be at least 8 characters with uppercase, lowercase, and digit
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirm_password"
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Confirm new password"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.push(`/tutor/students/${studentId}`)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              disabled={saving}
            >
              {saving ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Saving...</span>
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Success Toast */}
      <SuccessToast
        isOpen={showSuccessToast}
        onClose={() => setShowSuccessToast(false)}
        title={successMessage.title}
        message={successMessage.message}
      />
    </div>
  );
}

