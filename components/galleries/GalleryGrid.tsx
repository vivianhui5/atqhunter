import { Gallery } from '@/types/database';
import GalleryCard from './GalleryCard';

interface GalleryGridProps {
  galleries: Gallery[];
  allGalleries?: Gallery[];
  parentUnlocked?: boolean;
}

export default function GalleryGrid({ galleries, allGalleries = [], parentUnlocked = false }: GalleryGridProps) {
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
        <GalleryCard 
          key={gallery.id} 
          gallery={gallery} 
          allGalleries={allGalleries.length > 0 ? allGalleries : galleries}
          parentUnlocked={parentUnlocked}
        />
      ))}
    </div>
  );
}

