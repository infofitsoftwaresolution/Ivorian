/**
 * Knowledge Check Builder
 * Create quick quizzes and exercises for lessons
 */

'use client';

import { useState } from 'react';
import { 
  PlusIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  QuestionMarkCircleIcon,
  LightBulbIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { generateId } from '@/utils/idGenerator';

interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay';
  question: string;
  options?: string[];
  correctAnswer?: string | number;
  explanation?: string;
  points: number;
  timeLimit?: number; // in seconds
}

interface KnowledgeCheck {
  id: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  totalPoints: number;
  timeLimit?: number; // in minutes
  passingScore: number; // percentage
}

interface KnowledgeCheckBuilderProps {
  knowledgeCheck?: KnowledgeCheck;
  onSave: (knowledgeCheck: KnowledgeCheck) => void;
  onCancel: () => void;
  className?: string;
}

export default function KnowledgeCheckBuilder({ 
  knowledgeCheck,
  onSave, 
  onCancel,
  className = '' 
}: KnowledgeCheckBuilderProps) {
  const [check, setCheck] = useState<KnowledgeCheck>(
    knowledgeCheck || {
      id: generateId(),
      title: '',
      description: '',
      questions: [],
      totalPoints: 0,
      passingScore: 70
    }
  );

  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);

  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: generateId(),
      type: 'multiple-choice',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: '',
      points: 1,
      timeLimit: 30
    };
    setEditingQuestion(newQuestion);
    setShowQuestionModal(true);
  };

  const editQuestion = (question: QuizQuestion) => {
    setEditingQuestion(question);
    setShowQuestionModal(true);
  };

  const saveQuestion = (question: QuizQuestion) => {
    const existingIndex = check.questions.findIndex(q => q.id === question.id);
    let updatedQuestions;
    
    if (existingIndex >= 0) {
      updatedQuestions = [...check.questions];
      updatedQuestions[existingIndex] = question;
    } else {
      updatedQuestions = [...check.questions, question];
    }
    
    const totalPoints = updatedQuestions.reduce((sum, q) => sum + q.points, 0);
    
    setCheck(prev => ({
      ...prev,
      questions: updatedQuestions,
      totalPoints
    }));
    
    setShowQuestionModal(false);
    setEditingQuestion(null);
  };

  const deleteQuestion = (questionId: string) => {
    const updatedQuestions = check.questions.filter(q => q.id !== questionId);
    const totalPoints = updatedQuestions.reduce((sum, q) => sum + q.points, 0);
    
    setCheck(prev => ({
      ...prev,
      questions: updatedQuestions,
      totalPoints
    }));
  };

  const handleSave = () => {
    if (!check.title.trim()) {
      alert('Please enter a title for the knowledge check');
      return;
    }
    
    if (check.questions.length === 0) {
      alert('Please add at least one question');
      return;
    }
    
    onSave(check);
  };

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'multiple-choice':
        return '🔘';
      case 'true-false':
        return '✅';
      case 'short-answer':
        return '📝';
      case 'essay':
        return '📄';
      default:
        return '❓';
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'multiple-choice':
        return 'Multiple Choice';
      case 'true-false':
        return 'True/False';
      case 'short-answer':
        return 'Short Answer';
      case 'essay':
        return 'Essay';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Knowledge Check Builder</h2>
          <p className="text-sm text-gray-600">Create quizzes and exercises for your lesson</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Save Knowledge Check
          </button>
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={check.title}
              onChange={(e) => setCheck(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., JavaScript Fundamentals Quiz"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={check.description}
              onChange={(e) => setCheck(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what this knowledge check covers..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Limit (minutes)
              </label>
              <input
                type="number"
                value={check.timeLimit || ''}
                onChange={(e) => setCheck(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || undefined }))}
                placeholder="No limit"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Passing Score (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={check.passingScore}
                onChange={(e) => setCheck(prev => ({ ...prev, passingScore: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Points
              </label>
              <input
                type="number"
                value={check.totalPoints}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Questions ({check.questions.length})</h3>
          <button
            onClick={addQuestion}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center space-x-2"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Add Question</span>
          </button>
        </div>
        
        {check.questions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <QuestionMarkCircleIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p>No questions added yet. Click "Add Question" to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {check.questions.map((question, index) => (
              <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-medium text-gray-500">Q{index + 1}</span>
                      <span className="text-lg">{getQuestionTypeIcon(question.type)}</span>
                      <span className="text-sm text-gray-600">{getQuestionTypeLabel(question.type)}</span>
                      <span className="text-sm text-gray-500">• {question.points} point{question.points !== 1 ? 's' : ''}</span>
                      {question.timeLimit && (
                        <span className="text-sm text-gray-500">• {question.timeLimit}s</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-900 mb-2">{question.question}</p>
                    {question.explanation && (
                      <p className="text-xs text-gray-600 italic">{question.explanation}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => editQuestion(question)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Edit"
                    >
                      <CheckIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteQuestion(question.id)}
                      className="p-1 text-red-400 hover:text-red-600"
                      title="Delete"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Question Modal */}
      {showQuestionModal && editingQuestion && (
        <QuestionEditor
          question={editingQuestion}
          onSave={saveQuestion}
          onCancel={() => {
            setShowQuestionModal(false);
            setEditingQuestion(null);
          }}
        />
      )}
    </div>
  );
}

// Question Editor Component
interface QuestionEditorProps {
  question: QuizQuestion;
  onSave: (question: QuizQuestion) => void;
  onCancel: () => void;
}

function QuestionEditor({ question, onSave, onCancel }: QuestionEditorProps) {
  const [editedQuestion, setEditedQuestion] = useState<QuizQuestion>(question);

  const handleSave = () => {
    if (!editedQuestion.question.trim()) {
      alert('Please enter a question');
      return;
    }
    
    if (editedQuestion.type === 'multiple-choice' && editedQuestion.options) {
      const hasValidOptions = editedQuestion.options.some(opt => opt.trim() !== '');
      if (!hasValidOptions) {
        alert('Please add at least one option');
        return;
      }
    }
    
    onSave(editedQuestion);
  };

  const addOption = () => {
    if (editedQuestion.options) {
      setEditedQuestion(prev => ({
        ...prev,
        options: [...(prev.options || []), '']
      }));
    }
  };

  const updateOption = (index: number, value: string) => {
    if (editedQuestion.options) {
      const newOptions = [...editedQuestion.options];
      newOptions[index] = value;
      setEditedQuestion(prev => ({ ...prev, options: newOptions }));
    }
  };

  const removeOption = (index: number) => {
    if (editedQuestion.options && editedQuestion.options.length > 2) {
      const newOptions = editedQuestion.options.filter((_, i) => i !== index);
      setEditedQuestion(prev => ({ ...prev, options: newOptions }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Edit Question</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Question Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Question Type
            </label>
            <select
              value={editedQuestion.type}
              onChange={(e) => setEditedQuestion(prev => ({ 
                ...prev, 
                type: e.target.value as QuizQuestion['type'],
                options: e.target.value === 'multiple-choice' ? ['', '', '', ''] : undefined,
                correctAnswer: e.target.value === 'true-false' ? 0 : undefined
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="multiple-choice">Multiple Choice</option>
              <option value="true-false">True/False</option>
              <option value="short-answer">Short Answer</option>
              <option value="essay">Essay</option>
            </select>
          </div>
          
          {/* Question Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Question *
            </label>
            <textarea
              value={editedQuestion.question}
              onChange={(e) => setEditedQuestion(prev => ({ ...prev, question: e.target.value }))}
              placeholder="Enter your question here..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          {/* Options for Multiple Choice */}
          {editedQuestion.type === 'multiple-choice' && editedQuestion.options && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Options
              </label>
              <div className="space-y-2">
                {editedQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={editedQuestion.correctAnswer === index}
                      onChange={() => setEditedQuestion(prev => ({ ...prev, correctAnswer: index }))}
                      className="text-indigo-600"
                    />
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    {editedQuestion.options.length > 2 && (
                      <button
                        onClick={() => removeOption(index)}
                        className="p-1 text-red-400 hover:text-red-600"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addOption}
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                >
                  + Add Option
                </button>
              </div>
            </div>
          )}
          
          {/* True/False Options */}
          {editedQuestion.type === 'true-false' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correct Answer
              </label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={editedQuestion.correctAnswer === 0}
                    onChange={() => setEditedQuestion(prev => ({ ...prev, correctAnswer: 0 }))}
                    className="text-indigo-600"
                  />
                  <span>True</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={editedQuestion.correctAnswer === 1}
                    onChange={() => setEditedQuestion(prev => ({ ...prev, correctAnswer: 1 }))}
                    className="text-indigo-600"
                  />
                  <span>False</span>
                </label>
              </div>
            </div>
          )}
          
          {/* Short Answer */}
          {editedQuestion.type === 'short-answer' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correct Answer
              </label>
              <input
                type="text"
                value={editedQuestion.correctAnswer as string || ''}
                onChange={(e) => setEditedQuestion(prev => ({ ...prev, correctAnswer: e.target.value }))}
                placeholder="Enter the correct answer..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          )}
          
          {/* Points and Time Limit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Points
              </label>
              <input
                type="number"
                min="1"
                value={editedQuestion.points}
                onChange={(e) => setEditedQuestion(prev => ({ ...prev, points: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Limit (seconds)
              </label>
              <input
                type="number"
                min="0"
                value={editedQuestion.timeLimit || ''}
                onChange={(e) => setEditedQuestion(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || undefined }))}
                placeholder="No limit"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          
          {/* Explanation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Explanation (Optional)
            </label>
            <textarea
              value={editedQuestion.explanation || ''}
              onChange={(e) => setEditedQuestion(prev => ({ ...prev, explanation: e.target.value }))}
              placeholder="Explain why this is the correct answer..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Save Question
          </button>
        </div>
      </div>
    </div>
  );
}
