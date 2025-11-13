/**
 * Courses Management Page
 * Super Admin page for managing all courses on the platform
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { 
  BookOpenIcon, 
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { apiClient } from '@/lib/api/client';

interface Course {
  id: number;
  title: string;
  description: string;
  category?: string;
  difficulty_level?: string;
  status: string;
  price?: number;
  currency?: string;
  thumbnail_url?: string;
  created_at: string;
  updated_at?: string;
  organization_id?: number;
  organization_name?: string;
  instructor_id?: number;
  instructor_name?: string;
  enrollment_count?: number;
  total_lessons?: number;
  total_duration?: number;
  rating?: number;
}

interface CoursesResponse {
  courses: Course[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export default function CoursesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft' | 'archived'>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterOrganization, setFilterOrganization] = useState('all');
  const [organizationsList, setOrganizationsList] = useState<Array<{id: number, name: string}>>([]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCourses, setTotalCourses] = useState(0);

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

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params: Record<string, string | number | boolean> = {
        page: currentPage,
        size: 20
      };

      if (searchTerm) {
        params.search = searchTerm;
      }

      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }

      if (filterCategory !== 'all') {
        params.category = filterCategory;
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

      const response = await apiClient.getCourses(params);
      
      // Handle different response structures
      let coursesData: Course[] = [];
      let total = 0;
      let pages = 1;
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          coursesData = response.data;
          total = response.data.length;
        } else if (response.data.courses && Array.isArray(response.data.courses)) {
          coursesData = response.data.courses;
          total = response.data.total || response.data.courses.length;
          pages = response.data.pages || 1;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          coursesData = response.data.data;
          total = response.data.total || response.data.data.length;
          pages = response.data.pages || 1;
        }
      }

      setCourses(coursesData);
      setTotalPages(pages);
      setTotalCourses(total);
    } catch (error: unknown) {
      console.error('Error loading courses:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : undefined;
      setError(errorMessage || 'Failed to load courses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && (user?.role === 'super_admin' || user?.role === 'organization_admin')) {
      if (user?.role === 'super_admin') {
        loadOrganizations();
      }
      loadCourses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, currentPage, filterStatus, filterCategory, filterOrganization]);

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

  // Debounce search to avoid too many API calls
  useEffect(() => {
    if (!authLoading && (user?.role === 'super_admin' || user?.role === 'organization_admin')) {
      const timeoutId = setTimeout(() => {
        setCurrentPage(1); // Reset to first page on search
        loadCourses();
      }, 500); // 500ms debounce

      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm]);

  const handleViewCourse = (courseId: number) => {
    router.push(`/admin/courses/${courseId}`);
  };

  const handleEditCourse = (courseId: number) => {
    router.push(`/admin/courses/${courseId}/edit`);
  };

  const handleDeleteCourse = async (courseId: number) => {
    if (confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      try {
        setLoading(true);
        await apiClient.deleteCourse(courseId);
        await loadCourses();
      } catch (error: unknown) {
        console.error('Error deleting course:', error);
        const errorMessage = error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined;
        setError(errorMessage || 'Failed to delete course. Please try again.');
        alert(errorMessage || 'Failed to delete course. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Get unique categories for filters
  const categories = ['all', ...Array.from(new Set(courses.map(c => c.category).filter(Boolean)))];
  const uniqueCategories = categories.filter((cat, index, self) => self.indexOf(cat) === index);
  
  // Use loaded organizations list for filter
  const uniqueOrganizations = ['all', ...organizationsList.map(org => org.name)];

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to format duration
  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'N/A';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Show loading while checking authentication or loading data
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">
            {authLoading ? 'Loading authentication...' : 'Loading courses...'}
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
          <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
          <p className="text-gray-600">Manage all courses on the platform</p>
        </div>
        <button
          onClick={() => router.push('/admin/courses/create')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Course
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
              placeholder="Search courses..."
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
                setFilterStatus(e.target.value as 'all' | 'published' | 'draft' | 'archived');
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
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
        </div>
      </div>

      {/* Courses List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Instructor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Enrollments
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lessons
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {courses.map((course) => (
                <tr key={course.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12">
                        {course.thumbnail_url ? (
                          <Image
                            src={course.thumbnail_url}
                            alt={course.title}
                            width={48}
                            height={48}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                            <BookOpenIcon className="h-6 w-6 text-indigo-600" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{course.title}</div>
                        <div className="text-sm text-gray-500 line-clamp-1">{course.description}</div>
                        {course.category && (
                          <div className="text-xs text-gray-400 mt-1">{course.category}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {course.organization_name || '—'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {course.instructor_name || '—'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <UsersIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {course.enrollment_count || 0}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <BookOpenIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {course.total_lessons || 0}
                      </span>
                      {course.total_duration && (
                        <span className="text-xs text-gray-500 ml-2">
                          ({formatDuration(course.total_duration)})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {course.price !== undefined && course.price !== null
                        ? `${course.currency || '$'}${course.price.toFixed(2)}`
                        : 'Free'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(course.status)}`}>
                      {course.status || 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(course.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleViewCourse(course.id)}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="View Course"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEditCourse(course.id)}
                      className="text-gray-600 hover:text-gray-900"
                      title="Edit Course"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(course.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete Course"
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
        {courses.length === 0 && !loading && (
          <div className="text-center py-12">
            <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No courses found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterStatus !== 'all' || filterCategory !== 'all' || filterOrganization !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'Get started by creating a new course.'}
            </p>
            {!searchTerm && filterStatus === 'all' && filterCategory === 'all' && filterOrganization === 'all' && (
              <div className="mt-6">
                <button
                  onClick={() => router.push('/admin/courses/create')}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Course
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
                    {Math.min(currentPage * 20, totalCourses)}
                  </span>
                  {' '}of{' '}
                  <span className="font-medium">{totalCourses}</span>
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

