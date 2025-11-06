/**
 * Tutor Courses List
 * View and manage all courses created by the tutor
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api/client';
import { 
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  BookOpenIcon,
  UsersIcon,
  ClockIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import Breadcrumb from '@/components/ui/Breadcrumb';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

// Course interface
interface Course {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  price: number;
  currency: string;
  status: string;
  students: number;
  lessons: number;
  duration: number;
  rating: number;
  created_at: string;
  updated_at: string;
  thumbnail: string;
}

// Mock course data
const mockCourses: Course[] = [
  {
    id: 1,
    title: 'Complete Web Development Bootcamp',
    description: 'Learn HTML, CSS, JavaScript, React, Node.js and more',
    category: 'Technology',
    difficulty: 'Beginner',
    price: 299,
    currency: 'USD',
    status: 'published',
    students: 45,
    lessons: 120,
    duration: 12,
    rating: 4.8,
    created_at: '2024-01-15',
    updated_at: '2024-02-20',
    thumbnail: '/course-thumbnails/web-dev.jpg'
  },
  {
    id: 2,
    title: 'Advanced JavaScript Concepts',
    description: 'Master closures, prototypes, async/await, and more',
    category: 'Technology',
    difficulty: 'Advanced',
    price: 199,
    currency: 'USD',
    status: 'draft',
    students: 0,
    lessons: 45,
    duration: 8,
    rating: 0,
    created_at: '2024-02-10',
    updated_at: '2024-02-25',
    thumbnail: '/course-thumbnails/js-advanced.jpg'
  }
];

export default function TutorCourses() {
  const { user } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, published, draft, archived
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    course: Course | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    course: null,
    isLoading: false
  });
  const [publishModal, setPublishModal] = useState<{
    isOpen: boolean;
    course: Course | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    course: null,
    isLoading: false
  });

  // Fetch courses from backend
  const fetchCourses = async () => {
      try {
        setLoading(true);
        
        // Use API client to call backend
        const response = await apiClient.getCourses();
        
        // Transform backend data to match our frontend format
        const transformedCourses = response.data.courses?.map((course: any) => ({
          id: course.id,
          title: course.title,
          description: course.description,
          category: course.category,
          difficulty: course.difficulty_level,
          price: course.price,
          currency: course.currency,
          status: course.status,
          students: 0, // TODO: Get actual enrollment count
          lessons: 0, // TODO: Get actual lesson count  
          duration: course.duration_weeks,
          rating: 0, // TODO: Get actual rating
          created_at: course.created_at,
          updated_at: course.updated_at,
          thumbnail: course.thumbnail_url || '/course-thumbnails/default.jpg'
        })) || [];
        
        setCourses(transformedCourses);
      } catch (error) {
        console.error('Error fetching courses:', error);
        // Fallback to mock data if API fails
        setCourses(mockCourses);
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    if (user) {
      fetchCourses();
    }
  }, [user]);

  const handleCreateCourse = () => {
    router.push('/tutor/courses/create');
  };

  const handleViewCourse = (courseId: number) => {
    router.push(`/tutor/courses/${courseId}`);
  };

  const handleEditCourse = (courseId: number) => {
    router.push(`/tutor/courses/${courseId}/edit`);
  };

  const handleDeleteCourse = (course: Course) => {
    setDeleteModal({
      isOpen: true,
      course: course,
      isLoading: false
    });
  };

  const confirmDeleteCourse = async () => {
    if (!deleteModal.course) return;

    setDeleteModal(prev => ({ ...prev, isLoading: true }));

    try {
      console.log('Deleting course:', deleteModal.course.id);
      await apiClient.deleteCourse(deleteModal.course.id);
      console.log('Course deleted successfully');
      
      // Remove course from local state
      setCourses(courses.filter(course => course.id !== deleteModal.course!.id));
      
      // Close modal
      setDeleteModal({
        isOpen: false,
        course: null,
        isLoading: false
      });
      
      // Show success message
      alert('Course deleted successfully!');
    } catch (error) {
      console.error('Error deleting course:', error);
      alert(`Failed to delete course: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Reset loading state
      setDeleteModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  const cancelDeleteCourse = () => {
    setDeleteModal({
      isOpen: false,
      course: null,
      isLoading: false
    });
  };

  const handlePublishCourse = (course: Course) => {
    setPublishModal({
      isOpen: true,
      course: course,
      isLoading: false
    });
  };

  const confirmPublishCourse = async () => {
    if (!publishModal.course) return;

    setPublishModal(prev => ({ ...prev, isLoading: true }));

    try {
      console.log('Publishing course:', publishModal.course.id);
      await apiClient.publishCourse(publishModal.course.id);
      console.log('Course published successfully');
      
      // Update course status in local state
      setCourses(courses.map(course => 
        course.id === publishModal.course!.id 
          ? { ...course, status: 'published' }
          : course
      ));
      
      // Close modal
      setPublishModal({
        isOpen: false,
        course: null,
        isLoading: false
      });
      
      // Show success message
      alert('Course published successfully! Students can now enroll.');
    } catch (error) {
      console.error('Error publishing course:', error);
      alert(`Failed to publish course: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Reset loading state
      setPublishModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  const cancelPublishCourse = () => {
    setPublishModal({
      isOpen: false,
      course: null,
      isLoading: false
    });
  };

  const filteredCourses = courses.filter(course => {
    if (filter === 'all') return true;
    return course.status === filter;
  });

  const getStatusBadge = (status: string) => {
    const badges = {
      published: 'bg-green-100 text-green-800',
      draft: 'bg-yellow-100 text-yellow-800',
      archived: 'bg-gray-100 text-gray-800'
    };
    return badges[status as keyof typeof badges] || badges.draft;
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      Beginner: 'text-green-600',
      Intermediate: 'text-yellow-600',
      Advanced: 'text-red-600'
    };
    return colors[difficulty as keyof typeof colors] || colors.Beginner;
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
          <p className="text-gray-600">Manage your courses and track their performance</p>
        </div>
        <button
          onClick={handleCreateCourse}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Create Course</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpenIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Courses</p>
              <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <UsersIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">
                {courses.reduce((sum, course) => sum + course.students, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Lessons</p>
              <p className="text-2xl font-bold text-gray-900">
                {courses.reduce((sum, course) => sum + course.lessons, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <CurrencyDollarIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Published</p>
              <p className="text-2xl font-bold text-gray-900">
                {courses.filter(course => course.status === 'published').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex space-x-4">
            {[
              { key: 'all', label: 'All Courses' },
              { key: 'published', label: 'Published' },
              { key: 'draft', label: 'Draft' },
              { key: 'archived', label: 'Archived' }
            ].map(item => (
              <button
                key={item.key}
                onClick={() => setFilter(item.key)}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  filter === item.key
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Courses List */}
        <div className="overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No courses found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filter === 'all' 
                  ? "Get started by creating your first course."
                  : `No ${filter} courses found.`
                }
              </p>
              {filter === 'all' && (
                <div className="mt-6">
                  <button
                    onClick={handleCreateCourse}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    Create Course
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
              {filteredCourses.map(course => (
                <div key={course.id} className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  {/* Course Thumbnail */}
                  <div className="aspect-video relative">
                    {course.thumbnail && course.thumbnail !== '/course-thumbnails/default.jpg' ? (
                      <img 
                        src={course.thumbnail} 
                        alt={course.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to default if image fails to load
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`absolute inset-0 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center ${course.thumbnail && course.thumbnail !== '/course-thumbnails/default.jpg' ? 'hidden' : ''}`}>
                      <BookOpenIcon className="h-12 w-12 text-indigo-600" />
                    </div>
                  </div>

                  {/* Course Content */}
                  <div className="p-4">
                    {/* Status Badge */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(course.status)}`}>
                        {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                      </span>
                      <span className={`text-xs font-medium ${getDifficultyColor(course.difficulty)}`}>
                        {course.difficulty}
                      </span>
                    </div>

                    {/* Course Title */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {course.title}
                    </h3>

                    {/* Course Description */}
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {course.description}
                    </p>

                    {/* Course Stats */}
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <UsersIcon className="h-4 w-4 mr-1" />
                          {course.students}
                        </span>
                        <span className="flex items-center">
                          <BookOpenIcon className="h-4 w-4 mr-1" />
                          {course.lessons}
                        </span>
                        <span className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {course.duration}w
                        </span>
                      </div>
                      <div className="font-semibold text-gray-900">
                        ${course.price}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        Updated {new Date(course.updated_at).toLocaleDateString()}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewCourse(course.id)}
                          className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md"
                          title="View Course"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditCourse(course.id)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                          title="Edit Course"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        {course.status === 'draft' && (
                          <button
                            onClick={() => handlePublishCourse(course)}
                            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-md"
                            title="Publish Course"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                          </button>
                        )}
                        {course.status === 'published' && (
                          <div className="p-2 bg-green-100 text-green-600 rounded-md" title="Published">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        <button
                          onClick={() => handleDeleteCourse(course)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md"
                          title="Delete Course"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={cancelDeleteCourse}
        onConfirm={confirmDeleteCourse}
        title="Delete Course"
        message={
          deleteModal.course
            ? `Are you sure you want to delete "${deleteModal.course.title}"? This action cannot be undone and will permanently remove the course and all its content.`
            : 'Are you sure you want to delete this course?'
        }
        confirmText="Delete Course"
        cancelText="Cancel"
        type="danger"
        isLoading={deleteModal.isLoading}
      />

      {/* Publish Confirmation Modal */}
      <ConfirmationModal
        isOpen={publishModal.isOpen}
        onClose={cancelPublishCourse}
        onConfirm={confirmPublishCourse}
        title="Publish Course"
        message={
          publishModal.course
            ? `Are you sure you want to publish "${publishModal.course.title}"? Once published, students will be able to enroll in this course.`
            : 'Are you sure you want to publish this course?'
        }
        confirmText="Publish Course"
        cancelText="Cancel"
        type="info"
        isLoading={publishModal.isLoading}
      />
    </div>
  );
}
