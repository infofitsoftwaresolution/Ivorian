/**
 * Test Student Flow Page
 * Instructions for testing the complete student creation and login flow
 */

'use client';

import { useRouter } from 'next/navigation';
import { 
  UserPlusIcon,
  AcademicCapIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  EyeIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';

export default function TestStudentFlow() {
  const router = useRouter();

  const steps = [
    {
      id: 1,
      title: 'Add Student as Tutor',
      description: 'Navigate to tutor dashboard and add a new student',
      icon: UserPlusIcon,
      action: () => router.push('/tutor/students/create'),
      color: 'bg-blue-500'
    },
    {
      id: 2,
      title: 'View Students List',
      description: 'Check the students management page',
      icon: AcademicCapIcon,
      action: () => router.push('/tutor/students'),
      color: 'bg-green-500'
    },
    {
      id: 3,
      title: 'Student Login',
      description: 'Login as a student using demo credentials',
      icon: EyeIcon,
      action: () => router.push('/student/login'),
      color: 'bg-purple-500'
    },
    {
      id: 4,
      title: 'Student Dashboard',
      description: 'View the student dashboard and course interface',
      icon: BookOpenIcon,
      action: () => router.push('/student/dashboard'),
      color: 'bg-indigo-500'
    }
  ];

  const demoCredentials = [
    { email: 'student@example.com', password: 'password123' },
    { email: 'john.doe@example.com', password: 'password123' },
    { email: 'jane.smith@example.com', password: 'password123' },
    { email: 'mike.johnson@example.com', password: 'password123' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mx-auto h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
            <AcademicCapIcon className="h-8 w-8 text-indigo-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Student Flow Testing Guide
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Complete guide to test the student creation, management, and login flow
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-8">
          {steps.map((step, index) => (
            <div key={step.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start space-x-4">
                <div className={`flex-shrink-0 w-12 h-12 ${step.color} rounded-full flex items-center justify-center`}>
                  <step.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Step {step.id}: {step.title}
                      </h3>
                      <p className="text-gray-600 mt-1">{step.description}</p>
                    </div>
                    <button
                      onClick={step.action}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center space-x-2"
                    >
                      <span>Go to Step</span>
                      <ArrowRightIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Demo Credentials */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <CheckCircleIcon className="h-6 w-6 text-green-500 mr-2" />
            Demo Student Credentials
          </h2>
          <p className="text-gray-600 mb-6">
            Use these credentials to test the student login flow:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {demoCredentials.map((cred, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{cred.email}</p>
                    <p className="text-sm text-gray-500">Password: {cred.password}</p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${cred.email}\n${cred.password}`);
                      alert('Credentials copied to clipboard!');
                    }}
                    className="text-indigo-600 hover:text-indigo-800 text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features to Test */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Features to Test
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Tutor Features</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                  Add new students with form validation
                </li>
                <li className="flex items-center">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                  View students list with search and filters
                </li>
                <li className="flex items-center">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                  Student progress tracking
                </li>
                <li className="flex items-center">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                  Course enrollment management
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Student Features</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                  Student login with role-based access
                </li>
                <li className="flex items-center">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                  Student dashboard with course overview
                </li>
                <li className="flex items-center">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                  Progress tracking and statistics
                </li>
                <li className="flex items-center">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                  Course navigation and content access
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <button
            onClick={() => router.push('/tutor/dashboard')}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 flex items-center space-x-2"
          >
            <AcademicCapIcon className="h-5 w-5" />
            <span>Tutor Dashboard</span>
          </button>
          
          <button
            onClick={() => router.push('/student/login')}
            className="bg-purple-600 text-white px-6 py-3 rounded-md hover:bg-purple-700 flex items-center space-x-2"
          >
            <EyeIcon className="h-5 w-5" />
            <span>Student Login</span>
          </button>
        </div>
      </div>
    </div>
  );
}
