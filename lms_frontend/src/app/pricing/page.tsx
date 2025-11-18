'use client';

import HomeHeader from '@/components/layout/HomeHeader';
import HomeFooter from '@/components/layout/HomeFooter';
import { CheckIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function PricingPage() {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for getting started',
      features: [
        'Access to free courses',
        'Community support',
        'Basic certificates',
        'Limited course access'
      ],
      cta: 'Get Started',
      ctaLink: '/register',
      popular: false
    },
    {
      name: 'Student',
      price: '$9.99',
      period: 'per month',
      description: 'Best for individual learners',
      features: [
        'Access to all courses',
        'Priority support',
        'Certificates of completion',
        'Downloadable resources',
        'Progress tracking'
      ],
      cta: 'Start Learning',
      ctaLink: '/register',
      popular: true
    },
    {
      name: 'Professional',
      price: '$29.99',
      period: 'per month',
      description: 'For career advancement',
      features: [
        'Everything in Student',
        'Live session access',
        '1-on-1 instructor support',
        'Career guidance',
        'Resume review',
        'Job placement assistance'
      ],
      cta: 'Go Professional',
      ctaLink: '/register',
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <HomeHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-gray-600">
            Choose the plan that's right for you. All plans include access to our course library.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white rounded-lg shadow-lg p-8 ${
                plan.popular ? 'ring-2 ring-blue-600 transform scale-105' : ''
              }`}
            >
              {plan.popular && (
                <div className="bg-blue-600 text-white text-sm font-semibold px-3 py-1 rounded-full inline-block mb-4">
                  Most Popular
                </div>
              )}
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <p className="text-gray-600 mb-4">{plan.description}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                <span className="text-gray-600 ml-2">/{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={plan.ctaLink}
                className={`block w-full text-center px-6 py-3 rounded-lg font-semibold transition-colors ${
                  plan.popular
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Need a Custom Plan?</h2>
          <p className="text-gray-600 mb-6">
            Contact us for enterprise pricing and custom solutions for teams and organizations.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Contact Sales
          </Link>
        </div>
      </div>
      <HomeFooter />
    </div>
  );
}

