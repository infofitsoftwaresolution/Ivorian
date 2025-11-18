/**
 * Course Learning Interface
 * Main course player page for students to learn enrolled courses
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api/client';
import { 
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  BookOpenIcon,
  ClockIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BookmarkIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  AcademicCapIcon,
  ArrowLeftIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Breadcrumb from '@/components/ui/Breadcrumb';

interface Course {
  id: number;
  title: string;
  description: string;
  instructor: string | { id: number; name: string; email: string } | null;
  thumbnail_url?: string;
  total_duration: number;
  total_lessons: number;
  total_topics: number;
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
  content: string;
  content_type: 'video' | 'text' | 'interactive';
  duration?: number;
  estimated_duration?: number;
  video_duration?: number; // in seconds
  order: number;
  is_completed: boolean;
  video_url?: string;
  attachments?: any[];
}

interface CourseProgress {
  course_id: number;
  total_lessons: number;
  completed_lessons: number;
  current_lesson_id?: number;
  progress_percentage: number;
}

export default function CourseLearningPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const courseId = params.courseId as string;

  // State management
  const [course, setCourse] = useState<Course | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [enrollmentId, setEnrollmentId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notes, setNotes] = useState('');
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [loadingLesson, setLoadingLesson] = useState(false);

  // Video player refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // Fetch course data
  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        
        // Fetch course details
        console.log('[CourseLearning] Fetching course details for course ID:', courseId);
        const courseResponse = await apiClient.getCourse(parseInt(courseId));
        console.log('[CourseLearning] Course response:', courseResponse.data);
        setCourse(courseResponse.data);

        // Fetch course topics
        console.log('[CourseLearning] Fetching topics for course:', courseId);
        const topicsResponse = await apiClient.getCourseTopics(parseInt(courseId));
        console.log('[CourseLearning] Topics response:', topicsResponse);
        let topicsData = topicsResponse.data || [];
        console.log('[CourseLearning] Topics data:', topicsData);

        // Fetch lessons for each topic if not included
        for (let i = 0; i < topicsData.length; i++) {
          if (!topicsData[i].lessons || topicsData[i].lessons.length === 0) {
            try {
              console.log(`[CourseLearning] Fetching lessons for topic ${topicsData[i].id}...`);
              const lessonsResponse = await apiClient.getTopicLessons(topicsData[i].id);
              topicsData[i].lessons = lessonsResponse.data || [];
              console.log(`[CourseLearning] Lessons for topic ${topicsData[i].id}:`, topicsData[i].lessons);
            } catch (lessonError) {
              console.error(`[CourseLearning] Error fetching lessons for topic ${topicsData[i].id}:`, lessonError);
              topicsData[i].lessons = [];
            }
          } else {
            console.log(`[CourseLearning] Topic ${topicsData[i].id} already has ${topicsData[i].lessons.length} lessons`);
          }
        }

        // Ensure all topics have lessons array
        topicsData = topicsData.map((topic: any) => ({
          ...topic,
          lessons: topic.lessons || []
        }));

        console.log('[CourseLearning] Final topics data with lessons:', topicsData);
        setTopics(topicsData);

        // Set first lesson as current if available
        const firstLesson = topicsData
          .flatMap((topic: any) => topic.lessons || [])
          .find((lesson: any) => lesson);
        
        if (firstLesson) {
          console.log('[CourseLearning] Setting first lesson as current:', firstLesson);
          setCurrentLesson(firstLesson);
        } else {
          console.log('[CourseLearning] No lessons found in any topic');
        }

        // Calculate total lessons
        const totalLessons = topicsData.reduce((acc: number, topic: any) => acc + (topic.lessons?.length || 0), 0);
        console.log('[CourseLearning] Total lessons:', totalLessons);

        // Fetch enrollment to get enrollment ID and progress
        try {
          const enrollmentsResponse = await apiClient.getMyEnrollments();
          const enrollments = enrollmentsResponse.data || [];
          const enrollment = enrollments.find((e: any) => e.course_id === parseInt(courseId));
          
          if (enrollment) {
            setEnrollmentId(enrollment.id);
            const completedLessons = enrollment.completed_lessons || 0;
            const progressPercentage = enrollment.progress_percentage || 0;
            
            setProgress({
              course_id: parseInt(courseId),
              total_lessons: totalLessons,
              completed_lessons: completedLessons,
              progress_percentage: progressPercentage
            });

            // Fetch lesson progress to mark completed lessons
            try {
              console.log('[CourseLearning] Fetching lesson progress for enrollment:', enrollment.id);
              const progressResponse = await apiClient.getEnrollmentLessonProgress(enrollment.id);
              const lessonProgress = progressResponse.data?.progress || [];
              console.log('[CourseLearning] Lesson progress data:', lessonProgress);

              // Mark lessons as completed based on progress records
              if (lessonProgress.length > 0) {
                const completedLessonIds = new Set(
                  lessonProgress
                    .filter((p: any) => p.status === 'completed' || p.video_completed)
                    .map((p: any) => p.lesson_id)
                );
                console.log('[CourseLearning] Completed lesson IDs:', Array.from(completedLessonIds));

                // Update topics with completed lessons
                setTopics(prevTopics => {
                  const updatedTopics = prevTopics.map(topic => ({
                    ...topic,
                    lessons: topic.lessons.map(lesson => ({
                      ...lesson,
                      is_completed: completedLessonIds.has(lesson.id)
                    }))
                  }));

                  // Recalculate progress based on actual completed lessons
                  const actualCompletedLessons = updatedTopics.reduce((acc, topic) =>
                    acc + (topic.lessons?.filter(lesson => lesson.is_completed).length || 0), 0
                  );
                  const actualProgressPercentage = totalLessons > 0
                    ? Math.round((actualCompletedLessons / totalLessons) * 100)
                    : 0;

                  setProgress(prev => ({
                    course_id: parseInt(courseId),
                    total_lessons: totalLessons,
                    completed_lessons: actualCompletedLessons,
                    progress_percentage: actualProgressPercentage
                  }));

                  return updatedTopics;
                });

                // Update current lesson if it's completed
                setCurrentLesson(prev => {
                  if (prev && completedLessonIds.has(prev.id)) {
                    return { ...prev, is_completed: true };
                  }
                  return prev;
                });
              }
            } catch (progressError) {
              console.error('[CourseLearning] Error fetching lesson progress:', progressError);
              // Don't fail the whole page load if progress fetch fails
            }
          } else {
            // No enrollment found, set default progress
            setProgress({
              course_id: parseInt(courseId),
              total_lessons: totalLessons,
              completed_lessons: 0,
              progress_percentage: 0
            });
          }
        } catch (enrollmentError) {
          console.error('[CourseLearning] Error fetching enrollment:', enrollmentError);
          // Set default progress if enrollment fetch fails
          setProgress({
            course_id: parseInt(courseId),
            total_lessons: totalLessons,
            completed_lessons: 0,
            progress_percentage: 0
          });
        }

      } catch (error) {
        console.error('[CourseLearning] Error fetching course data:', error);
        setError('Failed to load course. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourseData();
    }
  }, [courseId]);

  // Video player controls
  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Lesson navigation
  const goToNextLesson = () => {
    if (!currentLesson) return;
    
    // Flatten all lessons from all topics, sorted by topic order and lesson order
    const allLessons = topics
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .flatMap(topic => 
        (topic.lessons || [])
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map(lesson => ({ ...lesson, topicId: topic.id }))
      );
    
    const currentIndex = allLessons.findIndex(lesson => lesson.id === currentLesson.id);
    
    if (currentIndex < allLessons.length - 1) {
      const nextLesson = allLessons[currentIndex + 1];
      selectLesson(nextLesson);
    }
  };

  const goToPreviousLesson = () => {
    if (!currentLesson) return;
    
    // Flatten all lessons from all topics, sorted by topic order and lesson order
    const allLessons = topics
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .flatMap(topic => 
        (topic.lessons || [])
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map(lesson => ({ ...lesson, topicId: topic.id }))
      );
    
    const currentIndex = allLessons.findIndex(lesson => lesson.id === currentLesson.id);
    
    if (currentIndex > 0) {
      const prevLesson = allLessons[currentIndex - 1];
      selectLesson(prevLesson);
    }
  };

  // Helper to check if there's a next/previous lesson
  const getLessonNavigation = () => {
    if (!currentLesson) return { hasNext: false, hasPrevious: false };
    
    const allLessons = topics
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .flatMap(topic => 
        (topic.lessons || [])
          .sort((a, b) => (a.order || 0) - (b.order || 0))
      );
    
    const currentIndex = allLessons.findIndex(lesson => lesson.id === currentLesson.id);
    
    return {
      hasNext: currentIndex < allLessons.length - 1,
      hasPrevious: currentIndex > 0
    };
  };

  const selectLesson = async (lesson: Lesson) => {
    try {
      setLoadingLesson(true);
      // Close sidebar on mobile when lesson is selected
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
      console.log('[CourseLearning] Selecting lesson:', lesson);
      
      // Fetch full lesson details to ensure we have all data (video_url, content, etc.)
      console.log('[CourseLearning] Fetching full lesson details for lesson ID:', lesson.id);
      console.log('[CourseLearning] Current lesson data before fetch:', {
        id: lesson.id,
        title: lesson.title,
        content_type: lesson.content_type,
        video_url: lesson.video_url,
        has_content: !!lesson.content
      });
      
      const lessonResponse = await apiClient.getLesson(lesson.id);
      console.log('[CourseLearning] Full lesson data received:', JSON.stringify(lessonResponse.data, null, 2));
      console.log('[CourseLearning] Video URL from API:', lessonResponse.data.video_url);
      console.log('[CourseLearning] Content type from API:', lessonResponse.data.content_type);
      
      // Merge the fetched lesson data with the existing lesson data
      const fullLesson: Lesson = {
        ...lesson,
        ...lessonResponse.data,
        // Ensure video_url is set (check multiple possible field names)
        video_url: lessonResponse.data.video_url || lessonResponse.data.videoUrl || lesson.video_url || undefined,
        // Ensure content is set
        content: lessonResponse.data.content || lesson.content || '',
        // Ensure content_type is set
        content_type: lessonResponse.data.content_type || lessonResponse.data.contentType || lesson.content_type || 'text',
      };
      
      console.log('[CourseLearning] Merged lesson data:', {
        id: fullLesson.id,
        title: fullLesson.title,
        content_type: fullLesson.content_type,
        video_url: fullLesson.video_url,
        has_content: !!fullLesson.content
      });
      console.log('[CourseLearning] Setting current lesson with full data:', fullLesson);
      setCurrentLesson(fullLesson);
      setIsPlaying(false);
      
      // Reset video player when switching lessons
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.pause();
      }
    } catch (error) {
      console.error('[CourseLearning] Error fetching lesson details:', error);
      // Fallback to using the lesson data we already have
      console.log('[CourseLearning] Using lesson data from topics list as fallback');
      setCurrentLesson(lesson);
      setIsPlaying(false);
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.pause();
      }
    } finally {
      setLoadingLesson(false);
    }
  };

  // Reload video when lesson changes
  useEffect(() => {
    if (currentLesson && videoRef.current && currentLesson.content_type === 'video' && currentLesson.video_url) {
      console.log('[CourseLearning] Loading video for lesson:', currentLesson.id, currentLesson.video_url);
      videoRef.current.load();
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [currentLesson?.id, currentLesson?.video_url]);

  const toggleBookmark = (lessonId: number) => {
    setBookmarks(prev => 
      prev.includes(lessonId) 
        ? prev.filter(id => id !== lessonId)
        : [...prev, lessonId]
    );
  };

  const markLessonComplete = async () => {
    if (!currentLesson || !courseId) {
      console.warn('[CourseLearning] Cannot mark lesson complete: missing lesson or course ID');
      setError('Cannot mark lesson complete: missing information');
      return;
    }

    // If no enrollment ID, try to fetch it first
    let activeEnrollmentId: number | null = enrollmentId;
    if (!activeEnrollmentId) {
      try {
        console.log('[CourseLearning] Enrollment ID not found, fetching enrollments...');
        const enrollmentsResponse = await apiClient.getMyEnrollments();
        const enrollments = enrollmentsResponse.data || [];
        const enrollment = enrollments.find((e: any) => e.course_id === parseInt(courseId));
        
        if (enrollment) {
          activeEnrollmentId = enrollment.id;
          setEnrollmentId(enrollment.id);
          console.log('[CourseLearning] Found enrollment ID:', activeEnrollmentId);
        } else {
          console.error('[CourseLearning] No enrollment found for course:', courseId);
          setError('You are not enrolled in this course. Please enroll first.');
          return;
        }
      } catch (fetchError) {
        console.error('[CourseLearning] Error fetching enrollment:', fetchError);
        setError('Failed to verify enrollment. Please try again.');
        return;
      }
    }
    
    // Ensure we have a valid enrollment ID before proceeding
    if (!activeEnrollmentId) {
      console.error('[CourseLearning] No enrollment ID available');
      setError('Cannot update progress: enrollment not found');
      return;
    }
    
    try {
      console.log('[CourseLearning] Marking lesson as complete:', currentLesson.id);
      console.log('[CourseLearning] Using enrollment ID:', activeEnrollmentId);
      
      // Calculate updated progress - check if lesson is already completed
      const totalLessons = topics.reduce((acc, topic) => acc + (topic.lessons?.length || 0), 0);
      const currentCompleted = topics.reduce((acc, topic) => 
        acc + (topic.lessons?.filter(lesson => lesson.is_completed && lesson.id !== currentLesson.id).length || 0), 0
      );
      // Add 1 for the current lesson being completed
      const newCompletedLessons = currentCompleted + 1;
      const progressPercentage = totalLessons > 0 ? Math.round((newCompletedLessons / totalLessons) * 100) : 0;

      // Update local state first (optimistic update)
      // This ensures UI updates immediately regardless of API call result
      setTopics(prevTopics => {
        const updatedTopics = prevTopics.map(topic => ({
          ...topic,
          lessons: topic.lessons.map(lesson => 
            lesson.id === currentLesson.id 
              ? { ...lesson, is_completed: true }
              : lesson
          )
        }));

        // Recalculate progress
        const totalLessons = updatedTopics.reduce((acc, topic) => acc + (topic.lessons?.length || 0), 0);
        const completedLessons = updatedTopics.reduce((acc, topic) => 
          acc + (topic.lessons?.filter(lesson => lesson.is_completed).length || 0), 0
        );
        const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

        setProgress(prev => ({
          course_id: parseInt(courseId),
          total_lessons: totalLessons,
          completed_lessons: completedLessons,
          progress_percentage: progressPercentage
        }));

        return updatedTopics;
      });

      // Update current lesson
      setCurrentLesson(prev => prev ? { ...prev, is_completed: true } : null);

      // Update lesson progress and enrollment progress via API (non-blocking - don't await, just fire and forget)
      // TypeScript: activeEnrollmentId is guaranteed to be a number at this point due to the check above
      const enrollmentIdToUpdate = activeEnrollmentId as number;
      console.log('[CourseLearning] Updating enrollment and lesson progress:', enrollmentIdToUpdate, {
        lesson_id: currentLesson.id,
        progress_percentage: progressPercentage,
        completed_lessons: newCompletedLessons
      });
      
      // Mark lesson as complete (creates/updates LessonProgress record)
      apiClient.markLessonComplete(enrollmentIdToUpdate, currentLesson.id)
        .then((lessonProgressResponse) => {
          console.log('[CourseLearning] Lesson progress update response:', lessonProgressResponse);
          
          // Then update enrollment progress
          return apiClient.updateLessonProgress(enrollmentIdToUpdate, {
            progress_percentage: progressPercentage,
            completed_lessons: newCompletedLessons
          });
        })
        .then((updateResponse) => {
          console.log('[CourseLearning] Enrollment update response:', updateResponse);
        })
        .catch((error) => {
          console.error('[CourseLearning] Error updating progress (non-blocking):', error);
          // Show a subtle notification but don't block the UI
          setError('Progress saved locally. Server sync may have failed.');
          setTimeout(() => setError(''), 3000);
        });
    } catch (error: any) {
      console.error('[CourseLearning] Error marking lesson as complete:', error);
      console.error('[CourseLearning] Error details:', {
        message: error?.message,
        status: error?.status,
        code: error?.code,
        details: error?.details
      });
      
      // Even if API call fails, update the UI to show progress
      // This provides better UX - user sees their progress even if backend has issues
      setTopics(prevTopics => {
        const updatedTopics = prevTopics.map(topic => ({
          ...topic,
          lessons: topic.lessons.map(lesson => 
            lesson.id === currentLesson.id 
              ? { ...lesson, is_completed: true }
              : lesson
          )
        }));

        // Recalculate progress
        const totalLessons = updatedTopics.reduce((acc, topic) => acc + (topic.lessons?.length || 0), 0);
        const completedLessons = updatedTopics.reduce((acc, topic) => 
          acc + (topic.lessons?.filter(lesson => lesson.is_completed).length || 0), 0
        );
        const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

        setProgress(prev => ({
          course_id: parseInt(courseId),
          total_lessons: totalLessons,
          completed_lessons: completedLessons,
          progress_percentage: progressPercentage
        }));

        return updatedTopics;
      });

      // Update current lesson
      setCurrentLesson(prev => prev ? { ...prev, is_completed: true } : null);
      
      // Show error message but don't block the UI update
      let errorMessage = 'Progress updated locally, but failed to save to server. Please refresh the page.';
      if (error?.status === 404) {
        errorMessage = 'Enrollment not found. Progress updated locally only.';
      } else if (error?.status === 403) {
        errorMessage = 'Permission denied. Progress updated locally only.';
      } else if (error?.status === 500) {
        errorMessage = 'Server error. Progress updated locally. Please refresh to sync.';
      } else if (error?.message) {
        errorMessage = `Progress updated locally. Error: ${error.message}`;
      }
      
      // Show error but don't block the UI - progress is still updated locally
      setError(errorMessage);
      
      // Clear error after 5 seconds
      setTimeout(() => {
        setError('');
      }, 5000);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper function to check if URL is a YouTube URL
  const isYouTubeUrl = (url: string): boolean => {
    if (!url) return false;
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  // Helper function to convert YouTube URL to embed URL
  const getYouTubeEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    
    // Handle different YouTube URL formats
    let videoId = '';
    
    // Format: https://www.youtube.com/watch?v=VIDEO_ID
    const watchMatch = url.match(/[?&]v=([^&]+)/);
    if (watchMatch) {
      videoId = watchMatch[1];
    }
    // Format: https://youtu.be/VIDEO_ID
    else {
      const shortMatch = url.match(/youtu\.be\/([^?]+)/);
      if (shortMatch) {
        videoId = shortMatch[1];
      }
      // Format: https://www.youtube.com/embed/VIDEO_ID
      else {
        const embedMatch = url.match(/embed\/([^?]+)/);
        if (embedMatch) {
          videoId = embedMatch[1];
        }
      }
    }
    
    if (videoId) {
      // Extract video ID (remove any additional parameters)
      videoId = videoId.split('&')[0].split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Course</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/student/dashboard')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Course Not Found</h2>
          <p className="text-gray-600 mb-4">The course you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/student/dashboard')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-gray-600 hover:text-gray-900"
          >
            {sidebarOpen ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
          </button>
          <button
            onClick={() => router.push('/student/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{course.title}</h1>
            <p className="text-sm text-gray-500">
              by {typeof course.instructor === 'string' 
                ? course.instructor 
                : course.instructor?.name || 'Unknown Instructor'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            Progress: {progress?.progress_percentage || 0}%
          </div>
          <div className="w-32 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress?.progress_percentage || 0}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-white border-r border-gray-200 overflow-hidden`}>
          <div className="h-full overflow-y-auto">
            <div className="p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Course Content</h2>
              
              {topics.map((topic, topicIndex) => (
                <div key={topic.id} className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{topic.title}</h3>
                    <span className="text-sm text-gray-500">
                      {topic.lessons?.filter(lesson => lesson.is_completed).length || 0}/{topic.lessons?.length || 0}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    {(topic.lessons || []).map((lesson, lessonIndex) => (
                      <button
                        key={lesson.id}
                        onClick={() => selectLesson(lesson)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          currentLesson?.id === lesson.id
                            ? 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              {lesson.content_type === 'video' ? (
                                <VideoCameraIcon className="h-4 w-4 text-gray-500" />
                              ) : (
                                <DocumentTextIcon className="h-4 w-4 text-gray-500" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{lesson.title}</p>
                              <p className="text-xs text-gray-500">
                                {lesson.video_duration 
                                  ? formatTime(lesson.video_duration)
                                  : lesson.estimated_duration 
                                    ? `${lesson.estimated_duration} min`
                                    : lesson.duration
                                      ? formatTime(lesson.duration * 60)
                                      : '—'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {lesson.is_completed && (
                              <CheckCircleIcon className="h-4 w-4 text-green-500" />
                            )}
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleBookmark(lesson.id);
                              }}
                              className={`p-1 rounded cursor-pointer ${
                                bookmarks.includes(lesson.id)
                                  ? 'text-yellow-500'
                                  : 'text-gray-400 hover:text-yellow-500'
                              }`}
                            >
                              <BookmarkIcon className="h-4 w-4" />
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {loadingLesson ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-gray-600">Loading lesson content...</p>
              </div>
            </div>
          ) : currentLesson ? (
            <>
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 p-4 mb-4 mx-6 mt-4 rounded">
                  <p className="text-sm text-red-800">{error}</p>
                  <button
                    onClick={() => setError('')}
                    className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
                  >
                    Dismiss
                  </button>
                </div>
              )}


              {/* Video Player */}
              {currentLesson.content_type === 'video' && currentLesson.video_url ? (
                // Check if it's a YouTube URL - use iframe for YouTube
                isYouTubeUrl(currentLesson.video_url) ? (
                  <div className="bg-black relative w-full" style={{ paddingBottom: '56.25%', height: 0 }}>
                    <iframe
                      src={getYouTubeEmbedUrl(currentLesson.video_url) || currentLesson.video_url}
                      className="absolute top-0 left-0 w-full h-full"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={currentLesson.title}
                      onLoad={() => {
                        console.log('[CourseLearning] YouTube video iframe loaded');
                        setError('');
                      }}
                      onError={() => {
                        console.error('[CourseLearning] YouTube video iframe error');
                        setError('Failed to load YouTube video. Please check the video URL.');
                      }}
                    />
                  </div>
                ) : (
                  // Regular video file - use HTML5 video element
                  <div className="bg-black relative">
                    <video
                      ref={videoRef}
                      src={currentLesson.video_url}
                      className="w-full h-96 object-contain"
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                      onPlay={() => {
                        console.log('[CourseLearning] Video started playing');
                        setIsPlaying(true);
                        // Clear any previous errors when video starts playing
                        setError('');
                      }}
                      onPause={() => {
                        console.log('[CourseLearning] Video paused');
                        setIsPlaying(false);
                      }}
                      onError={(e) => {
                        const video = e.currentTarget;
                        const error = video.error;
                        
                        // Get detailed error information
                        let errorMessage = 'Unknown video error';
                        let errorCode = error?.code;
                        
                        // Check if video URL is valid
                        if (!currentLesson.video_url || currentLesson.video_url.trim() === '') {
                          errorMessage = 'Video URL is empty or invalid';
                        } else if (error) {
                          // Map MediaError codes to user-friendly messages
                          switch (error.code) {
                            case MediaError.MEDIA_ERR_ABORTED:
                              errorMessage = 'Video loading was aborted. Please try again.';
                              break;
                            case MediaError.MEDIA_ERR_NETWORK:
                              errorMessage = 'Network error while loading video. Please check your internet connection and try again.';
                              break;
                            case MediaError.MEDIA_ERR_DECODE:
                              errorMessage = 'Video decoding error. The video file may be corrupted or in an unsupported format.';
                              break;
                            case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                              errorMessage = 'Video format not supported or video source is invalid. The video URL may be incorrect or the format is not supported by your browser.';
                              break;
                            default:
                              errorMessage = error.message || 'Unknown video playback error';
                          }
                        } else {
                          // If error object is null, check network state
                          if (video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
                            errorMessage = 'No video source available. The video URL may be invalid.';
                          } else if (video.networkState === HTMLMediaElement.NETWORK_EMPTY) {
                            errorMessage = 'Video source is empty. Please check the video URL.';
                          } else if (video.networkState === HTMLMediaElement.NETWORK_IDLE) {
                            errorMessage = 'Video failed to load. The video URL may be inaccessible or invalid.';
                          } else {
                            errorMessage = 'Failed to load video. Please check the video URL and try again.';
                          }
                        }
                        
                        const errorDetails = {
                          errorCode: errorCode,
                          errorMessage: error?.message,
                          networkState: video.networkState,
                          readyState: video.readyState,
                          videoURL: currentLesson.video_url,
                          src: video.src,
                          networkStateNames: {
                            0: 'NETWORK_EMPTY',
                            1: 'NETWORK_IDLE',
                            2: 'NETWORK_LOADING',
                            3: 'NETWORK_NO_SOURCE'
                          }
                        };
                        
                        console.error('[CourseLearning] Video playback error:', errorDetails);
                        console.error('[CourseLearning] Video error object:', error);
                        console.error('[CourseLearning] MediaError codes:', {
                          MEDIA_ERR_ABORTED: MediaError.MEDIA_ERR_ABORTED,
                          MEDIA_ERR_NETWORK: MediaError.MEDIA_ERR_NETWORK,
                          MEDIA_ERR_DECODE: MediaError.MEDIA_ERR_DECODE,
                          MEDIA_ERR_SRC_NOT_SUPPORTED: MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
                        });
                        
                        const fullErrorMessage = `${errorMessage}${currentLesson.video_url ? ` Video URL: ${currentLesson.video_url}` : ''}`;
                        setError(fullErrorMessage);
                      }}
                      onLoadStart={() => {
                        console.log('[CourseLearning] Video loading started:', currentLesson.video_url);
                      }}
                      onCanPlay={() => {
                        console.log('[CourseLearning] Video can play:', currentLesson.video_url);
                      }}
                      onLoadedData={() => {
                        console.log('[CourseLearning] Video data loaded');
                      }}
                      onEnded={() => {
                        console.log('[CourseLearning] Video ended - marking as complete');
                        markLessonComplete();
                      }}
                      onWaiting={() => {
                        console.log('[CourseLearning] Video waiting for data');
                      }}
                      onStalled={() => {
                        console.warn('[CourseLearning] Video stalled');
                      }}
                      controls
                      preload="auto"
                    />
                    
                    {/* Video Controls */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={handlePlayPause}
                          className="text-white hover:text-gray-300"
                        >
                          {isPlaying ? <PauseIcon className="h-6 w-6" /> : <PlayIcon className="h-6 w-6" />}
                        </button>
                        
                        <div className="flex-1">
                          <div className="w-full bg-gray-600 rounded-full h-1">
                            <div 
                              className="bg-white h-1 rounded-full transition-all duration-200"
                              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                        
                        <span className="text-white text-sm">
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                        
                        <button
                          onClick={handleMuteToggle}
                          className="text-white hover:text-gray-300"
                        >
                          {isMuted ? <SpeakerXMarkIcon className="h-5 w-5" /> : <SpeakerWaveIcon className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              ) : currentLesson.content_type === 'video' && !currentLesson.video_url ? (
                <div className="bg-gray-900 flex items-center justify-center h-96">
                  <div className="text-center text-white">
                    <VideoCameraIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium">No video URL available</p>
                    <p className="text-sm text-gray-400 mt-2">This lesson doesn't have a video attached.</p>
                    <p className="text-xs text-gray-500 mt-4 font-mono">Lesson ID: {currentLesson.id}</p>
                  </div>
                </div>
              ) : currentLesson.content_type !== 'video' ? (
                <div className="bg-gray-50 flex items-center justify-center h-96">
                  <div className="text-center text-gray-600">
                    <DocumentTextIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium">Text Content Lesson</p>
                    <p className="text-sm text-gray-500 mt-2">This is a text-based lesson. Content is shown below.</p>
                  </div>
                </div>
              ) : null}

              {/* Lesson Content */}
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="max-w-4xl mx-auto">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentLesson.title}</h2>
                    <p className="text-gray-600">{currentLesson.description}</p>
                  </div>

                  {/* Lesson Content */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="prose max-w-none">
                      {currentLesson.content_type === 'text' ? (
                        currentLesson.content ? (
                          <div dangerouslySetInnerHTML={{ __html: currentLesson.content }} />
                        ) : (
                          <p className="text-gray-600">No content available for this lesson.</p>
                        )
                      ) : currentLesson.content_type === 'video' ? (
                        currentLesson.content ? (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Lesson Notes</h3>
                            <div dangerouslySetInnerHTML={{ __html: currentLesson.content }} />
                          </div>
                        ) : (
                          <p className="text-gray-600">Video content is playing above.</p>
                        )
                      ) : (
                        <p className="text-gray-600">Content for this lesson is not available.</p>
                      )}
                    </div>
                  </div>

                  {/* Notes Section */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">My Notes</h3>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Take notes about this lesson..."
                      className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={goToPreviousLesson}
                      disabled={!getLessonNavigation().hasPrevious}
                      className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                        getLessonNavigation().hasPrevious
                          ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          : 'text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <ChevronLeftIcon className="h-5 w-5 mr-2" />
                      Previous Lesson
                    </button>

                    <button
                      onClick={markLessonComplete}
                      disabled={currentLesson.is_completed}
                      className={`px-6 py-2 rounded-md flex items-center transition-colors ${
                        currentLesson.is_completed
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                      {currentLesson.is_completed ? 'Completed' : 'Mark Complete'}
                    </button>

                    <button
                      onClick={goToNextLesson}
                      disabled={!getLessonNavigation().hasNext}
                      className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                        getLessonNavigation().hasNext
                          ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          : 'text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Next Lesson
                      <ChevronRightIcon className="h-5 w-5 ml-2" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Lesson Selected</h3>
                <p className="text-gray-600">Select a lesson from the sidebar to start learning.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

