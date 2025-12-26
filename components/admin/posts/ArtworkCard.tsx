'use client';

import { ArtworkPost } from '@/types/database';
import Image from 'next/image';
import { Pin, PinOff, Trash2, ImageIcon, Lock, Unlock } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ArtworkCardProps {
  artwork: ArtworkPost;
  onTogglePin: (id: string, currentPinned: boolean) => void;
  onDelete: (id: string) => void;
  onManagePassword?: (id: string, title: string, currentPassword: string | null) => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
}

export default function ArtworkCard({ artwork, onTogglePin, onDelete, onManagePassword, draggable = false, onDragStart }: ArtworkCardProps) {
  const router = useRouter();
  const firstImage = artwork.images?.sort((a, b) => a.display_order - b.display_order)[0];
  
  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const handleCardClick = () => {
    router.push(`/admin/posts/${artwork.id}`);
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
      {/* Image */}
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
        {artwork.is_pinned && (
          <div className="admin-artwork-badge">Pinned</div>
        )}
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

      {/* Actions */}
      <div className="admin-artwork-actions">
        <button
          onClick={(e) => handleActionClick(e, () => onTogglePin(artwork.id, artwork.is_pinned || false))}
          className={`admin-icon-button ${artwork.is_pinned ? 'active' : ''}`}
          title={artwork.is_pinned ? 'Unpin' : 'Pin'}
        >
          {artwork.is_pinned ? <PinOff size={18} /> : <Pin size={18} />}
        </button>
        {onManagePassword && (
          <button
            onClick={(e) => handleActionClick(e, () => onManagePassword(artwork.id, artwork.title, artwork.password || null))}
            className={`admin-icon-button ${artwork.password ? 'active' : ''}`}
            title={artwork.password ? 'Manage password' : 'Add password'}
          >
            {artwork.password ? <Lock size={18} /> : <Unlock size={18} />}
          </button>
        )}
        <button
          onClick={(e) => handleActionClick(e, () => onDelete(artwork.id))}
          className="admin-icon-button delete"
          title="Delete"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}

