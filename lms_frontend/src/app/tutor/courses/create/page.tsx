/**
 * Course Creation Wizard
 * 3-step wizard for creating courses: Foundation → Structure → Planning
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api/client';
import { 
  AcademicCapIcon,
  BookOpenIcon,
  ChartBarIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import Breadcrumb from '@/components/ui/Breadcrumb';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import AdvancedQuizBuilder from '@/components/course/AdvancedQuizBuilder';
import AdvancedAssignmentBuilder from '@/components/course/AdvancedAssignmentBuilder';
import RichTextEditor from '@/components/editor/RichTextEditor';
import VideoUploader from '@/components/editor/VideoUploader';
import { generateId } from '@/utils/idGenerator';

// Wizard steps
const STEPS = [
  { id: 1, name: 'Foundation', description: 'Basic course information', icon: AcademicCapIcon },
  { id: 2, name: 'Structure', description: 'Learning objectives & structure', icon: BookOpenIcon },
  { id: 3, name: 'Planning', description: 'Course content planning', icon: ChartBarIcon }
];

// Form data interface
interface CourseFormData {
  // Step 1: Foundation
  title: string;
  shortDescription: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  price: number;
  currency: string;
  thumbnailUrl: string;
  introVideoUrl: string;
  
  // Step 2: Structure
  learningObjectives: string[];
  prerequisites: string[];
  courseStructure: 'topic-based' | 'sequential' | 'project-based';
  
  // Step 3: Planning
  topics: Array<{
    id: string;
    title: string;
    description: string;
    lessons: Array<{
      id: string;
      title: string;
      type: 'video' | 'text' | 'interactive';
      description?: string;
      content?: string;
      video_url?: string;
      estimated_duration?: number;
      is_free_preview?: boolean;
    }>;
    assessments: Array<{
      id: string;
      title: string;
      type: 'quiz' | 'assignment';
      questions?: any[];
      assignment?: any;
    }>;
  }>;
}

export default function CourseCreateWizard() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<CourseFormData>({
    // Step 1
    title: '',
    shortDescription: '',
    category: '',
    difficulty: 'beginner',
    duration: 4,
    price: 0,
    currency: 'USD',
    thumbnailUrl: '',
    introVideoUrl: '',
    
    // Step 2
    learningObjectives: [''],
    prerequisites: [''],
    courseStructure: 'topic-based',
    
    // Step 3
    topics: [{
      id: '1',
      title: '',
      description: '',
      lessons: [{ 
        id: '1', 
        title: '', 
        type: 'video',
        description: '',
        content: '',
        video_url: '',
        estimated_duration: 15,
        is_free_preview: false
      }],
      assessments: []
    }]
  });

  const updateFormData = (updates: Partial<CourseFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Transform form data to match backend API
      const courseData = {
        title: formData.title,
        description: formData.shortDescription,
        short_description: formData.shortDescription,
        category: formData.category,
        difficulty_level: formData.difficulty,
        price: formData.price,
        currency: formData.currency,
        enrollment_type: formData.price > 0 ? 'paid' : 'free',
        duration_weeks: formData.duration,
        prerequisites: formData.prerequisites.filter(p => p.trim() !== '').join('\n'),
        learning_objectives: formData.learningObjectives.filter(o => o.trim() !== ''),
        tags: [formData.category],
        organization_id: user?.organization_id || 1, // Use user's organization
        thumbnail_url: formData.thumbnailUrl,
        intro_video_url: formData.introVideoUrl,
      };

      console.log('Creating course with data:', courseData);
      
      // Call backend API to create course using API client
      const response = await apiClient.createCourse(courseData);

      const courseId = response.data.id;

      console.log('Course created successfully:', response.data);
      
      // Now create topics and lessons if they exist
      if (formData.topics && formData.topics.length > 0) {
        console.log('Creating topics and lessons for course:', courseId);
        console.log('Topics to create:', formData.topics);
        
        for (let topicIndex = 0; topicIndex < formData.topics.length; topicIndex++) {
          const topicData = formData.topics[topicIndex];
          if (topicData.title.trim()) {
            try {
              // Create topic using API client method
              console.log(`Creating topic ${topicIndex + 1}:`, topicData.title);
              const topicPayload = {
                title: topicData.title,
                description: topicData.description || '',
                order: topicIndex + 1,
                content: topicData.description || '',
                estimated_duration: 30,
                is_required: true
              };
              console.log('Topic payload:', topicPayload);
              
              const topicResponse = await apiClient.createTopic(courseId, topicPayload);
              
              const topicId = topicResponse.data.id;
              console.log('Topic created successfully:', topicResponse.data);
              
              // Create lessons for this topic
              if (topicData.lessons && topicData.lessons.length > 0) {
                console.log(`Creating ${topicData.lessons.length} lessons for topic:`, topicData.title);
                
                for (let lessonIndex = 0; lessonIndex < topicData.lessons.length; lessonIndex++) {
                  const lessonData = topicData.lessons[lessonIndex];
                  if (lessonData.title.trim()) {
                    try {
                      console.log(`Creating lesson ${lessonIndex + 1}:`, lessonData.title, 'for topic:', topicId);
                      const lessonPayload = {
                        title: lessonData.title,
                        description: lessonData.description || `Lesson content for ${lessonData.title}`,
                        content: lessonData.content || `This is the content for ${lessonData.title}. You can edit this content in the course builder.`,
                        video_url: lessonData.video_url || '',
                        content_type: lessonData.type,
                        order: lessonIndex + 1,
                        estimated_duration: lessonData.estimated_duration || 15,
                        is_required: true,
                        is_free_preview: lessonData.is_free_preview || false
                      };
                      console.log('Lesson payload:', lessonPayload);
                      
                      const lessonResponse = await apiClient.createLesson(topicId, lessonPayload);
                      console.log('Lesson created successfully:', lessonResponse.data);
                    } catch (lessonError) {
                      console.error('Error creating lesson:', lessonError);
                      console.error('Lesson data that failed:', lessonData);
                    }
                  }
                }
              } else {
                console.log('No lessons to create for topic:', topicData.title);
              }
            } catch (topicError) {
              console.error('Error creating topic:', topicError);
            }
          }
        }
        
        console.log('All topics and lessons created successfully');
      }
      
      // Ask user if they want to publish the course
      const shouldPublish = window.confirm(
        'Course created successfully! Would you like to publish it now so students can enroll?'
      );
      
      if (shouldPublish) {
        try {
          console.log('Publishing course:', courseId);
          await apiClient.publishCourse(courseId);
          console.log('Course published successfully');
          alert('Course published successfully! Students can now enroll.');
        } catch (publishError) {
          console.error('Error publishing course:', publishError);
          alert('Course created but failed to publish. You can publish it later from the course editor.');
        }
      }
      
      // Redirect to course builder to continue editing
      router.push(`/tutor/courses/${courseId}/edit`);
    } catch (error) {
      console.error('Error creating course:', error);
      alert(`Failed to create course: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb />

      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Create New Course</h1>
              <p className="text-indigo-100 mt-2">Build an engaging learning experience that stands out</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-indigo-200 text-sm">Step {currentStep} of {STEPS.length}</p>
                <p className="text-white font-medium">{STEPS[currentStep - 1]?.name}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <AcademicCapIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Progress Steps */}
        <div className="border-t border-white/20">
          <nav className="flex space-x-8 px-6 py-6" aria-label="Progress">
            {STEPS.map((step, stepIdx) => (
              <div key={step.name} className="flex items-center">
                <div className="flex items-center space-x-3">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                    step.id < currentStep 
                      ? 'bg-white text-indigo-600 shadow-lg'
                      : step.id === currentStep
                      ? 'bg-white text-indigo-600 border-2 border-white shadow-lg scale-110'
                      : 'bg-white/20 text-white'
                  }`}>
                    {step.id < currentStep ? (
                      <CheckIcon className="w-6 h-6" />
                    ) : (
                      <step.icon className="w-6 h-6" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold ${
                      step.id <= currentStep ? 'text-white' : 'text-indigo-200'
                    }`}>
                      {step.name}
                    </p>
                    <p className="text-xs text-indigo-100">{step.description}</p>
                  </div>
                </div>
                {stepIdx !== STEPS.length - 1 && (
                  <div className={`ml-6 w-20 h-0.5 transition-all duration-300 ${
                    step.id < currentStep ? 'bg-white' : 'bg-white/30'
                  }`} />
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Enhanced Step Content */}
      <div className="bg-white shadow-xl rounded-xl border border-gray-100">
        <div className="p-8">
          {currentStep === 1 && (
            <FoundationStep 
              data={formData} 
              updateData={updateFormData} 
              onNext={nextStep}
            />
          )}
          {currentStep === 2 && (
            <StructureStep 
              data={formData} 
              updateData={updateFormData} 
              onNext={nextStep}
              onPrev={prevStep}
            />
          )}
          {currentStep === 3 && (
            <PlanningStep 
              data={formData} 
              updateData={updateFormData} 
              onPrev={prevStep}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Step 1: Foundation
interface StepProps {
  data: CourseFormData;
  updateData: (updates: Partial<CourseFormData>) => void;
  onNext?: () => void;
  onPrev?: () => void;
  onSubmit?: () => void;
  isSubmitting?: boolean;
}

function FoundationStep({ data, updateData, onNext }: StepProps) {
  const categories = [
    'Technology', 'Business', 'Design', 'Marketing', 'Data Science',
    'Personal Development', 'Language', 'Health & Fitness', 'Music', 'Photography'
  ];

  const handleNext = () => {
    // Basic validation
    if (!data.title || !data.shortDescription || !data.category) {
      alert('Please fill in all required fields');
      return;
    }
    onNext?.();
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AcademicCapIcon className="h-8 w-8 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Course Foundation</h2>
        <p className="text-gray-600">Let's start with the basic information about your course. This will help students understand what they'll learn.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Title */}
        <div className="lg:col-span-2">
          <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-3">
            Course Title *
          </label>
          <input
            type="text"
            id="title"
            value={data.title}
            onChange={(e) => updateData({ title: e.target.value })}
            placeholder="e.g., Complete Web Development Bootcamp"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-lg"
          />
          <p className="text-sm text-gray-500 mt-2">Choose a compelling title that clearly describes your course</p>
        </div>

        {/* Short Description */}
        <div className="lg:col-span-2">
          <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-3">
            Short Description *
          </label>
          <textarea
            id="description"
            rows={4}
            value={data.shortDescription}
            onChange={(e) => updateData({ shortDescription: e.target.value })}
            placeholder="Brief description of what students will learn..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
          />
          <p className="text-sm text-gray-500 mt-2">Write a compelling description that highlights the key benefits and outcomes</p>
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-3">
            Category *
          </label>
          <select
            id="category"
            value={data.category}
            onChange={(e) => updateData({ category: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          >
            <option value="">Select a category</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <p className="text-sm text-gray-500 mt-2">Choose the most relevant category for your course</p>
        </div>

        {/* Difficulty */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Difficulty Level
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(['beginner', 'intermediate', 'advanced'] as const).map(level => (
              <label key={level} className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                data.difficulty === level 
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="difficulty"
                  value={level}
                  checked={data.difficulty === level}
                  onChange={(e) => updateData({ difficulty: e.target.value as any })}
                  className="sr-only"
                />
                <span className="capitalize font-medium">{level}</span>
              </label>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-2">Select the appropriate difficulty level for your target audience</p>
        </div>

        {/* Duration */}
        <div>
          <label htmlFor="duration" className="block text-sm font-semibold text-gray-700 mb-3">
            Duration (weeks)
          </label>
          <input
            type="number"
            id="duration"
            min="1"
            max="52"
            value={data.duration}
            onChange={(e) => updateData({ duration: parseInt(e.target.value) })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
          <p className="text-sm text-gray-500 mt-2">Estimated time for students to complete the course</p>
        </div>

        {/* Price */}
        <div>
          <label htmlFor="price" className="block text-sm font-semibold text-gray-700 mb-3">
            Price (USD)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              id="price"
              min="0"
              step="0.01"
              value={data.price}
              onChange={(e) => updateData({ price: parseFloat(e.target.value) })}
              className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">Set to 0 for free course, or enter your desired price</p>
        </div>
      </div>

      {/* Enhanced Media Upload Section */}
      <div className="space-y-8 pt-8 border-t border-gray-200">
        <div className="text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpenIcon className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Course Media</h3>
          <p className="text-gray-600">Add visual and video content to make your course more engaging and professional.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Course Thumbnail */}
          <div className="bg-gray-50 p-6 rounded-xl">
            <label htmlFor="thumbnail" className="block text-sm font-semibold text-gray-700 mb-3">
              Course Thumbnail
            </label>
            <div className="space-y-4">
              <input
                type="url"
                id="thumbnail"
                value={data.thumbnailUrl}
                onChange={(e) => updateData({ thumbnailUrl: e.target.value })}
                placeholder="https://your-s3-bucket.amazonaws.com/course-thumbnail.jpg"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
              <p className="text-sm text-gray-600">
                Paste the URL of your course thumbnail image from AWS S3 or any image hosting service
              </p>
              {data.thumbnailUrl && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                  <div className="w-full max-w-sm">
                    <img 
                      src={data.thumbnailUrl} 
                      alt="Course thumbnail preview" 
                      className="w-full h-32 object-cover rounded-md border border-gray-300"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Intro Video */}
          <div className="bg-gray-50 p-6 rounded-xl">
            <label htmlFor="introVideo" className="block text-sm font-semibold text-gray-700 mb-3">
              Introduction Video
            </label>
            <div className="space-y-4">
              <input
                type="url"
                id="introVideo"
                value={data.introVideoUrl}
                onChange={(e) => updateData({ introVideoUrl: e.target.value })}
                placeholder="https://your-s3-bucket.amazonaws.com/intro-video.mp4"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
              <p className="text-sm text-gray-600">
                Paste the URL of your introduction video from AWS S3 or any video hosting service
              </p>
              {data.introVideoUrl && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                  <div className="w-full max-w-sm">
                    <video 
                      src={data.introVideoUrl} 
                      controls 
                      className="w-full h-32 rounded-md border border-gray-300"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Actions */}
      <div className="flex justify-end pt-8 border-t border-gray-200">
        <button
          onClick={handleNext}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 font-semibold flex items-center space-x-2"
        >
          <span>Continue to Structure</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Step 2: Structure  
function StructureStep({ data, updateData, onNext, onPrev }: StepProps) {
  const addLearningObjective = () => {
    updateData({ 
      learningObjectives: [...data.learningObjectives, ''] 
    });
  };

  const updateLearningObjective = (index: number, value: string) => {
    const objectives = [...data.learningObjectives];
    objectives[index] = value;
    updateData({ learningObjectives: objectives });
  };

  const removeLearningObjective = (index: number) => {
    if (data.learningObjectives.length > 1) {
      const objectives = data.learningObjectives.filter((_, i) => i !== index);
      updateData({ learningObjectives: objectives });
    }
  };

  const addPrerequisite = () => {
    updateData({ 
      prerequisites: [...data.prerequisites, ''] 
    });
  };

  const updatePrerequisite = (index: number, value: string) => {
    const prereqs = [...data.prerequisites];
    prereqs[index] = value;
    updateData({ prerequisites: prereqs });
  };

  const removePrerequisite = (index: number) => {
    if (data.prerequisites.length > 1) {
      const prereqs = data.prerequisites.filter((_, i) => i !== index);
      updateData({ prerequisites: prereqs });
    }
  };

  const handleNext = () => {
    // Validate that at least one learning objective is filled
    const hasObjectives = data.learningObjectives.some(obj => obj.trim() !== '');
    if (!hasObjectives) {
      alert('Please add at least one learning objective');
      return;
    }
    onNext?.();
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <BookOpenIcon className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Learning Structure</h2>
        <p className="text-gray-600">Define what students will learn and how the course is structured to maximize learning outcomes.</p>
      </div>

      {/* Learning Objectives */}
      <div className="bg-blue-50 p-6 rounded-xl">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Learning Objectives *
        </label>
        <p className="text-sm text-gray-600 mb-6">What will students be able to do after completing this course? Be specific and measurable.</p>
        
        <div className="space-y-4">
          {data.learningObjectives.map((objective, index) => (
            <div key={index} className="flex items-center space-x-3 bg-white p-4 rounded-lg border border-gray-200">
              <span className="text-sm font-semibold text-indigo-600 w-6">{index + 1}.</span>
              <input
                type="text"
                value={objective}
                onChange={(e) => updateLearningObjective(index, e.target.value)}
                placeholder="e.g., Build responsive websites using HTML, CSS, and JavaScript"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
              {data.learningObjectives.length > 1 && (
                <button
                  onClick={() => removeLearningObjective(index)}
                  className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
        
        <button
          onClick={addLearningObjective}
          className="mt-4 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Add Learning Objective</span>
        </button>
      </div>

      {/* Prerequisites */}
      <div className="bg-yellow-50 p-6 rounded-xl">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Prerequisites
        </label>
        <p className="text-sm text-gray-600 mb-6">What should students know before taking this course? This helps set proper expectations.</p>
        
        <div className="space-y-4">
          {data.prerequisites.map((prereq, index) => (
            <div key={index} className="flex items-center space-x-3 bg-white p-4 rounded-lg border border-gray-200">
              <span className="text-sm font-semibold text-yellow-600 w-6">•</span>
              <input
                type="text"
                value={prereq}
                onChange={(e) => updatePrerequisite(index, e.target.value)}
                placeholder="e.g., Basic computer skills"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
              {data.prerequisites.length > 1 && (
                <button
                  onClick={() => removePrerequisite(index)}
                  className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
        
        <button
          onClick={addPrerequisite}
          className="mt-4 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Add Prerequisite</span>
        </button>
      </div>

      {/* Course Structure */}
      <div className="bg-green-50 p-6 rounded-xl">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Course Structure
        </label>
        <p className="text-sm text-gray-600 mb-6">Choose how your course content will be organized to best serve your learning objectives.</p>
        <div className="space-y-4">
          {[
            { value: 'topic-based', label: 'Topic-based', desc: 'Organized by topics/modules (Recommended)', icon: '📚', color: 'bg-blue-100 text-blue-700' },
            { value: 'sequential', label: 'Sequential', desc: 'Linear progression through lessons', icon: '➡️', color: 'bg-green-100 text-green-700' },
            { value: 'project-based', label: 'Project-based', desc: 'Centered around building projects', icon: '🛠️', color: 'bg-purple-100 text-purple-700' }
          ].map(option => (
            <label key={option.value} className={`flex items-start space-x-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
              data.courseStructure === option.value 
                ? 'border-indigo-500 bg-indigo-50' 
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}>
              <input
                type="radio"
                name="courseStructure"
                value={option.value}
                checked={data.courseStructure === option.value}
                onChange={(e) => updateData({ courseStructure: e.target.value as any })}
                className="sr-only"
              />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${option.color}`}>
                {option.icon}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{option.label}</div>
                <div className="text-sm text-gray-600 mt-1">{option.desc}</div>
              </div>
              {data.courseStructure === option.value && (
                <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Enhanced Actions */}
      <div className="flex justify-between pt-8 border-t border-gray-200">
        <button
          onClick={onPrev}
          className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors font-semibold flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to Foundation</span>
        </button>
        <button
          onClick={handleNext}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 font-semibold flex items-center space-x-2"
        >
          <span>Continue to Planning</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Step 3: Planning
function PlanningStep({ data, updateData, onPrev, onSubmit, isSubmitting }: StepProps) {
  const [showQuizBuilder, setShowQuizBuilder] = useState(false);
  const [showAssignmentBuilder, setShowAssignmentBuilder] = useState(false);
  const [currentQuizTopic, setCurrentQuizTopic] = useState<string | null>(null);
  const [currentAssignmentTopic, setCurrentAssignmentTopic] = useState<string | null>(null);

  const addTopic = () => {
    const newTopic = {
      id: generateId(),
      title: '',
      description: '',
      lessons: [{ id: generateId(), title: '', type: 'video' as const }],
      assessments: []
    };
    updateData({ topics: [...data.topics, newTopic] });
  };

  const updateTopic = (topicId: string, updates: Partial<typeof data.topics[0]>) => {
    const topics = data.topics.map(topic => 
      topic.id === topicId ? { ...topic, ...updates } : topic
    );
    updateData({ topics });
  };

  const removeTopic = (topicId: string) => {
    if (data.topics.length > 1) {
      const topics = data.topics.filter(topic => topic.id !== topicId);
      updateData({ topics });
    }
  };

  const addLesson = (topicId: string) => {
    const topics = data.topics.map(topic => {
      if (topic.id === topicId) {
        return {
          ...topic,
          lessons: [...topic.lessons, { 
            id: generateId(), 
            title: '', 
            type: 'video' as const,
            description: '',
            content: '',
            video_url: '',
            estimated_duration: 15,
            is_free_preview: false
          }]
        };
      }
      return topic;
    });
    updateData({ topics });
  };

  const updateLesson = (topicId: string, lessonId: string, updates: Partial<typeof data.topics[0]['lessons'][0]>) => {
    const topics = data.topics.map(topic => {
      if (topic.id === topicId) {
        return {
          ...topic,
          lessons: topic.lessons.map(lesson =>
            lesson.id === lessonId ? { ...lesson, ...updates } : lesson
          )
        };
      }
      return topic;
    });
    updateData({ topics });
  };

  const removeLesson = (topicId: string, lessonId: string) => {
    const topics = data.topics.map(topic => {
      if (topic.id === topicId && topic.lessons.length > 1) {
        return {
          ...topic,
          lessons: topic.lessons.filter(lesson => lesson.id !== lessonId)
        };
      }
      return topic;
    });
    updateData({ topics });
  };

  const addAssessment = (topicId: string) => {
    const topics = data.topics.map(topic => {
      if (topic.id === topicId) {
        return {
          ...topic,
          assessments: [...topic.assessments, { 
            id: generateId(), 
            title: '', 
            type: 'quiz' as const 
          }]
        };
      }
      return topic;
    });
    updateData({ topics });
  };

  const openQuizBuilder = (topicId: string) => {
    setCurrentQuizTopic(topicId);
    setShowQuizBuilder(true);
  };

  const openAssignmentBuilder = (topicId: string) => {
    setCurrentAssignmentTopic(topicId);
    setShowAssignmentBuilder(true);
  };

  const handleQuizSave = (questions: any[]) => {
    if (currentQuizTopic) {
      const topics = data.topics.map(topic => {
        if (topic.id === currentQuizTopic) {
          return {
            ...topic,
            assessments: [...topic.assessments, { 
              id: generateId(), 
              title: `Quiz with ${questions.length} questions`, 
              type: 'quiz' as const,
              questions: questions
            }]
          };
        }
        return topic;
      });
      updateData({ topics });
    }
    setShowQuizBuilder(false);
    setCurrentQuizTopic(null);
  };

  const handleAssignmentSave = (assignment: any) => {
    if (currentAssignmentTopic) {
      const topics = data.topics.map(topic => {
        if (topic.id === currentAssignmentTopic) {
          return {
            ...topic,
            assessments: [...topic.assessments, { 
              id: generateId(), 
              title: assignment.title, 
              type: 'assignment' as const,
              assignment: assignment
            }]
          };
        }
        return topic;
      });
      updateData({ topics });
    }
    setShowAssignmentBuilder(false);
    setCurrentAssignmentTopic(null);
  };

  const handleSubmit = () => {
    // Basic validation
    const hasValidTopics = data.topics.some(topic => topic.title.trim() !== '');
    if (!hasValidTopics) {
      alert('Please add at least one topic with a title');
      return;
    }
    onSubmit?.();
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ChartBarIcon className="h-8 w-8 text-purple-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Course Planning</h2>
        <p className="text-gray-600">Plan your course structure with topics, lessons, and assessments. This is where the magic happens!</p>
      </div>

      {/* Enhanced Topics */}
      <div className="space-y-6">
        {data.topics.map((topic, topicIndex) => (
          <div key={topic.id} className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                  {topicIndex + 1}
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Topic {topicIndex + 1}
                </h3>
              </div>
              {data.topics.length > 1 && (
                <button
                  onClick={() => removeTopic(topic.id)}
                  className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>

            {/* Topic Title */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Topic Title *
              </label>
              <input
                type="text"
                value={topic.title}
                onChange={(e) => updateTopic(topic.id, { title: e.target.value })}
                placeholder="e.g., Introduction to JavaScript"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-lg"
              />
            </div>

            {/* Topic Description */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Topic Description
              </label>
              <textarea
                rows={3}
                value={topic.description}
                onChange={(e) => updateTopic(topic.id, { description: e.target.value })}
                placeholder="Brief description of this topic..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
              />
            </div>

            {/* Enhanced Lessons */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-700">Lessons</h4>
                <button
                  onClick={() => addLesson(topic.id)}
                  className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Add Lesson</span>
                </button>
              </div>
              <div className="space-y-4">
                {topic.lessons.map((lesson, lessonIndex) => (
                  <LessonEditor
                    key={lesson.id}
                    lesson={lesson}
                    lessonIndex={lessonIndex}
                    topicId={topic.id}
                    onUpdate={(updates) => updateLesson(topic.id, lesson.id, updates)}
                    onRemove={() => removeLesson(topic.id, lesson.id)}
                    canRemove={topic.lessons.length > 1}
                  />
                ))}
              </div>
            </div>

            {/* Enhanced Assessments */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-700">Assessments</h4>
                <div className="flex space-x-2">
                  <button
                    onClick={() => openQuizBuilder(topic.id)}
                    className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Add Quiz</span>
                  </button>
                  <button
                    onClick={() => openAssignmentBuilder(topic.id)}
                    className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Add Assignment</span>
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                {topic.assessments.map((assessment, assessmentIndex) => (
                  <div key={assessment.id} className="flex items-center space-x-3 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <span className="text-sm font-semibold text-green-600 w-8">📊</span>
                    <input
                      type="text"
                      value={assessment.title}
                      onChange={(e) => {
                        const topics = data.topics.map(t => {
                          if (t.id === topic.id) {
                            return {
                              ...t,
                              assessments: t.assessments.map(a =>
                                a.id === assessment.id ? { ...a, title: e.target.value } : a
                              )
                            };
                          }
                          return t;
                        });
                        updateData({ topics });
                      }}
                      placeholder="Assessment title"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    />
                    <select
                      value={assessment.type}
                      onChange={(e) => {
                        const topics = data.topics.map(t => {
                          if (t.id === topic.id) {
                            return {
                              ...t,
                              assessments: t.assessments.map(a =>
                                a.id === assessment.id ? { ...a, type: e.target.value as any } : a
                              )
                            };
                          }
                          return t;
                        });
                        updateData({ topics });
                      }}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    >
                      <option value="quiz">🧠 Quiz</option>
                      <option value="assignment">📝 Assignment</option>
                    </select>
                    <button
                      onClick={() => {
                        const topics = data.topics.map(t => {
                          if (t.id === topic.id) {
                            return {
                              ...t,
                              assessments: t.assessments.filter(a => a.id !== assessment.id)
                            };
                          }
                          return t;
                        });
                        updateData({ topics });
                      }}
                      className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Add Topic Button */}
      <button
        onClick={addTopic}
        className="w-full py-6 border-2 border-dashed border-indigo-300 rounded-xl text-indigo-600 hover:border-indigo-400 hover:text-indigo-700 hover:bg-indigo-50 transition-all duration-200 font-semibold flex items-center justify-center space-x-3"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        <span>Add New Topic</span>
      </button>

      {/* Enhanced Final Actions */}
      <div className="flex justify-between pt-8 border-t border-gray-200">
        <button
          onClick={onPrev}
          className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors font-semibold flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to Structure</span>
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-lg hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 transition-all duration-200 font-semibold flex items-center space-x-2"
        >
          {isSubmitting && <LoadingSpinner size="sm" />}
          <span>
            {isSubmitting 
              ? data.topics.some((t: any) => t.title.trim()) 
                ? 'Creating Course & Content...' 
                : 'Creating Course...'
              : 'Create Course'
            }
          </span>
          {!isSubmitting && (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      </div>

      {/* Advanced Quiz Builder Modal */}
      {showQuizBuilder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <AdvancedQuizBuilder
              onSave={handleQuizSave}
              onCancel={() => {
                setShowQuizBuilder(false);
                setCurrentQuizTopic(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Advanced Assignment Builder Modal */}
      {showAssignmentBuilder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <AdvancedAssignmentBuilder
              onSave={handleAssignmentSave}
              onCancel={() => {
                setShowAssignmentBuilder(false);
                setCurrentAssignmentTopic(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Lesson Editor Component for Course Creation
interface LessonEditorProps {
  lesson: {
    id: string;
    title: string;
    type: 'video' | 'text' | 'interactive';
    description?: string;
    content?: string;
    video_url?: string;
    estimated_duration?: number;
    is_free_preview?: boolean;
  };
  lessonIndex: number;
  topicId: string;
  onUpdate: (updates: any) => void;
  onRemove: () => void;
  canRemove: boolean;
}

function LessonEditor({ lesson, lessonIndex, onUpdate, onRemove, canRemove }: LessonEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Lesson Header */}
      <div className="flex items-center p-4 border-b border-gray-200">
        <span className="text-sm font-semibold text-indigo-600 w-8">{lessonIndex + 1}.</span>
        <input
          type="text"
          value={lesson.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="Lesson title"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
        />
        <select
          value={lesson.type}
          onChange={(e) => onUpdate({ type: e.target.value as any })}
          className="mx-3 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
        >
          <option value="video">📹 Video</option>
          <option value="text">📝 Text</option>
          <option value="interactive">🎮 Interactive</option>
        </select>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-md transition-colors"
        >
          {isExpanded ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </button>
        {canRemove && (
          <button
            onClick={onRemove}
            className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-md transition-colors ml-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Lesson Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lesson Description
            </label>
            <textarea
              rows={2}
              value={lesson.description || ''}
              onChange={(e) => onUpdate({ description: e.target.value })}
              placeholder="Brief description of this lesson..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Content based on lesson type */}
          {lesson.type === 'video' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Video Content
              </label>
              <VideoUploader
                videoUrl={lesson.video_url || ''}
                onVideoChange={(url) => onUpdate({ video_url: url })}
                className="min-h-[200px]"
              />
            </div>
          )}

          {lesson.type === 'text' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Text Content
              </label>
              <RichTextEditor
                content={lesson.content || ''}
                onChange={(content) => onUpdate({ content })}
                placeholder="Write your lesson content here..."
                className="min-h-[300px]"
              />
            </div>
          )}

          {lesson.type === 'interactive' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interactive Content
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <div className="text-gray-500 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Interactive Content</h3>
                <p className="text-gray-600 mb-4">
                  Interactive lessons can include simulations, coding exercises, or interactive demos.
                </p>
                <textarea
                  rows={4}
                  value={lesson.content || ''}
                  onChange={(e) => onUpdate({ content: e.target.value })}
                  placeholder="Describe the interactive content or paste embed code..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          )}

          {/* Lesson Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes)
              </label>
              <input
                type="number"
                min="1"
                value={lesson.estimated_duration || 15}
                onChange={(e) => onUpdate({ estimated_duration: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id={`free-preview-${lesson.id}`}
                checked={lesson.is_free_preview || false}
                onChange={(e) => onUpdate({ is_free_preview: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor={`free-preview-${lesson.id}`} className="text-sm font-medium text-gray-700">
                Free Preview Lesson
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
