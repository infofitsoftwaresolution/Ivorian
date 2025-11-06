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
  VideoCameraIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import HeroCarousel from '@/components/HeroCarousel';
import HomeHeader from '@/components/layout/HomeHeader';
import HomeFooter from '@/components/layout/HomeFooter';

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

// Mock data for demonstration
const featuredCourses = [
  {
    id: 1,
    title: "Complete Web Development Bootcamp",
    instructor: "Dr. Sarah Johnson",
    instructorAvatar: "/avatars/sarah.jpg",
    rating: 4.8,
    students: 12450,
    duration: "12 weeks",
    price: "$299",
    originalPrice: "$399",
    image: "/courses/web-dev.jpg",
    category: "Programming",
    level: "Beginner",
    featured: true
  },
  {
    id: 2,
    title: "Advanced Machine Learning with Python",
    instructor: "Prof. Michael Chen",
    instructorAvatar: "/avatars/michael.jpg",
    rating: 4.9,
    students: 8920,
    duration: "16 weeks",
    price: "$399",
    originalPrice: "$499",
    image: "/courses/ml.jpg",
    category: "Data Science",
    level: "Advanced",
    featured: true
  },
  {
    id: 3,
    title: "Digital Marketing Masterclass",
    instructor: "Emma Rodriguez",
    instructorAvatar: "/avatars/emma.jpg",
    rating: 4.7,
    students: 15680,
    duration: "8 weeks",
    price: "$199",
    originalPrice: "$249",
    image: "/courses/marketing.jpg",
    category: "Marketing",
    level: "Intermediate",
    featured: true
  },
  {
    id: 4,
    title: "UI/UX Design Fundamentals",
    instructor: "Alex Thompson",
    instructorAvatar: "/avatars/alex.jpg",
    rating: 4.6,
    students: 10230,
    duration: "10 weeks",
    price: "$249",
    originalPrice: "$299",
    image: "/courses/design.jpg",
    category: "Design",
    level: "Beginner",
    featured: true
  }
];

const famousTutors = [
  {
    id: 1,
    name: "Dr. Sarah Johnson",
    title: "Senior Software Engineer at Google",
    avatar: "/avatars/sarah.jpg",
    rating: 4.9,
    students: 45000,
    courses: 12,
    expertise: ["Web Development", "React", "Node.js"],
    featured: true
  },
  {
    id: 2,
    name: "Prof. Michael Chen",
    title: "AI Research Lead at Stanford",
    avatar: "/avatars/michael.jpg",
    rating: 4.8,
    students: 32000,
    courses: 8,
    expertise: ["Machine Learning", "Python", "Deep Learning"],
    featured: true
  },
  {
    id: 3,
    name: "Emma Rodriguez",
    title: "Digital Marketing Director",
    avatar: "/avatars/emma.jpg",
    rating: 4.7,
    students: 28000,
    courses: 15,
    expertise: ["Digital Marketing", "SEO", "Social Media"],
    featured: true
  },
  {
    id: 4,
    name: "Alex Thompson",
    title: "Senior UX Designer at Apple",
    avatar: "/avatars/alex.jpg",
    rating: 4.6,
    students: 22000,
    courses: 10,
    expertise: ["UI/UX Design", "Figma", "Prototyping"],
    featured: true
  }
];

const stats = [
  { label: "Active Students", value: "50K+", icon: UsersIcon },
  { label: "Expert Instructors", value: "200+", icon: AcademicCapIcon },
  { label: "Courses Available", value: "1000+", icon: PlayCircleIcon },
  { label: "Success Rate", value: "95%", icon: StarIcon }
];

export default function HomePage() {
  const formatDate = (dateString: string) => {
    // Use a consistent date format to avoid hydration issues
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
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
          <div className="relative">
            <input
              type="text"
              placeholder="What do you want to learn?"
              className="w-full px-6 py-4 text-lg border-2 border-blue-200 rounded-full focus:border-blue-500 focus:outline-none shadow-lg bg-white"
            />
            <button className="absolute right-2 top-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-2 rounded-full hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-md">
              Search
            </button>
          </div>
        </div>
      </section>

      {/* Upcoming Tutorial Sessions Section */}
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
                      className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 text-sm rounded-full hover:from-blue-600 hover:to-purple-700 transition-all duration-300 font-semibold shadow-md"
                    >
                      Join Session
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

      {/* Stats Section - Bright & Jolly */}
      <section className="py-16 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600 text-sm md:text-base font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredCourses.map((course) => (
              <div key={course.id} className="group cursor-pointer">
                <div className="relative overflow-hidden rounded-xl mb-3 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="aspect-video bg-gradient-to-br from-green-100 via-blue-100 to-purple-100 flex items-center justify-center">
                    <PlayCircleIcon className="w-12 h-12 text-green-600 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
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
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link 
              href="/courses" 
              className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-8 py-3 text-lg font-semibold rounded-full hover:from-green-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              View All Courses
            </Link>
          </div>
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
              { name: 'Development', icon: '💻', count: '1,200+ courses', color: 'from-blue-500 to-cyan-500' },
              { name: 'Business', icon: '📊', count: '800+ courses', color: 'from-green-500 to-emerald-500' },
              { name: 'Design', icon: '🎨', count: '600+ courses', color: 'from-purple-500 to-pink-500' },
              { name: 'Marketing', icon: '📈', count: '500+ courses', color: 'from-orange-500 to-red-500' },
              { name: 'Data Science', icon: '📊', count: '400+ courses', color: 'from-indigo-500 to-purple-500' },
              { name: 'Personal Development', icon: '🚀', count: '300+ courses', color: 'from-yellow-500 to-orange-500' },
            ].map((category, index) => (
              <div key={index} className="group cursor-pointer p-6 bg-white rounded-xl hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-gray-100">
                <div className={`text-4xl mb-4 p-3 bg-gradient-to-r ${category.color} rounded-lg w-fit mx-auto`}>
                  {category.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors text-center">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-600 text-center">{category.count}</p>
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
              ✨ Why Choose InfoFit LMS?
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
