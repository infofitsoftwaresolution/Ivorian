/**
 * Add Student Page
 * Allows tutors to add new students to their organization
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api/client';
import { 
  UserPlusIcon,
  EnvelopeIcon,
  UserIcon,
  BuildingOfficeIcon,
  AcademicCapIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import Breadcrumb from '@/components/ui/Breadcrumb';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface StudentFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  organization_id: number;
  role: string;
  password: string;
  confirm_password: string;
  course_ids: number[];
}

interface Course {
  id: number;
  title: string;
  description: string;
  status: string;
}

export default function AddStudent() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState<StudentFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    organization_id: user?.organization_id || 1, // Default to organization 1 if not set
    role: 'student',
    password: '',
    confirm_password: '',
    course_ids: []
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [courseSearchTerm, setCourseSearchTerm] = useState('');
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);

  // Fetch available courses
  const fetchCourses = async () => {
    setLoadingCourses(true);
    try {
      const response = await apiClient.getCourses();
      console.log('Courses API response:', response);
      
      // Handle different response structures
      let coursesData = response.data;
      if (Array.isArray(response.data)) {
        coursesData = response.data;
      } else if (response.data && Array.isArray(response.data.courses)) {
        coursesData = response.data.courses;
      } else if (response.data && Array.isArray(response.data.data)) {
        coursesData = response.data.data;
      } else {
        console.error('Unexpected courses response structure:', response.data);
        setCourses([]);
        return;
      }
      
      const availableCourses = coursesData.filter((course: any) => 
        course.status === 'published' || course.status === 'draft'
      );
      setCourses(availableCourses);
      console.log('Available courses:', availableCourses);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setError('Failed to load courses. Please try again.');
      setCourses([]);
    } finally {
      setLoadingCourses(false);
    }
  };

  // Log user organization info and fetch courses
  useEffect(() => {
    if (user) {
      console.log('Current user organization_id:', user?.organization_id);
      console.log('Using organization_id for student:', user?.organization_id || 1);
      fetchCourses();
    }
  }, [user]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCourseSelection = (courseId: number, isSelected: boolean) => {
    setFormData(prev => ({
      ...prev,
      course_ids: isSelected 
        ? [...prev.course_ids, courseId]
        : prev.course_ids.filter(id => id !== courseId)
    }));
  };

  // Filter courses based on search term
  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(courseSearchTerm.toLowerCase()) ||
    course.description.toLowerCase().includes(courseSearchTerm.toLowerCase())
  );

  // Get selected courses for display
  const selectedCourses = courses.filter(course => formData.course_ids.includes(course.id));

  const removeSelectedCourse = (courseId: number) => {
    setFormData(prev => ({
      ...prev,
      course_ids: prev.course_ids.filter(id => id !== courseId)
    }));
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
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Ensure we have a valid organization_id
      const organizationId = user?.organization_id || 1;
      console.log('Current user data:', user);
      console.log('Current user organization_id:', user?.organization_id);
      console.log('Using organization_id:', organizationId);
      
      // Create student account
      const studentData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        organization_id: organizationId,
        role: formData.role,
        password: formData.password
      };

      console.log('Creating student with data:', studentData);
      
      // Create user via API
      const response = await apiClient.createUser(studentData);
      console.log('Student created successfully:', response.data);
      
      // If courses are selected, enroll the student in those courses
      if (formData.course_ids.length > 0) {
        console.log('🎓 Enrolling student in courses:', formData.course_ids);
        console.log('👤 Student ID:', response.data.id);
        
        // Enroll student in each selected course
        for (const courseId of formData.course_ids) {
          try {
            console.log(`🔄 Enrolling student ${response.data.id} in course ${courseId}`);
            const enrollmentResponse = await apiClient.enrollStudentInCourse(response.data.id, courseId);
            console.log(`✅ Successfully enrolled student in course ${courseId}:`, enrollmentResponse);
          } catch (enrollmentError) {
            console.error(`❌ Failed to enroll student in course ${courseId}:`, enrollmentError);
            console.error('Enrollment error details:', enrollmentError);
            // Continue with other enrollments even if one fails
          }
        }
      } else {
        console.log('ℹ️ No courses selected for enrollment');
      }
      
      setSuccess(true);
      setLoading(false);
      setTimeout(() => {
        router.push('/tutor/students?created=true');
      }, 1500);
      
    } catch (error) {
      console.error('Error creating student:', error);
      if (error instanceof Error) {
        setError(`Failed to create student: ${error.message}`);
      } else {
        setError('Failed to create student. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <UserPlusIcon className="h-6 w-6 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Student Created Successfully!</h2>
          <p className="text-gray-600 mb-4">
            {formData.first_name} {formData.last_name} has been added as a student.
          </p>
          <p className="text-sm text-gray-500">
            They can now log in with their email: <strong>{formData.email}</strong>
          </p>
          {formData.course_ids.length > 0 && (
            <p className="text-sm text-green-600 mt-2">
              ✓ Enrolled in {formData.course_ids.length} course(s)
            </p>
          )}
          <div className="mt-6">
            <LoadingSpinner size="sm" />
            <p className="text-sm text-gray-500 mt-2">Redirecting to students list...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <Breadcrumb />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <button
              onClick={() => router.back()}
              className="mr-4 p-2 text-gray-400 hover:text-gray-600"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Add New Student</h1>
              <p className="text-gray-600">Create a new student account for your organization</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Student Information</h2>
            <p className="text-sm text-gray-500">Fill in the details to create a new student account</p>
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
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter first name"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter last name"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
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
                    placeholder="student@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            {/* Account Information */}
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-900 flex items-center">
                <AcademicCapIcon className="h-5 w-5 mr-2" />
                Account Information
              </h3>

              <div>
                <label htmlFor="organization_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Organization
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="organization_id"
                    value="Your Organization"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    disabled
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Student will be added to your organization</p>
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="student">Student</option>
                </select>
              </div>
            </div>

            {/* Course Assignment */}
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-900 flex items-center">
                <AcademicCapIcon className="h-5 w-5 mr-2" />
                Course Assignment
              </h3>
              
              {loadingCourses ? (
                <div className="flex items-center justify-center py-4">
                  <LoadingSpinner size="sm" />
                  <span className="ml-2 text-sm text-gray-500">Loading courses...</span>
                </div>
              ) : courses.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Search and select courses to enroll this student in:
                  </p>
                  
                  {/* Selected Courses Display */}
                  {selectedCourses.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Selected Courses:</label>
                      <div className="flex flex-wrap gap-2">
                        {selectedCourses.map((course) => (
                          <div
                            key={course.id}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800"
                          >
                            <span className="mr-2">{course.title}</span>
                            <button
                              type="button"
                              onClick={() => removeSelectedCourse(course.id)}
                              className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-indigo-200"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Course Search and Selection */}
                  <div className="relative course-dropdown-container">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        placeholder="Search courses by title or description..."
                        value={courseSearchTerm}
                        onChange={(e) => setCourseSearchTerm(e.target.value)}
                        onFocus={() => setShowCourseDropdown(true)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCourseDropdown(!showCourseDropdown)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        <svg 
                          className={`h-5 w-5 text-gray-400 transform transition-transform ${showCourseDropdown ? 'rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>

                    {/* Dropdown Course List */}
                    {showCourseDropdown && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {filteredCourses.length > 0 ? (
                          filteredCourses.map((course) => (
                            <div
                              key={course.id}
                              className="flex items-start space-x-3 p-3 hover:bg-gray-50 cursor-pointer"
                              onClick={() => {
                                const isSelected = formData.course_ids.includes(course.id);
                                handleCourseSelection(course.id, !isSelected);
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={formData.course_ids.includes(course.id)}
                                onChange={() => {}} // Handled by parent onClick
                                className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900">{course.title}</div>
                                <div className="text-sm text-gray-500 truncate">{course.description}</div>
                                <div className="text-xs text-gray-400 capitalize">{course.status}</div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-center text-sm text-gray-500">
                            No courses found matching "{courseSearchTerm}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Summary */}
                  {formData.course_ids.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-3">
                      <div className="flex items-center">
                        <svg className="h-5 w-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-green-800">
                          Student will be enrolled in {formData.course_ids.length} course(s)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">No courses available</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Create courses first to assign them to students
                  </p>
                  <button
                    onClick={fetchCourses}
                    className="mt-2 text-sm text-indigo-600 hover:text-indigo-500"
                  >
                    Retry loading courses
                  </button>
                </div>
              )}
            </div>

            {/* Password Information */}
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-900">Password</h3>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter password (min 6 characters)"
                  required
                />
              </div>

              <div>
                <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  id="confirm_password"
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Confirm password"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center space-x-2"
              >
                {loading && <LoadingSpinner size="sm" />}
                <span>{loading ? 'Creating Student...' : 'Create Student'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Information Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <UserPlusIcon className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Student Account Information</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>• The student will receive login credentials via email</p>
                <p>• They can access their dashboard at /student/dashboard</p>
                <p>• You can manage their enrollment in your courses</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
