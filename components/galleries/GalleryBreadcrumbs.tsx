import Link from 'next/link';
import { Gallery } from '@/types/database';

interface GalleryBreadcrumbsProps {
  gallery: Gallery;
  allGalleries: Gallery[];
}

export default function GalleryBreadcrumbs({ gallery, allGalleries }: GalleryBreadcrumbsProps) {
  const parent = gallery.parent_id
    ? allGalleries.find((g) => g.id === gallery.parent_id)
    : null;

  const backHref = parent ? `/?gallery=${parent.id}` : '/';
  const backText = parent ? `← ${parent.name}` : '← Full Collection';

  return (
    <nav aria-label="Back navigation" style={{ marginBottom: '1.5rem' }}>
      <Link href={backHref} className="back-button">
        {backText}
      </Link>
    </nav>
  );
}
