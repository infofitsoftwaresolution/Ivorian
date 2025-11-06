/**
 * Advanced Quiz Builder Component
 * Supports multiple question types: MCQ, Video, Descriptive, Comprehension
 */

'use client';

import { useState } from 'react';
import { 
  PlusIcon, 
  TrashIcon, 
  EyeIcon,
  PlayIcon,
  DocumentTextIcon,
  LightBulbIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface Question {
  id: string;
  type: 'mcq' | 'video' | 'descriptive' | 'comprehension';
  title: string;
  content: string;
  options?: string[];
  correctAnswer?: number;
  explanation?: string;
  points: number;
  timeLimit?: number;
}

interface QuizBuilderProps {
  onSave: (quiz: Question[]) => void;
  onCancel?: () => void;
  initialQuestions?: Question[];
}

export default function AdvancedQuizBuilder({ onSave, onCancel, initialQuestions = [] }: QuizBuilderProps) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const questionTypes = [
    { 
      type: 'mcq', 
      name: 'Multiple Choice', 
      icon: '🔘', 
      description: 'Single or multiple correct answers',
      color: 'bg-blue-100 text-blue-700'
    },
    { 
      type: 'video', 
      name: 'Video Question', 
      icon: '🎥', 
      description: 'Questions based on video content',
      color: 'bg-purple-100 text-purple-700'
    },
    { 
      type: 'descriptive', 
      name: 'Descriptive', 
      icon: '📝', 
      description: 'Open-ended text responses',
      color: 'bg-green-100 text-green-700'
    },
    { 
      type: 'comprehension', 
      name: 'Comprehension', 
      icon: '🧠', 
      description: 'Reading comprehension with multiple parts',
      color: 'bg-orange-100 text-orange-700'
    }
  ];

  const addQuestion = (type: Question['type']) => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      type,
      title: '',
      content: '',
      options: type === 'mcq' ? ['', '', '', ''] : undefined,
      correctAnswer: type === 'mcq' ? 0 : undefined,
      explanation: '',
      points: 1,
      timeLimit: 60
    };
    
    setQuestions([...questions, newQuestion]);
    setActiveQuestion(newQuestion.id);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
    if (activeQuestion === id) {
      setActiveQuestion(null);
    }
  };

  const addOption = (questionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.options) {
      updateQuestion(questionId, { options: [...question.options, ''] });
    }
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.options && question.options.length > 2) {
      const newOptions = question.options.filter((_, index) => index !== optionIndex);
      updateQuestion(questionId, { 
        options: newOptions,
        correctAnswer: question.correctAnswer === optionIndex ? 0 : question.correctAnswer
      });
    }
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.options) {
      const newOptions = [...question.options];
      newOptions[optionIndex] = value;
      updateQuestion(questionId, { options: newOptions });
    }
  };

  const handleSave = () => {
    onSave(questions);
  };

  const renderQuestionEditor = (question: Question) => {
    return (
      <div className="space-y-6">
        {/* Question Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${questionTypes.find(t => t.type === question.type)?.color}`}>
              {questionTypes.find(t => t.type === question.type)?.icon}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {questionTypes.find(t => t.type === question.type)?.name} Question
              </h3>
              <p className="text-sm text-gray-500">
                {questionTypes.find(t => t.type === question.type)?.description}
              </p>
            </div>
          </div>
          <button
            onClick={() => removeQuestion(question.id)}
            className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Question Title */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Question Title *
          </label>
          <input
            type="text"
            value={question.title}
            onChange={(e) => updateQuestion(question.id, { title: e.target.value })}
            placeholder="Enter your question title..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Question Content */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Question Content *
          </label>
          <textarea
            value={question.content}
            onChange={(e) => updateQuestion(question.id, { content: e.target.value })}
            placeholder="Enter your question content..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
          />
        </div>

        {/* Question Type Specific Fields */}
        {question.type === 'mcq' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Answer Options *
            </label>
            <div className="space-y-3">
              {question.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    question.correctAnswer === index 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(question.id, index, e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                  <button
                    onClick={() => updateQuestion(question.id, { correctAnswer: index })}
                    className={`p-2 rounded-lg transition-colors ${
                      question.correctAnswer === index 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <CheckCircleIcon className="h-5 w-5" />
                  </button>
                  {question.options && question.options.length > 2 && (
                    <button
                      onClick={() => removeOption(question.id, index)}
                      className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => addOption(question.id)}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors flex items-center justify-center space-x-2"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Add Option</span>
              </button>
            </div>
          </div>
        )}

        {question.type === 'video' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Video URL *
            </label>
            <input
              type="url"
              value={question.content}
              onChange={(e) => updateQuestion(question.id, { content: e.target.value })}
              placeholder="https://example.com/video.mp4"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
            <p className="text-sm text-gray-500 mt-2">
              Paste the URL of your video content. Students will watch this video and answer questions based on it.
            </p>
          </div>
        )}

        {/* Points and Time Limit */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Points
            </label>
            <input
              type="number"
              min="1"
              value={question.points}
              onChange={(e) => updateQuestion(question.id, { points: parseInt(e.target.value) })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Time Limit (seconds)
            </label>
            <input
              type="number"
              min="30"
              value={question.timeLimit}
              onChange={(e) => updateQuestion(question.id, { timeLimit: parseInt(e.target.value) })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Explanation */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Explanation (Optional)
          </label>
          <textarea
            value={question.explanation || ''}
            onChange={(e) => updateQuestion(question.id, { explanation: e.target.value })}
            placeholder="Explain why this is the correct answer..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Advanced Quiz Builder</h2>
          <p className="text-gray-600">Create engaging quizzes with multiple question types</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
          >
            <EyeIcon className="h-5 w-5" />
            <span>{previewMode ? 'Edit Mode' : 'Preview Mode'}</span>
          </button>
          {onCancel && (
            <button
              onClick={onCancel}
              className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors font-semibold"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSave}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
          >
            Save Quiz
          </button>
        </div>
      </div>

      {previewMode ? (
        /* Preview Mode */
        <div className="space-y-4">
          {questions.map((question, index) => (
            <div key={question.id} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                  {index + 1}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{question.title}</h3>
                  <p className="text-sm text-gray-500">
                    {questionTypes.find(t => t.type === question.type)?.name} • {question.points} points
                  </p>
                </div>
              </div>
              <p className="text-gray-700 mb-4">{question.content}</p>
              {question.type === 'mcq' && question.options && (
                <div className="space-y-2">
                  {question.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        question.correctAnswer === optionIndex 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {String.fromCharCode(65 + optionIndex)}
                      </div>
                      <span className="text-gray-700">{option}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Edit Mode */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Question Types */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Questions</h3>
              <div className="space-y-3">
                {questionTypes.map((type) => (
                  <button
                    key={type.type}
                    onClick={() => addQuestion(type.type as Question['type'])}
                    className="w-full p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${type.color}`}>
                        <span className="text-lg">{type.icon}</span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{type.name}</div>
                        <div className="text-sm text-gray-500">{type.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Question Editor */}
          <div className="lg:col-span-2">
            {activeQuestion ? (
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                {renderQuestionEditor(questions.find(q => q.id === activeQuestion)!)}
              </div>
            ) : (
              <div className="bg-gray-50 p-12 rounded-lg border-2 border-dashed border-gray-300 text-center">
                <LightBulbIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Question Selected</h3>
                <p className="text-gray-500">Choose a question type from the left to start building your quiz.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Questions List */}
      {questions.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Questions ({questions.length})</h3>
          <div className="space-y-3">
            {questions.map((question, index) => (
              <div
                key={question.id}
                onClick={() => setActiveQuestion(question.id)}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  activeQuestion === question.id 
                    ? 'border-indigo-500 bg-indigo-50' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{question.title || 'Untitled Question'}</h4>
                      <p className="text-sm text-gray-500">
                        {questionTypes.find(t => t.type === question.type)?.name} • {question.points} points
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      question.title && question.content 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {question.title && question.content ? 'Complete' : 'Incomplete'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeQuestion(question.id);
                      }}
                      className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
