/**
 * Student Notifications Page
 * View and manage all notifications for the student
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api/client';
import { 
  BellIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  BookOpenIcon,
  DocumentTextIcon,
  ClockIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  EnvelopeIcon,
  AcademicCapIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Breadcrumb from '@/components/ui/Breadcrumb';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'announcement' | 'assignment' | 'grade' | 'course' | 'system' | 'message';
  is_read: boolean;
  created_at: string;
  course_id?: number;
  course_title?: string;
  assignment_id?: number;
  assignment_title?: string;
  link?: string;
  priority?: 'low' | 'medium' | 'high';
  action_required?: boolean;
}

type FilterType = 'all' | 'announcement' | 'assignment' | 'grade' | 'course' | 'system' | 'message';
type FilterStatus = 'all' | 'unread' | 'read';

export default function StudentNotificationsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  // Check authentication
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (!authLoading && user && user.role !== 'student') {
      router.push('/dashboard');
    }
  }, [user, router, authLoading]);

  useEffect(() => {
    if (!authLoading && user?.role === 'student') {
      loadNotifications();
    }
  }, [user, authLoading]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError('');

      // TODO: Replace with actual API endpoint when available
      // For now, generate mock notifications based on enrolled courses and assignments
      const mockNotifications: Notification[] = [];

      // Fetch enrolled courses to create relevant notifications
      try {
        const enrollmentsResponse = await apiClient.getMyEnrollments();
        let enrollments: any[] = [];
        if (Array.isArray(enrollmentsResponse.data)) {
          enrollments = enrollmentsResponse.data;
        } else if (enrollmentsResponse.data?.enrollments && Array.isArray(enrollmentsResponse.data.enrollments)) {
          enrollments = enrollmentsResponse.data.enrollments;
        }

        // Fetch assignments to create assignment-related notifications
        try {
          const assessmentsResponse = await apiClient.getAssessments({ status: 'published' });
          let assessments: any[] = [];
          if (Array.isArray(assessmentsResponse.data)) {
            assessments = assessmentsResponse.data;
          } else if (assessmentsResponse.data?.assessments && Array.isArray(assessmentsResponse.data.assessments)) {
            assessments = assessmentsResponse.data.assessments;
          }

          const enrolledCourseIds = enrollments.map((e: any) => e.course_id || e.course?.id).filter(Boolean);
          const courseAssessments = assessments.filter((a: any) => 
            a.course_id && enrolledCourseIds.includes(a.course_id)
          );

          // Generate mock notifications
          enrollments.slice(0, 3).forEach((enrollment: any, index: number) => {
            const course = enrollment.course || {};
            const daysAgo = index * 2;

            // Course announcement
            mockNotifications.push({
              id: index * 3 + 1,
              title: `New announcement in ${course.title || 'Course'}`,
              message: 'Your instructor has posted a new announcement. Check it out!',
              type: 'announcement',
              is_read: index === 0 ? false : true,
              created_at: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
              course_id: course.id,
              course_title: course.title,
              link: `/student/courses/${course.id}`,
              priority: 'medium',
              action_required: false
            });
          });

          courseAssessments.slice(0, 2).forEach((assessment: any, index: number) => {
            const daysAgo = index * 3 + 1;
            const dueDate = assessment.due_date ? new Date(assessment.due_date) : null;
            const now = new Date();
            const isOverdue = dueDate && dueDate < now;

            // Assignment due soon/overdue
            if (dueDate) {
              mockNotifications.push({
                id: 10 + index * 2,
                title: `${isOverdue ? 'Overdue' : 'Due Soon'}: ${assessment.title}`,
                message: isOverdue
                  ? `This assignment was due on ${dueDate.toLocaleDateString()}. Please submit it as soon as possible.`
                  : `This assignment is due on ${dueDate.toLocaleDateString()}. Don't forget to submit it!`,
                type: 'assignment',
                is_read: false,
                created_at: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
                course_id: assessment.course_id,
                course_title: assessment.course_title,
                assignment_id: assessment.id,
                assignment_title: assessment.title,
                link: `/student/assignments/${assessment.id}/submit`,
                priority: isOverdue ? 'high' : 'medium',
                action_required: true
              });
            }
          });

          // Grade notification
          mockNotifications.push({
            id: 20,
            title: 'New grade received',
            message: 'Your assignment "Introduction to Python" has been graded. Check your results!',
            type: 'grade',
            is_read: false,
            created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            course_id: enrollments[0]?.course_id || enrollments[0]?.course?.id,
            course_title: enrollments[0]?.course?.title,
            link: '/student/assignments',
            priority: 'medium',
            action_required: false
          });

          // System notification
          mockNotifications.push({
            id: 21,
            title: 'Welcome to InfoFit Labs LMS!',
            message: 'Thank you for joining our learning platform. Start exploring courses and begin your learning journey!',
            type: 'system',
            is_read: true,
            created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            link: '/student/catalog',
            priority: 'low',
            action_required: false
          });

        } catch (assessmentsError) {
          // Silently handle 404 for assessments
          console.log('Assessments endpoint not available');
        }
      } catch (enrollmentsError) {
        // Silently handle 404 for enrollments
        console.log('Enrollments endpoint not available');
      }

      // Sort by created_at (newest first)
      mockNotifications.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setNotifications(mockNotifications);
    } catch (error: unknown) {
      console.error('Error loading notifications:', error);
      setError('Failed to load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      // TODO: Replace with actual API call when available
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // TODO: Replace with actual API call when available
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      // TODO: Replace with actual API call when available
      setNotifications(notifications.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read when clicked
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    // Navigate to the link if available
    if (notification.link) {
      router.push(notification.link);
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        notification.title.toLowerCase().includes(searchLower) ||
        notification.message.toLowerCase().includes(searchLower) ||
        notification.course_title?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Type filter
    if (filterType !== 'all' && notification.type !== filterType) {
      return false;
    }

    // Status filter
    if (filterStatus === 'unread' && notification.is_read) {
      return false;
    }
    if (filterStatus === 'read' && !notification.is_read) {
      return false;
    }

    return true;
  });

  // Get notification icon
  const getNotificationIcon = (type: Notification['type']) => {
    const iconClass = 'h-5 w-5';
    switch (type) {
      case 'announcement':
        return <BellIcon className={`${iconClass} text-blue-500`} />;
      case 'assignment':
        return <DocumentTextIcon className={`${iconClass} text-purple-500`} />;
      case 'grade':
        return <CheckCircleIcon className={`${iconClass} text-green-500`} />;
      case 'course':
        return <BookOpenIcon className={`${iconClass} text-indigo-500`} />;
      case 'system':
        return <InformationCircleIcon className={`${iconClass} text-gray-500`} />;
      case 'message':
        return <EnvelopeIcon className={`${iconClass} text-yellow-500`} />;
      default:
        return <BellIcon className={`${iconClass} text-gray-500`} />;
    }
  };

  // Get notification badge color
  const getNotificationBadgeColor = (type: Notification['type'], priority?: Notification['priority']) => {
    if (priority === 'high') return 'bg-red-100 text-red-800';
    if (priority === 'medium') return 'bg-yellow-100 text-yellow-800';
    
    switch (type) {
      case 'announcement':
        return 'bg-blue-100 text-blue-800';
      case 'assignment':
        return 'bg-purple-100 text-purple-800';
      case 'grade':
        return 'bg-green-100 text-green-800';
      case 'course':
        return 'bg-indigo-100 text-indigo-800';
      case 'system':
        return 'bg-gray-100 text-gray-800';
      case 'message':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  // Show loading while checking authentication or loading data
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">
            {authLoading ? 'Loading authentication...' : 'Loading notifications...'}
          </p>
        </div>
      </div>
    );
  }

  // Don't render if not student
  if (!user || user.role !== 'student') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Calculate stats
  const unreadCount = notifications.filter(n => !n.is_read).length;
  const stats = {
    total: notifications.length,
    unread: unreadCount,
    announcements: notifications.filter(n => n.type === 'announcement').length,
    assignments: notifications.filter(n => n.type === 'assignment').length,
    grades: notifications.filter(n => n.type === 'grade').length
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">Stay updated with your courses and assignments</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <CheckIcon className="h-4 w-4 mr-2" />
            Mark all as read
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BellIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total</dt>
                  <dd className="text-lg font-semibold text-gray-900">{stats.total}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{stats.unread}</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Unread</dt>
                  <dd className="text-lg font-semibold text-gray-900">{stats.unread}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BellIcon className="h-6 w-6 text-blue-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Announcements</dt>
                  <dd className="text-lg font-semibold text-gray-900">{stats.announcements}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-6 w-6 text-purple-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Assignments</dt>
                  <dd className="text-lg font-semibold text-gray-900">{stats.assignments}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Grades</dt>
                  <dd className="text-lg font-semibold text-gray-900">{stats.grades}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as FilterType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Types</option>
              <option value="announcement">Announcements</option>
              <option value="assignment">Assignments</option>
              <option value="grade">Grades</option>
              <option value="course">Courses</option>
              <option value="system">System</option>
              <option value="message">Messages</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'You\'re all caught up! No new notifications.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-6 hover:bg-gray-50 transition-colors ${
                  !notification.is_read ? 'bg-indigo-50' : ''
                }`}
              >
                <div className="flex items-start">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div 
                    className="ml-4 flex-1 cursor-pointer"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className={`text-base font-medium ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </h3>
                          {!notification.is_read && (
                            <span className="h-2 w-2 rounded-full bg-indigo-600"></span>
                          )}
                          {notification.action_required && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                              Action Required
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                        <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                            {notification.type}
                          </span>
                          {notification.course_title && (
                            <div className="flex items-center">
                              <BookOpenIcon className="h-3 w-3 mr-1" />
                              {notification.course_title}
                            </div>
                          )}
                          <div className="flex items-center">
                            <ClockIcon className="h-3 w-3 mr-1" />
                            {formatRelativeTime(notification.created_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="ml-4 flex items-center space-x-2">
                    {!notification.is_read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                        title="Mark as read"
                      >
                        <CheckIcon className="h-5 w-5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      className="text-gray-400 hover:text-red-600"
                      title="Delete"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

