'use client';

import { ArtworkPost } from '@/types/database';
import Image from 'next/image';
import { Trash2, ImageIcon, Lock, Unlock } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ArtworkCardProps {
  artwork: ArtworkPost;
  onDelete: (id: string) => void;
  onManagePassword?: (id: string, title: string, currentPassword: string | null) => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
}

export default function ArtworkCard({ artwork, onDelete, onManagePassword, draggable = false, onDragStart }: ArtworkCardProps) {
  const router = useRouter();
  const firstImage = artwork.images?.sort((a, b) => a.display_order - b.display_order)[0];
  
  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const handleCardClick = () => {
    router.push(`/admin/${artwork.id}`);
  };

  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  return (
    <div 
      className={`admin-artwork-card clickable ${draggable ? 'draggable' : ''}`}
      onClick={handleCardClick}
      draggable={draggable}
      onDragStart={onDragStart}
    >
      {/* Image with Actions Overlay */}
      <div className="admin-artwork-image">
        {firstImage ? (
          <Image
            src={firstImage.image_url}
            alt={artwork.title}
            fill
            className="object-contain"
            sizes="300px"
          />
        ) : (
          <div className="admin-artwork-no-image">
            <ImageIcon size={32} />
          </div>
        )}
        <div className="admin-artwork-actions-overlay">
          {onManagePassword && (
            <button
              onClick={(e) => handleActionClick(e, () => onManagePassword(artwork.id, artwork.title, artwork.password || null))}
              className={`admin-artwork-action-button ${artwork.password ? 'locked' : ''}`}
              title={artwork.password ? 'Manage password' : 'Add password'}
            >
              {artwork.password ? <Lock size={16} /> : <Unlock size={16} />}
            </button>
          )}
          <button
            onClick={(e) => handleActionClick(e, () => onDelete(artwork.id))}
            className="admin-artwork-action-button delete"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="admin-artwork-info">
        <h3 className="admin-artwork-title">{artwork.title}</h3>
        {artwork.description && (
          <p className="admin-artwork-description">
            {stripHtml(artwork.description).slice(0, 100)}
            {stripHtml(artwork.description).length > 100 ? '...' : ''}
          </p>
        )}
        {artwork.gallery && (
          <p className="admin-artwork-gallery-label">
            <span className="gallery-label-text">From Gallery:</span> {artwork.gallery.name}
          </p>
        )}
      </div>
    </div>
  );
}

