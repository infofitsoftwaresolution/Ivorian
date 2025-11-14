/**
 * Create Student Page
 * Admin page for creating new students and enrolling them in courses
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  ArrowLeftIcon,
  UserPlusIcon,
  AcademicCapIcon,
  XMarkIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { apiClient } from '@/lib/api/client';

// Form validation schema
const studentSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional(),
  organization_id: z.preprocess(
    (val) => {
      if (val === '' || val === undefined || val === null) return undefined;
      if (typeof val === 'string') return val === '' ? undefined : Number(val);
      return val;
    },
    z.number().optional()
  ),
  course_ids: z.array(z.number()).default([]),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

type StudentFormData = z.infer<typeof studentSchema>;

interface Course {
  id: number;
  title: string;
  description: string;
  status: string;
  organization_id?: number;
  organization_name?: string;
}

interface Organization {
  id: number;
  name: string;
}

export default function CreateStudentPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [courseSearchTerm, setCourseSearchTerm] = useState('');
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      course_ids: [],
      organization_id: user?.organization_id,
    }
  });

  const selectedCourseIds = watch('course_ids');
  const selectedOrganizationId = watch('organization_id');

  // Check if user is super admin or organization admin
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (!authLoading && user && user.role !== 'super_admin' && user.role !== 'organization_admin') {
      setIsRedirecting(true);
      router.push('/dashboard');
    }
  }, [user, router, authLoading]);

  // Auto-redirect on success after 2 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        router.push('/admin/students');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success, router]);

  // Load organizations (only for super admin)
  useEffect(() => {
    const loadOrganizations = async () => {
      if (user?.role !== 'super_admin') {
        return;
      }

      try {
        setLoadingOrgs(true);
        const response = await apiClient.getOrganizations();
        let orgsData: Organization[] = [];
        
        if (Array.isArray(response.data)) {
          orgsData = response.data;
        } else if (response.data?.organizations && Array.isArray(response.data.organizations)) {
          orgsData = response.data.organizations;
        }

        setOrganizations(orgsData);
      } catch (error: unknown) {
        // Silently handle 404 errors (API endpoint not implemented yet)
        if (error && typeof error === 'object' && 'status' in error) {
          const errorWithStatus = error as { status?: number };
          if (errorWithStatus.status === 404) {
            // API endpoint not available yet - set empty organizations
            setOrganizations([]);
            // Don't log 404 errors as they're expected when endpoint doesn't exist
          } else {
            // Log other errors but still allow form to work
            console.error('Error loading organizations:', error);
            setOrganizations([]);
          }
        } else {
          // Log other errors but still allow form to work
          console.error('Error loading organizations:', error);
          setOrganizations([]);
        }
      } finally {
        setLoadingOrgs(false);
      }
    };

    if (user?.role === 'super_admin') {
      loadOrganizations();
    }
  }, [user]);

  // Load courses
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoadingCourses(true);
        const response = await apiClient.getCourses();
        
        let coursesData: Course[] = [];
        if (Array.isArray(response.data)) {
          coursesData = response.data;
        } else if (response.data?.courses && Array.isArray(response.data.courses)) {
          coursesData = response.data.courses;
        }

        // Filter courses based on organization if organization_admin
        if (user?.role === 'organization_admin' && user.organization_id) {
          coursesData = coursesData.filter(course => 
            course.organization_id === user.organization_id
          );
        }

        // Filter only published/draft courses
        coursesData = coursesData.filter(course => 
          course.status === 'published' || course.status === 'draft'
        );

        setCourses(coursesData);
      } catch (error) {
        console.error('Error loading courses:', error);
      } finally {
        setLoadingCourses(false);
      }
    };

    if (user) {
      loadCourses();
    }
  }, [user, selectedOrganizationId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.course-dropdown-container')) {
        setShowCourseDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCourseToggle = (courseId: number) => {
    const currentIds = selectedCourseIds || [];
    const isSelected = currentIds.includes(courseId);
    
    if (isSelected) {
      setValue('course_ids', currentIds.filter(id => id !== courseId));
    } else {
      setValue('course_ids', [...currentIds, courseId]);
    }
  };

  const removeCourse = (courseId: number) => {
    const currentIds = selectedCourseIds || [];
    setValue('course_ids', currentIds.filter(id => id !== courseId));
  };

  // Filter courses based on search term
  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(courseSearchTerm.toLowerCase()) ||
    course.description?.toLowerCase().includes(courseSearchTerm.toLowerCase())
  );

  // Get selected courses for display
  const selectedCourses = courses.filter(course => 
    selectedCourseIds?.includes(course.id)
  );

  const onSubmit = async (data: StudentFormData) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Determine organization_id
      let organizationId: number | undefined;
      if (user?.role === 'super_admin') {
        organizationId = data.organization_id;
      } else if (user?.role === 'organization_admin') {
        organizationId = user.organization_id;
      }

      // Prepare student data
      const studentData: Record<string, any> = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        password: data.password,
        role: 'student',
        is_active: true,
      };

      if (data.phone) {
        studentData.phone = data.phone;
      }

      if (organizationId) {
        studentData.organization_id = organizationId;
      }

      console.log('Creating student with data:', studentData);
      
      // Create student
      const response = await apiClient.createUser(studentData);
      console.log('Student created successfully:', response);
      
      const studentId = response.data?.id || response.data?.user?.id;
      
      if (!studentId) {
        throw new Error('Student ID not found in response');
      }

      // Enroll student in selected courses
      if (data.course_ids && data.course_ids.length > 0) {
        console.log('Enrolling student in courses:', data.course_ids);
        
        const enrollmentPromises = data.course_ids.map(courseId => 
          apiClient.enrollStudentInCourse(studentId, courseId).catch(err => {
            console.error(`Failed to enroll in course ${courseId}:`, err);
            // Continue with other enrollments even if one fails
            return null;
          })
        );

        await Promise.all(enrollmentPromises);
        console.log('Enrollment process completed');
      }
      
      // Show success message
      setSuccess('Student created successfully! Redirecting to students list...');
      
      // Reset form
      reset();

    } catch (err: any) {
      console.error('Error creating student:', err);
      console.log('Error object:', JSON.stringify(err, null, 2));
      console.log('Error details:', err.details);
      
      let errorMessage = 'Failed to create student';
      
      // Check for error message in different locations
      if (err instanceof Error) {
        // Check if the error message contains useful information
        if (err.message && !err.message.startsWith('HTTP')) {
          errorMessage = err.message;
        } else if (err.message && err.message.includes('already exists')) {
          errorMessage = 'A user with this email address already exists. Please use a different email address.';
        }
      }
      
      // Check error details
      if (err.details) {
        if (err.details.detail) {
          if (Array.isArray(err.details.detail)) {
            errorMessage = err.details.detail.map((e: any) => {
              if (typeof e === 'string') return e;
              if (e.msg) return `${e.loc?.join('.') || 'Field'}: ${e.msg}`;
              return JSON.stringify(e);
            }).join(', ');
          } else if (typeof err.details.detail === 'string') {
            errorMessage = err.details.detail;
          }
        } else if (err.details.message) {
          errorMessage = err.details.message;
        }
      }
      
      // Check the error message itself for common patterns
      if (err.message) {
        const msg = err.message.toString();
        if (msg.includes('already exists') || msg.includes('duplicate') || msg.includes('422')) {
          if (msg.includes('email')) {
            errorMessage = 'A user with this email address already exists. Please use a different email address.';
          } else {
            errorMessage = 'A user with this information already exists. Please check the details and try again.';
          }
        } else if (!msg.startsWith('HTTP') && msg !== `HTTP ${err.status}`) {
          errorMessage = msg;
        }
      }
      
      // Final check for status code 422 (validation/uniqueness error)
      if (err.status === 422 || (err.message && err.message.includes('422'))) {
        if (!errorMessage.includes('already exists') && !errorMessage.includes('duplicate')) {
          errorMessage = 'Validation error: Please check your input and try again.';
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking authentication
  if (authLoading || isRedirecting) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">
            {authLoading ? 'Loading authentication...' : 'Redirecting...'}
          </p>
        </div>
      </div>
    );
  }

  // Don't render if not admin
  if (!user || (user.role !== 'super_admin' && user.role !== 'organization_admin')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
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
            onClick={() => router.back()}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Student</h1>
            <p className="text-gray-600">Create a new student and enroll them in courses</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Success</h3>
              <p className="mt-1 text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Student Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('first_name')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter first name"
              />
              {errors.first_name && (
                <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('last_name')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter last name"
              />
              {errors.last_name && (
                <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                {...register('email')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter email address"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                {...register('phone')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter phone number (optional)"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                {...register('password')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter password (min 8 characters)"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                {...register('confirm_password')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Confirm password"
              />
              {errors.confirm_password && (
                <p className="mt-1 text-sm text-red-600">{errors.confirm_password.message}</p>
              )}
            </div>

            {/* Organization (only for super admin) */}
            {user?.role === 'super_admin' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization
                </label>
                {loadingOrgs ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <select
                    {...register('organization_id', {
                      setValueAs: (value) => value === '' ? undefined : Number(value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select an organization (optional)</option>
                    {organizations.map(org => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                )}
                {errors.organization_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.organization_id.message}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Course Enrollment */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Course Enrollment</h2>
          
          <div className="space-y-4">
            {/* Selected Courses */}
            {selectedCourses.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selected Courses ({selectedCourses.length})
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedCourses.map(course => (
                    <span
                      key={course.id}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
                    >
                      {course.title}
                      <button
                        type="button"
                        onClick={() => removeCourse(course.id)}
                        className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Course Selection */}
            <div className="course-dropdown-container relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Courses (Optional)
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={courseSearchTerm}
                  onChange={(e) => setCourseSearchTerm(e.target.value)}
                  onFocus={() => setShowCourseDropdown(true)}
                  placeholder="Search courses..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Course Dropdown */}
              {showCourseDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {loadingCourses ? (
                    <div className="p-4 text-center">
                      <LoadingSpinner size="sm" />
                    </div>
                  ) : filteredCourses.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">
                      No courses found
                    </div>
                  ) : (
                    <div className="py-1">
                      {filteredCourses.map(course => {
                        const isSelected = selectedCourseIds?.includes(course.id);
                        return (
                          <label
                            key={course.id}
                            className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleCourseToggle(course.id)}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <div className="ml-3 flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                {course.title}
                              </div>
                              {course.description && (
                                <div className="text-xs text-gray-500 line-clamp-1">
                                  {course.description}
                                </div>
                              )}
                            </div>
                            <span className={`ml-2 px-2 py-1 text-xs rounded ${
                              course.status === 'published' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {course.status}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {selectedCourseIds && selectedCourseIds.length > 0 && (
              <p className="text-sm text-gray-500">
                Student will be enrolled in {selectedCourseIds.length} course{selectedCourseIds.length !== 1 ? 's' : ''} upon creation.
              </p>
            )}
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end space-x-4 bg-white shadow rounded-lg p-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Creating...
              </>
            ) : (
              <>
                <UserPlusIcon className="h-4 w-4 inline mr-2" />
                Create Student
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

