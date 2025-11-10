'use client';

import { useState, useMemo } from 'react';
import { 
  VideoCameraIcon,
  CalendarIcon,
  ClockIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import HomeHeader from '@/components/layout/HomeHeader';
import HomeFooter from '@/components/layout/HomeFooter';

interface Session {
  id: number;
  title: string;
  instructor: string;
  instructorAvatar: string;
  date: string;
  time: string;
  duration: string;
  price: string;
  seats: number;
  availableSeats: number;
  category: string;
  level: string;
  image: string;
  description?: string;
}

const allSessions: Session[] = [
  {
    id: 1,
    title: "Advanced React Patterns",
    instructor: "Dr. Sarah Johnson",
    instructorAvatar: "/avatars/sarah.jpg",
    date: "2024-01-15",
    time: "14:00",
    duration: "2 hours",
    price: "$49",
    seats: 25,
    availableSeats: 8,
    category: "Programming",
    level: "Advanced",
    image: "/sessions/react-patterns.jpg",
    description: "Learn advanced React patterns including hooks, context API, and performance optimization techniques."
  },
  {
    id: 2,
    title: "Machine Learning Fundamentals",
    instructor: "Prof. Michael Chen",
    instructorAvatar: "/avatars/michael.jpg",
    date: "2024-01-18",
    time: "10:00",
    duration: "3 hours",
    price: "$79",
    seats: 30,
    availableSeats: 15,
    category: "Data Science",
    level: "Intermediate",
    image: "/sessions/ml-fundamentals.jpg",
    description: "Introduction to machine learning concepts, algorithms, and practical applications."
  },
  {
    id: 3,
    title: "UI/UX Design Workshop",
    instructor: "Alex Thompson",
    instructorAvatar: "/avatars/alex.jpg",
    date: "2024-01-20",
    time: "16:00",
    duration: "2.5 hours",
    price: "$59",
    seats: 20,
    availableSeats: 5,
    category: "Design",
    level: "Beginner",
    image: "/sessions/uiux-workshop.jpg",
    description: "Master the fundamentals of user interface and user experience design."
  },
  {
    id: 4,
    title: "Digital Marketing Masterclass",
    instructor: "Emma Rodriguez",
    instructorAvatar: "/avatars/emma.jpg",
    date: "2024-01-22",
    time: "13:00",
    duration: "2 hours",
    price: "$69",
    seats: 35,
    availableSeats: 12,
    category: "Marketing",
    level: "All Levels",
    image: "/sessions/marketing-masterclass.jpg",
    description: "Comprehensive guide to digital marketing strategies and tools."
  },
  {
    id: 5,
    title: "Python for Data Analysis",
    instructor: "Prof. Michael Chen",
    instructorAvatar: "/avatars/michael.jpg",
    date: "2024-01-25",
    time: "11:00",
    duration: "2.5 hours",
    price: "$65",
    seats: 28,
    availableSeats: 18,
    category: "Data Science",
    level: "Beginner",
    image: "/sessions/python-data.jpg",
    description: "Learn how to use Python and pandas for data analysis and visualization."
  },
  {
    id: 6,
    title: "Full-Stack Development Bootcamp",
    instructor: "Dr. Sarah Johnson",
    instructorAvatar: "/avatars/sarah.jpg",
    date: "2024-01-28",
    time: "09:00",
    duration: "4 hours",
    price: "$99",
    seats: 40,
    availableSeats: 22,
    category: "Programming",
    level: "Intermediate",
    image: "/sessions/fullstack.jpg",
    description: "Build complete web applications using modern full-stack technologies."
  },
  {
    id: 7,
    title: "Figma Design System Workshop",
    instructor: "Alex Thompson",
    instructorAvatar: "/avatars/alex.jpg",
    date: "2024-02-01",
    time: "14:00",
    duration: "2 hours",
    price: "$55",
    seats: 24,
    availableSeats: 10,
    category: "Design",
    level: "Intermediate",
    image: "/sessions/figma.jpg",
    description: "Create and maintain design systems using Figma."
  },
  {
    id: 8,
    title: "Social Media Marketing Strategies",
    instructor: "Emma Rodriguez",
    instructorAvatar: "/avatars/emma.jpg",
    date: "2024-02-05",
    time: "15:00",
    duration: "2 hours",
    price: "$59",
    seats: 32,
    availableSeats: 20,
    category: "Marketing",
    level: "All Levels",
    image: "/sessions/social-media.jpg",
    description: "Learn effective social media marketing strategies to grow your brand."
  }
];

const categories = ["All", "Programming", "Data Science", "Design", "Marketing"];
const levels = ["All", "Beginner", "Intermediate", "Advanced", "All Levels"];

export default function SessionsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
  };

  const filteredSessions = useMemo(() => {
    return allSessions.filter(session => {
      const matchesSearch = session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           session.instructor.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           session.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || session.category === selectedCategory;
      const matchesLevel = selectedLevel === 'All' || session.level === selectedLevel;
      
      return matchesSearch && matchesCategory && matchesLevel;
    });
  }, [searchQuery, selectedCategory, selectedLevel]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedLevel('All');
  };

  const hasActiveFilters = searchQuery !== '' || selectedCategory !== 'All' || selectedLevel !== 'All';

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <HomeHeader />

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Live Tutorial Sessions
          </h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto opacity-90">
            Join interactive live sessions with expert instructors. Learn, ask questions, and grow your skills in real-time.
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
                placeholder="Search sessions by title, instructor, or topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
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
            Showing {filteredSessions.length} of {allSessions.length} sessions
          </div>
        </div>
      </section>

      {/* Sessions Grid */}
      <section className="py-16 bg-gradient-to-br from-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-16">
              <VideoCameraIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No sessions found</h3>
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
              {filteredSessions.map((session) => {
                const seatPercentage = (session.availableSeats / session.seats) * 100;
                const isLowSeats = seatPercentage < 30;
                
                return (
                  <div key={session.id} className="group cursor-pointer">
                    <div className="relative overflow-hidden rounded-xl mb-4 shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="aspect-video bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center">
                        <VideoCameraIcon className="w-12 h-12 text-blue-600 group-hover:text-purple-600 transition-colors" />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                      
                      {/* Live Badge */}
                      <div className="absolute top-3 left-3">
                        <span className="px-3 py-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full flex items-center shadow-lg">
                          <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
                          LIVE
                        </span>
                      </div>
                      
                      {/* Seats Available */}
                      <div className="absolute top-3 right-3">
                        <span className={`px-3 py-1 text-white text-xs font-bold rounded-full shadow-lg ${
                          isLowSeats 
                            ? 'bg-gradient-to-r from-red-500 to-orange-500' 
                            : 'bg-gradient-to-r from-yellow-400 to-orange-400'
                        }`}>
                          {session.availableSeats} seats left
                        </span>
                      </div>

                      {/* Category Badge */}
                      <div className="absolute bottom-3 left-3">
                        <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-semibold rounded-full">
                          {session.category}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 flex-1">
                          {session.title}
                        </h3>
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded whitespace-nowrap">
                          {session.level}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600">{session.instructor}</p>
                      
                      {session.description && (
                        <p className="text-sm text-gray-500 line-clamp-2">{session.description}</p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <CalendarIcon className="w-4 h-4 mr-1 text-blue-500" />
                          {formatDate(session.date)}
                        </div>
                        <div className="flex items-center">
                          <ClockIcon className="w-4 h-4 mr-1 text-purple-500" />
                          {session.time} ({session.duration})
                        </div>
                      </div>

                      {/* Seats Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Seats Available</span>
                          <span>{session.availableSeats} / {session.seats}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              isLowSeats 
                                ? 'bg-gradient-to-r from-red-500 to-orange-500' 
                                : seatPercentage < 50
                                ? 'bg-gradient-to-r from-yellow-400 to-orange-400'
                                : 'bg-gradient-to-r from-green-400 to-emerald-500'
                            }`}
                            style={{ width: `${seatPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl font-bold text-gray-900">{session.price}</span>
                        </div>
                        <Link 
                          href={`/sessions/${session.id}`}
                          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 text-sm rounded-full hover:from-blue-600 hover:to-purple-700 transition-all duration-300 font-semibold shadow-md hover:shadow-lg"
                        >
                          Join Session
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Want to Teach a Session?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Share your expertise with our community of learners
          </p>
          <Link 
            href="/teach"
            className="inline-block bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"
          >
            Become an Instructor
          </Link>
        </div>
      </section>

      {/* Footer */}
      <HomeFooter />
    </div>
  );
}

