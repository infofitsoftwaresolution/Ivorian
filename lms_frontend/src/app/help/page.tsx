'use client';

import HomeHeader from '@/components/layout/HomeHeader';
import HomeFooter from '@/components/layout/HomeFooter';
import Link from 'next/link';

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <HomeHeader />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Help Center</h1>
        <div className="bg-white rounded-lg shadow p-8">
          <p className="text-gray-600 mb-4">Welcome to the InfoFit Labs Help Center.</p>
          <p className="text-gray-600 mb-6">If you need assistance, please contact our support team.</p>
          <Link href="/contact" className="text-blue-600 hover:underline">
            Contact Support →
          </Link>
        </div>
      </div>
      <HomeFooter />
    </div>
  );
}

