'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  AcademicCapIcon, 
  UserGroupIcon, 
  RocketLaunchIcon, 
  SparklesIcon,
  PlayCircleIcon,
  StarIcon,
  ClockIcon,
  UsersIcon,
  CalendarIcon,
  VideoCameraIcon,
  MagnifyingGlassIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import HeroCarousel from '@/components/HeroCarousel';
import HomeHeader from '@/components/layout/HomeHeader';
import HomeFooter from '@/components/layout/HomeFooter';
import { apiClient, ApiError } from '@/lib/api/client';

// Upcoming tutorial sessions data
const upcomingSessions = [
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
    image: "/sessions/react-patterns.jpg"
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
    image: "/sessions/ml-fundamentals.jpg"
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
    image: "/sessions/uiux-workshop.jpg"
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
    image: "/sessions/marketing-masterclass.jpg"
  }
];

// Courses are now fetched from API - see useEffect in HomePage component
// Sessions data is kept as per user requirement

const howItWorks = [
  {
    step: 1,
    title: "Choose Your Course",
    description: "Browse our extensive catalog and find the perfect course for your goals",
    icon: PlayCircleIcon,
    color: "from-blue-500 to-cyan-500"
  },
  {
    step: 2,
    title: "Learn at Your Pace",
    description: "Access video lessons, assignments, and resources anytime, anywhere",
    icon: ClockIcon,
    color: "from-purple-500 to-pink-500"
  },
  {
    step: 3,
    title: "Practice & Apply",
    description: "Complete hands-on projects and get feedback from expert instructors",
    icon: RocketLaunchIcon,
    color: "from-green-500 to-emerald-500"
  },
  {
    step: 4,
    title: "Get Certified",
    description: "Earn certificates to showcase your new skills and advance your career",
    icon: AcademicCapIcon,
    color: "from-orange-500 to-red-500"
  }
];

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredCourses, setFeaturedCourses] = useState<any[]>([]);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [showAllCourses, setShowAllCourses] = useState(false);

  const formatDate = (dateString: string) => {
    // Use a consistent date format to avoid hydration issues
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
  };

  // Fetch courses from API
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoadingCourses(true);
        console.log('🔄 Fetching courses from API...');
        const response = await apiClient.getCourses({ 
          page: 1, 
          size: 20, // Fetch more courses to show all available
          status: 'published' // Only fetch published courses
        });
        
        // Handle different response structures
        let coursesData: any[] = [];
        console.log('📦 Full API Response:', JSON.stringify(response, null, 2));
        console.log('📦 Response data:', response.data);
        console.log('📦 Response data type:', typeof response.data);
        console.log('📦 Is array?', Array.isArray(response.data));
        
        // The backend returns CourseListResponse with structure: { courses: [...], total: ..., page: ..., size: ..., pages: ... }
        if (response.data?.courses && Array.isArray(response.data.courses)) {
          coursesData = response.data.courses;
          console.log('✅ Found courses in response.data.courses:', coursesData.length);
        } else if (Array.isArray(response.data)) {
          coursesData = response.data;
          console.log('✅ Found courses as direct array:', coursesData.length);
        } else if (response.data?.data?.courses && Array.isArray(response.data.data.courses)) {
          coursesData = response.data.data.courses;
          console.log('✅ Found courses in response.data.data.courses:', coursesData.length);
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          coursesData = response.data.data;
          console.log('✅ Found courses in response.data.data:', coursesData.length);
        } else {
          // Try to find courses array in nested structure
          console.warn('⚠️ Unexpected response structure. Full response:', response);
          console.warn('⚠️ Response keys:', response.data ? Object.keys(response.data) : 'No data');
          coursesData = [];
        }
        
        console.log('📚 Extracted courses data:', coursesData);
        console.log('📚 Number of courses:', coursesData.length);
        
        // Transform API data to match component format
        const transformedCourses = coursesData
          .filter((course: any) => {
            // Filter only published courses (status might be enum or string)
            const courseStatus = course.status?.value || course.status;
            const isPublished = courseStatus === 'published' || courseStatus === 'Published';
            if (!isPublished) {
              console.log('⏭️ Skipping non-published course:', course.id, course.title, 'Status:', courseStatus);
            }
            return isPublished;
          })
          .map((course: any) => {
            console.log('🔄 Transforming course:', course.id, course.title);
            return {
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
              featured: true
            };
          });
        
        console.log('✨ Transformed courses:', transformedCourses);
        console.log('✨ Number of transformed courses:', transformedCourses.length);
        
        // Store all courses
        setAllCourses(transformedCourses);
        // Show only first 3 courses initially
        setFeaturedCourses(transformedCourses.slice(0, 3));
        
        if (transformedCourses.length === 0) {
          console.warn('⚠️ No courses found after transformation. Check if courses are published in the database.');
        }
      } catch (error) {
        console.error('❌ Error fetching courses:', error);
        // Handle ApiError properly
        if (error instanceof ApiError) {
          console.error('❌ API Error Details:', {
            message: error.message,
            status: error.status,
            code: error.code,
            details: error.details
          });
        } else if (error instanceof Error) {
          console.error('❌ Error:', error.message);
          console.error('❌ Error stack:', error.stack);
        } else {
          console.error('❌ Unknown error:', error);
        }
        // Fallback to empty array
        setFeaturedCourses([]);
        setAllCourses([]);
      } finally {
        setLoadingCourses(false);
        console.log('✅ Finished fetching courses');
      }
    };

    fetchCourses();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/courses?search=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push('/courses');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <HomeHeader />

      {/* Hero Carousel Section */}
      <HeroCarousel />

      {/* Search Bar Section */}
      <section className="py-8 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <form onSubmit={handleSearch} className="relative">
            <MagnifyingGlassIcon className="absolute left-6 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
            <input
              type="text"
              placeholder="What do you want to learn?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-32 py-4 text-lg border-2 border-blue-200 rounded-full focus:border-blue-500 focus:outline-none shadow-lg bg-white"
            />
            <button 
              type="submit"
              className="absolute right-2 top-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-2 rounded-full hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-md hover:shadow-lg"
            >
              Search
            </button>
          </form>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <span className="text-sm text-gray-600">Popular:</span>
            {['React', 'Python', 'Design', 'Marketing'].map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  setSearchQuery(tag);
                  router.push(`/courses?search=${encodeURIComponent(tag)}`);
                }}
                className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-full hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Tutorial Sessions Section - Commented out for future use */}
      {false && (
      <section className="py-16 bg-gradient-to-br from-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              🎯 Upcoming Live Sessions
            </h2>
            <p className="text-lg text-gray-600">
              Join live tutorial sessions with expert instructors. Limited seats available!
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {upcomingSessions.map((session) => (
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
                    <span className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold rounded-full shadow-lg">
                      {session.availableSeats} seats left
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {session.title}
                  </h3>
                  
                  <p className="text-sm text-gray-600">{session.instructor}</p>
                  
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
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-gray-900">{session.price}</span>
                    </div>
                    <Link 
                      href={`/sessions/${session.id}`}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 text-sm rounded-full hover:from-blue-600 hover:to-purple-700 transition-all duration-300 font-semibold shadow-md hover:shadow-lg inline-flex items-center"
                    >
                      Join Session <ArrowRightIcon className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link 
              href="/sessions" 
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 text-lg font-semibold rounded-full hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              View All Sessions
            </Link>
          </div>
        </div>
      </section>
      )}

      {/* Featured Courses Section - Bright & Jolly */}
      <section className="py-16 bg-gradient-to-br from-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              🚀 Popular Courses
            </h2>
            <p className="text-lg text-gray-600">
              Expand your knowledge with our most popular courses
            </p>
          </div>
          
          {loadingCourses ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading courses...</p>
              </div>
            </div>
          ) : featuredCourses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No courses available at the moment.</p>
              <Link 
                href="/courses" 
                className="mt-4 inline-block bg-gradient-to-r from-green-500 to-blue-600 text-white px-8 py-3 text-lg font-semibold rounded-full hover:from-green-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Browse All Courses
              </Link>
            </div>
          ) : (
          <>
          <div className={`grid grid-cols-1 md:grid-cols-2 ${showAllCourses ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6`}>
            {(showAllCourses ? allCourses : featuredCourses).map((course) => (
              <Link key={course.id} href={`/courses/${course.id}`} className="group block">
                <div className="relative overflow-hidden rounded-xl mb-3 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="aspect-video bg-gradient-to-br from-green-100 via-blue-100 to-purple-100 flex items-center justify-center">
                    <PlayCircleIcon className="w-12 h-12 text-green-600 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                  <div className="absolute top-3 right-3">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-semibold rounded-full">
                      {course.category}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {course.title}
                  </h3>
                  
                  <p className="text-sm text-gray-600">{course.instructor}</p>
                  
                  <div className="flex items-center space-x-1 mb-2">
                    <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium">{course.rating}</span>
                    <span className="text-sm text-gray-500">({course.students.toLocaleString()})</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-gray-900">{course.price}</span>
                      <span className="text-sm text-gray-500 line-through">{course.originalPrice}</span>
                    </div>
                    <span className="text-xs bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-2 py-1 rounded-full font-bold shadow-sm">
                      Bestseller
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          
          {/* Show All Courses Button */}
          {!showAllCourses && allCourses.length > 3 && (
            <div className="text-center mt-8">
              <button
                onClick={() => setShowAllCourses(true)}
                className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-8 py-3 text-lg font-semibold rounded-full hover:from-green-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                See All Courses ({allCourses.length})
              </button>
            </div>
          )}
          
          {/* Show Less Button */}
          {showAllCourses && allCourses.length > 3 && (
            <div className="text-center mt-8">
              <button
                onClick={() => setShowAllCourses(false)}
                className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-8 py-3 text-lg font-semibold rounded-full hover:from-gray-600 hover:to-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Show Less
              </button>
            </div>
          )}
          
          {/* View All Courses Link */}
          <div className="text-center mt-8">
            <Link 
              href="/courses" 
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 text-lg font-semibold rounded-full hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl inline-block"
            >
              Browse All Courses
            </Link>
          </div>
          </>
          )}
        </div>
      </section>

      {/* Categories Section - Bright & Jolly */}
      <section className="py-16 bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              🎨 Top Categories
            </h2>
            <p className="text-lg text-gray-600">
              Explore our most popular learning categories
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { name: 'Development', icon: '💻', count: '1,200+ courses', color: 'from-blue-500 to-cyan-500', href: '/courses?category=Programming' },
              { name: 'Business', icon: '📊', count: '800+ courses', color: 'from-green-500 to-emerald-500', href: '/courses' },
              { name: 'Design', icon: '🎨', count: '600+ courses', color: 'from-purple-500 to-pink-500', href: '/courses?category=Design' },
              { name: 'Marketing', icon: '📈', count: '500+ courses', color: 'from-orange-500 to-red-500', href: '/courses?category=Marketing' },
              { name: 'Data Science', icon: '📊', count: '400+ courses', color: 'from-indigo-500 to-purple-500', href: '/courses?category=Data Science' },
              { name: 'Personal Development', icon: '🚀', count: '300+ courses', color: 'from-yellow-500 to-orange-500', href: '/courses' },
            ].map((category, index) => (
              <Link 
                key={index} 
                href={category.href}
                className="group p-6 bg-white rounded-xl hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-gray-100"
              >
                <div className={`text-4xl mb-4 p-3 bg-gradient-to-r ${category.color} rounded-lg w-fit mx-auto`}>
                  {category.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors text-center">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-600 text-center">{category.count}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-gradient-to-br from-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              🎓 How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Start your learning journey in just a few simple steps
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((item, index) => (
              <div key={index} className="relative">
                <div className="text-center p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                  <div className={`w-20 h-20 bg-gradient-to-r ${item.color} rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                    <item.icon className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -top-4 -right-4 w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.description}</p>
                </div>
                {index < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRightIcon className="w-8 h-8 text-gray-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - Bright & Jolly */}
      <section className="py-16 bg-gradient-to-br from-white to-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              ✨ Why Choose Edumentry?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Join millions of learners worldwide and transform your career with our platform
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <SparklesIcon className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">AI-Powered Learning</h3>
              <p className="text-gray-600 leading-relaxed">
                Get personalized learning paths and intelligent content recommendations tailored to your goals
              </p>
            </div>
            
            <div className="text-center p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <AcademicCapIcon className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Expert Instructors</h3>
              <p className="text-gray-600 leading-relaxed">
                Learn from industry leaders and certified professionals who are experts in their fields
              </p>
            </div>
            
            <div className="text-center p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <UserGroupIcon className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Interactive Community</h3>
              <p className="text-gray-600 leading-relaxed">
                Connect with peers, participate in discussions, and collaborate on real-world projects
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Bright & Jolly */}
      <section className="py-16 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            🎉 Ready to start learning?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join millions of learners worldwide and transform your career today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/register" 
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"
            >
              Get Started Free
            </Link>
            <Link 
              href="/courses" 
              className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg font-semibold rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"
            >
              Browse Courses
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <HomeFooter />
    </div>
  );
}
