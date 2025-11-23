/**
 * Course Learning Interface
 * Main course player page for students to learn enrolled courses
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  XMarkIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  ForwardIcon,
  BackwardIcon,
  Cog6ToothIcon,
  RectangleStackIcon,
  LanguageIcon,
  PhotoIcon
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
  duration?: number; // Legacy field, prefer video_duration or estimated_duration
  video_duration?: number; // Duration in seconds (from backend)
  estimated_duration?: number; // Duration in minutes (from backend)
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

// Utility function to detect and convert YouTube URLs
const isYouTubeUrl = (url: string): boolean => {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'www.youtube.com' || 
           urlObj.hostname === 'youtube.com' || 
           urlObj.hostname === 'youtu.be' ||
           urlObj.hostname === 'm.youtube.com';
  } catch {
    return false;
  }
};

// Extract YouTube video ID from various URL formats
const getYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    
    // Handle youtu.be format
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1);
    }
    
    // Handle youtube.com/watch?v= format
    if (urlObj.hostname.includes('youtube.com')) {
      return urlObj.searchParams.get('v');
    }
    
    return null;
  } catch {
    return null;
  }
};

// Convert YouTube URL to embeddable format
// Uses youtube-nocookie.com for better privacy and fewer tracking-related console errors
const getYouTubeEmbedUrl = (url: string): string | null => {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return null;
  // Use youtube-nocookie.com to reduce tracking and associated console errors
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
};

export default function CourseLearningPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const courseId = params.courseId as string;

  // State management
  const [course, setCourse] = useState<Course | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [enrollmentId, setEnrollmentId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notes, setNotes] = useState('');
  const [bookmarks, setBookmarks] = useState<number[]>([]);

  // Video player refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [isPictureInPicture, setIsPictureInPicture] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [bufferedRanges, setBufferedRanges] = useState<{ start: number; end: number }[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      console.log('User not authenticated, redirecting to login...');
      router.push('/login?redirect=' + encodeURIComponent(`/student/courses/${courseId}/learn`));
    }
  }, [authLoading, isAuthenticated, router, courseId]);

  // Fetch course data function - wrapped in useCallback to prevent infinite loops
  const fetchCourseData = useCallback(async () => {
    // Don't fetch if not authenticated or still loading auth
    if (authLoading || !isAuthenticated) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Fetch course details
      const courseResponse = await apiClient.getCourse(parseInt(courseId));
      setCourse(courseResponse.data);

      // Fetch course topics and lessons
      console.log('🔍 Fetching topics for course:', courseId);
      const topicsResponse = await apiClient.getCourseTopics(parseInt(courseId));
      console.log('📚 Topics response:', topicsResponse);
      const topicsData = topicsResponse.data || [];
      console.log('📚 Topics data:', topicsData);
        
        // Log lesson structure for debugging
        if (topicsData.length > 0 && topicsData[0].lessons && topicsData[0].lessons.length > 0) {
          const firstLesson = topicsData[0].lessons[0];
          console.log('📖 First lesson structure:', {
            id: firstLesson.id,
            title: firstLesson.title,
            video_url: firstLesson.video_url,
            video_duration: firstLesson.video_duration,
            estimated_duration: firstLesson.estimated_duration,
            duration: firstLesson.duration,
            content_type: firstLesson.content_type
          });
          
          // Log all lessons with video URLs for debugging
          topicsData.forEach((topic: any, topicIdx: number) => {
            if (topic.lessons && Array.isArray(topic.lessons)) {
              topic.lessons.forEach((lesson: any, lessonIdx: number) => {
                if (lesson.content_type === 'video') {
                  console.log(`📹 Lesson ${lesson.id} (${lesson.title}): video_url =`, lesson.video_url);
                }
              });
            }
          });
        }
        
        // Ensure video_url is preserved in all lessons
        const topicsWithVideoUrl = topicsData.map((topic: any) => ({
          ...topic,
          lessons: (topic.lessons || []).map((lesson: any) => ({
            ...lesson,
            video_url: lesson.video_url || null // Explicitly preserve video_url
          }))
        }));
        
        console.log('📹 Topics with lessons (checking video_url):', topicsWithVideoUrl.map((t: any) => ({
          topicId: t.id,
          title: t.title,
          lessons: (t.lessons || []).map((l: any) => ({
            id: l.id,
            title: l.title,
            content_type: l.content_type,
            video_url: l.video_url
          }))
        })));
        
        setTopics(topicsWithVideoUrl);

        // Fetch enrollment data to get progress
        try {
          console.log('🔍 Fetching enrollment data for course:', courseId);
          const enrollmentsResponse = await apiClient.getMyEnrollments();
          console.log('📊 Enrollment response:', enrollmentsResponse);
          
          let enrollments: any[] = [];
          
          if (Array.isArray(enrollmentsResponse.data)) {
            enrollments = enrollmentsResponse.data;
          } else if (enrollmentsResponse.data?.enrollments && Array.isArray(enrollmentsResponse.data.enrollments)) {
            enrollments = enrollmentsResponse.data.enrollments;
          }

          console.log('📚 Processed enrollments:', enrollments);
          console.log('🔍 Looking for course ID:', parseInt(courseId));

          // Find enrollment for this course
          // Backend returns course_id directly, not nested course object
          const courseEnrollment = enrollments.find(
            (e: any) => {
              const match = e.course_id === parseInt(courseId) || e.course?.id === parseInt(courseId);
              if (match) {
                console.log('✅ Found enrollment:', e);
              }
              return match;
            }
          );

          console.log('🎯 Course enrollment found:', courseEnrollment);

          if (courseEnrollment) {
            console.log('✅ Using enrollment data:', {
              id: courseEnrollment.id,
              course_id: courseEnrollment.course_id,
              progress_percentage: courseEnrollment.progress_percentage,
              completed_lessons: courseEnrollment.completed_lessons,
              total_lessons: courseEnrollment.total_lessons
            });
            
            setEnrollment(courseEnrollment);
            setEnrollmentId(courseEnrollment.id);
            
            // Always calculate total_lessons from actual topics data (most accurate)
            // Use topicsWithVideoUrl instead of topicsData to ensure video_url is preserved
            const totalLessons = topicsWithVideoUrl.reduce((acc: number, topic: any) => {
              return acc + (Array.isArray(topic.lessons) ? topic.lessons.length : 0);
            }, 0);

            // Get progress percentage from enrollment (ensure it's a number)
            const progressPercentage = typeof courseEnrollment.progress_percentage === 'number' 
              ? courseEnrollment.progress_percentage 
              : parseFloat(String(courseEnrollment.progress_percentage || 0)) || 0;

            // Use completed_lessons from enrollment if available and valid, otherwise calculate from percentage
            let completedLessons = 0;
            if (courseEnrollment.completed_lessons !== undefined && courseEnrollment.completed_lessons !== null) {
              completedLessons = parseInt(String(courseEnrollment.completed_lessons)) || 0;
            } else if (totalLessons > 0 && progressPercentage > 0) {
              // Calculate from percentage if completed_lessons is not available
              completedLessons = Math.round((progressPercentage / 100) * totalLessons);
            }
            
            // Ensure completed_lessons doesn't exceed total_lessons
            completedLessons = Math.min(completedLessons, totalLessons);

            console.log('📊 Progress calculation:', {
              totalLessons,
              completedLessons,
              progressPercentage
            });


            // Mark lessons as completed based on enrollment progress
            // First, try to fetch actual lesson progress from backend if available
            // Otherwise, estimate from completed_lessons count
            // Use topicsWithVideoUrl to ensure video_url is preserved
            let lessonCounter = 0;
            const updatedTopics = topicsWithVideoUrl.map((topic: any) => {
              const updatedLessons = (topic.lessons || []).map((lesson: any) => {
                // Keep existing is_completed status if it's already set
                // Otherwise, estimate based on completed_lessons count
                const currentIndex = lessonCounter;
                lessonCounter++;
                const estimatedCompleted = currentIndex < completedLessons;
                
                // Preserve ALL lesson fields including video_url
                return {
                  ...lesson,
                  // Preserve existing completion status, or use estimated if not set
                  is_completed: lesson.is_completed === true ? true : (lesson.is_completed === false ? false : estimatedCompleted),
                  // Explicitly preserve video_url to ensure it's not lost
                  video_url: lesson.video_url || null
                };
              });
              
              return {
                ...topic,
                lessons: updatedLessons
              };
            });

            setTopics(updatedTopics);

            // Recalculate progress percentage based on actual completed/total ratio
            const actualProgressPercentage = totalLessons > 0 
              ? Math.round((completedLessons / totalLessons) * 100)
              : 0;
            
            const finalProgress = {
              course_id: parseInt(courseId),
              total_lessons: totalLessons,
              completed_lessons: completedLessons,
              progress_percentage: Math.max(0, Math.min(100, actualProgressPercentage)) // Clamp between 0-100
            };
            
            console.log('📈 Setting progress from backend:', finalProgress);
            console.log('📊 Enrollment data used:', {
              enrollment_completed: courseEnrollment.completed_lessons,
              enrollment_total: courseEnrollment.total_lessons,
              enrollment_percentage: courseEnrollment.progress_percentage,
              calculated_total: totalLessons,
              calculated_completed: completedLessons,
              calculated_percentage: actualProgressPercentage
            });
            setProgress(finalProgress);

            // Set first lesson as current if available (use updated topics)
            if (updatedTopics.length > 0 && updatedTopics[0].lessons && updatedTopics[0].lessons.length > 0) {
              setCurrentLesson(updatedTopics[0].lessons[0]);
            }
          } else {
            // No enrollment found - set default progress
            console.warn('⚠️ No enrollment found for course:', courseId);
            console.log('📋 Available enrollments:', enrollments.map((e: any) => ({ 
              id: e.id, 
              course_id: e.course_id,
              course: e.course?.id 
            })));
            
            // Use topicsWithVideoUrl to ensure video_url is preserved
            const totalLessons = topicsWithVideoUrl.reduce((acc: number, topic: any) => {
              return acc + (Array.isArray(topic.lessons) ? topic.lessons.length : 0);
            }, 0);

            setProgress({
              course_id: parseInt(courseId),
              total_lessons: totalLessons,
              completed_lessons: 0,
              progress_percentage: 0
            });

            // Set first lesson as current if available
            if (topicsWithVideoUrl.length > 0 && topicsWithVideoUrl[0].lessons && topicsWithVideoUrl[0].lessons.length > 0) {
              setCurrentLesson(topicsWithVideoUrl[0].lessons[0]);
            }
          }
        } catch (enrollmentError) {
          console.error('Error fetching enrollment data:', enrollmentError);
          // Continue without enrollment data - set default progress
          // Use topicsWithVideoUrl to ensure video_url is preserved
          const totalLessons = topicsWithVideoUrl.reduce((acc: number, topic: any) => {
            return acc + (Array.isArray(topic.lessons) ? topic.lessons.length : 0);
          }, 0);

          setProgress({
            course_id: parseInt(courseId),
            total_lessons: totalLessons,
            completed_lessons: 0,
            progress_percentage: 0
          });

          // Set first lesson as current if available
          if (topicsWithVideoUrl.length > 0 && topicsWithVideoUrl[0].lessons && topicsWithVideoUrl[0].lessons.length > 0) {
            setCurrentLesson(topicsWithVideoUrl[0].lessons[0]);
          }
        }

      } catch (error: any) {
        console.error('Error fetching course data:', error);
        
        // Handle authentication errors
        if (error?.status === 401 || error?.message?.includes('Could not validate credentials') || error?.message?.includes('Unauthorized')) {
          console.log('Authentication error detected, redirecting to login...');
          // Clear any invalid tokens
          if (typeof window !== 'undefined') {
            localStorage.removeItem('lms_access_token');
            localStorage.removeItem('lms_refresh_token');
          }
          // Redirect to login with return URL
          router.push('/login?redirect=' + encodeURIComponent(`/student/courses/${courseId}/learn`));
          return;
        }
        
        // Handle other errors
        const errorMessage = error?.message || 'Failed to load course. Please try again.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
  }, [courseId, authLoading, isAuthenticated, router]);

  // Initial fetch when component mounts or dependencies change
  useEffect(() => {
    if (courseId) {
      fetchCourseData();
    }
  }, [courseId, fetchCourseData]);

  // Refresh course data when page becomes visible (to get latest updates from tutor)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated && courseId && !loading) {
        console.log('🔄 Page became visible, refreshing course data...');
        fetchCourseData();
      }
    };

    const handleFocus = () => {
      if (isAuthenticated && courseId && !loading) {
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
  }, [courseId, isAuthenticated, loading, fetchCourseData]);

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
      const clampedVolume = Math.max(0, Math.min(1, newVolume));
      videoRef.current.volume = clampedVolume;
      setVolume(clampedVolume);
      if (clampedVolume > 0 && isMuted) {
        setIsMuted(false);
        videoRef.current.muted = false;
      }
    }
  };

  // Helper function to get lesson duration in seconds
  // Priority: video_duration (from backend or video metadata) > estimated_duration > duration
  const getLessonDuration = (lesson: Lesson): number => {
    // Try video_duration first (in seconds) - this is the actual video file duration
    if (lesson.video_duration && typeof lesson.video_duration === 'number' && lesson.video_duration > 0) {
      return lesson.video_duration;
    } 
    // Fallback to estimated_duration (in minutes) - convert to seconds
    else if (lesson.estimated_duration && typeof lesson.estimated_duration === 'number' && lesson.estimated_duration > 0) {
      return lesson.estimated_duration * 60;
    } 
    // Legacy duration field
    else if (lesson.duration && typeof lesson.duration === 'number' && lesson.duration > 0) {
      return lesson.duration;
    }
    return 0;
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      resetControlsTimeout();
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current && currentLesson) {
      const videoDuration = videoRef.current.duration;
      
      // Always use the actual video duration from the video element (most accurate)
      if (videoDuration > 0 && !isNaN(videoDuration)) {
        setDuration(videoDuration);
        
        const roundedDuration = Math.round(videoDuration);
        
        // Update the current lesson with the actual video duration
        setCurrentLesson((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            video_duration: roundedDuration
          };
        });
        
        // Also update in topics array so sidebar shows correct duration
        setTopics((prevTopics) => 
          prevTopics.map((topic: any) => ({
            ...topic,
            lessons: (topic.lessons || []).map((l: any) =>
              l.id === currentLesson.id
                ? { ...l, video_duration: roundedDuration }
                : l
            )
          }))
        );
        
        console.log('📹 Video duration loaded from video metadata:', roundedDuration, 'seconds');
        console.log('📹 Updated lesson:', currentLesson.id, 'with duration:', roundedDuration);
      }
    }
  };

  const handleWaiting = () => {
    setIsBuffering(true);
  };

  const handleCanPlay = () => {
    setIsBuffering(false);
  };

  const handleProgress = () => {
    if (videoRef.current) {
      const buffered = videoRef.current.buffered;
      const ranges: { start: number; end: number }[] = [];
      for (let i = 0; i < buffered.length; i++) {
        ranges.push({
          start: buffered.start(i),
          end: buffered.end(i)
        });
      }
      setBufferedRanges(ranges);
    }
  };

  const handlePictureInPicture = async () => {
    if (!videoRef.current) return;
    
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPictureInPicture(false);
      } else {
        await videoRef.current.requestPictureInPicture();
        setIsPictureInPicture(true);
      }
    } catch (error) {
      console.error('Picture-in-picture error:', error);
    }
  };

  // Picture-in-picture event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnterPictureInPicture = () => setIsPictureInPicture(true);
    const handleLeavePictureInPicture = () => setIsPictureInPicture(false);

    video.addEventListener('enterpictureinpicture', handleEnterPictureInPicture);
    video.addEventListener('leavepictureinpicture', handleLeavePictureInPicture);

    return () => {
      video.removeEventListener('enterpictureinpicture', handleEnterPictureInPicture);
      video.removeEventListener('leavepictureinpicture', handleLeavePictureInPicture);
    };
  }, []);

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressBarRef.current && videoRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const newTime = percent * duration;
      handleSeek(newTime);
    }
  };

  const handleProgressBarHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressBarRef.current && duration > 0) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const hoverTime = Math.max(0, Math.min(duration, percent * duration));
      setPreviewTime(hoverTime);
      setShowPreview(true);
    }
  };

  const handleProgressBarLeave = () => {
    setShowPreview(false);
  };

  const handleFullscreen = () => {
    if (!videoContainerRef.current) return;
    
    if (!isFullscreen) {
      if (videoContainerRef.current.requestFullscreen) {
        videoContainerRef.current.requestFullscreen();
      } else if ((videoContainerRef.current as any).webkitRequestFullscreen) {
        (videoContainerRef.current as any).webkitRequestFullscreen();
      } else if ((videoContainerRef.current as any).msRequestFullscreen) {
        (videoContainerRef.current as any).msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
      setShowSpeedMenu(false);
    }
  };

  const skipForward = (seconds: number = 10) => {
    if (videoRef.current) {
      handleSeek(Math.min(currentTime + seconds, duration));
    }
  };

  const skipBackward = (seconds: number = 10) => {
    if (videoRef.current) {
      handleSeek(Math.max(currentTime - seconds, 0));
    }
  };

  const handleVideoClick = () => {
    handlePlayPause();
  };

  const resetControlsTimeout = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!videoRef.current) return;
      
      // Don't trigger if user is typing in an input
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skipBackward(10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          skipForward(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleVolumeChange(Math.min(volume + 0.1, 1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleVolumeChange(Math.max(volume - 0.1, 0));
          break;
        case 'm':
          e.preventDefault();
          handleMuteToggle();
          break;
        case 'f':
          e.preventDefault();
          handleFullscreen();
          break;
        case 't':
          e.preventDefault();
          setIsTheaterMode(!isTheaterMode);
          break;
        case 'i':
          e.preventDefault();
          handlePictureInPicture();
          break;
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          e.preventDefault();
          const percent = parseInt(e.key) / 10;
          handleSeek(percent * duration);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, volume, duration, currentTime]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (showSpeedMenu && !target.closest('[data-speed-menu]')) {
        setShowSpeedMenu(false);
      }
      if (showSettingsMenu && !target.closest('[data-settings-menu]')) {
        setShowSettingsMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSpeedMenu, showSettingsMenu]);

  // Preload metadata for all video lessons to get their actual durations
  // Use a ref to track if we've already started preloading to prevent re-running
  const preloadStartedRef = useRef<Set<number>>(new Set());
  const topicsInitializedRef = useRef<string>(''); // Track which courseId we've initialized for
  const topicsHashRef = useRef<string>(''); // Track a hash of topic IDs to detect new topics
  
  // Reset refs when courseId changes
  useEffect(() => {
    preloadStartedRef.current.clear();
    topicsInitializedRef.current = '';
    topicsHashRef.current = '';
  }, [courseId]);
  
  useEffect(() => {
    if (!topics || topics.length === 0) return;
    
    // Create a hash of topic and lesson IDs to detect if topics have actually changed
    const topicsHash = topics.map((t: any) => 
      `${t.id}-${(t.lessons || []).map((l: any) => l.id).join(',')}`
    ).join('|');
    
    // Only run if topics hash has changed (new topics loaded) or courseId changed
    if (topicsHashRef.current === topicsHash && topicsInitializedRef.current === courseId) {
      return; // Topics haven't changed, skip
    }
    
    // Mark as initialized for this course and store hash
    topicsInitializedRef.current = courseId;
    topicsHashRef.current = topicsHash;

    // Collect ALL video lessons - always preload to get actual video duration
    // This ensures we get the real duration even if estimated_duration exists
    const videoLessons: Array<{ lessonId: number; videoUrl: string; topicIndex: number; lessonIndex: number }> = [];
    topics.forEach((topic: any, topicIdx: number) => {
      if (topic.lessons && Array.isArray(topic.lessons)) {
        topic.lessons.forEach((lesson: any, lessonIdx: number) => {
          // Validate video_url before attempting to preload
          if (lesson.content_type === 'video' && lesson.video_url) {
            // Check if video_url is a valid non-empty string
            const videoUrl = String(lesson.video_url).trim();
            if (videoUrl && videoUrl.length > 0) {
              // Skip YouTube URLs - they can't be preloaded with HTML5 video element
              if (isYouTubeUrl(videoUrl)) {
                console.log(`📹 Skipping metadata preload for YouTube video in lesson ${lesson.id}`);
                return; // Skip YouTube videos
              }
              
              // Basic URL validation for non-YouTube URLs
              try {
                new URL(videoUrl);
                // Only add if we haven't started preloading this lesson yet
                if (!preloadStartedRef.current.has(lesson.id)) {
                  videoLessons.push({
                    lessonId: lesson.id,
                    videoUrl: videoUrl,
                    topicIndex: topicIdx,
                    lessonIndex: lessonIdx
                  });
                }
              } catch (e) {
                // Invalid URL, skip preloading
                console.warn(`⚠️ Invalid video URL for lesson ${lesson.id}: ${videoUrl}`);
              }
            }
          }
        });
      }
    });

    if (videoLessons.length === 0) {
      return; // No new lessons to preload
    }

    console.log(`📹 Preloading metadata for ${videoLessons.length} video lessons...`);

    // Create hidden video elements to preload metadata
    const videoElements: HTMLVideoElement[] = [];
    const timeouts: NodeJS.Timeout[] = [];
    const processedLessons = new Set<number>(); // Track which lessons have been processed

    videoLessons.forEach(({ lessonId, videoUrl, topicIndex, lessonIndex }) => {
      // Mark as started to prevent re-processing
      preloadStartedRef.current.add(lessonId);
      
      // Skip if already processed
      if (processedLessons.has(lessonId)) {
        return;
      }

      // Validate URL before creating video element
      let isValidVideoUrl = false;
      try {
        const testUrl = new URL(videoUrl);
        isValidVideoUrl = true;
      } catch (e) {
        console.warn(`⚠️ Skipping preload for lesson ${lessonId} - invalid video URL: ${videoUrl}`);
        return; // Skip this video
      }

      if (!isValidVideoUrl) {
        return; // Skip invalid URLs
      }

      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = videoUrl;
      video.style.display = 'none';
      video.muted = true; // Mute to allow autoplay for metadata loading
      video.playsInline = true;
      document.body.appendChild(video);
      videoElements.push(video);

      let hasProcessed = false; // Flag to prevent duplicate processing

      const handleLoadedMetadata = () => {
        // Prevent duplicate processing
        if (hasProcessed || processedLessons.has(lessonId)) {
          return;
        }

        const videoDuration = video.duration;
        if (videoDuration > 0 && !isNaN(videoDuration)) {
          hasProcessed = true;
          processedLessons.add(lessonId);
          
          const roundedDuration = Math.round(videoDuration);
          
          console.log(`📹 Metadata loaded for lesson ${lessonId}: ${roundedDuration} seconds (${Math.floor(roundedDuration / 60)}:${String(roundedDuration % 60).padStart(2, '0')})`);
          
          // Update in topics array - this will trigger a re-render of the sidebar
          // Use functional update to avoid dependency on topics
          setTopics((prevTopics) => {
            const updatedTopics = prevTopics.map((topic: any, tIdx: number) => {
              if (tIdx === topicIndex && topic.lessons) {
                return {
                  ...topic,
                  lessons: topic.lessons.map((l: any, lIdx: number) =>
                    lIdx === lessonIndex
                      ? { ...l, video_duration: roundedDuration }
                      : l
                  )
                };
              }
              return topic;
            });
            return updatedTopics;
          });
          
          // Also update currentLesson if it's the same lesson
          setCurrentLesson((prev) => {
            if (prev && prev.id === lessonId) {
              return { ...prev, video_duration: roundedDuration };
            }
            return prev;
          });
          
          console.log(`✅ Updated duration for lesson ${lessonId} in topics array`);
        } else {
          console.warn(`⚠️ Invalid duration for lesson ${lessonId}: ${videoDuration}`);
        }
      };

      const handleError = (e: Event) => {
        if (!hasProcessed) {
          const error = e.target as HTMLVideoElement;
          const errorCode = error.error?.code;
          const errorMessage = error.error?.message || 'Unknown error';
          
          // Only log warning, don't throw error
          console.warn(`⚠️ Failed to load metadata for lesson ${lessonId}:`, {
            code: errorCode,
            message: errorMessage,
            videoUrl: videoUrl
          });
          
          // Clean up the video element on error
          try {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('error', handleError);
            // Remove src to prevent further errors
            video.src = '';
            video.load();
            if (video.parentNode) {
              video.parentNode.removeChild(video);
            }
          } catch (cleanupError) {
            // Ignore cleanup errors - just try to remove from DOM
            try {
              if (video.parentNode) {
                video.parentNode.removeChild(video);
              }
            } catch (e) {
              // Final fallback - ignore
            }
          }
          
          // Mark as processed to prevent duplicate error handling
          hasProcessed = true;
          processedLessons.add(lessonId);
        }
      };

      // Use only loadedmetadata event to avoid duplicates
      video.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
      video.addEventListener('error', handleError, { once: true });
      
      // Add additional error handlers to catch all error types
      video.addEventListener('abort', handleError, { once: true });
      video.addEventListener('stalled', () => {
        console.warn(`⚠️ Video stalled for lesson ${lessonId}`);
      }, { once: true });
      
      // Start loading metadata immediately with error handling
      // Wrap in try-catch and also handle promise rejections
      try {
        // Set error handler before loading to catch errors immediately
        const loadPromise = new Promise<void>((resolve, reject) => {
          const successHandler = () => {
            video.removeEventListener('error', rejectHandler);
            resolve();
          };
          const rejectHandler = (e: Event) => {
            video.removeEventListener('loadedmetadata', successHandler);
            reject(e);
          };
          
          video.addEventListener('loadedmetadata', successHandler, { once: true });
          video.addEventListener('error', rejectHandler, { once: true });
          
          // Start loading
          try {
            video.load();
          } catch (loadError) {
            reject(loadError);
          }
        });
        
        // Handle promise rejection silently
        loadPromise.catch((error) => {
          // Error already handled by handleError event listener
          // Just prevent unhandled promise rejection
        });
      } catch (loadError) {
        console.warn(`⚠️ Error calling video.load() for lesson ${lessonId}:`, loadError);
        handleError(new Event('error'));
      }
      
      // Backup: check if metadata is already available after a short delay
      const timeout = setTimeout(() => {
        if (!hasProcessed && video.readyState >= 1 && video.duration > 0) { // HAVE_METADATA
          handleLoadedMetadata();
        }
      }, 200);
      timeouts.push(timeout);
    });

    // Cleanup function
    return () => {
      // Clear all timeouts
      timeouts.forEach(timeout => clearTimeout(timeout));
      
      // Remove all video elements
      videoElements.forEach((video) => {
        // Remove from DOM if it has a parent
        if (video.parentNode) {
          video.parentNode.removeChild(video);
        }
      });
    };
  }, [topics, courseId]); // Run when topics are first loaded for a course

  // Update duration from video when lesson changes
  useEffect(() => {
    if (videoRef.current && currentLesson && currentLesson.video_url) {
      // Reset duration when lesson changes
      setDuration(0);
      
      // Wait a bit for video to load, then check duration
      const checkDuration = () => {
        if (videoRef.current && videoRef.current.duration) {
          const videoDuration = videoRef.current.duration;
          if (videoDuration > 0 && !isNaN(videoDuration)) {
            const roundedDuration = Math.round(videoDuration);
            setDuration(videoDuration);
            
            // Update lesson with actual video duration
            setCurrentLesson((prev) => {
              if (!prev || prev.id !== currentLesson.id) return prev;
              return { ...prev, video_duration: roundedDuration };
            });
            
            // Update in topics array
            setTopics((prevTopics) => 
              prevTopics.map((topic: any) => ({
                ...topic,
                lessons: (topic.lessons || []).map((l: any) =>
                  l.id === currentLesson.id
                    ? { ...l, video_duration: roundedDuration }
                    : l
                )
              }))
            );
            
            console.log('📹 Duration synced from video for lesson:', currentLesson.id, '=', roundedDuration, 'seconds');
          }
        }
      };
      
      // Check immediately and also after a delay
      checkDuration();
      const timeout = setTimeout(checkDuration, 500);
      
      return () => clearTimeout(timeout);
    }
  }, [currentLesson?.id, currentLesson?.video_url]);

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
    // Find the full lesson data from topics to ensure we have all fields including video_url
    let fullLesson = lesson;
    for (const topic of topics) {
      const foundLesson = topic.lessons?.find((l: any) => l.id === lesson.id);
      if (foundLesson) {
        fullLesson = foundLesson;
        break;
      }
    }
    
    // Debug logging
    console.log('🎯 Selecting lesson:', {
      lessonId: fullLesson.id,
      title: fullLesson.title,
      content_type: fullLesson.content_type,
      video_url: fullLesson.video_url,
      hasVideoUrl: !!fullLesson.video_url
    });
    
    setCurrentLesson(fullLesson);
    setIsPlaying(false);
    
    // Reset video player state
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
      setDuration(0); // Reset duration, will be set when video metadata loads
      
      // Force video to reload to get fresh metadata and actual duration
      if (fullLesson.video_url) {
        videoRef.current.load(); // This will trigger onLoadedMetadata with actual video duration
      }
    }
  };

  const toggleBookmark = (lessonId: number) => {
    setBookmarks(prev => 
      prev.includes(lessonId) 
        ? prev.filter(id => id !== lessonId)
        : [...prev, lessonId]
    );
  };

  const markLessonComplete = async () => {
    if (!currentLesson || !enrollmentId) {
      console.warn('Cannot mark lesson complete: missing lesson or enrollment');
      return;
    }

    // Don't mark again if already completed
    if (currentLesson.is_completed) {
      console.log('Lesson already completed');
      return;
    }

    try {
      // Update lesson completion status in local state
      const updatedTopics = topics.map((topic: any) => ({
        ...topic,
        lessons: (topic.lessons || []).map((lesson: any) =>
          lesson.id === currentLesson.id
            ? { ...lesson, is_completed: true }
            : lesson
        )
      }));
      setTopics(updatedTopics);

      // Update current lesson
      setCurrentLesson({ ...currentLesson, is_completed: true });

      // Calculate new progress
      const totalLessons = updatedTopics.reduce((acc: number, topic: any) => {
        return acc + (Array.isArray(topic.lessons) ? topic.lessons.length : 0);
      }, 0);

      const completedLessons = updatedTopics.reduce((acc: number, topic: any) => {
        return acc + (Array.isArray(topic.lessons)
          ? topic.lessons.filter((l: any) => l.is_completed).length
          : 0);
      }, 0);

      const newProgressPercentage = totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;

      // Update local progress state
      setProgress({
        course_id: parseInt(courseId),
        total_lessons: totalLessons,
        completed_lessons: completedLessons,
        progress_percentage: newProgressPercentage
      });

      // Update enrollment on backend
      if (enrollmentId) {
        console.log('📤 Updating enrollment:', {
          enrollmentId,
          completedLessons,
          progressPercentage: newProgressPercentage
        });

        try {
          // Ensure progress_percentage is a float between 0 and 100
          const progressPercentage = Math.max(0, Math.min(100, parseFloat(newProgressPercentage.toFixed(2))));
          
          const updateData = {
            completed_lessons: parseInt(String(completedLessons)),
            progress_percentage: progressPercentage
          };
          
          console.log('📤 Sending update data:', updateData);
          
          const updateResponse = await apiClient.updateEnrollment(enrollmentId, updateData);
          console.log('✅ Enrollment updated successfully:', updateResponse);

          // Refresh enrollment data
          const enrollmentsResponse = await apiClient.getMyEnrollments();
          let enrollments: any[] = [];
          
          if (Array.isArray(enrollmentsResponse.data)) {
            enrollments = enrollmentsResponse.data;
          } else if (enrollmentsResponse.data?.enrollments && Array.isArray(enrollmentsResponse.data.enrollments)) {
            enrollments = enrollmentsResponse.data.enrollments;
          }

          const courseEnrollment = enrollments.find(
            (e: any) => e.course_id === parseInt(courseId) || e.course?.id === parseInt(courseId)
          );

          if (courseEnrollment) {
            setEnrollment(courseEnrollment);
            console.log('✅ Enrollment data refreshed');
          }
        } catch (updateError: any) {
          console.error('❌ Error updating enrollment:', updateError);
          console.error('Error details:', {
            message: updateError?.message,
            status: updateError?.status,
            details: updateError?.details
          });
          // Don't throw - we've already updated local state
          // The user will see the progress update even if backend save fails
        }
      } else {
        console.warn('⚠️ No enrollmentId available, skipping backend update');
      }

      console.log('✅ Lesson marked as complete:', currentLesson.id);
    } catch (error: any) {
      console.error('❌ Error marking lesson complete:', error);
      console.error('Error details:', {
        message: error?.message,
        status: error?.status,
        details: error?.details
      });
      // Revert local state on error if needed
      // For now, we'll keep the optimistic update
    }
  };

  const handleVideoEnded = () => {
    console.log('Video ended, marking lesson as complete');
    setIsPlaying(false);
    setShowControls(true);
    markLessonComplete();
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds) || seconds < 0) {
      return '0:00';
    }
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
            {progress ? (
              <>
                {progress.completed_lessons} of {progress.total_lessons} lessons completed
                <span className="ml-2">({Math.round(progress.progress_percentage)}%)</span>
              </>
            ) : (
              'Loading progress...'
            )}
          </div>
          <div className="w-32 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.max(0, Math.min(100, progress?.progress_percentage || 0))}%` }}
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
                    <span className="text-sm text-gray-500">
                      {Array.isArray(topic.lessons) ? topic.lessons.filter((lesson: any) => lesson.is_completed).length : 0}/{Array.isArray(topic.lessons) ? topic.lessons.length : 0}
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
                                {formatTime(getLessonDuration(lesson))}
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
        <div className={`flex-1 flex flex-col ${isTheaterMode ? 'max-w-7xl mx-auto w-full' : ''}`}>
          {currentLesson ? (
            <>
              {/* Enhanced Video Player */}
              {currentLesson.content_type === 'video' && (() => {
                // Validate video_url before rendering
                const videoUrl = currentLesson.video_url ? String(currentLesson.video_url).trim() : '';
                
                // Debug logging
                console.log('🎬 Rendering video player for lesson:', {
                  lessonId: currentLesson.id,
                  title: currentLesson.title,
                  video_url: currentLesson.video_url,
                  videoUrl_processed: videoUrl,
                  hasVideoUrl: !!videoUrl && videoUrl.length > 0
                });
                
                if (!videoUrl || videoUrl.length === 0) {
                  console.warn('⚠️ No video URL found for lesson:', currentLesson.id, currentLesson.title);
                  return (
                    <div className="bg-gray-100 rounded-lg p-8 text-center">
                      <p className="text-gray-600">Video URL is not available for this lesson.</p>
                      <p className="text-sm text-gray-500 mt-2">Lesson ID: {currentLesson.id}</p>
                    </div>
                  );
                }
                
                // Check if it's a YouTube URL
                if (isYouTubeUrl(videoUrl)) {
                  const embedUrl = getYouTubeEmbedUrl(videoUrl);
                  if (!embedUrl) {
                    return (
                      <div className="bg-gray-100 rounded-lg p-8 text-center">
                        <p className="text-gray-600">Invalid YouTube URL for this lesson.</p>
                      </div>
                    );
                  }
                  
                  // Render YouTube iframe
                  // Note: YouTube's embedded player may show console warnings about aria-hidden and CORS
                  // These are harmless and come from YouTube's player, not our code
                  return (
                    <div 
                      className={`bg-black relative ${isTheaterMode ? 'rounded-lg overflow-hidden' : ''} ${isTheaterMode ? 'h-[70vh]' : 'h-96'} flex items-center justify-center`}
                    >
                      <iframe
                        src={embedUrl}
                        className="w-full h-full"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        title={currentLesson.title}
                        loading="lazy"
                        // Suppress YouTube's internal console errors (they're harmless but noisy)
                        onError={(e) => {
                          // Silently handle iframe load errors
                          console.debug('YouTube iframe loaded (any console warnings are from YouTube\'s player, not our code)');
                        }}
                      />
                    </div>
                  );
                }
                
                // Validate URL format for non-YouTube videos
                let isValidUrl = false;
                try {
                  new URL(videoUrl);
                  isValidUrl = true;
                } catch (e) {
                  return (
                    <div className="bg-gray-100 rounded-lg p-8 text-center">
                      <p className="text-gray-600">Invalid video URL for this lesson.</p>
                    </div>
                  );
                }
                
                if (!isValidUrl) {
                  return null;
                }
                
                return (
                <div 
                  ref={videoContainerRef}
                  className={`bg-black relative group ${isTheaterMode ? 'rounded-lg overflow-hidden' : ''} ${isTheaterMode ? 'h-[70vh]' : 'h-96'} flex flex-col`}
                  onMouseEnter={() => {
                    setIsHovering(true);
                    setShowControls(true);
                    resetControlsTimeout();
                  }}
                  onMouseLeave={() => {
                    setIsHovering(false);
                    if (isPlaying) {
                      resetControlsTimeout();
                    }
                  }}
                  onMouseMove={resetControlsTimeout}
                >
                  <div className="relative flex-1 flex items-center justify-center min-h-0">
                    <video
                      key={currentLesson.id} // Force remount when lesson changes to reload metadata
                      ref={videoRef}
                      src={videoUrl}
                      onError={(e) => {
                        console.error('Video load error:', e);
                        // Prevent error from breaking the page
                      }}
                      className="w-full h-full max-w-full max-h-full object-contain cursor-pointer"
                      preload="metadata"
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                      onLoadedData={() => {
                        // Also capture duration when data is loaded (backup)
                        if (videoRef.current && videoRef.current.duration && currentLesson) {
                          const videoDuration = videoRef.current.duration;
                          if (videoDuration > 0 && !isNaN(videoDuration)) {
                            const roundedDuration = Math.round(videoDuration);
                            setDuration(videoDuration);
                            
                            // Update lesson with actual video duration
                            setCurrentLesson((prev) => {
                              if (!prev) return prev;
                              return { ...prev, video_duration: roundedDuration };
                            });
                            
                            // Update in topics array
                            setTopics((prevTopics) => 
                              prevTopics.map((topic: any) => ({
                                ...topic,
                                lessons: (topic.lessons || []).map((l: any) =>
                                  l.id === currentLesson.id
                                    ? { ...l, video_duration: roundedDuration }
                                    : l
                                )
                              }))
                            );
                            
                            console.log('📹 Video duration from onLoadedData:', roundedDuration, 'seconds');
                          }
                        }
                      }}
                      onWaiting={handleWaiting}
                      onCanPlay={handleCanPlay}
                      onProgress={handleProgress}
                      onPlay={() => {
                        setIsPlaying(true);
                        resetControlsTimeout();
                      }}
                      onPause={() => {
                        setIsPlaying(false);
                        setShowControls(true);
                      }}
                      onEnded={handleVideoEnded}
                      onClick={handleVideoClick}
                    />
                  </div>

                  {/* Buffering Indicator */}
                  {isBuffering && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                    </div>
                  )}
                  
                  {/* Enhanced Video Controls */}
                  <div 
                    className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-300 ${
                      showControls || isHovering ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    {/* Enhanced Progress Bar with Buffering */}
                    <div 
                      ref={progressBarRef}
                      className="w-full h-2 bg-gray-600/50 cursor-pointer group/progress relative"
                      onClick={handleProgressBarClick}
                      onMouseMove={handleProgressBarHover}
                      onMouseLeave={handleProgressBarLeave}
                    >
                      {/* Buffered ranges */}
                      {bufferedRanges.map((range, index) => (
                        <div
                          key={index}
                          className="absolute h-full bg-gray-500/30"
                          style={{
                            left: `${(range.start / duration) * 100}%`,
                            width: `${((range.end - range.start) / duration) * 100}%`
                          }}
                        />
                      ))}
                      
                      {/* Progress */}
                      <div 
                        className="h-full bg-indigo-500 transition-all duration-200 relative group-hover/progress:bg-indigo-400 z-10"
                        style={{ 
                          width: `${duration && duration > 0 
                            ? Math.max(0, Math.min(100, (currentTime / duration) * 100)) 
                            : 0}%` 
                        }}
                      >
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity shadow-lg" />
                      </div>

                      {/* Preview Tooltip */}
                      {showPreview && duration > 0 && (
                        <div 
                          className="absolute bottom-full mb-2 transform -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-20"
                          style={{ left: `${(previewTime / duration) * 100}%` }}
                        >
                          {formatTime(previewTime)}
                        </div>
                      )}
                    </div>

                    {/* Control Buttons */}
                    <div className="px-4 py-3 flex items-center space-x-4">
                      {/* Play/Pause */}
                      <button
                        onClick={handlePlayPause}
                        className="text-white hover:text-gray-300 transition-colors"
                        aria-label={isPlaying ? 'Pause' : 'Play'}
                      >
                        {isPlaying ? <PauseIcon className="h-6 w-6" /> : <PlayIcon className="h-6 w-6" />}
                      </button>

                      {/* Skip Backward */}
                      <button
                        onClick={() => skipBackward(10)}
                        className="text-white hover:text-gray-300 transition-colors"
                        aria-label="Skip backward 10 seconds"
                      >
                        <BackwardIcon className="h-5 w-5" />
                      </button>

                      {/* Skip Forward */}
                      <button
                        onClick={() => skipForward(10)}
                        className="text-white hover:text-gray-300 transition-colors"
                        aria-label="Skip forward 10 seconds"
                      >
                        <ForwardIcon className="h-5 w-5" />
                      </button>

                      {/* Volume Control */}
                      <div 
                        className="relative flex items-center space-x-2"
                        onMouseEnter={() => setShowVolumeSlider(true)}
                        onMouseLeave={() => setShowVolumeSlider(false)}
                      >
                        <button
                          onClick={handleMuteToggle}
                          className="text-white hover:text-gray-300 transition-colors"
                          aria-label={isMuted ? 'Unmute' : 'Mute'}
                        >
                          {isMuted || volume === 0 ? (
                            <SpeakerXMarkIcon className="h-5 w-5" />
                          ) : volume < 0.5 ? (
                            <SpeakerWaveIcon className="h-5 w-5" />
                          ) : (
                            <SpeakerWaveIcon className="h-5 w-5" />
                          )}
                        </button>
                        {showVolumeSlider && (
                          <div className="absolute bottom-full left-0 mb-2 bg-black/80 rounded px-2 py-1">
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.01"
                              value={isMuted ? 0 : volume}
                              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                              className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                              style={{
                                background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${(isMuted ? 0 : volume) * 100}%, #4b5563 ${(isMuted ? 0 : volume) * 100}%, #4b5563 100%)`
                              }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Time Display */}
                      <span className="text-white text-sm font-mono">
                        {formatTime(isNaN(currentTime) ? 0 : currentTime)} / {formatTime(isNaN(duration) ? 0 : duration)}
                      </span>

                      <div className="flex-1" />

                      {/* Playback Speed */}
                      <div className="relative" data-speed-menu>
                        <button
                          onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                          className="text-white hover:text-gray-300 transition-colors text-sm font-medium px-2 py-1"
                        >
                          {playbackRate}x
                        </button>
                        {showSpeedMenu && (
                          <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded shadow-lg overflow-hidden z-50">
                            {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                              <button
                                key={rate}
                                onClick={() => handlePlaybackRateChange(rate)}
                                className={`block w-full text-left px-4 py-2 text-sm text-white hover:bg-indigo-600 transition-colors ${
                                  playbackRate === rate ? 'bg-indigo-600' : ''
                                }`}
                              >
                                {rate}x
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Theater Mode */}
                      <button
                        onClick={() => setIsTheaterMode(!isTheaterMode)}
                        className={`text-white hover:text-gray-300 transition-colors ${isTheaterMode ? 'text-indigo-400' : ''}`}
                        aria-label={isTheaterMode ? 'Exit theater mode' : 'Enter theater mode'}
                        title="Theater mode (t)"
                      >
                        <RectangleStackIcon className="h-5 w-5" />
                      </button>

                      {/* Picture-in-Picture */}
                      {document.pictureInPictureEnabled && (
                        <button
                          onClick={handlePictureInPicture}
                          className={`text-white hover:text-gray-300 transition-colors ${isPictureInPicture ? 'text-indigo-400' : ''}`}
                          aria-label={isPictureInPicture ? 'Exit picture-in-picture' : 'Enter picture-in-picture'}
                          title="Picture-in-picture (i)"
                        >
                          <PhotoIcon className="h-5 w-5" />
                        </button>
                      )}

                      {/* Fullscreen */}
                      <button
                        onClick={handleFullscreen}
                        className="text-white hover:text-gray-300 transition-colors"
                        aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                        title="Fullscreen (f)"
                      >
                        {isFullscreen ? (
                          <ArrowsPointingInIcon className="h-5 w-5" />
                        ) : (
                          <ArrowsPointingOutIcon className="h-5 w-5" />
                        )}
                      </button>

                      {/* Settings Menu */}
                      <div className="relative" data-settings-menu>
                        <button
                          onClick={() => {
                            setShowSettingsMenu(!showSettingsMenu);
                            setShowSpeedMenu(false);
                          }}
                          className="text-white hover:text-gray-300 transition-colors"
                          aria-label="Settings"
                          title="Settings"
                        >
                          <Cog6ToothIcon className="h-5 w-5" />
                        </button>
                        {showSettingsMenu && (
                          <div className="absolute bottom-full right-0 mb-2 bg-black/95 rounded shadow-xl overflow-hidden z-50 min-w-[200px]">
                            {/* Playback Speed */}
                            <div className="px-4 py-2 border-b border-gray-700">
                              <div className="text-xs text-gray-400 mb-2">Playback Speed</div>
                              <div className="space-y-1">
                                {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                                  <button
                                    key={rate}
                                    onClick={() => {
                                      handlePlaybackRateChange(rate);
                                      setShowSettingsMenu(false);
                                    }}
                                    className={`block w-full text-left px-3 py-1.5 text-sm text-white hover:bg-gray-700 rounded transition-colors ${
                                      playbackRate === rate ? 'bg-indigo-600' : ''
                                    }`}
                                  >
                                    {rate}x {rate === 1 && '(Normal)'}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Quality (placeholder) */}
                            <div className="px-4 py-2 border-b border-gray-700">
                              <div className="text-xs text-gray-400 mb-2">Quality</div>
                              <button className="block w-full text-left px-3 py-1.5 text-sm text-white hover:bg-gray-700 rounded transition-colors">
                                Auto
                              </button>
                            </div>

                            {/* Captions (placeholder) */}
                            <div className="px-4 py-2">
                              <div className="text-xs text-gray-400 mb-2">Subtitles/CC</div>
                              <button className="block w-full text-left px-3 py-1.5 text-sm text-gray-400 rounded transition-colors cursor-not-allowed">
                                <LanguageIcon className="h-4 w-4 inline mr-2" />
                                None available
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Keyboard Shortcuts Hint */}
                    {isHovering && (
                      <div className="px-4 pb-2 text-xs text-gray-400 flex flex-wrap gap-x-2 gap-y-1">
                        <span>Space/K: Play/Pause</span>
                        <span>•</span>
                        <span>← →: Skip 10s</span>
                        <span>•</span>
                        <span>↑ ↓: Volume</span>
                        <span>•</span>
                        <span>M: Mute</span>
                        <span>•</span>
                        <span>F: Fullscreen</span>
                        <span>•</span>
                        <span>T: Theater</span>
                        <span>•</span>
                        <span>I: PiP</span>
                        <span>•</span>
                        <span>0-9: Jump to %</span>
                      </div>
                    )}
                  </div>
                </div>
                );
              })()}

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
                      disabled={currentLesson.is_completed}
                      className={`px-6 py-2 rounded-md flex items-center transition-colors ${
                        currentLesson.is_completed
                          ? 'bg-green-500 text-white cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                      {currentLesson.is_completed ? 'Completed' : 'Mark Complete'}
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

