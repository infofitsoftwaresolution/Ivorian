'use client';

import HomeHeader from '@/components/layout/HomeHeader';
import HomeFooter from '@/components/layout/HomeFooter';

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <HomeHeader />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h1>
        <div className="bg-white rounded-lg shadow p-8">
          <p className="text-gray-600 mb-4">Common questions and answers will be available here.</p>
          <p className="text-gray-600">This page is under construction.</p>
        </div>
      </div>
      <HomeFooter />
    </div>
  );
}

