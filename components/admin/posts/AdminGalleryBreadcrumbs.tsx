'use client';

import Link from 'next/link';
import { Gallery } from '@/types/database';
import { ChevronRight, Home } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

interface AdminGalleryBreadcrumbsProps {
  gallery: Gallery | null;
  allGalleries: Gallery[];
}

export default function AdminGalleryBreadcrumbs({ gallery, allGalleries }: AdminGalleryBreadcrumbsProps) {
  const searchParams = useSearchParams();
  
  if (!gallery) {
    return null;
  }

  // Build breadcrumb path
  const buildPath = (gallery: Gallery, allGalleries: Gallery[]): Gallery[] => {
    const path: Gallery[] = [gallery];
    let currentParentId = gallery.parent_id;

    while (currentParentId) {
      const parent = allGalleries.find((g) => g.id === currentParentId);
      if (parent) {
        path.unshift(parent);
        currentParentId = parent.parent_id;
      } else {
        break;
      }
    }

    return path;
  };

  const path = buildPath(gallery, allGalleries);

  return (
    <nav className="admin-breadcrumbs" aria-label="Breadcrumb">
      <ol className="admin-breadcrumbs-list">
        <li className="admin-breadcrumb-item">
          <Link href="/admin/posts" className="admin-breadcrumb-link">
            <Home size={16} />
            <span>Home</span>
          </Link>
        </li>
        {path.map((g, index) => {
          const isLast = index === path.length - 1;
          return (
            <li key={g.id} className="admin-breadcrumb-item">
              <ChevronRight size={16} className="admin-breadcrumb-separator" />
              {isLast ? (
                <span className="admin-breadcrumb-current">{g.name}</span>
              ) : (
                <Link 
                  href={`/admin/posts?gallery=${g.id}${searchParams.get('search') ? `&search=${searchParams.get('search')}` : ''}`} 
                  className="admin-breadcrumb-link"
                >
                  {g.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

