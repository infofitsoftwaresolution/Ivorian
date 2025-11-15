'use client';

import HomeHeader from '@/components/layout/HomeHeader';
import HomeFooter from '@/components/layout/HomeFooter';
import { UserGroupIcon } from '@heroicons/react/24/outline';

export default function TutorsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <HomeHeader />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Find Instructors</h1>
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <UserGroupIcon className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Browse our expert instructors.</p>
          <p className="text-gray-600">This feature is coming soon.</p>
        </div>
      </div>
      <HomeFooter />
    </div>
  );
}

