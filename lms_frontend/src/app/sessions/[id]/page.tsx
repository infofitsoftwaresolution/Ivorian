'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  VideoCameraIcon,
  CalendarIcon,
  ClockIcon,
  UsersIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
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

// Mock data - in production, fetch from API
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
];

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionId = parseInt(params?.id as string);
    const foundSession = allSessions.find(s => s.id === sessionId);
    setSession(foundSession || null);
    setLoading(false);
  }, [params]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HomeHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading session details...</p>
          </div>
        </div>
        <HomeFooter />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HomeHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Session Not Found</h1>
            <p className="text-gray-600 mb-6">The session you're looking for doesn't exist.</p>
            <Link
              href="/sessions"
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              Back to Sessions
            </Link>
          </div>
        </div>
        <HomeFooter />
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const seatPercentage = (session.availableSeats / session.seats) * 100;
  const isLowSeats = session.availableSeats < 5;

  return (
    <div className="min-h-screen bg-gray-50">
      <HomeHeader />

      {/* Back Button */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/sessions"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Sessions
          </Link>
        </div>
      </div>

      {/* Session Details */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Hero Image */}
          <div className="relative h-64 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
            <div className="absolute inset-0 bg-black bg-opacity-20"></div>
            <div className="relative h-full flex items-center justify-center">
              <VideoCameraIcon className="w-24 h-24 text-white opacity-50" />
            </div>
          </div>

          <div className="p-8">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-4">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
                  {session.category}
                </span>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-semibold rounded-full">
                  {session.level}
                </span>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{session.title}</h1>
              {session.description && (
                <p className="text-lg text-gray-600">{session.description}</p>
              )}
            </div>

            {/* Instructor Info */}
            <div className="flex items-center space-x-4 mb-8 pb-8 border-b">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {session.instructor.charAt(0)}
              </div>
              <div>
                <p className="text-sm text-gray-500">Instructor</p>
                <p className="text-lg font-semibold text-gray-900">{session.instructor}</p>
              </div>
            </div>

            {/* Session Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="flex items-start space-x-4">
                <CalendarIcon className="w-6 h-6 text-blue-500 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="text-lg font-semibold text-gray-900">{formatDate(session.date)}</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <ClockIcon className="w-6 h-6 text-purple-500 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Time & Duration</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {session.time} ({session.duration})
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <UsersIcon className="w-6 h-6 text-green-500 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Seats Available</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {session.availableSeats} / {session.seats}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
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
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-6 h-6 mt-1"></div>
                <div>
                  <p className="text-sm text-gray-500">Price</p>
                  <p className="text-3xl font-bold text-gray-900">{session.price}</p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t">
              <button className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 text-lg font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl">
                Join Session
              </button>
              <Link
                href="/sessions"
                className="flex-1 text-center border-2 border-gray-300 text-gray-700 px-8 py-4 text-lg font-semibold rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
              >
                Browse Other Sessions
              </Link>
            </div>
          </div>
        </div>
      </div>

      <HomeFooter />
    </div>
  );
}

