/**
 * Course Detail Page
 * Detailed course information and enrollment page for students
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api/client';
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
  ShareIcon,
  HeartIcon,
  BookmarkIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Breadcrumb from '@/components/ui/Breadcrumb';

interface Course {
  id: number;
  title: string;
  description: string;
  short_description: string;
  instructor: string;
  instructor_bio?: string;
  thumbnail_url?: string;
  price: number;
  currency: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  rating: number;
  total_lessons: number;
  total_duration: number;
  enrollment_count: number;
  status: 'published' | 'draft';
  tags: string[];
  learning_objectives: string[];
  prerequisites: string[];
  is_enrolled?: boolean;
  created_at: string;
}

interface Topic {
  id: number;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
}

interface Lesson {
  id: number;
  title: string;
  description: string;
  content_type: 'video' | 'text' | 'interactive';
  duration?: number;
  estimated_duration?: number;
  order: number;
  is_preview: boolean;
}

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Fetch course data function
  const fetchCourseData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch course details
      const courseResponse = await apiClient.getCourse(parseInt(courseId));
      setCourse(courseResponse.data);

      // Fetch course topics and lessons
      const topicsResponse = await apiClient.getCourseTopics(parseInt(courseId));
      const topicsData = topicsResponse.data || [];
      
      // Fetch lessons for each topic if not included
      const topicsWithLessons = await Promise.all(
        topicsData.map(async (topic: any) => {
          if (!topic.lessons || topic.lessons.length === 0) {
            try {
              const lessonsResponse = await apiClient.getTopicLessons(topic.id);
              topic.lessons = lessonsResponse.data || [];
            } catch (error) {
              console.error(`Error fetching lessons for topic ${topic.id}:`, error);
              topic.lessons = [];
            }
          }
          return topic;
        })
      );
      
      setTopics(topicsWithLessons);

    } catch (error) {
      console.error('Error fetching course data:', error);
      setError('Failed to load course. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  // Initial fetch when component mounts
  useEffect(() => {
    if (courseId) {
      fetchCourseData();
    }
  }, [courseId, fetchCourseData]);

  // Refresh course data when page becomes visible (to get latest updates from tutor)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && courseId && !loading) {
        console.log('🔄 Page became visible, refreshing course data...');
        fetchCourseData();
      }
    };

    const handleFocus = () => {
      if (courseId && !loading) {
        console.log('🔄 Window focused, refreshing course data...');
        fetchCourseData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [courseId, loading, fetchCourseData]);

  const handleEnroll = async () => {
    if (!course) return;

    try {
      setIsEnrolling(true);
      
      // Enroll in course via API
      const response = await apiClient.enrollInCourse(course.id);
      console.log('Enrollment response:', response);
      
      // Show success message and redirect
      alert('Enrollment successful! Redirecting to course...');
      router.push(`/student/courses/${course.id}/learn`);
    } catch (error) {
      console.error('Error enrolling in course:', error);
      alert('Failed to enroll in course. Please try again.');
    } finally {
      setIsEnrolling(false);
    }
  };

  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    // TODO: Implement bookmark API
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

  const formatDuration = (minutes?: number | null) => {
    // Handle NaN, null, undefined, or invalid values
    if (!minutes || isNaN(minutes) || minutes <= 0) {
      return '—';
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Course</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/student/courses')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Course Not Found</h2>
          <p className="text-gray-600 mb-4">The course you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/student/courses')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb />

      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
          <p className="text-gray-600">by {course.instructor}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Course Video/Image */}
          <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
            {course.thumbnail_url ? (
              <img
                src={course.thumbnail_url}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <PlayIcon className="h-16 w-16 text-gray-400" />
              </div>
            )}
          </div>

          {/* Course Description */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">About This Course</h2>
            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed">{course.description}</p>
            </div>
          </div>

          {/* Learning Objectives */}
          {course.learning_objectives && course.learning_objectives.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">What You'll Learn</h2>
              <ul className="space-y-2">
                {course.learning_objectives.map((objective, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{objective}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Prerequisites */}
          {course.prerequisites && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Prerequisites</h2>
              <p className="text-gray-700">{course.prerequisites}</p>
            </div>
          )}

          {/* Course Curriculum */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Course Curriculum</h2>
            <div className="space-y-4">
              {topics.map((topic, topicIndex) => (
                <div key={topic.id} className="border border-gray-200 rounded-lg">
                  <div className="p-4 bg-gray-50 border-b border-gray-200">
                    <h3 className="font-medium text-gray-900">
                      {(() => {
                        // Always use the order field from database for module number
                        const moduleNumber = Number(topic.order) || 0;
                        // Title is already cleaned during normalization, but double-check
                        let displayTitle = topic.title || '';
                        
                        // Final cleanup - remove any remaining "Module X:" patterns (safety check)
                        displayTitle = displayTitle.replace(/^Module\s*\d+\s*:\s*/i, '').trim();
                        // Handle multiple nested prefixes
                        while (displayTitle.match(/^Module\s*\d+\s*:\s*/i)) {
                          displayTitle = displayTitle.replace(/^Module\s*\d+\s*:\s*/i, '').trim();
                        }
                        
                        return `Module ${moduleNumber}: ${displayTitle || 'Untitled Module'}`;
                      })()}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{topic.description}</p>
                  </div>
                  <div className="p-4">
                    <div className="space-y-2">
                      {topic.lessons.map((lesson, lessonIndex) => (
                        <div key={lesson.id} className="flex items-center justify-between py-2">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              {lesson.content_type === 'video' ? (
                                <PlayIcon className="h-4 w-4 text-gray-500" />
                              ) : (
                                <BookOpenIcon className="h-4 w-4 text-gray-500" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{lesson.title}</p>
                              {lesson.is_preview && (
                                <span className="text-xs text-indigo-600 font-medium">Preview</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">
                              {formatDuration(lesson.estimated_duration || lesson.duration)}
                            </span>
                            {lesson.is_preview && (
                              <PlayIcon className="h-4 w-4 text-indigo-600" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Enrollment Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
            <div className="text-center mb-6">
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {course.price === 0 ? 'Free' : `${course.currency} ${course.price}`}
              </div>
              <div className="text-sm text-gray-600">One-time payment</div>
            </div>

            <button
              onClick={handleEnroll}
              disabled={isEnrolling || course.is_enrolled}
              className={`w-full py-3 px-4 rounded-md font-medium flex items-center justify-center ${
                course.is_enrolled
                  ? 'bg-green-600 text-white'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              } disabled:opacity-50`}
            >
              {isEnrolling ? (
                <LoadingSpinner size="sm" />
              ) : course.is_enrolled ? (
                <>
                  <PlayIcon className="h-5 w-5 mr-2" />
                  Continue Learning
                </>
              ) : (
                <>
                  <PlayIcon className="h-5 w-5 mr-2" />
                  Enroll Now
                </>
              )}
            </button>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">30-day money-back guarantee</p>
            </div>
          </div>

          {/* Course Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Course Includes</h3>
            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <ClockIcon className="h-4 w-4 mr-3 text-gray-400" />
                {formatDuration(course.total_duration)} of content
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <BookOpenIcon className="h-4 w-4 mr-3 text-gray-400" />
                {course.total_lessons} lessons
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <UserGroupIcon className="h-4 w-4 mr-3 text-gray-400" />
                {course.enrollment_count} students enrolled
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <AcademicCapIcon className="h-4 w-4 mr-3 text-gray-400" />
                Certificate of completion
              </div>
            </div>
          </div>

          {/* Course Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Course Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Difficulty</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(course.difficulty_level)}`}>
                  {course.difficulty_level}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Category</span>
                <span className="text-sm text-gray-900">{course.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Rating</span>
                <div className="flex items-center">
                  <StarIcon className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                  <span className="text-sm text-gray-900">{(course.rating || 0).toFixed(1)}</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Created</span>
                <span className="text-sm text-gray-900">{formatDate(course.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Tags */}
          {course.tags && course.tags.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {course.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    <TagIcon className="h-3 w-3 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex space-x-3">
              <button
                onClick={toggleBookmark}
                className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md border ${
                  isBookmarked
                    ? 'border-yellow-300 bg-yellow-50 text-yellow-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <BookmarkIcon className="h-4 w-4 mr-2" />
                {isBookmarked ? 'Bookmarked' : 'Bookmark'}
              </button>
              <button className="flex-1 flex items-center justify-center px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">
                <ShareIcon className="h-4 w-4 mr-2" />
                Share
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

