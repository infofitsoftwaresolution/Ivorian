/**
 * Course Builder Interface
 * Advanced content creation tool for building course content
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api/client';
import { 
  BookOpenIcon,
  PlayIcon,
  DocumentTextIcon,
  PlusIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  EyeIcon,
  Cog6ToothIcon,
  ArrowLeftIcon,
  VideoCameraIcon,
  PaperClipIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import SuccessToast from '@/components/ui/SuccessToast';
import ConfirmationToast from '@/components/ui/ConfirmationToast';
import RichTextEditor from '@/components/editor/RichTextEditor';
import VideoUploader from '@/components/editor/VideoUploader';
import ResourceAttachments from '@/components/editor/ResourceAttachments';
import KnowledgeCheckBuilder from '@/components/editor/KnowledgeCheckBuilder';
import StudentPreview from '@/components/editor/StudentPreview';
import CoursePreview from '@/components/editor/CoursePreview';
import AssessmentEditor from '@/components/course/AssessmentEditor';

// Interfaces
interface Course {
  id: number;
  title: string;
  description: string;
  status: string;
  topics: Topic[];
}

interface Topic {
  id: number;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
  assessments?: Array<{
    id: string;
    title: string;
    type: 'quiz' | 'assignment';
    questions?: any[];
    assignment?: any;
  }>;
  isExpanded?: boolean;
}

interface Lesson {
  id: number;
  title: string;
  description: string;
  content: string;
  video_url: string;
  content_type: string;
  order: number;
  estimated_duration: number;
  is_free_preview: boolean;
  attachments?: Array<{
    id: string;
    name: string;
    type: 'pdf' | 'image' | 'video' | 'audio' | 'document' | 'archive' | 'link';
    url: string;
    size?: number;
    description?: string;
  }>;
  knowledge_checks?: Array<{
    id: string;
    title: string;
    description: string;
    questions: Array<{
      id: string;
      type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay' | 'mcq' | 'descriptive' | 'video' | 'comprehension';
      question: string;
      options?: string[];
      correctAnswer?: string | number;
      explanation?: string;
      points: number;
      timeLimit?: number;
      videoUrl?: string;
      comprehensionText?: string;
    }>;
    totalPoints: number;
    timeLimit?: number;
    passingScore: number;
  }>;
  assignments?: Array<{
    id: string;
    title: string;
    description: string;
    dueDate: string;
    maxPoints: number;
    fileUploadEnabled: boolean;
    peerReviewEnabled: boolean;
    rubric: Array<{
      id: string;
      criterion: string;
      description: string;
      maxPoints: number;
    }>;
  }>;
}

type ContentType = 'course-overview' | 'topic' | 'lesson' | 'new-topic' | 'new-lesson' | 'assessment';

interface SelectedContent {
  type: ContentType;
  id?: number | string;
  parentId?: number; // For lessons, this is the topic ID
}

export default function CourseBuilder() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const courseId = parseInt(params.courseId as string);

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [selectedContent, setSelectedContent] = useState<SelectedContent>({ type: 'course-overview' });
  const [showCoursePreview, setShowCoursePreview] = useState(false);
  const [showPublishConfirmation, setShowPublishConfirmation] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ title: '', message: '' });

  // Load course data
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        console.log(`Fetching course data for course ID: ${courseId}`);
        
        const response = await apiClient.getCourse(courseId);
        console.log('Course data received:', response.data);
        
        // If topics are not included in the main response, fetch them separately
        let topics = response.data.topics || [];
        if (!topics || topics.length === 0) {
          console.log('No topics in course response, fetching topics separately...');
          try {
            const topicsResponse = await apiClient.getCourseTopics(courseId);
            console.log('Topics fetched separately:', topicsResponse.data);
            topics = topicsResponse.data || [];
            
            // Fetch lessons for each topic
            for (let i = 0; i < topics.length; i++) {
              try {
                const lessonsResponse = await apiClient.getTopicLessons(topics[i].id);
                topics[i].lessons = lessonsResponse.data || [];
                console.log(`Lessons for topic ${topics[i].id}:`, topics[i].lessons);
              } catch (lessonError) {
                console.error(`Error fetching lessons for topic ${topics[i].id}:`, lessonError);
                topics[i].lessons = [];
              }
            }
          } catch (topicsError) {
            console.error('Error fetching topics:', topicsError);
            topics = [];
          }
        }
        
        // Transform backend data
        const courseData: Course = {
          id: response.data.id,
          title: response.data.title,
          description: response.data.description || response.data.short_description,
          status: response.data.status,
          topics: topics.map((topic: any) => ({
            id: topic.id,
            title: topic.title,
            description: topic.description,
            order: topic.order,
            lessons: topic.lessons?.map((lesson: any) => ({
              id: lesson.id,
              title: lesson.title,
              description: lesson.description,
              content: lesson.content,
              video_url: lesson.video_url,
              content_type: lesson.content_type,
              order: lesson.order,
              estimated_duration: lesson.estimated_duration,
              is_free_preview: lesson.is_free_preview
            })) || [],
            isExpanded: true
          })) || []
        };
        
        console.log('Transformed course data:', courseData);
        setCourse(courseData);
        
        // Auto-select lesson if lessonId is in URL params
        const lessonIdParam = searchParams.get('lessonId');
        const topicIdParam = searchParams.get('topicId');
        
        if (lessonIdParam && topicIdParam) {
          const lessonId = parseInt(lessonIdParam);
          const topicId = parseInt(topicIdParam);
          
          // Find the lesson in the course data
          const topic = courseData.topics.find(t => t.id === topicId);
          if (topic) {
            const lesson = topic.lessons.find(l => l.id === lessonId);
            if (lesson) {
              console.log('Auto-selecting lesson from URL params:', lesson);
              setSelectedContent({ type: 'lesson', id: lessonId, parentId: topicId });
              // Remove query params from URL
              router.replace(`/tutor/courses/${courseId}/edit`, { scroll: false });
            }
          }
        }
      } catch (error) {
        console.error('Error fetching course:', error);
        
        // Check if it's a CORS error
        if (error instanceof Error && error.message.includes('fetch')) {
          console.error('CORS or network error detected. Make sure backend is running on localhost:8000');
        }
        
        setError('Failed to load course. Please try again or check if the course exists.');
      } finally {
        setLoading(false);
      }
    };

    if (courseId && !isNaN(courseId)) {
      fetchCourse();
    } else {
      console.error('Invalid course ID:', courseId);
      setLoading(false);
    }
  }, [courseId, searchParams, router]);

  const toggleTopicExpansion = (topicId: number) => {
    setCourse(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        topics: prev.topics.map(topic =>
          topic.id === topicId
            ? { ...topic, isExpanded: !topic.isExpanded }
            : topic
        )
      };
    });
  };

  const handleContentSelect = (content: SelectedContent) => {
    console.log('handleContentSelect called with:', content);
    
    // If selecting a lesson, ensure its parent topic is expanded
    if (content.type === 'lesson' && content.parentId) {
      setCourse(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          topics: prev.topics.map(topic =>
            topic.id === content.parentId
              ? { ...topic, isExpanded: true }
              : topic
          )
        };
      });
    }
    
    setSelectedContent(content);
    console.log('Selected content updated:', content);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // TODO: Save current content
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Content saved successfully');
    } catch (error) {
      console.error('Error saving content:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = () => {
    if (!course) return;
    setShowPublishConfirmation(true);
  };

  const confirmPublish = async () => {
    if (!course) return;
    
    setShowPublishConfirmation(false);
    setPublishing(true);
    
    try {
      console.log('Publishing course:', courseId);
      await apiClient.publishCourse(courseId);
      console.log('Course published successfully');
      
      // Update course status in local state
      setCourse(prev => prev ? { ...prev, status: 'published' } : null);
      
      // Show success toast
      setSuccessMessage({
        title: 'Course Published',
        message: 'Course published successfully! Students can now enroll in this course.'
      });
      setShowSuccessToast(true);
    } catch (error) {
      console.error('Error publishing course:', error);
      setSuccessMessage({
        title: 'Publish Failed',
        message: `Failed to publish course: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      setShowSuccessToast(true);
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading course builder...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Course not found</h2>
          <p className="text-gray-600 mt-2">The requested course could not be loaded.</p>
          <button
            onClick={() => router.push('/tutor/courses')}
            className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Top Header */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 px-6 py-4 shadow-sm">
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
              <h1 className="text-xl font-semibold text-gray-900">{course.title}</h1>
              <p className="text-sm text-gray-500">Course Builder</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowCoursePreview(true)}
              className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            >
              <EyeIcon className="h-4 w-4 mr-2" />
              Preview Course
            </button>
            {course.status === 'draft' && (
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {publishing && <LoadingSpinner size="sm" />}
                <span>{publishing ? 'Publishing...' : 'Publish Course'}</span>
              </button>
            )}
            {course.status === 'published' && (
              <div className="flex items-center px-3 py-2 bg-green-100 text-green-800 rounded-md">
                <span className="text-sm font-medium">✓ Published</span>
              </div>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {saving && <LoadingSpinner size="sm" />}
              <span>{saving ? 'Saving...' : 'Save'}</span>
            </button>
            <button className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md">
              <Cog6ToothIcon className="h-4 w-4 mr-2" />
              Settings
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Content Tree */}
        <div className="w-80 bg-white/95 backdrop-blur-sm border-r border-gray-200/50 overflow-y-auto shadow-lg">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Course Content</h2>
            
            {/* Course Overview */}
            <div className="mb-4">
              <button
                onClick={() => handleContentSelect({ type: 'course-overview' })}
                className={`w-full flex items-center p-3 rounded-lg text-left transition-colors ${
                  selectedContent.type === 'course-overview'
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                <BookOpenIcon className="h-5 w-5 mr-3 flex-shrink-0" />
                <div>
                  <div className="font-medium">Course Overview</div>
                  <div className="text-xs text-gray-500">Basic information & settings</div>
                </div>
              </button>
            </div>

            {/* Topics */}
            <div className="space-y-2">
              {course.topics.map((topic, index) => (
                <div key={topic.id} className="border border-gray-200 rounded-lg">
                  {/* Topic Header */}
                  <button
                    onClick={() => toggleTopicExpansion(topic.id)}
                    className={`w-full flex items-center p-3 text-left transition-colors ${
                      selectedContent.type === 'topic' && selectedContent.id === topic.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {topic.isExpanded ? (
                      <ChevronDownIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                    ) : (
                      <ChevronRightIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {topic.title || `Topic ${index + 1}`}
                      </div>
                      <div className="text-xs text-gray-500">
                        {topic.lessons.length} lessons
                      </div>
                    </div>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContentSelect({ type: 'topic', id: topic.id });
                      }}
                      className="p-1 hover:bg-blue-100 rounded cursor-pointer"
                    >
                      <Cog6ToothIcon className="h-4 w-4" />
                    </div>
                  </button>

                  {/* Lessons */}
                  {topic.isExpanded && (
                    <div className="border-t border-gray-200 bg-gray-50">
                      {topic.lessons.map((lesson, lessonIndex) => {
                        const isSelected = selectedContent.type === 'lesson' && 
                          (selectedContent.id === lesson.id || String(selectedContent.id) === String(lesson.id));
                        
                        return (
                          <button
                            key={lesson.id}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('Lesson button clicked:', lesson.id, lesson.title);
                              handleContentSelect({ type: 'lesson', id: lesson.id, parentId: topic.id });
                            }}
                            className={`w-full flex items-center p-3 text-left transition-colors border-b border-gray-200 last:border-b-0 ${
                              isSelected
                                ? 'bg-green-50 text-green-700 border-l-4 border-l-green-500'
                                : 'hover:bg-gray-100'
                            }`}
                            ref={(el) => {
                              // Scroll into view if this is the selected lesson
                              if (isSelected && el) {
                                setTimeout(() => {
                                  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                                }, 100);
                              }
                            }}
                          >
                          <div className="w-6 flex justify-center mr-3">
                            {lesson.content_type === 'video' ? (
                              <PlayIcon className="h-4 w-4" />
                            ) : (
                              <DocumentTextIcon className="h-4 w-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate text-sm">
                              {lesson.title || `Lesson ${lessonIndex + 1}`}
                            </div>
                            <div className="text-xs text-gray-500">
                              {lesson.estimated_duration || 0} min
                            </div>
                          </div>
                          {isSelected && (
                            <div className="ml-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            </div>
                          )}
                        </button>
                      );
                      })}
                      
                      {/* Add Lesson Button */}
                      <button
                        onClick={() => handleContentSelect({ type: 'new-lesson', parentId: topic.id })}
                        className="w-full flex items-center p-3 text-left text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      >
                        <PlusIcon className="h-4 w-4 mr-3" />
                        <span className="text-sm font-medium">Add Lesson</span>
                      </button>
                    </div>
                  )}

                  {/* Assessments Section */}
                  {topic.isExpanded && (topic.assessments && topic.assessments.length > 0) && (
                    <div className="border-t border-gray-200 bg-purple-50">
                      <div className="px-3 py-2 text-xs font-medium text-purple-700 uppercase tracking-wide">
                        Assessments
                      </div>
                      {topic.assessments.map((assessment, assessmentIndex) => (
                        <button
                          key={assessment.id}
                          onClick={() => handleContentSelect({ type: 'assessment', id: assessment.id, parentId: topic.id })}
                          className={`w-full flex items-center p-3 text-left transition-colors border-b border-gray-200 last:border-b-0 ${
                            selectedContent.type === 'assessment' && selectedContent.id === assessment.id
                              ? 'bg-purple-50 text-purple-700'
                              : 'hover:bg-purple-100'
                          }`}
                        >
                          <div className="w-6 flex justify-center mr-3">
                            {assessment.type === 'quiz' ? (
                              <QuestionMarkCircleIcon className="h-4 w-4 text-purple-600" />
                            ) : (
                              <DocumentTextIcon className="h-4 w-4 text-purple-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate text-sm">
                              {assessment.title}
                            </div>
                            <div className="text-xs text-purple-600">
                              {assessment.type === 'quiz' ? 'Quiz' : 'Assignment'}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              {/* Add Topic Button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  console.log('Add Topic button clicked');
                  handleContentSelect({ type: 'new-topic' });
                }}
                className="w-full flex items-center p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:text-indigo-600 hover:border-indigo-300 transition-colors cursor-pointer"
              >
                <PlusIcon className="h-5 w-5 mr-3" />
                <span className="font-medium">Add Topic</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-br from-white to-gray-50">
          <div className="p-6">
            <ContentEditor 
              course={course}
              selectedContent={selectedContent}
              onContentUpdate={(updatedCourse) => setCourse(updatedCourse)}
              onSave={handleSave}
              onContentSelect={handleContentSelect}
            />
          </div>
        </div>
      </div>

      {/* Course Preview Modal */}
      {showCoursePreview && course && (
        <CoursePreview
          course={course as any}
          onClose={() => setShowCoursePreview(false)}
        />
      )}

      {/* Confirmation Toast for Publishing */}
      <ConfirmationToast
        isOpen={showPublishConfirmation}
        onClose={() => setShowPublishConfirmation(false)}
        onConfirm={confirmPublish}
        title="Publish Course"
        message="Are you sure you want to publish this course? Students will be able to enroll."
        confirmText="Publish"
        cancelText="Cancel"
        isLoading={publishing}
      />

      {/* Success Toast */}
      <SuccessToast
        isOpen={showSuccessToast}
        onClose={() => setShowSuccessToast(false)}
        title={successMessage.title}
        message={successMessage.message}
        duration={5000}
      />
    </div>
  );
}

// Content Editor Component
interface ContentEditorProps {
  course: Course;
  selectedContent: SelectedContent;
  onContentUpdate: (course: Course) => void;
  onSave: () => void;
  onContentSelect?: (content: SelectedContent) => void;
}

function ContentEditor({ course, selectedContent, onContentUpdate, onSave, onContentSelect }: ContentEditorProps) {
  console.log('ContentEditor rendered with selectedContent:', selectedContent);
  console.log('ContentEditor course:', course);
  
  const renderContent = () => {
    console.log('renderContent called, selectedContent.type:', selectedContent.type);
    switch (selectedContent.type) {
      case 'course-overview':
        return <CourseOverviewEditor course={course} onUpdate={onContentUpdate} />;
      
      case 'topic':
        const topic = course.topics.find(t => t.id === selectedContent.id);
        return topic ? <TopicEditor topic={topic} course={course} onUpdate={onContentUpdate} /> : null;
      
      case 'lesson':
        return <LessonEditorWrapper 
          lessonId={selectedContent.id!} 
          course={course} 
          onUpdate={onContentUpdate} 
        />;
      
      case 'new-topic':
        if (!course) {
          console.error('Course is null, cannot render NewTopicEditor');
          return <div className="p-6 text-red-600">Error: Course data not loaded. Please refresh the page.</div>;
        }
        console.log('Rendering NewTopicEditor with course:', course);
        return <NewTopicEditor course={course} onUpdate={onContentUpdate} onSave={onSave} onNavigate={onContentSelect} />;
      
      case 'new-lesson':
        if (!course) {
          console.error('Course is null, cannot render NewLessonEditor');
          return <div className="p-6 text-red-600">Error: Course data not loaded. Please refresh the page.</div>;
        }
        return <NewLessonEditor course={course} topicId={selectedContent.parentId!} onUpdate={onContentUpdate} onSave={onSave} onNavigate={onContentSelect} />;
      
      case 'assessment':
        const assessment = course.topics
          .flatMap(t => t.assessments || [])
          .find(a => a.id === selectedContent.id);
        return assessment ? <AssessmentEditor assessment={assessment} course={course} onUpdate={onContentUpdate} /> : null;
      
      default:
        return <CourseOverviewEditor course={course} onUpdate={onContentUpdate} />;
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 min-h-full overflow-hidden">
      {renderContent()}
    </div>
  );
}

// Course Overview Editor
function CourseOverviewEditor({ course, onUpdate }: { course: Course; onUpdate: (course: Course) => void }) {
  const [localCourse, setLocalCourse] = useState(course);
  const [showPublishConfirmation, setShowPublishConfirmation] = useState(false);

  const handleUpdate = (field: string, value: any) => {
    const updated = { ...localCourse, [field]: value };
    setLocalCourse(updated);
    onUpdate(updated);
  };

  const handlePublishClick = () => {
    setShowPublishConfirmation(true);
  };

  const confirmPublish = () => {
    setShowPublishConfirmation(false);
    handleUpdate('status', 'published');
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Course Overview</h2>
        <p className="text-gray-600">Manage your course's basic information and settings.</p>
      </div>

      <div className="space-y-6">
        {/* Course Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Course Title
          </label>
          <input
            type="text"
            value={localCourse.title}
            onChange={(e) => handleUpdate('title', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Course Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Course Description
          </label>
          <textarea
            rows={4}
            value={localCourse.description}
            onChange={(e) => handleUpdate('description', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Course Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Course Status
          </label>
          <div className="flex items-center space-x-4">
            <select
              value={localCourse.status}
              onChange={(e) => handleUpdate('status', e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
            {localCourse.status === 'draft' && (
              <button
                onClick={handlePublishClick}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm font-medium"
              >
                Publish Now
              </button>
            )}
            {localCourse.status === 'published' && (
              <div className="flex items-center px-3 py-2 bg-green-100 text-green-800 rounded-md">
                <span className="text-sm font-medium">✓ Published</span>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {localCourse.status === 'draft' 
              ? 'Course is in draft mode. Students cannot enroll until published.'
              : localCourse.status === 'published'
              ? 'Course is published. Students can enroll and access content.'
              : 'Course is archived. Students cannot enroll.'
            }
          </p>
        </div>

        {/* Course Statistics */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Course Statistics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold text-indigo-600">{course.topics.length}</div>
              <div className="text-sm text-gray-500">Topics</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {course.topics.reduce((sum, topic) => sum + topic.lessons.length, 0)}
              </div>
              <div className="text-sm text-gray-500">Lessons</div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Publishing */}
      <ConfirmationToast
        isOpen={showPublishConfirmation}
        onClose={() => setShowPublishConfirmation(false)}
        onConfirm={confirmPublish}
        title="Publish Course"
        message="Are you sure you want to publish this course? Students will be able to enroll."
        confirmText="Publish"
        cancelText="Cancel"
      />
    </div>
  );
}

// Topic Editor
function TopicEditor({ topic, course, onUpdate }: { topic: Topic; course: Course; onUpdate: (course: Course) => void }) {
  const [localTopic, setLocalTopic] = useState(topic);

  const handleUpdate = (field: string, value: any) => {
    const updated = { ...localTopic, [field]: value };
    setLocalTopic(updated);
    
    const updatedCourse = {
      ...course,
      topics: course.topics.map(t => t.id === topic.id ? updated : t)
    };
    onUpdate(updatedCourse);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Edit Topic</h2>
        <p className="text-gray-600">Configure this topic's content and settings.</p>
      </div>

      <div className="space-y-6">
        {/* Topic Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Topic Title
          </label>
          <input
            type="text"
            value={localTopic.title}
            onChange={(e) => handleUpdate('title', e.target.value)}
            placeholder="e.g., Introduction to JavaScript"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Topic Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Topic Description
          </label>
          <textarea
            rows={3}
            value={localTopic.description}
            onChange={(e) => handleUpdate('description', e.target.value)}
            placeholder="Describe what students will learn in this topic..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Lessons in Topic */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Lessons in this Topic</h3>
          <div className="space-y-2">
            {localTopic.lessons.map((lesson, index) => (
              <div key={lesson.id} className="flex items-center p-3 bg-gray-50 rounded-md">
                <div className="flex items-center flex-1">
                  {lesson.content_type === 'video' ? (
                    <PlayIcon className="h-4 w-4 mr-3 text-blue-600" />
                  ) : (
                    <DocumentTextIcon className="h-4 w-4 mr-3 text-gray-600" />
                  )}
                  <div>
                    <div className="font-medium text-sm">{lesson.title || `Lesson ${index + 1}`}</div>
                    <div className="text-xs text-gray-500">{lesson.estimated_duration || 0} minutes</div>
                  </div>
                </div>
                <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                  Edit
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Lesson Editor Wrapper - Fetches full lesson data
function LessonEditorWrapper({ lessonId, course, onUpdate }: { lessonId: number | string; course: Course; onUpdate: (course: Course) => void }) {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        setLoading(true);
        setError('');
        
        // First try to find lesson in course data
        const lessonFromCourse = course.topics
          .flatMap(t => (t.lessons || []).map(l => ({ ...l, topicId: t.id })))
          .find(l => l.id === lessonId || String(l.id) === String(lessonId));
        
        if (lessonFromCourse) {
          console.log('[LessonEditor] Found lesson in course data:', lessonFromCourse);
          
          // Fetch full lesson details from API
          try {
            const response = await apiClient.getLesson(typeof lessonId === 'string' ? parseInt(lessonId) : lessonId);
            console.log('[LessonEditor] Full lesson data from API:', response.data);
            
            // Merge API data with course data
            const fullLesson: Lesson = {
              ...lessonFromCourse,
              ...response.data,
              video_url: response.data.video_url || lessonFromCourse.video_url,
              content: response.data.content || lessonFromCourse.content || '',
              content_type: response.data.content_type || lessonFromCourse.content_type || 'text',
            };
            
            setLesson(fullLesson);
          } catch (apiError: any) {
            console.warn('[LessonEditor] Failed to fetch full lesson data, using course data:', apiError);
            // If it's a 404, the lesson might not exist in the backend yet, use course data
            if (apiError?.status === 404) {
              console.log('[LessonEditor] Lesson not found in backend (404), using course data only');
            }
            setLesson(lessonFromCourse);
          }
        } else {
          // Try fetching directly from API
          console.log('[LessonEditor] Lesson not in course data, fetching from API...');
          try {
            const response = await apiClient.getLesson(typeof lessonId === 'string' ? parseInt(lessonId) : lessonId);
            setLesson(response.data);
          } catch (apiError: any) {
            console.error('[LessonEditor] Failed to fetch lesson from API:', apiError);
            if (apiError?.status === 404) {
              setError(`Lesson with ID ${lessonId} not found. It may have been deleted.`);
            } else {
              setError('Failed to load lesson. Please try again.');
            }
          }
        }
      } catch (err) {
        console.error('[LessonEditor] Error fetching lesson:', err);
        setError('Failed to load lesson. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (lessonId) {
      fetchLesson();
    }
  }, [lessonId, course]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
          <span className="ml-4 text-gray-600">Loading lesson...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <p className="text-gray-600">Lesson not found. Please select a lesson from the sidebar.</p>
        </div>
      </div>
    );
  }

  return <LessonEditor lesson={lesson} course={course} onUpdate={onUpdate} />;
}

// Lesson Editor
function LessonEditor({ lesson, course, onUpdate }: { lesson: Lesson; course: Course; onUpdate: (course: Course) => void }) {
  const [localLesson, setLocalLesson] = useState(lesson);
  
  // Update local lesson when prop changes
  useEffect(() => {
    console.log('[LessonEditor] Lesson prop changed:', lesson);
    setLocalLesson(lesson);
  }, [lesson]);
  
  // Debug: Log lesson data
  useEffect(() => {
    console.log('[LessonEditor] Current lesson data:', {
      id: localLesson.id,
      title: localLesson.title,
      content_type: localLesson.content_type,
      has_content: !!localLesson.content,
      content_length: localLesson.content?.length || 0,
      has_video_url: !!localLesson.video_url,
      video_url: localLesson.video_url
    });
  }, [localLesson]);
  const [activeTab, setActiveTab] = useState<'content' | 'video' | 'attachments' | 'knowledge-checks'>('content');
  const [showKnowledgeCheckBuilder, setShowKnowledgeCheckBuilder] = useState(false);
  const [showStudentPreview, setShowStudentPreview] = useState(false);

  const handleUpdate = (field: string, value: any) => {
    const updated = { ...localLesson, [field]: value };
    setLocalLesson(updated);
    
    const updatedCourse = {
      ...course,
      topics: course.topics.map(topic => ({
        ...topic,
        lessons: topic.lessons.map(l => l.id === lesson.id ? updated : l)
      }))
    };
    onUpdate(updatedCourse);
  };

  const handleAttachmentsChange = (attachments: any[]) => {
    handleUpdate('attachments', attachments);
  };

  const handleKnowledgeCheckSave = (knowledgeCheck: any) => {
    const existingIndex = localLesson.knowledge_checks?.findIndex(kc => kc.id === knowledgeCheck.id) ?? -1;
    let updatedKnowledgeChecks;
    
    if (existingIndex >= 0 && localLesson.knowledge_checks) {
      updatedKnowledgeChecks = [...localLesson.knowledge_checks];
      updatedKnowledgeChecks[existingIndex] = knowledgeCheck;
    } else {
      updatedKnowledgeChecks = [...(localLesson.knowledge_checks || []), knowledgeCheck];
    }
    
    handleUpdate('knowledge_checks', updatedKnowledgeChecks);
    setShowKnowledgeCheckBuilder(false);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Edit Lesson</h2>
            <p className="text-gray-600">Create engaging lesson content for your students.</p>
          </div>
          <button
            onClick={() => setShowStudentPreview(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center space-x-2"
          >
            <EyeIcon className="h-4 w-4" />
            <span>Preview as Student</span>
          </button>
        </div>
      </div>

      {/* Lesson Title */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Lesson Title
        </label>
        <input
          type="text"
          value={localLesson.title}
          onChange={(e) => handleUpdate('title', e.target.value)}
          placeholder="e.g., Variables and Data Types"
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200/50 mb-6 bg-gradient-to-r from-gray-50 to-white">
        <nav className="-mb-px flex space-x-8 px-6 py-2">
          {[
            { id: 'content', name: 'Content', icon: DocumentTextIcon },
            { id: 'video', name: 'Video', icon: VideoCameraIcon },
            { id: 'attachments', name: 'Resources', icon: PaperClipIcon },
            { id: 'knowledge-checks', name: 'Knowledge Checks', icon: QuestionMarkCircleIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-medium text-sm rounded-t-lg transition-all duration-200 ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600 bg-white shadow-sm'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          {/* Content Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content Type
            </label>
            <select
              value={localLesson.content_type}
              onChange={(e) => handleUpdate('content_type', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="video">Video Lesson</option>
              <option value="text">Text Content</option>
              <option value="interactive">Interactive Content</option>
            </select>
          </div>

          {/* Rich Text Editor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lesson Content
            </label>
            <RichTextEditor
              content={localLesson.content}
              onChange={(content) => handleUpdate('content', content)}
              placeholder="Write your lesson content here... Use the toolbar to format text, add images, links, and more."
              className="min-h-[400px]"
            />
          </div>

          {/* Lesson Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Duration (minutes)
              </label>
              <input
                type="number"
                min="1"
                value={localLesson.estimated_duration || ''}
                onChange={(e) => handleUpdate('estimated_duration', parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="freePreview"
                checked={localLesson.is_free_preview}
                onChange={(e) => handleUpdate('is_free_preview', e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="freePreview" className="text-sm font-medium text-gray-700">
                Free Preview Lesson
              </label>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'video' && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Video Content
            </label>
            <VideoUploader
              videoUrl={localLesson.video_url}
              onVideoChange={(url) => handleUpdate('video_url', url)}
              className="min-h-[300px]"
            />
          </div>
        </div>
      )}

      {activeTab === 'attachments' && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resource Attachments
            </label>
            <ResourceAttachments
              attachments={localLesson.attachments || []}
              onAttachmentsChange={handleAttachmentsChange}
            />
          </div>
        </div>
      )}

      {activeTab === 'knowledge-checks' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Knowledge Checks & Quizzes
              </label>
              <p className="text-sm text-gray-600">
                Create quizzes and exercises to test student understanding
              </p>
            </div>
            <button
              onClick={() => setShowKnowledgeCheckBuilder(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center space-x-2"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Add Knowledge Check</span>
            </button>
          </div>

          {/* Knowledge Checks List */}
          {localLesson.knowledge_checks && localLesson.knowledge_checks.length > 0 ? (
            <div className="space-y-3">
              {localLesson.knowledge_checks.map((kc, index) => (
                <div key={kc.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{kc.title}</h4>
                      <p className="text-sm text-gray-600">{kc.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>{kc.questions.length} questions</span>
                        <span>{kc.totalPoints} points</span>
                        {kc.timeLimit && <span>{kc.timeLimit} min</span>}
                        <span>{kc.passingScore}% passing</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setShowKnowledgeCheckBuilder(true);
                          // Set the knowledge check to edit
                        }}
                        className="text-indigo-600 hover:text-indigo-800 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          const updated = localLesson.knowledge_checks?.filter(k => k.id !== kc.id);
                          handleUpdate('knowledge_checks', updated);
                        }}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <QuestionMarkCircleIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p>No knowledge checks added yet.</p>
              <p className="text-sm">Click "Add Knowledge Check" to create quizzes and exercises.</p>
            </div>
          )}
        </div>
      )}

      {/* Knowledge Check Builder Modal */}
      {showKnowledgeCheckBuilder && (
        <KnowledgeCheckBuilder
          onSave={handleKnowledgeCheckSave}
          onCancel={() => setShowKnowledgeCheckBuilder(false)}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        />
      )}

      {/* Student Preview Modal */}
      {showStudentPreview && (
        <StudentPreview
          lesson={localLesson as any}
          onClose={() => setShowStudentPreview(false)}
        />
      )}
    </div>
  );
}

// New Topic Editor
function NewTopicEditor({ course, onUpdate, onSave, onNavigate }: { course: Course; onUpdate: (course: Course) => void; onSave: () => void; onNavigate?: (content: SelectedContent) => void }) {
  const [topicData, setTopicData] = useState({
    title: '',
    description: '',
    order: (course?.topics?.length || 0) + 1
  });
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    console.log('handleCreate called');
    console.log('topicData:', topicData);
    console.log('course:', course);
    
    if (!topicData.title || !topicData.title.trim()) {
      alert('Please enter a topic title');
      return;
    }

    if (!course || !course.id) {
      console.error('Course is missing:', course);
      alert('Course information is missing. Please refresh the page.');
      return;
    }
    
    console.log('All validations passed, proceeding with topic creation...');

    setIsCreating(true);
    try {
      // Create topic using API client
      const topicPayload = {
        title: topicData.title.trim(),
        description: topicData.description?.trim() || '',
        order: topicData.order,
        content: topicData.description?.trim() || topicData.title.trim(),
        estimated_duration: 30,
        is_required: true
      };

      console.log('Creating topic with payload:', topicPayload);
      console.log('Course ID:', course.id);
      const response = await apiClient.createTopic(course.id, topicPayload);
      console.log('API Response:', response);
      console.log('Response data:', response.data);
      console.log('Response data type:', typeof response.data);
      
      // Handle different response structures
      // Backend returns TopicResponse directly, which is wrapped in ApiResponse.data
      // But it might also be wrapped in response.data.data if backend returns {message, data: {...}}
      let topic = response.data;
      
      // Check if it's wrapped in another data property
      if (topic && topic.data) {
        topic = topic.data;
      }
      
      // Check if topic is an object with id property
      if (!topic || (typeof topic === 'object' && !topic.id)) {
        console.error('Invalid response structure:', response);
        console.error('Topic object:', topic);
        throw new Error('Topic was created but no ID was returned. Response: ' + JSON.stringify(response));
      }

      const topicId = topic.id;
      console.log('Topic created successfully:', topic);

      const newTopic: Topic = {
        id: topicId,
        title: topic.title || topicData.title,
        description: topic.description || topicData.description,
        order: topic.order || topicData.order,
        lessons: [],
        isExpanded: true
      };

      const updatedCourse = {
        ...course,
        topics: [...course.topics, newTopic]
      };

      onUpdate(updatedCourse);
      onSave();
      
      // Show success toast
      setShowSuccessToast(true);
      
      // Navigate to the newly created topic after a short delay
      setTimeout(() => {
        if (onNavigate) {
          onNavigate({ type: 'topic', id: topicId });
        }
      }, 1500);
    } catch (error: any) {
      console.error('Error creating topic:', error);
      
      // Handle session expiration
      if (error?.status === 401 || error?.code === 'SESSION_EXPIRED' || error?.details?.requiresLogin) {
        alert('Your session has expired. You will be redirected to the login page.');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return;
      }
      
      // Extract detailed error message
      let errorMessage = 'An unexpected error occurred';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.details?.detail) {
        // Handle FastAPI validation errors
        if (Array.isArray(error.details.detail)) {
          errorMessage = error.details.detail.map((err: any) => {
            if (typeof err === 'string') return err;
            if (err.msg) return `${err.loc?.join('.') || 'Field'}: ${err.msg}`;
            return JSON.stringify(err);
          }).join('\n');
        } else {
          errorMessage = error.details.detail;
        }
      }
      
      alert(`Failed to create topic:\n\n${errorMessage}\n\nPlease check the console for more details.`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCreate();
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create New Topic</h2>
        <p className="text-gray-600">Add a new topic to organize your course content.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Topic Title *
          </label>
          <input
            type="text"
            value={topicData.title}
            onChange={(e) => setTopicData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="e.g., Introduction to JavaScript"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            required
            disabled={isCreating}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Topic Description
          </label>
          <textarea
            rows={3}
            value={topicData.description}
            onChange={(e) => setTopicData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe what students will learn in this topic..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            disabled={isCreating}
          />
        </div>

        <div className="flex space-x-3">
          <button
            type="submit"
            onClick={(e) => {
              e.preventDefault();
              console.log('Button clicked, calling handleCreate');
              handleCreate();
            }}
            disabled={isCreating}
            className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isCreating && <LoadingSpinner size="sm" />}
            <span>{isCreating ? 'Creating...' : 'Create Topic'}</span>
          </button>
          <button
            type="button"
            onClick={() => window.history.back()}
            disabled={isCreating}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Success Toast */}
      <SuccessToast
        isOpen={showSuccessToast}
        onClose={() => setShowSuccessToast(false)}
        title="Topic Created Successfully! 🎉"
        message="Your topic has been added to the course. You can now add lessons to it."
        duration={4000}
      />
    </div>
  );
}

// New Lesson Editor
function NewLessonEditor({ course, topicId, onUpdate, onSave, onNavigate }: { course: Course; topicId: number; onUpdate: (course: Course) => void; onSave: () => void; onNavigate?: (content: SelectedContent) => void }) {
  const topic = course.topics.find(t => t.id === topicId);
  const [lessonData, setLessonData] = useState({
    title: '',
    description: '',
    content: '',
    video_url: '',
    content_type: 'video',
    estimated_duration: 15,
    is_free_preview: false,
    order: (topic?.lessons.length || 0) + 1
  });

  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!lessonData.title.trim()) {
      alert('Please enter a lesson title');
      return;
    }

    setIsCreating(true);
    try {
      // Create lesson using API client
      const lessonPayload = {
        title: lessonData.title.trim(),
        description: lessonData.description?.trim() || '',
        content: lessonData.content?.trim() || lessonData.title.trim(),
        video_url: lessonData.video_url?.trim() || '',
        content_type: lessonData.content_type,
        order: lessonData.order,
        estimated_duration: lessonData.estimated_duration,
        is_required: true,
        is_free_preview: lessonData.is_free_preview
      };

      console.log('Creating lesson with payload:', lessonPayload);
      const response = await apiClient.createLesson(topicId, lessonPayload);
      console.log('API Response:', response);
      
      // Handle different response structures
      const lesson = response.data?.data || response.data;
      const lessonId = lesson?.id || response.data?.id;

      if (!lessonId) {
        throw new Error('Lesson was created but no ID was returned. Response: ' + JSON.stringify(response));
      }

      console.log('Lesson created successfully:', lesson);

      const newLesson: Lesson = {
        id: lessonId,
        title: lesson.title || lessonData.title,
        description: lesson.description || lessonData.description,
        content: lesson.content || lessonData.content,
        video_url: lesson.video_url || lessonData.video_url,
        content_type: lesson.content_type || lessonData.content_type,
        order: lesson.order || lessonData.order,
        estimated_duration: lesson.estimated_duration || lessonData.estimated_duration,
        is_free_preview: lesson.is_free_preview || lessonData.is_free_preview
      };

      const updatedCourse = {
        ...course,
        topics: course.topics.map(topic => 
          topic.id === topicId 
            ? { ...topic, lessons: [...topic.lessons, newLesson] }
            : topic
        )
      };

      onUpdate(updatedCourse);
      onSave();
      
      // Show success toast
      setShowSuccessToast(true);
      
      // Navigate to the parent topic after a short delay
      setTimeout(() => {
        if (onNavigate) {
          onNavigate({ type: 'topic', id: topicId });
        }
      }, 1500);
    } catch (error: any) {
      console.error('Error creating lesson:', error);
      
      // Extract detailed error message
      let errorMessage = 'An unexpected error occurred';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.details?.detail) {
        // Handle FastAPI validation errors
        if (Array.isArray(error.details.detail)) {
          errorMessage = error.details.detail.map((err: any) => {
            if (typeof err === 'string') return err;
            if (err.msg) return `${err.loc?.join('.') || 'Field'}: ${err.msg}`;
            return JSON.stringify(err);
          }).join('\n');
        } else {
          errorMessage = error.details.detail;
        }
      }
      
      alert(`Failed to create lesson:\n\n${errorMessage}\n\nPlease check the console for more details.`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create New Lesson</h2>
        <p className="text-gray-600">Add a new lesson to "{topic?.title}"</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lesson Title *
          </label>
          <input
            type="text"
            value={lessonData.title}
            onChange={(e) => setLessonData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="e.g., Variables and Data Types"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content Type
          </label>
          <select
            value={lessonData.content_type}
            onChange={(e) => setLessonData(prev => ({ ...prev, content_type: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="video">Video Lesson</option>
            <option value="text">Text Content</option>
            <option value="interactive">Interactive Content</option>
          </select>
        </div>

        {lessonData.content_type === 'video' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Video URL
            </label>
            <input
              type="url"
              value={lessonData.video_url}
              onChange={(e) => setLessonData(prev => ({ ...prev, video_url: e.target.value }))}
              placeholder="https://your-s3-bucket.amazonaws.com/lesson-video.mp4"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lesson Content
          </label>
          <textarea
            rows={6}
            value={lessonData.content}
            onChange={(e) => setLessonData(prev => ({ ...prev, content: e.target.value }))}
            placeholder="Write your lesson content here..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration (minutes)
            </label>
            <input
              type="number"
              min="1"
              value={lessonData.estimated_duration}
              onChange={(e) => setLessonData(prev => ({ ...prev, estimated_duration: parseInt(e.target.value) }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="freePreview"
              checked={lessonData.is_free_preview}
              onChange={(e) => setLessonData(prev => ({ ...prev, is_free_preview: e.target.checked }))}
              className="mr-2"
            />
            <label htmlFor="freePreview" className="text-sm font-medium text-gray-700">
              Free Preview Lesson
            </label>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isCreating && <LoadingSpinner size="sm" />}
            <span>{isCreating ? 'Creating...' : 'Create Lesson'}</span>
          </button>
          <button
            onClick={() => window.history.back()}
            disabled={isCreating}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Success Toast */}
      <SuccessToast
        isOpen={showSuccessToast}
        onClose={() => setShowSuccessToast(false)}
        title="Lesson Created Successfully! 🎉"
        message="Your lesson has been added to the topic. You can now add content to it."
        duration={4000}
      />
    </div>
  );
}
