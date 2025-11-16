/**
 * Course Detail View
 * View course details, analytics, and manage course
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api/client';
import { 
  PencilIcon,
  EyeIcon,
  UsersIcon,
  BookOpenIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowLeftIcon,
  PlayIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import Breadcrumb from '@/components/ui/Breadcrumb';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface Course {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty_level: string;
  price: number;
  currency: string;
  status: string;
  thumbnail_url: string;
  intro_video_url: string;
  topics: Topic[];
  enrollments: any[];
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
  content_type: string;
  estimated_duration: number;
  is_free_preview: boolean;
}

export default function CourseDetailView() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const courseId = parseInt(params.courseId as string);

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        console.log(`[CourseDetail] Fetching course data for course ID: ${courseId}`);
        
        const response = await apiClient.getCourse(courseId);
        console.log('[CourseDetail] Course data received:', response.data);
        const courseData = response.data;
        
        // If topics are not included in the main response, fetch them separately
        let topics = courseData.topics || [];
        if (!topics || topics.length === 0) {
          console.log('[CourseDetail] No topics in course response, fetching topics separately...');
          try {
            const topicsResponse = await apiClient.getCourseTopics(courseId);
            console.log('[CourseDetail] Topics fetched separately:', topicsResponse.data);
            topics = topicsResponse.data || [];
            
            // Fetch lessons for each topic
            for (let i = 0; i < topics.length; i++) {
              try {
                const lessonsResponse = await apiClient.getTopicLessons(topics[i].id);
                topics[i].lessons = lessonsResponse.data || [];
                console.log(`[CourseDetail] Lessons for topic ${topics[i].id}:`, topics[i].lessons);
              } catch (lessonError) {
                console.error(`[CourseDetail] Error fetching lessons for topic ${topics[i].id}:`, lessonError);
                topics[i].lessons = [];
              }
            }
          } catch (topicsError) {
            console.error('[CourseDetail] Error fetching topics:', topicsError);
            topics = [];
          }
        } else {
          // Topics are included, but check if lessons are included
          for (let i = 0; i < topics.length; i++) {
            if (!topics[i].lessons || topics[i].lessons.length === 0) {
              try {
                console.log(`[CourseDetail] Fetching lessons for topic ${topics[i].id}...`);
                const lessonsResponse = await apiClient.getTopicLessons(topics[i].id);
                topics[i].lessons = lessonsResponse.data || [];
                console.log(`[CourseDetail] Lessons for topic ${topics[i].id}:`, topics[i].lessons);
              } catch (lessonError) {
                console.error(`[CourseDetail] Error fetching lessons for topic ${topics[i].id}:`, lessonError);
                topics[i].lessons = [];
              }
            }
          }
        }
        
        // Ensure topics is always an array and each topic has lessons array
        const normalizedCourse: Course = {
          ...courseData,
          topics: topics.map((topic: any) => ({
            ...topic,
            lessons: topic.lessons || []
          })),
          enrollments: courseData.enrollments || []
        };
        
        console.log('[CourseDetail] Normalized course data:', normalizedCourse);
        setCourse(normalizedCourse);
      } catch (error) {
        console.error('[CourseDetail] Error fetching course:', error);
        // Don't set mock data, let the error state show
        setCourse(null);
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  const handleEditCourse = () => {
    router.push(`/tutor/courses/${courseId}/edit`);
  };

  const handlePublishCourse = async () => {
    try {
      // TODO: API call to publish course
      console.log('Publishing course...');
      setCourse(prev => prev ? { ...prev, status: 'published' } : prev);
    } catch (error) {
      console.error('Error publishing course:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <div className="text-center py-12">
          <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Course not found</h3>
          <p className="mt-1 text-sm text-gray-500">The requested course could not be loaded.</p>
          <div className="mt-6">
            <button
              onClick={() => router.push('/tutor/courses')}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Back to Courses
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Safely calculate totals with fallbacks
  const topics = course.topics || [];
  const totalLessons = topics.reduce((sum, topic) => {
    const lessons = topic.lessons || [];
    return sum + lessons.length;
  }, 0);
  const totalDuration = topics.reduce((sum, topic) => {
    const lessons = topic.lessons || [];
    return sum + lessons.reduce((lessonSum, lesson) => {
      return lessonSum + (lesson.estimated_duration || 0);
    }, 0);
  }, 0);

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
                onClick={() => router.push('/tutor/courses')}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back to Courses
              </button>
              <div className="border-l border-gray-300 pl-4">
                <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
                <div className="flex items-center space-x-4 mt-1">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    course.status === 'published' ? 'bg-green-100 text-green-800' :
                    course.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                  </span>
                  <span className="text-sm text-gray-500">{course.category}</span>
                  <span className="text-sm text-gray-500 capitalize">{course.difficulty_level}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleEditCourse}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit Course
              </button>
              {course.status === 'draft' && (
                <button
                  onClick={handlePublishCourse}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Publish Course
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Course Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpenIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Topics</p>
              <p className="text-2xl font-bold text-gray-900">{topics.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <PlayIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Lessons</p>
              <p className="text-2xl font-bold text-gray-900">{totalLessons}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Duration</p>
              <p className="text-2xl font-bold text-gray-900">{Math.round(totalDuration / 60)}h</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <UsersIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Students</p>
              <p className="text-2xl font-bold text-gray-900">{course.enrollments?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content Structure */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Course Content</h2>
            <button
              onClick={handleEditCourse}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            >
              Edit Content
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {topics.length === 0 ? (
            <div className="text-center py-8">
              <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No content yet</h3>
              <p className="mt-1 text-sm text-gray-500">Start building your course by adding topics and lessons.</p>
              <div className="mt-6">
                <button
                  onClick={handleEditCourse}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                  Start Building
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {topics.map((topic, topicIndex) => (
                <div key={topic.id} className="border border-gray-200 rounded-lg">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                      {topicIndex + 1}. {topic.title}
                    </h3>
                    {topic.description && (
                      <p className="text-sm text-gray-600 mt-1">{topic.description}</p>
                    )}
                  </div>
                  
                  <div className="p-4">
                    {(!topic.lessons || topic.lessons.length === 0) ? (
                      <p className="text-sm text-gray-500 italic">No lessons in this topic yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {topic.lessons.map((lesson, lessonIndex) => (
                          <button
                            key={lesson.id}
                            onClick={() => router.push(`/tutor/courses/${courseId}/edit?lessonId=${lesson.id}&topicId=${topic.id}`)}
                            className="w-full flex items-center p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors text-left"
                          >
                            <div className="flex items-center flex-1">
                              {lesson.content_type === 'video' ? (
                                <PlayIcon className="h-4 w-4 mr-3 text-blue-600" />
                              ) : (
                                <DocumentTextIcon className="h-4 w-4 mr-3 text-gray-600" />
                              )}
                              <div>
                                <div className="font-medium text-sm text-gray-900">
                                  {lessonIndex + 1}. {lesson.title}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {lesson.estimated_duration || 0} min
                                  {lesson.is_free_preview && (
                                    <span className="ml-2 text-green-600 font-medium">Free Preview</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="ml-2">
                              <PencilIcon className="h-4 w-4 text-gray-400" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Course Description */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Course Description</h2>
        </div>
        <div className="p-6">
          <p className="text-gray-700 whitespace-pre-wrap">
            {course.description || 'No description available.'}
          </p>
        </div>
      </div>
    </div>
  );
}
