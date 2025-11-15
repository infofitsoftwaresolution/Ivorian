/**
 * Breadcrumb Navigation Component
 * Shows current page location and navigation path
 */

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';

interface BreadcrumbItem {
  name: string;
  href: string;
  current: boolean;
  key: string;
}

export default function Breadcrumb() {
  const pathname = usePathname();

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      {
        name: 'Home',
        href: '/dashboard',
        current: segments.length === 0,
        key: 'home'
      }
    ];

    let currentPath = '';
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Convert segment to readable name
      let name = segment;
      if (segment === 'admin') name = 'Admin';
      else if (segment === 'platform') name = 'Platform';
      else if (segment === 'organizations') name = 'Organizations';
      else if (segment === 'create') name = 'Create';
      else if (segment === 'tutor') name = 'Tutor';
      else if (segment === 'student') name = 'Student';
      else if (segment === 'courses') name = 'Courses';
      else if (segment === 'dashboard') name = 'Dashboard';
      else {
        // Capitalize first letter and replace dashes/underscores
        name = segment
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
      }

      breadcrumbs.push({
        name,
        href: currentPath,
        current: index === segments.length - 1,
        key: `${segment}-${index}`
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <nav className="flex mb-6" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {breadcrumbs.map((item) => (
          <li key={item.key} className="flex items-center">
            {item.name !== 'Home' && (
              <ChevronRightIcon className="h-4 w-4 text-gray-400 mx-2" />
            )}
            
            {item.current ? (
              <span className="text-sm font-medium text-gray-500">
                {item.name}
              </span>
            ) : (
              <Link
                href={item.href}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center"
              >
                {item.name === 'Home' && <HomeIcon className="h-4 w-4 mr-1" />}
                {item.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
