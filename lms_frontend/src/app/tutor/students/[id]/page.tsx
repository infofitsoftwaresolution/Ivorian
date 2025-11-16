/**
 * Student Detail View
 * View student details, enrollments, and progress
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api/client';
import { 
  PencilIcon,
  ArrowLeftIcon,
  EnvelopeIcon,
  PhoneIcon,
  AcademicCapIcon,
  CalendarIcon,
  UserIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import Breadcrumb from '@/components/ui/Breadcrumb';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: string;
  created_at: string;
  last_login?: string;
  is_active: boolean;
  organization_id?: number;
}

interface Enrollment {
  id: number;
  course_id: number;
  course: {
    id: number;
    title: string;
    description: string;
    status: string;
  };
  enrollment_date: string;
  completion_status: string;
  progress_percentage: number;
}

export default function StudentDetailView() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const studentId = parseInt(params.id as string);

  const [student, setStudent] = useState<Student | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Extract organization_id to ensure stable dependency array
  const organizationId = useMemo(() => user?.organization_id ?? undefined, [user?.organization_id]);

  useEffect(() => {
    if (!studentId) return;

    const fetchStudentData = async () => {
      try {
        setLoading(true);
        setError('');
        console.log(`[StudentDetail] Fetching student data for student ID: ${studentId}`);
        
        // Fetch student details first
        const studentResponse = await apiClient.getUser(studentId.toString());
        console.log('[StudentDetail] Student data received:', studentResponse.data);
        setStudent(studentResponse.data);
        setLoading(false); // Set loading to false after student data is loaded

        // Fetch enrollments separately (non-blocking)
        fetchEnrollments();
      } catch (error: any) {
        console.error('[StudentDetail] Error fetching student:', error);
        if (error?.status === 404) {
          setError('Student not found.');
        } else if (error?.status === 401 || error?.status === 403) {
          setError('You do not have permission to view this student.');
          setTimeout(() => router.push('/tutor/students'), 2000);
        } else {
          setError('Failed to load student details. Please try again.');
        }
        setLoading(false);
      }
    };

    const fetchEnrollments = async () => {
      try {
        if (!organizationId) {
          console.log('[StudentDetail] No organization ID, skipping enrollment fetch');
          setEnrollments([]);
          return;
        }

        // Get all courses in the organization
        const coursesResponse = await apiClient.getCourses({ 
          organization_id: organizationId
        });
        const courses = coursesResponse.data?.courses || coursesResponse.data || [];
        
        if (!Array.isArray(courses) || courses.length === 0) {
          console.log('[StudentDetail] No courses found');
          setEnrollments([]);
          return;
        }
        
        console.log(`[StudentDetail] Found ${courses.length} courses, fetching enrollments...`);
        
        // Fetch enrollments for each course and filter for this student
        // Use Promise.allSettled to handle individual failures gracefully
        const enrollmentPromises = courses.map(async (course: any) => {
          try {
            console.log(`[StudentDetail] Fetching enrollments for course ${course.id} (${course.title})...`);
            
            // Check if course exists and is accessible
            if (!course.id) {
              console.warn(`[StudentDetail] Course ${course.id} has no ID, skipping`);
              return [];
            }
            
            const enrollmentsResponse = await apiClient.getCourseEnrollments(course.id);
            console.log(`[StudentDetail] Enrollment response for course ${course.id}:`, enrollmentsResponse);
            
            const courseEnrollments = Array.isArray(enrollmentsResponse.data) 
              ? enrollmentsResponse.data 
              : Array.isArray(enrollmentsResponse) 
                ? enrollmentsResponse 
                : [];
            
            console.log(`[StudentDetail] Course ${course.id} has ${courseEnrollments.length} enrollments`);
            
            // Filter enrollments for this student
            const studentEnrollments = courseEnrollments.filter(
              (e: any) => {
                const matches = e.student_id === studentId || 
                               e.user_id === studentId || 
                               e.student?.id === studentId ||
                               e.student_id?.toString() === studentId?.toString();
                if (matches) {
                  console.log(`[StudentDetail] Found matching enrollment:`, e);
                }
                return matches;
              }
            );
            
            console.log(`[StudentDetail] Found ${studentEnrollments.length} enrollments for student ${studentId} in course ${course.id}`);
            
            return studentEnrollments.map((e: any) => ({
              ...e,
              course: course
            }));
          } catch (error: any) {
            // Log detailed error information
            console.error(`[StudentDetail] ERROR fetching enrollments for course ${course.id}:`, error);
            console.error(`[StudentDetail] Error type:`, error?.constructor?.name);
            console.error(`[StudentDetail] Error status:`, error?.status);
            console.error(`[StudentDetail] Error message:`, error?.message);
            console.error(`[StudentDetail] Error code:`, error?.code);
            console.error(`[StudentDetail] Error details:`, error?.details);
            console.error(`[StudentDetail] Full error object:`, JSON.stringify(error, Object.getOwnPropertyNames(error)));
            // Continue with other courses even if one fails
            // Return empty array so Promise.allSettled doesn't fail
            return [];
          }
        });
        
        // Use Promise.allSettled to handle individual failures gracefully
        const enrollmentResults = await Promise.allSettled(enrollmentPromises);
        const enrollmentArrays = enrollmentResults
          .filter((result): result is PromiseFulfilledResult<any[]> => result.status === 'fulfilled')
          .map(result => result.value);
        
        const studentEnrollments = enrollmentArrays.flat();
        setEnrollments(studentEnrollments);
        console.log(`[StudentDetail] Found ${studentEnrollments.length} enrollments for student ${studentId}`);
      } catch (enrollmentError: any) {
        console.warn('[StudentDetail] Could not fetch enrollments:', enrollmentError);
        console.warn('[StudentDetail] Enrollment error status:', enrollmentError?.status);
        console.warn('[StudentDetail] Enrollment error message:', enrollmentError?.message);
        console.warn('[StudentDetail] Enrollment error details:', enrollmentError?.details);
        // Don't fail the whole page if enrollments can't be fetched
        setEnrollments([]);
      }
    };

    fetchStudentData();
  }, [studentId, organizationId, router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
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
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <UserIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Student</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => router.push('/tutor/students')}
                  className="bg-red-100 text-red-800 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-200"
                >
                  Back to Students
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-sm text-yellow-800">Student not found.</p>
        </div>
      </div>
    );
  }

  const initials = `${student.first_name[0]}${student.last_name[0]}`.toUpperCase();
  const totalCourses = enrollments.length;
  const completedCourses = enrollments.filter(e => 
    e.completion_status === 'completed' || e.progress_percentage === 100
  ).length;
  const averageProgress = enrollments.length > 0
    ? Math.round(enrollments.reduce((sum, e) => sum + (e.progress_percentage || 0), 0) / enrollments.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb />

      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/tutor/students')}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back to Students
              </button>
              <div className="border-l border-gray-300 pl-4">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-2xl font-bold text-indigo-600">{initials}</span>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {student.first_name} {student.last_name}
                    </h1>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-sm text-gray-500">ID: {student.id}</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        student.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {student.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push(`/tutor/students/${student.id}/edit`)}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                <PencilIcon className="h-5 w-5 mr-2" />
                Edit Student
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <AcademicCapIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Enrolled Courses</p>
              <p className="text-2xl font-bold text-gray-900">{totalCourses}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed Courses</p>
              <p className="text-2xl font-bold text-gray-900">{completedCourses}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Average Progress</p>
              <p className="text-2xl font-bold text-gray-900">{averageProgress}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <CalendarIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Member Since</p>
              <p className="text-sm font-bold text-gray-900">{formatDate(student.created_at)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Student Information */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Student Information</h2>
        </div>
        <div className="p-6">
          <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Full Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{student.first_name} {student.last_name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900 flex items-center">
                <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                {student.email}
              </dd>
            </div>
            {student.phone && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center">
                  <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                  {student.phone}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-gray-500">Role</dt>
              <dd className="mt-1 text-sm text-gray-900 capitalize">{student.role}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Account Created</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(student.created_at)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Last Login</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {student.last_login ? formatDateTime(student.last_login) : 'Never'}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Enrollments */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Enrolled Courses</h2>
        </div>
        <div className="p-6">
          {enrollments.length > 0 ? (
            <div className="space-y-4">
              {enrollments.map((enrollment) => (
                <div key={enrollment.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">
                        {enrollment.course?.title || `Course ${enrollment.course_id}`}
                      </h3>
                      {enrollment.course?.description && (
                        <p className="text-sm text-gray-500 mt-1">{enrollment.course.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-sm text-gray-500">
                          Enrolled: {formatDate(enrollment.enrollment_date)}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          enrollment.completion_status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {enrollment.completion_status === 'completed' ? 'Completed' : 'In Progress'}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          {enrollment.progress_percentage || 0}%
                        </div>
                        <div className="w-32 bg-gray-200 rounded-full h-2 mt-2">
                          <div 
                            className="bg-indigo-600 h-2 rounded-full" 
                            style={{ width: `${enrollment.progress_percentage || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No enrollments</h3>
              <p className="mt-1 text-sm text-gray-500">
                This student has not enrolled in any courses yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

