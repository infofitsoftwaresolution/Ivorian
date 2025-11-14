/**
 * My Courses Page
 * Shows all courses the student is enrolled in
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api/client';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  StarIcon,
  ClockIcon,
  UserGroupIcon,
  BookOpenIcon,
  PlayIcon,
  AcademicCapIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Breadcrumb from '@/components/ui/Breadcrumb';

interface EnrolledCourse {
  id: number;
  course: {
    id: number;
    title: string;
    description: string;
    short_description?: string;
    instructor_name?: string;
    thumbnail_url?: string;
    price: number;
    currency?: string;
    difficulty_level: 'beginner' | 'intermediate' | 'advanced';
    category: string;
    rating?: number;
    total_lessons: number;
    total_duration: number;
    enrollment_count?: number;
    status: 'published' | 'draft';
    tags?: string[];
  };
  status: string;
  progress_percentage: number;
  enrollment_date: string;
}

interface FilterOptions {
  category: string;
  difficulty: string;
  priceRange: string;
  rating: number;
}

export default function StudentCoursesPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    category: 'all',
    difficulty: 'all',
    priceRange: 'all',
    rating: 0
  });

  // Fetch enrolled courses only
  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      if (!user || user.role !== 'student') return;
      
      try {
        setLoading(true);
        setError('');
        const response = await apiClient.getMyEnrollments();
        
        // Handle different response structures
        let enrollments = [];
        if (Array.isArray(response.data)) {
          enrollments = response.data;
        } else if (response.data && Array.isArray(response.data.enrollments)) {
          enrollments = response.data.enrollments;
        } else {
          console.log('No enrollments found or unexpected response structure');
          enrollments = [];
        }
        
        setEnrolledCourses(enrollments);
        setFilteredCourses(enrollments);
      } catch (error) {
        console.error('Error fetching enrolled courses:', error);
        setError('Failed to load enrolled courses. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchEnrolledCourses();
  }, [user]);

  // Filter and search enrolled courses
  useEffect(() => {
    let filtered = enrolledCourses;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(enrollment => {
        const course = enrollment.course;
        return (
          course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (course.instructor_name && course.instructor_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (course.tags && course.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase())))
        );
      });
    }

    // Category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(enrollment => enrollment.course.category === filters.category);
    }

    // Difficulty filter
    if (filters.difficulty !== 'all') {
      filtered = filtered.filter(enrollment => enrollment.course.difficulty_level === filters.difficulty);
    }

    // Price range filter
    if (filters.priceRange === 'free') {
      filtered = filtered.filter(enrollment => enrollment.course.price === 0);
    } else if (filters.priceRange === 'paid') {
      filtered = filtered.filter(enrollment => enrollment.course.price > 0);
    }

    // Rating filter
    if (filters.rating > 0) {
      filtered = filtered.filter(enrollment => (enrollment.course.rating || 0) >= filters.rating);
    }

    // Sort courses
    switch (sortBy) {
      case 'title':
        filtered.sort((a, b) => a.course.title.localeCompare(b.course.title));
        break;
      case 'price':
        filtered.sort((a, b) => a.course.price - b.course.price);
        break;
      case 'rating':
        filtered.sort((a, b) => (b.course.rating || 0) - (a.course.rating || 0));
        break;
      case 'newest':
        filtered.sort((a, b) => b.id - a.id);
        break;
      default:
        // Keep original order for relevance
        break;
    }

    setFilteredCourses(filtered);
  }, [enrolledCourses, searchTerm, filters, sortBy]);

  const handleContinue = (courseId: number) => {
    router.push(`/student/courses/${courseId}/learn`);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
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

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Extract unique categories from enrolled courses
  const categories = ['all', ...Array.from(new Set(enrolledCourses.map(e => e.course.category).filter(Boolean)))];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
          <p className="text-gray-600">Continue learning from your enrolled courses</p>
        </div>
        <button
          onClick={() => router.push('/student/catalog')}
          className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
        >
          Browse Course Catalog →
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Sort and Filter */}
          <div className="flex items-center space-x-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full lg:w-64 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="relevance">Sort by Relevance</option>
              <option value="title">Sort by Title</option>
              <option value="price">Sort by Price</option>
              <option value="rating">Sort by Rating</option>
              <option value="newest">Sort by Newest</option>
            </select>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filters
              <ChevronDownIcon className={`h-4 w-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                <select
                  value={filters.difficulty}
                  onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                <select
                  value={filters.priceRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, priceRange: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Prices</option>
                  <option value="free">Free</option>
                  <option value="paid">Paid</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <select
                  value={filters.rating}
                  onChange={(e) => setFilters(prev => ({ ...prev, rating: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value={0}>All Ratings</option>
                  <option value={4}>4+ Stars</option>
                  <option value={3}>3+ Stars</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="mb-4">
        <p className="text-gray-600">
          Showing {filteredCourses.length} of {enrolledCourses.length} enrolled courses
        </p>
      </div>

      {/* Course Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      ) : filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((enrollment) => {
            const course = enrollment.course;
            const progress = enrollment.progress_percentage || 0;
            
            return (
              <div key={enrollment.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Course Image */}
                <div className="aspect-video bg-gray-200 relative">
                  {course.thumbnail_url ? (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpenIcon className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(course.difficulty_level)}`}>
                      {course.difficulty_level}
                    </span>
                  </div>
                  {/* Progress Bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                    <div 
                      className="h-full bg-indigo-600 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Course Content */}
                <div className="p-6">
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{course.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{course.short_description || course.description}</p>
                  </div>

                  {course.instructor_name && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-500">by {course.instructor_name}</p>
                    </div>
                  )}

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">Progress</span>
                      <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Course Stats */}
                  <div className="flex items-center space-x-4 mb-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {formatDuration(course.total_duration)}
                    </div>
                    <div className="flex items-center">
                      <BookOpenIcon className="h-4 w-4 mr-1" />
                      {course.total_lessons} lessons
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleContinue(course.id)}
                    className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center justify-center"
                  >
                    <PlayIcon className="h-4 w-4 mr-2" />
                    {progress > 0 ? 'Continue Learning' : 'Start Course'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No enrolled courses</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || Object.values(filters).some(f => f !== 'all' && f !== 0)
              ? 'Try adjusting your search or filter criteria.'
              : 'You haven\'t enrolled in any courses yet.'}
          </p>
          {!searchTerm && !Object.values(filters).some(f => f !== 'all' && f !== 0) && (
            <button
              onClick={() => router.push('/student/catalog')}
              className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
            >
              Browse Course Catalog
            </button>
          )}
        </div>
      )}
    </div>
  );
}

