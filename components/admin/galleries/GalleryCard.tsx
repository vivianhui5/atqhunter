'use client';

import { Gallery } from '@/types/database';
import { Trash2, Edit2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface GalleryCardProps {
  gallery: Gallery;
  artworkCount: number;
  onDelete: (id: string, name: string) => void;
  onEdit: (id: string, name: string) => void;
}

export default function GalleryCard({ gallery, artworkCount, onDelete, onEdit }: GalleryCardProps) {
  const router = useRouter();

  const handleCardClick = () => {
    router.push(`/admin/galleries/${gallery.id}`);
  };

  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  return (
    <div className="admin-gallery-card clickable" onClick={handleCardClick}>
      <div className="admin-gallery-info">
        <h3 className="admin-gallery-title">{gallery.name}</h3>
        <p className="admin-gallery-count">
          {artworkCount} {artworkCount === 1 ? 'artwork' : 'artworks'}
        </p>
      </div>

      <div className="admin-gallery-actions">
        <button
          onClick={(e) => handleActionClick(e, () => onEdit(gallery.id, gallery.name))}
          className="admin-icon-button"
          title="Edit Name"
        >
          <Edit2 size={18} />
        </button>
        <button
          onClick={(e) => handleActionClick(e, () => onDelete(gallery.id, gallery.name))}
          className="admin-icon-button delete"
          title="Delete"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}

