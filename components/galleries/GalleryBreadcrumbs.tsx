import Link from 'next/link';
import { Gallery } from '@/types/database';
import { ChevronRight, Home } from 'lucide-react';

interface GalleryBreadcrumbsProps {
  gallery: Gallery;
  allGalleries: Gallery[];
}

export default function GalleryBreadcrumbs({ gallery, allGalleries }: GalleryBreadcrumbsProps) {
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
    <nav className="gallery-breadcrumbs" aria-label="Breadcrumb">
      <ol className="gallery-breadcrumbs-list">
        <li className="gallery-breadcrumb-item">
          <Link href="/collection" className="gallery-breadcrumb-link">
            <Home size={16} />
            <span>Collection</span>
          </Link>
        </li>
        {path.map((g, index) => {
          const isLast = index === path.length - 1;
          return (
            <li key={g.id} className="gallery-breadcrumb-item">
              <ChevronRight size={16} className="gallery-breadcrumb-separator" />
              {isLast ? (
                <span className="gallery-breadcrumb-current">{g.name}</span>
              ) : (
                <Link href={`/collection?gallery=${g.id}`} className="gallery-breadcrumb-link">
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

