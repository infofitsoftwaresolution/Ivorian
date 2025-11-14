'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  PlayIcon,
  ClockIcon,
  BookOpenIcon,
  UserGroupIcon,
  StarIcon,
  CheckCircleIcon,
  AcademicCapIcon,
  TagIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import HomeHeader from '@/components/layout/HomeHeader';
import HomeFooter from '@/components/layout/HomeFooter';
import { apiClient, ApiError } from '@/lib/api/client';
import { useAuth } from '@/hooks/useAuth';

interface Course {
  id: number;
  title: string;
  description: string;
  short_description?: string;
  instructor_name?: string;
  instructor?: { name: string; bio?: string };
  thumbnail_url?: string;
  price: number;
  currency: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  rating?: number;
  total_lessons?: number;
  total_duration?: number;
  enrollment_count?: number;
  status: 'published' | 'draft';
  tags?: string[];
  learning_objectives?: string[];
  prerequisites?: string[];
  created_at: string;
}

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const courseId = params?.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEnrolling, setIsEnrolling] = useState(false);

  // Fetch course data
  useEffect(() => {
    const fetchCourseData = async () => {
      if (!courseId) return;
      
      try {
        setLoading(true);
        setError('');
        
        const response = await apiClient.getCourse(parseInt(courseId));
        setCourse(response.data);
      } catch (error) {
        console.error('Error fetching course data:', error);
        if (error instanceof ApiError) {
          setError(error.message || 'Failed to load course. Please try again.');
        } else if (error instanceof Error) {
          setError(error.message || 'Failed to load course. Please try again.');
        } else {
          setError('Failed to load course. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId]);

  const handleEnroll = async () => {
    if (!course) return;

    if (!user) {
      router.push(`/login?redirect=/courses/${course.id}`);
      return;
    }

    try {
      setIsEnrolling(true);
      const response = await apiClient.enrollInCourse(course.id);
      router.push(`/student/courses/${course.id}/learn`);
    } catch (error) {
      console.error('Error enrolling in course:', error);
      let errorMessage = 'Failed to enroll in course. Please try again.';
      if (error instanceof ApiError) {
        errorMessage = error.message || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }
      alert(errorMessage);
    } finally {
      setIsEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HomeHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading course details...</p>
          </div>
        </div>
        <HomeFooter />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HomeHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Course Not Found</h1>
            <p className="text-gray-600 mb-6">{error || 'The course you\'re looking for doesn\'t exist.'}</p>
            <Link
              href="/courses"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              Back to Courses
            </Link>
          </div>
        </div>
        <HomeFooter />
      </div>
    );
  }

  const instructorName = course.instructor_name || course.instructor?.name || 'Instructor';
  const priceDisplay = course.price ? `$${course.price}` : 'Free';
  const difficultyColors: Record<string, string> = {
    beginner: 'bg-green-100 text-green-800',
    intermediate: 'bg-yellow-100 text-yellow-800',
    advanced: 'bg-red-100 text-red-800'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <HomeHeader />

      {/* Back Button */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/courses"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Courses
          </Link>
        </div>
      </div>

      {/* Course Details */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Video/Image */}
            <div className="aspect-video bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 rounded-xl overflow-hidden shadow-lg">
              {course.thumbnail_url ? (
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <PlayIcon className="h-20 w-20 text-blue-600" />
                </div>
              )}
            </div>

            {/* Course Description */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Course</h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {course.description || course.short_description || 'No description available.'}
                </p>
              </div>
            </div>

            {/* Learning Objectives */}
            {course.learning_objectives && course.learning_objectives.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">What You'll Learn</h2>
                <ul className="space-y-3">
                  {course.learning_objectives.map((objective, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircleIcon className="h-6 w-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{objective}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Prerequisites */}
            {course.prerequisites && course.prerequisites.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Prerequisites</h2>
                <ul className="space-y-2">
                  {course.prerequisites.map((prereq, index) => (
                    <li key={index} className="flex items-start">
                      <AcademicCapIcon className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{prereq}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sticky top-4">
              {/* Price */}
              <div className="mb-6">
                <div className="text-4xl font-bold text-gray-900 mb-2">{priceDisplay}</div>
                {course.price > 0 && (
                  <p className="text-sm text-gray-500">One-time payment</p>
                )}
              </div>

              {/* Enroll Button */}
              <button
                onClick={handleEnroll}
                disabled={isEnrolling || course.status !== 'published'}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed mb-4"
              >
                {isEnrolling ? 'Enrolling...' : user ? 'Enroll Now' : 'Sign Up to Enroll'}
              </button>

              {!user && (
                <p className="text-sm text-gray-500 text-center mb-4">
                  <Link href="/login" className="text-blue-600 hover:underline">
                    Sign in
                  </Link>
                  {' '}or{' '}
                  <Link href="/register" className="text-blue-600 hover:underline">
                    create an account
                  </Link>
                  {' '}to enroll
                </p>
              )}

              {/* Course Info */}
              <div className="space-y-4 pt-6 border-t border-gray-200">
                <div className="flex items-center text-gray-700">
                  <ClockIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <span>{course.total_duration ? `${course.total_duration} hours` : 'Duration not specified'}</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <BookOpenIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <span>{course.total_lessons || 0} lessons</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <UserGroupIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <span>{course.enrollment_count || 0} students enrolled</span>
                </div>
                {course.rating && (
                  <div className="flex items-center text-gray-700">
                    <StarIcon className="h-5 w-5 text-yellow-400 fill-current mr-3" />
                    <span>{course.rating.toFixed(1)} rating</span>
                  </div>
                )}
              </div>

              {/* Course Details */}
              <div className="pt-6 border-t border-gray-200 space-y-3">
                <div>
                  <span className="text-sm text-gray-500">Category</span>
                  <p className="text-gray-900 font-medium">{course.category || 'General'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Difficulty</span>
                  <p>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${difficultyColors[course.difficulty_level] || 'bg-gray-100 text-gray-800'}`}>
                      {course.difficulty_level ? course.difficulty_level.charAt(0).toUpperCase() + course.difficulty_level.slice(1) : 'All Levels'}
                    </span>
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Instructor</span>
                  <p className="text-gray-900 font-medium">{instructorName}</p>
                </div>
              </div>

              {/* Tags */}
              {course.tags && course.tags.length > 0 && (
                <div className="pt-6 border-t border-gray-200">
                  <span className="text-sm text-gray-500 block mb-2">Tags</span>
                  <div className="flex flex-wrap gap-2">
                    {course.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <HomeFooter />
    </div>
  );
}

