import { Gallery } from '@/types/database';
import GalleryCard from './GalleryCard';

interface GalleryGridProps {
  galleries: Gallery[];
}

export default function GalleryGrid({ galleries }: GalleryGridProps) {
  if (galleries.length === 0) {
    return (
      <div className="empty-state">
        <p>No galleries available yet</p>
      </div>
    );
  }

  return (
    <div className="gallery-grid">
      {galleries.map((gallery) => (
        <GalleryCard key={gallery.id} gallery={gallery} />
      ))}
    </div>
  );
}

