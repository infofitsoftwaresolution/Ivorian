/**
 * Sidebar Navigation
 * Role-based navigation menu for different user types
 */

'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { 
  XMarkIcon,
  HomeIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  AcademicCapIcon,
  BookOpenIcon,
  ChartBarIcon,
  CogIcon,
  UserIcon,
  PlusIcon,
  UsersIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  BellIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

interface SidebarProps {
  user: any;
  isOpen: boolean;
  isCollapsed?: boolean;
  onClose: () => void;
  onToggleCollapse?: () => void;
}

interface MenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  current: boolean;
}

export default function Sidebar({ user, isOpen, isCollapsed = false, onClose, onToggleCollapse }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // Get navigation items based on user role
  const getNavigationItems = (): MenuItem[] => {
  // Get role-specific dashboard href
  const getDashboardHref = () => {
    switch (user?.role) {
      case 'super_admin':
        return '/admin/platform';
      case 'organization_admin':
        return '/admin/organization';
      case 'tutor':
        return '/tutor/dashboard';
      case 'student':
        return '/student/dashboard';
      default:
        return '/dashboard';
    }
  };

  const baseItems = [
    {
      name: 'Dashboard',
      href: getDashboardHref(),
      icon: HomeIcon,
      current: pathname === getDashboardHref()
    }
  ];

    // Super Admin Navigation
    if (user?.role === 'super_admin') {
      return [
        ...baseItems,
        {
          name: 'Platform Overview',
          href: '/admin/platform',
          icon: ChartBarIcon,
          current: pathname.startsWith('/admin/platform')
        },
        {
          name: 'Organizations',
          href: '/admin/organizations',
          icon: BuildingOfficeIcon,
          current: pathname.startsWith('/admin/organizations')
        },
        {
          name: 'All Users',
          href: '/admin/users',
          icon: UsersIcon,
          current: pathname.startsWith('/admin/users')
        },
        {
          name: 'Students',
          href: '/admin/students',
          icon: UserGroupIcon,
          current: pathname.startsWith('/admin/students')
        },
        {
          name: 'Courses',
          href: '/admin/courses',
          icon: BookOpenIcon,
          current: pathname.startsWith('/admin/courses')
        },
        {
          name: 'System Analytics',
          href: '/admin/analytics',
          icon: ChartBarIcon,
          current: pathname.startsWith('/admin/analytics')
        },
        {
          name: 'System Settings',
          href: '/admin/settings',
          icon: CogIcon,
          current: pathname.startsWith('/admin/settings')
        }
      ];
    }

    // Organization Admin Navigation
    if (user?.role === 'organization_admin') {
      return [
        ...baseItems,
        {
          name: 'Organization Dashboard',
          href: '/admin/organization',
          icon: BuildingOfficeIcon,
          current: pathname.startsWith('/admin/organization')
        },
        {
          name: 'Tutors',
          href: '/admin/tutors',
          icon: AcademicCapIcon,
          current: pathname.startsWith('/admin/tutors')
        },
        {
          name: 'Students',
          href: '/admin/students',
          icon: UserGroupIcon,
          current: pathname.startsWith('/admin/students')
        },
        {
          name: 'Courses',
          href: '/admin/courses',
          icon: BookOpenIcon,
          current: pathname.startsWith('/admin/courses')
        },
        {
          name: 'Analytics',
          href: '/admin/analytics',
          icon: ChartBarIcon,
          current: pathname.startsWith('/admin/analytics')
        },
        {
          name: 'Organization Settings',
          href: '/admin/settings',
          icon: CogIcon,
          current: pathname.startsWith('/admin/settings')
        }
      ];
    }

    // Tutor/Instructor Navigation
    if (user?.role === 'tutor') {
      return [
        ...baseItems,
        {
          name: 'My Courses',
          href: '/tutor/courses',
          icon: BookOpenIcon,
          current: pathname.startsWith('/tutor/courses')
        },
        {
          name: 'Create Course',
          href: '/tutor/courses/create',
          icon: PlusIcon,
          current: pathname === '/tutor/courses/create'
        },
        {
          name: 'My Students',
          href: '/tutor/students',
          icon: UserGroupIcon,
          current: pathname.startsWith('/tutor/students')
        },
        {
          name: 'Assessments',
          href: '/tutor/assessments',
          icon: ClipboardDocumentListIcon,
          current: pathname.startsWith('/tutor/assessments')
        },
        {
          name: 'Analytics',
          href: '/tutor/analytics',
          icon: ChartBarIcon,
          current: pathname.startsWith('/tutor/analytics')
        }
      ];
    }

    // Student Navigation
    if (user?.role === 'student') {
      return [
        ...baseItems,
        {
          name: 'My Courses',
          href: '/student/courses',
          icon: BookOpenIcon,
          current: pathname.startsWith('/student/courses')
        },
        {
          name: 'Course Catalog',
          href: '/student/catalog',
          icon: DocumentTextIcon,
          current: pathname.startsWith('/student/catalog')
        },
        {
          name: 'My Progress',
          href: '/student/progress',
          icon: ChartBarIcon,
          current: pathname.startsWith('/student/progress')
        },
        {
          name: 'Assignments',
          href: '/student/assignments',
          icon: ClipboardDocumentListIcon,
          current: pathname.startsWith('/student/assignments')
        },
        {
          name: 'Notifications',
          href: '/student/notifications',
          icon: BellIcon,
          current: pathname.startsWith('/student/notifications')
        }
      ];
    }

    // Default navigation
    return baseItems;
  };

  const navigation = getNavigationItems();

  return (
    <>
      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={onClose}
        >
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
        </div>
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 bg-white shadow-lg transform transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-16' : 'w-64'}
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            {!isCollapsed && (
              <h1 className="text-xl font-semibold text-gray-900">
                Edumentry
              </h1>
            )}
            <div className="flex items-center space-x-2">
              {!isCollapsed && (
                <button
                  type="button"
                  className="text-gray-500 hover:text-gray-700 lg:hidden"
                  onClick={onClose}
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              )}
              <button
                type="button"
                className="text-gray-500 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100"
                onClick={onToggleCollapse}
                title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isCollapsed ? (
                  <ChevronRightIcon className="h-5 w-5" />
                ) : (
                  <ChevronLeftIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* User info */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-indigo-600">
                  {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
                </span>
              </div>
              {!isCollapsed && (
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user?.role?.replace('_', ' ')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    router.push(item.href);
                    onClose();
                  }}
                  className={`
                    group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-colors
                    ${isCollapsed ? 'justify-center' : ''}
                    ${item.current
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                  title={isCollapsed ? item.name : undefined}
                >
                  <Icon 
                    className={`
                      h-5 w-5 transition-colors
                      ${!isCollapsed ? 'mr-3' : ''}
                      ${item.current
                        ? 'text-indigo-500'
                        : 'text-gray-400 group-hover:text-gray-500'
                      }
                    `}
                  />
                  {!isCollapsed && item.name}
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => {
                router.push('/dashboard/profile');
                onClose();
              }}
              className={`flex items-center w-full px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 ${
                isCollapsed ? 'justify-center' : ''
              }`}
              title={isCollapsed ? 'Profile' : undefined}
            >
              <UserIcon className={`h-5 w-5 text-gray-400 ${!isCollapsed ? 'mr-3' : ''}`} />
              {!isCollapsed && 'Profile'}
            </button>
            <button
              onClick={() => {
                router.push('/dashboard/settings');
                onClose();
              }}
              className={`flex items-center w-full px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 ${
                isCollapsed ? 'justify-center' : ''
              }`}
              title={isCollapsed ? 'Settings' : undefined}
            >
              <CogIcon className={`h-5 w-5 text-gray-400 ${!isCollapsed ? 'mr-3' : ''}`} />
              {!isCollapsed && 'Settings'}
            </button>
            <button
              onClick={handleLogout}
              className={`flex items-center w-full px-2 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 hover:text-red-700 ${
                isCollapsed ? 'justify-center' : ''
              }`}
              title={isCollapsed ? 'Sign out' : undefined}
            >
              <XMarkIcon className={`h-5 w-5 text-red-400 ${!isCollapsed ? 'mr-3' : ''}`} />
              {!isCollapsed && 'Sign out'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
