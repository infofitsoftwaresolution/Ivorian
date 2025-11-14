'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
  PlayCircleIcon,
  StarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ClockIcon,
  UsersIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import HomeHeader from '@/components/layout/HomeHeader';
import HomeFooter from '@/components/layout/HomeFooter';
import { apiClient, ApiError } from '@/lib/api/client';

interface Course {
  id: number;
  title: string;
  instructor: string;
  instructorAvatar: string;
  rating: number;
  students: number;
  duration: string;
  price: string;
  originalPrice?: string;
  image: string;
  category: string;
  level: string;
  featured: boolean;
  description?: string;
  lessons?: number;
}

// Categories will be dynamically generated from courses
const baseCategories = ["All"];
const levels = ["All", "Beginner", "Intermediate", "Advanced"];
const sortOptions = [
  { value: "popular", label: "Most Popular" },
  { value: "rating", label: "Highest Rated" },
  { value: "newest", label: "Newest First" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" }
];

export default function CoursesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [sortBy, setSortBy] = useState('popular');
  const [showFilters, setShowFilters] = useState(false);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>(baseCategories);

  // Fetch courses from API
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await apiClient.getCourses({ 
          page: 1, 
          size: 100, // Fetch all courses
          status: 'published' // Only fetch published courses
        });
        
        // Handle different response structures
        let coursesData: any[] = [];
        if (response.data?.courses && Array.isArray(response.data.courses)) {
          coursesData = response.data.courses;
        } else if (Array.isArray(response.data)) {
          coursesData = response.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          coursesData = response.data.data;
        }
        
        // Transform API data to match component format
        const transformedCourses = coursesData
          .filter((course: any) => {
            const courseStatus = course.status?.value || course.status;
            return courseStatus === 'published' || courseStatus === 'Published';
          })
          .map((course: any) => ({
            id: course.id,
            title: course.title,
            instructor: course.instructor_name || course.instructor?.name || 'Instructor',
            instructorAvatar: course.instructor_avatar || '/avatars/default.jpg',
            rating: course.rating || 4.5,
            students: course.enrollment_count || course.students || 0,
            duration: course.duration_weeks ? `${course.duration_weeks} weeks` : course.duration || 'N/A',
            price: course.price ? `$${course.price}` : 'Free',
            originalPrice: course.original_price ? `$${course.original_price}` : undefined,
            image: course.thumbnail_url || course.image || '/courses/default.jpg',
            category: course.category || 'General',
            level: course.difficulty_level || course.level || 'All Levels',
            featured: course.is_featured || false,
            description: course.short_description || course.description || '',
            lessons: course.total_lessons || 0
          }));
        
        setAllCourses(transformedCourses);
        
        // Extract unique categories from courses
        const uniqueCategories = Array.from(new Set(transformedCourses.map(c => c.category)))
          .filter(cat => cat && cat !== 'General')
          .sort();
        setCategories([...baseCategories, ...uniqueCategories]);
      } catch (error) {
        console.error('Error fetching courses:', error);
        setAllCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const filteredAndSortedCourses = useMemo(() => {
    let filtered = allCourses.filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           course.instructor.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           course.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
      const matchesLevel = selectedLevel === 'All' || course.level === selectedLevel;
      
      return matchesSearch && matchesCategory && matchesLevel;
    });

    // Sort courses
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.students - a.students;
        case 'rating':
          return b.rating - a.rating;
        case 'newest':
          return b.id - a.id;
        case 'price-low':
          return parseFloat(a.price.replace('$', '')) - parseFloat(b.price.replace('$', ''));
        case 'price-high':
          return parseFloat(b.price.replace('$', '')) - parseFloat(a.price.replace('$', ''));
        default:
          return 0;
      }
    });

    return filtered;
  }, [searchQuery, selectedCategory, selectedLevel, sortBy]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedLevel('All');
    setSortBy('popular');
  };

  const hasActiveFilters = searchQuery !== '' || selectedCategory !== 'All' || selectedLevel !== 'All' || sortBy !== 'popular';

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <HomeHeader />

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Explore Our Courses
          </h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto opacity-90">
            Discover thousands of courses taught by industry experts. Learn at your own pace and advance your career.
          </p>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="py-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search Bar */}
            <div className="flex-1 w-full relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search courses by title, instructor, or topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="w-full md:w-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full md:w-48 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* Filter Toggle Button (Mobile) */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center space-x-2 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FunnelIcon className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-700">Filters</span>
            </button>
          </div>

          {/* Filters */}
          <div className={`mt-4 ${showFilters ? 'block' : 'hidden'} md:block`}>
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {/* Category Filter */}
              <div className="w-full md:w-auto">
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full md:w-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Level Filter */}
              <div className="w-full md:w-auto">
                <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full md:w-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {levels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-6 md:mt-0 md:ml-auto flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                  <span className="font-medium">Clear Filters</span>
                </button>
              )}
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-gray-600">
            {loading ? 'Loading courses...' : `Showing ${filteredAndSortedCourses.length} of ${allCourses.length} courses`}
          </div>
        </div>
      </section>

      {/* Courses Grid */}
      <section className="py-16 bg-gradient-to-br from-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading courses...</p>
            </div>
          ) : filteredAndSortedCourses.length === 0 ? (
            <div className="text-center py-16">
              <AcademicCapIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses found</h3>
              <p className="text-gray-600 mb-6">Try adjusting your search or filters</p>
              <button
                onClick={clearFilters}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedCourses.map((course) => (
                <div key={course.id} className="group cursor-pointer">
                  <div className="relative overflow-hidden rounded-xl mb-3 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="aspect-video bg-gradient-to-br from-green-100 via-blue-100 to-purple-100 flex items-center justify-center">
                      <PlayCircleIcon className="w-12 h-12 text-green-600 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                    
                    {/* Featured Badge */}
                    {course.featured && (
                      <div className="absolute top-3 left-3">
                        <span className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold rounded-full shadow-lg">
                          Bestseller
                        </span>
                      </div>
                    )}

                    {/* Category Badge */}
                    <div className="absolute top-3 right-3">
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-semibold rounded-full">
                        {course.category}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 flex-1">
                        {course.title}
                      </h3>
                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded whitespace-nowrap">
                        {course.level}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600">{course.instructor}</p>
                    
                    {course.description && (
                      <p className="text-sm text-gray-500 line-clamp-2">{course.description}</p>
                    )}
                    
                    <div className="flex items-center space-x-1 mb-2">
                      <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium">{course.rating}</span>
                      <span className="text-sm text-gray-500">({course.students.toLocaleString()})</span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      {course.lessons && (
                        <div className="flex items-center">
                          <PlayCircleIcon className="w-4 h-4 mr-1 text-blue-500" />
                          {course.lessons} lessons
                        </div>
                      )}
                      <div className="flex items-center">
                        <ClockIcon className="w-4 h-4 mr-1 text-purple-500" />
                        {course.duration}
                      </div>
                      <div className="flex items-center">
                        <UsersIcon className="w-4 h-4 mr-1 text-green-500" />
                        {course.students.toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold text-gray-900">{course.price}</span>
                        {course.originalPrice && (
                          <span className="text-sm text-gray-500 line-through">{course.originalPrice}</span>
                        )}
                      </div>
                      <Link 
                        href={`/courses/${course.id}`}
                        className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-6 py-2 text-sm rounded-full hover:from-green-600 hover:to-blue-700 transition-all duration-300 font-semibold shadow-md hover:shadow-lg"
                      >
                        View Course
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Start Learning?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of students already learning with InfoFit Labs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/register" 
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"
            >
              Get Started Free
            </Link>
            <Link 
              href="/about" 
              className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg font-semibold rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <HomeFooter />
    </div>
  );
}

