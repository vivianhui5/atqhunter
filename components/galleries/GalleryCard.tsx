import Link from 'next/link';
import { Gallery } from '@/types/database';

interface GalleryCardProps {
  gallery: Gallery;
}

export default function GalleryCard({ gallery }: GalleryCardProps) {
  return (
    <Link href={`/galleries/${gallery.id}`} className="gallery-card">
      <div className="gallery-card-content">
        <h2 className="gallery-card-title">{gallery.name}</h2>
        <span className="gallery-card-arrow">→</span>
      </div>
      <p className="gallery-card-label">View Collection</p>
    </Link>
  );
}

