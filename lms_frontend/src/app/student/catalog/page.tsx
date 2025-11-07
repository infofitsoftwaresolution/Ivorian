/**
 * Student Course Catalog
 * Browse and discover courses available for enrollment
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api/client';
import Image from 'next/image';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  StarIcon,
  ClockIcon,
  UserGroupIcon,
  BookOpenIcon,
  AcademicCapIcon,
  XMarkIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Breadcrumb from '@/components/ui/Breadcrumb';

interface Course {
  id: number;
  title: string;
  description: string;
  category?: string;
  difficulty_level?: string;
  price?: number;
  currency?: string;
  thumbnail_url?: string;
  status: string;
  created_at: string;
  organization_id?: number;
  organization_name?: string;
  instructor_id?: number;
  instructor_name?: string;
  enrollment_count?: number;
  total_lessons?: number;
  total_duration?: number;
  rating?: number;
}

export default function StudentCatalogPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [showFilters, setShowFilters] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [filterPrice, setFilterPrice] = useState('all');
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<number[]>([]);
  const [enrollingCourseId, setEnrollingCourseId] = useState<number | null>(null);

  // Check authentication
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (!authLoading && user && user.role !== 'student') {
      router.push('/dashboard');
    }
  }, [user, router, authLoading]);

  // Load courses
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await apiClient.getCourses();
        
        let coursesData: Course[] = [];
        if (Array.isArray(response.data)) {
          coursesData = response.data;
        } else if (response.data?.courses && Array.isArray(response.data.courses)) {
          coursesData = response.data.courses;
        }

        // Filter only published courses
        const publishedCourses = coursesData.filter(course => 
          course.status === 'published'
        );

        setCourses(publishedCourses);
        setFilteredCourses(publishedCourses);
      } catch (error: unknown) {
        console.error('Error loading courses:', error);
        setError('Failed to load courses. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'student') {
      loadCourses();
    }
  }, [user]);

  // Load enrolled courses to show enrollment status
  useEffect(() => {
    const loadEnrollments = async () => {
      if (!user || user.role !== 'student') return;

      try {
        const response = await apiClient.getMyEnrollments();
        let enrollments: any[] = [];
        
        if (Array.isArray(response.data)) {
          enrollments = response.data;
        } else if (response.data?.enrollments && Array.isArray(response.data.enrollments)) {
          enrollments = response.data.enrollments;
        }

        const enrolledIds = enrollments.map((enrollment: any) => 
          enrollment.course_id || enrollment.course?.id
        ).filter(Boolean);
        
        setEnrolledCourseIds(enrolledIds);
      } catch (error) {
        console.error('Error loading enrollments:', error);
        // Don't show error, just continue without enrollment status
      }
    };

    loadEnrollments();
  }, [user]);

  // Filter and search courses
  useEffect(() => {
    let filtered = [...courses];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.instructor_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(course => course.category === filterCategory);
    }

    // Difficulty filter
    if (filterDifficulty !== 'all') {
      filtered = filtered.filter(course => course.difficulty_level === filterDifficulty);
    }

    // Price filter
    if (filterPrice === 'free') {
      filtered = filtered.filter(course => !course.price || course.price === 0);
    } else if (filterPrice === 'paid') {
      filtered = filtered.filter(course => course.price && course.price > 0);
    }

    // Sort courses
    switch (sortBy) {
      case 'title':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'price-low':
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price-high':
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'enrollments':
        filtered.sort((a, b) => (b.enrollment_count || 0) - (a.enrollment_count || 0));
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      default:
        // Keep original order for relevance
        break;
    }

    setFilteredCourses(filtered);
  }, [courses, searchTerm, filterCategory, filterDifficulty, filterPrice, sortBy]);

  const handleEnroll = async (courseId: number) => {
    if (enrollingCourseId) return; // Prevent multiple enrollments

    try {
      setEnrollingCourseId(courseId);
      
      await apiClient.enrollInCourse(courseId);
      
      // Update enrolled courses list
      setEnrolledCourseIds(prev => [...prev, courseId]);
      
      // Show success and redirect
      router.push(`/student/courses/${courseId}/learn`);
    } catch (error: unknown) {
      console.error('Error enrolling in course:', error);
      alert('Failed to enroll in course. Please try again.');
    } finally {
      setEnrollingCourseId(null);
    }
  };

  const handleViewCourse = (courseId: number) => {
    router.push(`/student/courses/${courseId}`);
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'N/A';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Get unique categories for filter
  const categories = ['all', ...Array.from(new Set(courses.map(c => c.category).filter(Boolean)))];
  const uniqueCategories = categories.filter((cat, index, self) => self.indexOf(cat) === index);

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

  // Don't render if not student
  if (!user || user.role !== 'student') {
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Course Catalog</h1>
        <p className="mt-2 text-gray-600">Discover and enroll in courses to enhance your skills</p>
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

      {/* Search and Filters Bar */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses by title, description, or instructor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Sort */}
          <div className="lg:w-48">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="relevance">Sort by Relevance</option>
              <option value="title">Sort by Title</option>
              <option value="newest">Newest First</option>
              <option value="rating">Highest Rated</option>
              <option value="enrollments">Most Popular</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium ${
              showFilters
                ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filters
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {uniqueCategories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat === 'all' ? 'All Categories' : cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Difficulty Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty
                </label>
                <select
                  value={filterDifficulty}
                  onChange={(e) => setFilterDifficulty(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              {/* Price Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price
                </label>
                <select
                  value={filterPrice}
                  onChange={(e) => setFilterPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Prices</option>
                  <option value="free">Free</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>

            {/* Clear Filters */}
            {(filterCategory !== 'all' || filterDifficulty !== 'all' || filterPrice !== 'all') && (
              <div className="mt-4">
                <button
                  onClick={() => {
                    setFilterCategory('all');
                    setFilterDifficulty('all');
                    setFilterPrice('all');
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing <span className="font-medium">{filteredCourses.length}</span> course{filteredCourses.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No courses found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || filterCategory !== 'all' || filterDifficulty !== 'all' || filterPrice !== 'all'
              ? 'Try adjusting your search or filters to find more courses.'
              : 'No courses are available at the moment.'}
          </p>
          {(searchTerm || filterCategory !== 'all' || filterDifficulty !== 'all' || filterPrice !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterCategory('all');
                setFilterDifficulty('all');
                setFilterPrice('all');
              }}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const isEnrolled = enrolledCourseIds.includes(course.id);
            const isEnrolling = enrollingCourseId === course.id;

            return (
              <div
                key={course.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
              >
                {/* Course Thumbnail */}
                <div className="relative h-48 bg-gradient-to-br from-indigo-500 to-purple-600">
                  {course.thumbnail_url ? (
                    <Image
                      src={course.thumbnail_url}
                      alt={course.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <BookOpenIcon className="h-16 w-16 text-white opacity-50" />
                    </div>
                  )}
                  {isEnrolled && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      Enrolled
                    </div>
                  )}
                  {course.difficulty_level && (
                    <div className="absolute top-2 left-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(course.difficulty_level)}`}>
                        {course.difficulty_level}
                      </span>
                    </div>
                  )}
                </div>

                {/* Course Content */}
                <div className="p-5">
                  {/* Category */}
                  {course.category && (
                    <span className="inline-block text-xs font-medium text-indigo-600 mb-2">
                      {course.category}
                    </span>
                  )}

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {course.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {course.description}
                  </p>

                  {/* Course Meta */}
                  <div className="flex items-center text-sm text-gray-500 space-x-4 mb-4">
                    {course.instructor_name && (
                      <div className="flex items-center">
                        <AcademicCapIcon className="h-4 w-4 mr-1" />
                        <span className="truncate">{course.instructor_name}</span>
                      </div>
                    )}
                    {course.total_lessons !== undefined && (
                      <div className="flex items-center">
                        <BookOpenIcon className="h-4 w-4 mr-1" />
                        <span>{course.total_lessons} lessons</span>
                      </div>
                    )}
                  </div>

                  {/* Rating and Enrollments */}
                  <div className="flex items-center justify-between mb-4">
                    {course.rating !== undefined && course.rating > 0 ? (
                      <div className="flex items-center">
                        <StarIconSolid className="h-4 w-4 text-yellow-400 mr-1" />
                        <span className="text-sm font-medium text-gray-900">{course.rating.toFixed(1)}</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-gray-400">
                        <StarIcon className="h-4 w-4 mr-1" />
                        <span className="text-sm">No ratings</span>
                      </div>
                    )}
                    {course.enrollment_count !== undefined && (
                      <div className="flex items-center text-sm text-gray-500">
                        <UserGroupIcon className="h-4 w-4 mr-1" />
                        <span>{course.enrollment_count} enrolled</span>
                      </div>
                    )}
                  </div>

                  {/* Duration */}
                  {course.total_duration && (
                    <div className="flex items-center text-sm text-gray-500 mb-4">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      <span>{formatDuration(course.total_duration)}</span>
                    </div>
                  )}

                  {/* Price and Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="text-lg font-bold text-gray-900">
                      {course.price !== undefined && course.price !== null && course.price > 0
                        ? `${course.currency || '$'}${course.price.toFixed(2)}`
                        : 'Free'}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewCourse(course.id)}
                        className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                      >
                        View
                      </button>
                      {isEnrolled ? (
                        <button
                          onClick={() => router.push(`/student/courses/${course.id}/learn`)}
                          className="px-4 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                        >
                          Continue
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEnroll(course.id)}
                          disabled={isEnrolling}
                          className="px-4 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isEnrolling ? (
                            <>
                              <LoadingSpinner size="sm" className="inline mr-2" />
                              Enrolling...
                            </>
                          ) : (
                            'Enroll'
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

