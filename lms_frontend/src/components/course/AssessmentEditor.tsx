/**
 * Assessment Editor Component
 * For editing quizzes and assignments in the course edit page
 */

'use client';

import { useState } from 'react';
import { QuestionMarkCircleIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import AdvancedQuizBuilder from './AdvancedQuizBuilder';
import AdvancedAssignmentBuilder from './AdvancedAssignmentBuilder';

interface AssessmentEditorProps {
  assessment: {
    id: string;
    title: string;
    type: 'quiz' | 'assignment';
    questions?: any[];
    assignment?: any;
  };
  course: any;
  onUpdate: (course: any) => void;
}

export default function AssessmentEditor({ assessment, course, onUpdate }: AssessmentEditorProps) {
  const [showQuizBuilder, setShowQuizBuilder] = useState(false);
  const [showAssignmentBuilder, setShowAssignmentBuilder] = useState(false);

  const handleQuizUpdate = (questions: any[]) => {
    const updatedCourse = {
      ...course,
      topics: course.topics.map((topic: any) => ({
        ...topic,
        assessments: topic.assessments?.map((a: any) => 
          a.id === assessment.id 
            ? { ...a, questions: questions }
            : a
        ) || []
      }))
    };
    onUpdate(updatedCourse);
    setShowQuizBuilder(false);
  };

  const handleAssignmentUpdate = (assignmentData: any) => {
    const updatedCourse = {
      ...course,
      topics: course.topics.map((topic: any) => ({
        ...topic,
        assessments: topic.assessments?.map((a: any) => 
          a.id === assessment.id 
            ? { ...a, assignment: assignmentData }
            : a
        ) || []
      }))
    };
    onUpdate(updatedCourse);
    setShowAssignmentBuilder(false);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {assessment.type === 'quiz' ? 'Quiz Editor' : 'Assignment Editor'}
            </h2>
            <p className="text-gray-600">
              {assessment.type === 'quiz' 
                ? 'Edit quiz questions and settings' 
                : 'Edit assignment details and rubric'
              }
            </p>
          </div>
          <div className="flex space-x-3">
            {assessment.type === 'quiz' ? (
              <button
                onClick={() => setShowQuizBuilder(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
              >
                <QuestionMarkCircleIcon className="h-4 w-4" />
                <span>Edit Quiz</span>
              </button>
            ) : (
              <button
                onClick={() => setShowAssignmentBuilder(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 flex items-center space-x-2"
              >
                <DocumentTextIcon className="h-4 w-4" />
                <span>Edit Assignment</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Assessment Details */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Assessment Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              value={assessment.title}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <input
              type="text"
              value={assessment.type === 'quiz' ? 'Quiz' : 'Assignment'}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
            />
          </div>
        </div>
      </div>

      {/* Quiz Content */}
      {assessment.type === 'quiz' && assessment.questions && (
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quiz Questions</h3>
          {assessment.questions.length > 0 ? (
            <div className="space-y-4">
              {assessment.questions.map((question: any, index: number) => (
                <div key={question.id} className="bg-white rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Question {index + 1}</h4>
                    <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded">
                      {question.type}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-3">{question.questionText}</p>
                  {question.type === 'mcq' && question.options && (
                    <div className="space-y-2">
                      {question.options.map((option: any, optIndex: number) => (
                        <div key={option.id} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            checked={option.isCorrect}
                            readOnly
                            className="text-blue-600"
                          />
                          <span className={option.isCorrect ? 'text-green-700 font-medium' : 'text-gray-600'}>
                            {option.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No questions added yet. Click "Edit Quiz" to add questions.</p>
          )}
        </div>
      )}

      {/* Assignment Content */}
      {assessment.type === 'assignment' && assessment.assignment && (
        <div className="bg-purple-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignment Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <p className="text-gray-700 bg-white p-3 rounded border">
                {assessment.assignment.description || 'No description provided'}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                <p className="text-gray-700 bg-white p-3 rounded border">
                  {assessment.assignment.dueDate || 'Not set'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Points</label>
                <p className="text-gray-700 bg-white p-3 rounded border">
                  {assessment.assignment.maxPoints || 0}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">File Upload</label>
                <p className="text-gray-700 bg-white p-3 rounded border">
                  {assessment.assignment.fileUploadEnabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>
            {assessment.assignment.rubric && assessment.assignment.rubric.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Grading Rubric</label>
                <div className="space-y-2">
                  {assessment.assignment.rubric.map((item: any, index: number) => (
                    <div key={item.id} className="bg-white p-3 rounded border">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-medium text-gray-900">{item.criterion}</h5>
                          <p className="text-sm text-gray-600">{item.description}</p>
                        </div>
                        <span className="text-sm font-medium text-purple-600">
                          {item.maxPoints} points
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {showQuizBuilder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <AdvancedQuizBuilder
              initialQuestions={assessment.questions || []}
              onSave={handleQuizUpdate}
              onCancel={() => setShowQuizBuilder(false)}
            />
          </div>
        </div>
      )}

      {showAssignmentBuilder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <AdvancedAssignmentBuilder
              initialAssignment={assessment.assignment}
              onSave={handleAssignmentUpdate}
              onCancel={() => setShowAssignmentBuilder(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
