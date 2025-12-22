'use client';

import { Gallery, ArtworkPost } from '@/types/database';
import GalleryCard from './GalleryCard';

interface GalleryGridProps {
  galleries: Gallery[];
  artworks: ArtworkPost[];
  onDelete: (id: string, name: string) => void;
  onEdit: (id: string, name: string) => void;
}

export default function GalleryGrid({ galleries, artworks, onDelete, onEdit }: GalleryGridProps) {
  const getGalleryArtworkCount = (galleryId: string) => {
    return artworks.filter((a) => a.gallery_id === galleryId).length;
  };

  if (galleries.length === 0) {
    return (
      <div className="admin-empty-state">
        <p>No galleries yet. Create your first one!</p>
      </div>
    );
  }

  return (
    <div className="admin-gallery-grid">
      {galleries.map((gallery) => (
        <GalleryCard
          key={gallery.id}
          gallery={gallery}
          artworkCount={getGalleryArtworkCount(gallery.id)}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}

