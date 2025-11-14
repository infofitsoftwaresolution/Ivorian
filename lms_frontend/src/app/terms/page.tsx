'use client';

import HomeHeader from '@/components/layout/HomeHeader';
import HomeFooter from '@/components/layout/HomeFooter';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <HomeHeader />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Terms of Service</h1>
        <div className="bg-white rounded-lg shadow p-8">
          <p className="text-gray-600 mb-4">Last updated: {new Date().toLocaleDateString()}</p>
          <div className="prose max-w-none">
            <p className="text-gray-700 mb-4">
              Please read these Terms of Service carefully before using InfoFit Labs.
            </p>
            <p className="text-gray-700">
              These terms are under review and will be updated soon.
            </p>
          </div>
        </div>
      </div>
      <HomeFooter />
    </div>
  );
}

