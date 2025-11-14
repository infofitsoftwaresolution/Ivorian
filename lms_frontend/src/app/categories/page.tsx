'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  AcademicCapIcon,
  CodeBracketIcon,
  BriefcaseIcon,
  PaintBrushIcon,
  ChartBarIcon,
  RocketLaunchIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

const categories = [
  {
    name: 'Development',
    icon: CodeBracketIcon,
    description: 'Learn programming, web development, and software engineering',
    count: '1,200+ courses',
    color: 'from-blue-500 to-cyan-500',
    href: '/courses?category=Programming'
  },
  {
    name: 'Business',
    icon: BriefcaseIcon,
    description: 'Master business skills, management, and entrepreneurship',
    count: '800+ courses',
    color: 'from-green-500 to-emerald-500',
    href: '/courses?category=Business'
  },
  {
    name: 'Design',
    icon: PaintBrushIcon,
    description: 'Explore UI/UX design, graphic design, and creative arts',
    count: '600+ courses',
    color: 'from-purple-500 to-pink-500',
    href: '/courses?category=Design'
  },
  {
    name: 'Marketing',
    icon: ChartBarIcon,
    description: 'Learn digital marketing, SEO, and social media strategies',
    count: '500+ courses',
    color: 'from-orange-500 to-red-500',
    href: '/courses?category=Marketing'
  },
  {
    name: 'Data Science',
    icon: AcademicCapIcon,
    description: 'Master data analysis, machine learning, and AI',
    count: '400+ courses',
    color: 'from-indigo-500 to-purple-500',
    href: '/courses?category=Data Science'
  },
  {
    name: 'Personal Development',
    icon: RocketLaunchIcon,
    description: 'Grow personally and professionally with life skills',
    count: '300+ courses',
    color: 'from-yellow-500 to-orange-500',
    href: '/courses?category=Personal Development'
  },
];

export default function CategoriesPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCategories, setFilteredCategories] = useState(categories);

  useEffect(() => {
    if (searchTerm) {
      const filtered = categories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCategories(filtered);
    } else {
      setFilteredCategories(categories);
    }
  }, [searchTerm]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Browse Categories
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Explore our wide range of learning categories and find the perfect course for you
            </p>
          </div>

          {/* Search Bar */}
          <div className="mt-8 max-w-2xl mx-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No categories found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((category) => {
              const Icon = category.icon;
              return (
                <Link
                  key={category.name}
                  href={category.href}
                  className="group relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-primary-300"
                >
                  <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${category.color}`} />
                  <div className="p-6">
                    <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${category.color} mb-4`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {category.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">
                        {category.count}
                      </span>
                      <span className="text-primary-600 font-medium text-sm group-hover:underline">
                        Explore →
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Can't find what you're looking for?
          </h2>
          <p className="text-primary-100 text-lg mb-6">
            Browse all our courses or contact us for personalized recommendations
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/courses"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-primary-600 bg-white hover:bg-gray-50 transition-colors"
            >
              View All Courses
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3 border-2 border-white text-base font-medium rounded-lg text-white hover:bg-white hover:text-primary-600 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

