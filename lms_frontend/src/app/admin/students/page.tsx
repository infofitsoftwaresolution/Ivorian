/**
 * Students Management Page
 * Super Admin page for managing all students on the platform
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { 
  AcademicCapIcon, 
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { apiClient } from '@/lib/api/client';

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_login?: string;
  organization_id?: number;
  organization_name?: string;
  enrolled_courses?: number;
  completed_courses?: number;
  total_progress?: number;
}

interface StudentsResponse {
  users: Student[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export default function StudentsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterOrganization, setFilterOrganization] = useState('all');
  const [organizationsList, setOrganizationsList] = useState<Array<{id: number, name: string}>>([]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);

  // Check if user is super admin or organization admin
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (!authLoading && user && user.role !== 'super_admin' && user.role !== 'organization_admin') {
      router.push('/dashboard');
    }
  }, [user, router, authLoading]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params: Record<string, string | number | boolean> = {
        page: currentPage,
        size: 20,
        role: 'student' // Filter for students only
      };

      if (searchTerm) {
        params.search = searchTerm;
      }

      if (filterStatus !== 'all') {
        params.is_active = filterStatus === 'active';
      }

      // For organization_admin, filter by their organization
      if (user?.role === 'organization_admin' && user.organization_id) {
        params.organization_id = user.organization_id;
      } else if (filterOrganization !== 'all' && user?.role === 'super_admin') {
        // Find organization ID by name
        const org = organizationsList.find(o => o.name === filterOrganization);
        if (org) {
          params.organization_id = org.id;
        }
      }

      const response = await apiClient.getUsers(params);
      
      console.log('Students API response:', response);
      
      // Handle different response structures
      let studentsData: Student[] = [];
      let total = 0;
      let pages = 1;
      
      if (response.data) {
        // Case 1: Direct array
        if (Array.isArray(response.data)) {
          studentsData = response.data.filter((s: any) => s.role === 'student');
          total = studentsData.length;
        }
        // Case 2: Nested under 'users' key (most common - UserListResponse)
        else if (response.data.users && Array.isArray(response.data.users)) {
          // Backend already filters by role, so we can use the users directly
          studentsData = response.data.users;
          total = response.data.total || studentsData.length;
          pages = response.data.pages || 1;
        }
        // Case 3: Nested under 'data' key
        else if (response.data.data && Array.isArray(response.data.data)) {
          studentsData = response.data.data;
          total = response.data.total || studentsData.length;
          pages = response.data.pages || 1;
        }
        // Case 4: Single user object (shouldn't happen for list endpoint)
        else if (response.data.role === 'student') {
          studentsData = [response.data];
          total = 1;
        }
      }

      console.log('Processed students data:', { studentsData, total, pages });

      setStudents(studentsData);
      setTotalPages(pages);
      setTotalStudents(total);
    } catch (error: unknown) {
      console.error('Error loading students:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : undefined;
      setError(errorMessage || 'Failed to load students. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && (user?.role === 'super_admin' || user?.role === 'organization_admin')) {
      if (user?.role === 'super_admin') {
        loadOrganizations();
      }
      loadStudents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, currentPage, filterStatus, filterOrganization]);

  // Debounce search to avoid too many API calls
  useEffect(() => {
    if (!authLoading && (user?.role === 'super_admin' || user?.role === 'organization_admin')) {
      const timeoutId = setTimeout(() => {
        setCurrentPage(1); // Reset to first page on search
        loadStudents();
      }, 500); // 500ms debounce

      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm]);

  const loadOrganizations = async () => {
    try {
      const response = await apiClient.getOrganizations();
      const orgsData = response.data?.organizations || response.data || [];
      const orgsList = Array.isArray(orgsData) ? orgsData.map((org: any) => ({
        id: org.id,
        name: org.name || 'Unnamed Organization'
      })) : [];
      setOrganizationsList(orgsList);
    } catch (error) {
      console.error('Error loading organizations:', error);
    }
  };

  const handleViewStudent = (studentId: number) => {
    router.push(`/admin/students/${studentId}`);
  };

  const handleEditStudent = (studentId: number) => {
    router.push(`/admin/students/${studentId}/edit`);
  };

  const handleDeleteStudent = async (studentId: number) => {
    if (confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      try {
        setLoading(true);
        await apiClient.deleteUser(studentId);
        await loadStudents();
      } catch (error: unknown) {
        console.error('Error deleting student:', error);
        const errorMessage = error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined;
        setError(errorMessage || 'Failed to delete student. Please try again.');
        alert(errorMessage || 'Failed to delete student. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Get unique organizations for filter - use loaded organizations list
  const uniqueOrganizations = user?.role === 'super_admin' 
    ? ['all', ...organizationsList.map(org => org.name)]
    : ['all', ...Array.from(new Set(students.map(s => s.organization_name).filter(Boolean)))];

  // Show loading while checking authentication or loading data
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">
            {authLoading ? 'Loading authentication...' : 'Loading students...'}
          </p>
        </div>
      </div>
    );
  }

  // Don't render if not super admin or organization admin
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-600">Manage all students on the platform</p>
        </div>
        <button
          onClick={() => router.push('/admin/students/create')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Student
        </button>
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

      {/* Filters and Search */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className={`grid grid-cols-1 gap-4 ${user?.role === 'super_admin' ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value as 'all' | 'active' | 'inactive');
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Organization Filter - Only show for super admin */}
          {user?.role === 'super_admin' && (
            <div>
              <select
                value={filterOrganization}
                onChange={(e) => {
                  setFilterOrganization(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                {uniqueOrganizations.map(org => (
                  <option key={org} value={org === 'all' ? 'all' : org}>
                    {org === 'all' ? 'All Organizations' : org}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Results Count */}
          <div className="flex items-center justify-end text-sm text-gray-500">
            {totalStudents} {totalStudents === 1 ? 'student' : 'students'}
          </div>
        </div>
      </div>

      {/* Students List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Enrolled Courses
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-indigo-600">
                            {student.first_name.charAt(0)}{student.last_name.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {student.first_name} {student.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {student.phone || 'No phone'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{student.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {student.organization_name || '—'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <BookOpenIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {student.enrolled_courses || 0}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full"
                          style={{ width: `${student.total_progress || 0}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-900">
                        {student.total_progress || 0}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      student.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {student.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {student.last_login 
                      ? new Date(student.last_login).toLocaleDateString()
                      : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleViewStudent(student.id)}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="View Student"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEditStudent(student.id)}
                      className="text-gray-600 hover:text-gray-900"
                      title="Edit Student"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteStudent(student.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete Student"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {students.length === 0 && !loading && (
          <div className="text-center py-12">
            <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterStatus !== 'all' || filterOrganization !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'Get started by adding a new student.'}
            </p>
            {!searchTerm && filterStatus === 'all' && filterOrganization === 'all' && (
              <div className="mt-6">
                <button
                  onClick={() => router.push('/admin/students/create')}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Student
                </button>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">{(currentPage - 1) * 20 + 1}</span>
                  {' '}to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * 20, totalStudents)}
                  </span>
                  {' '}of{' '}
                  <span className="font-medium">{totalStudents}</span>
                  {' '}results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                    let page;
                    if (totalPages <= 10) {
                      page = i + 1;
                    } else if (currentPage <= 5) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 4) {
                      page = totalPages - 9 + i;
                    } else {
                      page = currentPage - 4 + i;
                    }
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === currentPage
                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

