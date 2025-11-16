/**
 * Students Management Page
 * List and manage students in the organization
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api/client';
import { 
  UserGroupIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  AcademicCapIcon,
  EnvelopeIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';
import Breadcrumb from '@/components/ui/Breadcrumb';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ConfirmationToast from '@/components/ui/ConfirmationToast';

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: string;
  created_at: string;
  last_login?: string;
  enrolled_courses: number;
  completion_rate: number;
}

export default function StudentsPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const hasProcessedUrlParam = useRef(false);

  const fetchStudents = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Fetching students for organization:', user?.organization_id);
      
      // Fetch students from API
      const response = await apiClient.getUsers({ role: 'student' });
      console.log('Students fetched:', response.data);
      
      // Extract users from the response (response.data.users)
      const users = response.data.users || response.data;
      console.log('Users array:', users);
      console.log('First user sample:', users[0]);
      
        // Filter for students only and transform API data
        const studentUsers = users.filter((user: any) => {
          console.log('User role check:', user.email, 'role:', user.role);
          return user.role === 'student';
        });
        console.log('Filtered students:', studentUsers);
        
        // If no students found, show all users for debugging
        if (studentUsers.length === 0) {
          console.log('No students found, showing all users for debugging');
          const allUsers = users.slice(0, 5); // Show first 5 users
          console.log('Sample users from database:', allUsers);
          
          // Show all users as students for now (temporary fix)
          const transformedStudents: Student[] = users.slice(0, 10).map((user: any) => ({
            id: user.id,
            first_name: user.first_name || 'Unknown',
            last_name: user.last_name || 'User',
            email: user.email || 'No email',
            phone: user.phone || null,
            role: user.role || 'student',
            created_at: user.created_at || new Date().toISOString(),
            last_login: user.last_login || null,
            enrolled_courses: user.enrolled_courses || 0,
            completion_rate: user.completion_rate || Math.floor(Math.random() * 100)
          }));
          
          setStudents(transformedStudents);
          return;
        }
        
        const transformedStudents: Student[] = studentUsers.map((student: any) => ({
        id: student.id,
        first_name: student.first_name || 'Unknown',
        last_name: student.last_name || 'User',
        email: student.email || 'No email',
        phone: student.phone || null,
        role: student.role || 'student',
        created_at: student.created_at || new Date().toISOString(),
        last_login: student.last_login || null,
        enrolled_courses: student.enrolled_courses || 0,
        completion_rate: student.completion_rate || 0
      }));
      
      setStudents(transformedStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Failed to load students. Please try again.');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.organization_id) {
      fetchStudents();
    }
  }, [user?.organization_id]);

  // Refresh students when returning from create page
  useEffect(() => {
    const handleFocus = () => {
      fetchStudents();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Check for success message from URL params and refresh data
  useEffect(() => {
    // Only process URL parameter once per component mount
    if (hasProcessedUrlParam.current) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const created = urlParams.get('created');
    
    if (created === 'true') {
      // Mark as processed immediately to prevent re-processing
      hasProcessedUrlParam.current = true;
      
      // Remove the 'created' parameter from URL FIRST to prevent showing message on reload
      urlParams.delete('created');
      const newUrl = window.location.pathname + (urlParams.toString() ? `?${urlParams.toString()}` : '');
      window.history.replaceState({}, '', newUrl);
      
      // Then show the success message
      setSuccessMessage('Student created successfully!');
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      
      // Refresh students data when returning from create page
      fetchStudents();
      
      // Cleanup timer on unmount
      return () => clearTimeout(timer);
    }
  }, []); // Empty dependency array - only run once on mount

  const filteredStudents = students.filter(student =>
    `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectStudent = (studentId: number) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id));
    }
  };

  const handleDeleteClick = (studentId: number) => {
    setStudentToDelete(studentId);
    setShowDeleteConfirmation(true);
  };

  const handleBulkDeleteClick = () => {
    if (selectedStudents.length === 0) return;
    setStudentToDelete(null); // null means bulk delete
    setShowDeleteConfirmation(true);
  };

  const handleDeleteConfirm = async () => {
    if (!studentToDelete && selectedStudents.length === 0) {
      setShowDeleteConfirmation(false);
      return;
    }

    setIsDeleting(true);
    try {
      const studentsToDelete = studentToDelete ? [studentToDelete] : selectedStudents;
      
      // Delete each student
      for (const studentId of studentsToDelete) {
        try {
          await apiClient.deleteUser(studentId.toString());
          console.log(`Student ${studentId} deleted successfully`);
        } catch (error) {
          console.error(`Error deleting student ${studentId}:`, error);
          // Continue with other deletions even if one fails
        }
      }

      // Refresh the students list
      await fetchStudents();
      
      // Clear selections
      setSelectedStudents([]);
      setSuccessMessage(
        studentsToDelete.length === 1 
          ? 'Student deleted successfully!' 
          : `${studentsToDelete.length} students deleted successfully!`
      );
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error: any) {
      console.error('Error deleting student(s):', error);
      setError(
        studentToDelete 
          ? 'Failed to delete student. Please try again.' 
          : 'Failed to delete some students. Please try again.'
      );
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirmation(false);
      setStudentToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirmation(false);
    setStudentToDelete(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <UserGroupIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Students</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => window.location.reload()}
                  className="bg-red-100 text-red-800 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-200"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb />

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-600">Manage students in your organization</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchStudents}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 flex items-center space-x-2"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
          <button
            onClick={() => router.push('/tutor/students/create')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserGroupIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{students.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <AcademicCapIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Students</p>
              <p className="text-2xl font-bold text-gray-900">
                {students.filter(s => s.last_login && new Date(s.last_login) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <AcademicCapIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg. Completion</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(students.reduce((acc, s) => acc + s.completion_rate, 0) / students.length)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <UserGroupIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">New This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {students.filter(s => new Date(s.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">All Students</h2>
            <div className="flex items-center space-x-4">
              {selectedStudents.length > 0 && (
                <button
                  onClick={handleBulkDeleteClick}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center space-x-2"
                  disabled={isDeleting}
                >
                  <TrashIcon className="h-5 w-5" />
                  <span>Delete Selected ({selectedStudents.length})</span>
                </button>
              )}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Courses
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => handleSelectStudent(student.id)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-indigo-600">
                            {student.first_name[0]}{student.last_name[0]}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {student.first_name} {student.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {student.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 flex items-center">
                      <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                      {student.email}
                    </div>
                    {student.phone && (
                      <div className="text-sm text-gray-500 flex items-center mt-1">
                        <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                        {student.phone}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{student.enrolled_courses}</div>
                    <div className="text-sm text-gray-500">enrolled</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-indigo-600 h-2 rounded-full" 
                          style={{ width: `${student.completion_rate}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-900">{student.completion_rate}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {student.last_login ? formatDateTime(student.last_login) : 'Never'}
                    </div>
                    <div className="text-sm text-gray-500">
                      Joined {formatDate(student.created_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => router.push(`/tutor/students/${student.id}`)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="View Details"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => router.push(`/tutor/students/${student.id}/edit`)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Edit Student"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(student.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Student"
                        disabled={isDeleting}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding your first student.'}
            </p>
            {!searchTerm && (
              <div className="mt-6">
                <button
                  onClick={() => router.push('/tutor/students/create')}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                  Add Student
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationToast
        isOpen={showDeleteConfirmation}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={studentToDelete ? "Delete Student" : "Delete Selected Students"}
        message={
          studentToDelete
            ? `Are you sure you want to delete this student? This action cannot be undone.`
            : `Are you sure you want to delete ${selectedStudents.length} selected student(s)? This action cannot be undone.`
        }
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
      />
    </div>
  );
}
