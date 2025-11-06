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
  instructor: string;
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
  duration: number;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notes, setNotes] = useState('');
  const [bookmarks, setBookmarks] = useState<number[]>([]);

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
        const courseResponse = await apiClient.getCourse(parseInt(courseId));
        setCourse(courseResponse.data);

        // Fetch course topics and lessons
        console.log('🔍 Fetching topics for course:', courseId);
        const topicsResponse = await apiClient.getCourseTopics(parseInt(courseId));
        console.log('📚 Topics response:', topicsResponse);
        const topicsData = topicsResponse.data || [];
        console.log('📚 Topics data:', topicsData);
        setTopics(topicsData);

        // Set first lesson as current if available
        if (topicsData.length > 0 && topicsData[0].lessons && topicsData[0].lessons.length > 0) {
          setCurrentLesson(topicsData[0].lessons[0]);
        }

        // Fetch course progress
        // TODO: Implement progress tracking API
        setProgress({
          course_id: parseInt(courseId),
          total_lessons: topicsData.reduce((acc: number, topic: any) => acc + (topic.lessons?.length || 0), 0),
          completed_lessons: 0,
          progress_percentage: 0
        });

      } catch (error) {
        console.error('Error fetching course data:', error);
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
    // TODO: Implement next lesson logic
    console.log('Next lesson');
  };

  const goToPreviousLesson = () => {
    // TODO: Implement previous lesson logic
    console.log('Previous lesson');
  };

  const selectLesson = (lesson: Lesson) => {
    setCurrentLesson(lesson);
    setIsPlaying(false);
  };

  const toggleBookmark = (lessonId: number) => {
    setBookmarks(prev => 
      prev.includes(lessonId) 
        ? prev.filter(id => id !== lessonId)
        : [...prev, lessonId]
    );
  };

  const markLessonComplete = () => {
    if (currentLesson) {
      // TODO: Implement lesson completion API
      console.log('Mark lesson complete:', currentLesson.id);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
            <p className="text-sm text-gray-500">by {course.instructor}</p>
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
                              <p className="text-xs text-gray-500">{formatTime(lesson.duration)}</p>
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
          {currentLesson ? (
            <>
              {/* Video Player */}
              {currentLesson.content_type === 'video' && currentLesson.video_url && (
                <div className="bg-black relative">
                  <video
                    ref={videoRef}
                    src={currentLesson.video_url}
                    className="w-full h-96 object-contain"
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
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
              )}

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
                        <div dangerouslySetInnerHTML={{ __html: currentLesson.content }} />
                      ) : (
                        <p className="text-gray-600">Video content is playing above.</p>
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
                      className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900"
                    >
                      <ChevronLeftIcon className="h-5 w-5 mr-2" />
                      Previous Lesson
                    </button>

                    <button
                      onClick={markLessonComplete}
                      className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 flex items-center"
                    >
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                      Mark Complete
                    </button>

                    <button
                      onClick={goToNextLesson}
                      className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900"
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

