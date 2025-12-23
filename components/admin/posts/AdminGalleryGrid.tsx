'use client';

import { Gallery, ArtworkPost } from '@/types/database';
import AdminGalleryCard from './AdminGalleryCard';

interface AdminGalleryGridProps {
  galleries: Gallery[];
  artworks: ArtworkPost[];
  onUpdateGalleryName?: (id: string, newName: string) => Promise<void>;
}

export default function AdminGalleryGrid({ galleries, artworks, onUpdateGalleryName }: AdminGalleryGridProps) {
  const getArtworkCount = (galleryId: string) => {
    return artworks.filter((a) => a.gallery_id === galleryId).length;
  };

  if (galleries.length === 0) {
    return null;
  }

  return (
    <div className="admin-gallery-grid-filebrowser">
      {galleries.map((gallery) => (
        <AdminGalleryCard
          key={gallery.id}
          gallery={gallery}
          artworkCount={getArtworkCount(gallery.id)}
          onUpdateName={onUpdateGalleryName}
        />
      ))}
    </div>
  );
}

