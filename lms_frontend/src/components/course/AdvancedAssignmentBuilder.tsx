/**
 * Advanced Assignment Builder Component
 * Supports file uploads, rubrics, and peer review
 */

'use client';

import { useState } from 'react';
import {
  PlusIcon,
  TrashIcon,
  DocumentIcon,
  DocumentArrowUpIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface RubricCriteria {
  id: string;
  title: string;
  description: string;
  points: number;
  levels: {
    excellent: string;
    good: string;
    satisfactory: string;
    needsImprovement: string;
  };
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  instructions: string;
  dueDate: string;
  timeLimit?: number;
  maxPoints: number;
  fileTypes: string[];
  maxFileSize: number;
  rubric: RubricCriteria[];
  peerReview: boolean;
  peerReviewCriteria: string[];
  submissionType: 'individual' | 'group';
  groupSize?: number;
}

interface AssignmentBuilderProps {
  onSave: (assignment: Assignment) => void;
  onCancel?: () => void;
  initialAssignment?: Assignment;
}

export default function AdvancedAssignmentBuilder({ onSave, onCancel, initialAssignment }: AssignmentBuilderProps) {
  const [assignment, setAssignment] = useState<Assignment>(
    initialAssignment || {
      id: Date.now().toString(),
      title: '',
      description: '',
      instructions: '',
      dueDate: '',
      timeLimit: undefined,
      maxPoints: 100,
      fileTypes: ['pdf', 'doc', 'docx'],
      maxFileSize: 10,
      rubric: [],
      peerReview: false,
      peerReviewCriteria: [],
      submissionType: 'individual',
      groupSize: 2
    }
  );

  const [activeTab, setActiveTab] = useState<'basic' | 'files' | 'rubric' | 'peer'>('basic');

  const updateAssignment = (updates: Partial<Assignment>) => {
    setAssignment({ ...assignment, ...updates });
  };

  const addRubricCriteria = () => {
    const newCriteria: RubricCriteria = {
      id: Date.now().toString(),
      title: '',
      description: '',
      points: 10,
      levels: {
        excellent: '',
        good: '',
        satisfactory: '',
        needsImprovement: ''
      }
    };
    updateAssignment({ rubric: [...assignment.rubric, newCriteria] });
  };

  const updateRubricCriteria = (criteriaId: string, updates: Partial<RubricCriteria>) => {
    const updatedRubric = assignment.rubric.map(criteria => 
      criteria.id === criteriaId ? { ...criteria, ...updates } : criteria
    );
    updateAssignment({ rubric: updatedRubric });
  };

  const removeRubricCriteria = (criteriaId: string) => {
    updateAssignment({ rubric: assignment.rubric.filter(c => c.id !== criteriaId) });
  };

  const addPeerReviewCriteria = () => {
    updateAssignment({ peerReviewCriteria: [...assignment.peerReviewCriteria, ''] });
  };

  const updatePeerReviewCriteria = (index: number, value: string) => {
    const updated = [...assignment.peerReviewCriteria];
    updated[index] = value;
    updateAssignment({ peerReviewCriteria: updated });
  };

  const removePeerReviewCriteria = (index: number) => {
    updateAssignment({ 
      peerReviewCriteria: assignment.peerReviewCriteria.filter((_, i) => i !== index) 
    });
  };

  const handleSave = () => {
    onSave(assignment);
  };

  const tabs = [
    { id: 'basic', name: 'Basic Info', icon: DocumentIcon },
    { id: 'files', name: 'File Settings', icon: DocumentArrowUpIcon },
    { id: 'rubric', name: 'Rubric', icon: ClipboardDocumentListIcon },
    { id: 'peer', name: 'Peer Review', icon: UserGroupIcon }
  ];

  const fileTypeOptions = [
    { value: 'pdf', label: 'PDF', icon: '📄' },
    { value: 'doc', label: 'Word Document', icon: '📝' },
    { value: 'docx', label: 'Word Document (DOCX)', icon: '📝' },
    { value: 'ppt', label: 'PowerPoint', icon: '📊' },
    { value: 'pptx', label: 'PowerPoint (PPTX)', icon: '📊' },
    { value: 'xls', label: 'Excel', icon: '📈' },
    { value: 'xlsx', label: 'Excel (XLSX)', icon: '📈' },
    { value: 'txt', label: 'Text File', icon: '📄' },
    { value: 'zip', label: 'ZIP Archive', icon: '📦' },
    { value: 'jpg', label: 'JPEG Image', icon: '🖼️' },
    { value: 'png', label: 'PNG Image', icon: '🖼️' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Advanced Assignment Builder</h2>
          <p className="text-gray-600">Create comprehensive assignments with rubrics and peer review</p>
        </div>
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
          Save Assignment
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        {activeTab === 'basic' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Assignment Title *
              </label>
              <input
                type="text"
                value={assignment.title}
                onChange={(e) => updateAssignment({ title: e.target.value })}
                placeholder="Enter assignment title..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={assignment.description}
                onChange={(e) => updateAssignment({ description: e.target.value })}
                placeholder="Brief description of the assignment..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Instructions *
              </label>
              <textarea
                value={assignment.instructions}
                onChange={(e) => updateAssignment({ instructions: e.target.value })}
                placeholder="Detailed instructions for students..."
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Due Date *
                </label>
                <input
                  type="datetime-local"
                  value={assignment.dueDate}
                  onChange={(e) => updateAssignment({ dueDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Max Points *
                </label>
                <input
                  type="number"
                  min="1"
                  value={assignment.maxPoints}
                  onChange={(e) => updateAssignment({ maxPoints: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Submission Type
                </label>
                <div className="space-y-3">
                  {[
                    { value: 'individual', label: 'Individual', description: 'Students submit individually' },
                    { value: 'group', label: 'Group', description: 'Students submit as a group' }
                  ].map((option) => (
                    <label key={option.value} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="submissionType"
                        value={option.value}
                        checked={assignment.submissionType === option.value}
                        onChange={(e) => updateAssignment({ submissionType: e.target.value as any })}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        assignment.submissionType === option.value 
                          ? 'border-indigo-500 bg-indigo-500' 
                          : 'border-gray-300'
                      }`} />
                      <div>
                        <div className="font-medium text-gray-900">{option.label}</div>
                        <div className="text-sm text-gray-500">{option.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {assignment.submissionType === 'group' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Group Size
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="10"
                    value={assignment.groupSize}
                    onChange={(e) => updateAssignment({ groupSize: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'files' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Allowed File Types
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {fileTypeOptions.map((type) => (
                  <label key={type.value} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={assignment.fileTypes.includes(type.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          updateAssignment({ fileTypes: [...assignment.fileTypes, type.value] });
                        } else {
                          updateAssignment({ fileTypes: assignment.fileTypes.filter(t => t !== type.value) });
                        }
                      }}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded border-2 ${
                      assignment.fileTypes.includes(type.value) 
                        ? 'border-indigo-500 bg-indigo-500' 
                        : 'border-gray-300'
                    }`} />
                    <span className="text-lg">{type.icon}</span>
                    <span className="text-sm font-medium text-gray-900">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Max File Size (MB)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={assignment.maxFileSize}
                onChange={(e) => updateAssignment({ maxFileSize: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Time Limit (minutes) - Optional
              </label>
              <input
                type="number"
                min="30"
                value={assignment.timeLimit || ''}
                onChange={(e) => updateAssignment({ timeLimit: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="No time limit"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
              <p className="text-sm text-gray-500 mt-2">
                Set a time limit for students to complete the assignment
              </p>
            </div>
          </div>
        )}

        {activeTab === 'rubric' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Grading Rubric</h3>
              <button
                onClick={addRubricCriteria}
                className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-2"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Add Criteria</span>
              </button>
            </div>

            {assignment.rubric.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <ClipboardDocumentListIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Rubric Criteria</h3>
                <p className="text-gray-500">Add criteria to create a detailed grading rubric for your assignment.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {assignment.rubric.map((criteria, index) => (
                  <div key={criteria.id} className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">Criteria {index + 1}</h4>
                      <button
                        onClick={() => removeRubricCriteria(criteria.id)}
                        className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Criteria Title *
                        </label>
                        <input
                          type="text"
                          value={criteria.title}
                          onChange={(e) => updateRubricCriteria(criteria.id, { title: e.target.value })}
                          placeholder="e.g., Content Quality"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Points *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={criteria.points}
                          onChange={(e) => updateRubricCriteria(criteria.id, { points: parseInt(e.target.value) })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={criteria.description}
                        onChange={(e) => updateRubricCriteria(criteria.id, { description: e.target.value })}
                        placeholder="Describe what this criteria evaluates..."
                        rows={2}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Excellent (4 points)
                        </label>
                        <textarea
                          value={criteria.levels.excellent}
                          onChange={(e) => updateRubricCriteria(criteria.id, { 
                            levels: { ...criteria.levels, excellent: e.target.value }
                          })}
                          placeholder="Description of excellent work..."
                          rows={2}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Good (3 points)
                        </label>
                        <textarea
                          value={criteria.levels.good}
                          onChange={(e) => updateRubricCriteria(criteria.id, { 
                            levels: { ...criteria.levels, good: e.target.value }
                          })}
                          placeholder="Description of good work..."
                          rows={2}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Satisfactory (2 points)
                        </label>
                        <textarea
                          value={criteria.levels.satisfactory}
                          onChange={(e) => updateRubricCriteria(criteria.id, { 
                            levels: { ...criteria.levels, satisfactory: e.target.value }
                          })}
                          placeholder="Description of satisfactory work..."
                          rows={2}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Needs Improvement (1 point)
                        </label>
                        <textarea
                          value={criteria.levels.needsImprovement}
                          onChange={(e) => updateRubricCriteria(criteria.id, { 
                            levels: { ...criteria.levels, needsImprovement: e.target.value }
                          })}
                          placeholder="Description of work that needs improvement..."
                          rows={2}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'peer' && (
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="peerReview"
                checked={assignment.peerReview}
                onChange={(e) => updateAssignment({ peerReview: e.target.checked })}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="peerReview" className="text-sm font-semibold text-gray-700">
                Enable Peer Review
              </label>
            </div>

            {assignment.peerReview && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Peer Review Criteria
                  </label>
                  <div className="space-y-3">
                    {assignment.peerReviewCriteria.map((criteria, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <input
                          type="text"
                          value={criteria}
                          onChange={(e) => updatePeerReviewCriteria(index, e.target.value)}
                          placeholder="e.g., Clarity of explanation"
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        />
                        <button
                          onClick={() => removePeerReviewCriteria(index)}
                          className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={addPeerReviewCriteria}
                      className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors flex items-center justify-center space-x-2"
                    >
                      <PlusIcon className="h-5 w-5" />
                      <span>Add Criteria</span>
                    </button>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Peer Review Process</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Students will review 2-3 peer submissions</li>
                    <li>• Reviews will be anonymous</li>
                    <li>• Students must provide constructive feedback</li>
                    <li>• Reviews will be graded for quality</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
