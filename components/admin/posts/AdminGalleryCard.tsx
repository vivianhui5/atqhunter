'use client';

import { useState } from 'react';
import { Gallery } from '@/types/database';
import { hasOwnPassword } from '@/lib/gallery-utils';
import Image from 'next/image';
import { Folder, Edit2, Check, X, Trash2, Lock, Unlock, Image as ImageIcon } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

interface AdminGalleryCardProps {
  gallery: Gallery & { previewImages?: string[]; allImages?: string[] };
  artworkCount: number;
  subfolderCount?: number;
  onUpdateName?: (id: string, newName: string) => Promise<void>;
  onDelete?: (id: string, name: string) => void;
  onManagePassword?: (id: string, name: string, currentPassword: string | null) => void;
  onEditCoverImage?: (id: string, name: string, currentCoverImage: string | null, availableImages: string[]) => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
}

export default function AdminGalleryCard({ 
  gallery, 
  artworkCount,
  subfolderCount = 0,
  onUpdateName,
  onDelete,
  onManagePassword,
  onEditCoverImage,
  draggable = false,
  onDragStart,
  onDrop,
  onDragOver,
  onDragLeave
}: AdminGalleryCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const previewImages = gallery.previewImages || [];
  const allImages = gallery.allImages || previewImages; // Use allImages if available, otherwise fallback to previewImages
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(gallery.name);
  const [isUpdating, setIsUpdating] = useState(false);

  // Check if gallery has its own password (not inherited)
  const galleryHasOwnPassword = hasOwnPassword(gallery);
  const ownPassword = gallery.password || null;

  const handleClick = () => {
    if (!isEditing) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('gallery', gallery.id);
      router.push(`/admin?${params.toString()}`);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditedName(gallery.name);
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editedName.trim() === gallery.name.trim()) {
      setIsEditing(false);
      return;
    }

    setIsUpdating(true);
    try {
      if (onUpdateName) {
        await onUpdateName(gallery.id, editedName.trim());
      }
      setIsEditing(false);
    } catch {
      // Error handled by parent
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditedName(gallery.name);
    setIsEditing(false);
  };

  return (
    <div 
      className={`admin-gallery-card-filebrowser ${!isEditing ? 'clickable' : ''} ${draggable ? 'draggable' : ''}`}
      onClick={handleClick}
      draggable={draggable && !isEditing}
      onDragStart={onDragStart}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
      {/* Cover Image with Edit Button Overlay */}
      <div className="admin-gallery-preview-wrapper">
        {(() => {
          const coverImageUrl = gallery.cover_image_url || previewImages[0] || null;
          return coverImageUrl ? (
            <div className="admin-gallery-cover-image">
              <Image
                src={coverImageUrl}
                alt={gallery.name}
                fill
                className="object-contain"
                sizes="200px"
              />
            </div>
          ) : (
            <div className="admin-gallery-preview-empty-all">
              <Folder size={32} />
            </div>
          );
        })()}
        {!isEditing && (
          <div className="admin-gallery-card-actions-overlay">
            {onUpdateName && (
          <button
            onClick={handleEditClick}
                className="admin-gallery-card-action-button"
            title="Edit gallery name"
          >
            <Edit2 size={16} />
          </button>
            )}
            {onEditCoverImage && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditCoverImage(gallery.id, gallery.name, gallery.cover_image_url || null, allImages);
                }}
                className="admin-gallery-card-action-button"
                title="Edit cover image"
              >
                <ImageIcon size={16} />
              </button>
            )}
            {onManagePassword && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Pass the gallery's own password, not the effective/inherited one
                  onManagePassword(gallery.id, gallery.name, ownPassword);
                }}
                className={`admin-gallery-card-action-button ${galleryHasOwnPassword ? 'locked' : ''}`}
                title={galleryHasOwnPassword ? 'Manage password' : 'Add password protection'}
              >
                {galleryHasOwnPassword ? <Lock size={16} /> : <Unlock size={16} />}
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(gallery.id, gallery.name);
                }}
                className="admin-gallery-card-action-button delete"
                title="Delete gallery"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Gallery Info */}
      <div className="admin-gallery-card-content">
        {isEditing ? (
          <div className="admin-gallery-card-edit-mode">
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className="admin-gallery-card-edit-input"
              autoFocus
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSave(e as unknown as React.MouseEvent);
                }
                if (e.key === 'Escape') {
                  e.preventDefault();
                  handleCancel(e as unknown as React.MouseEvent);
                }
              }}
              disabled={isUpdating}
              aria-label="Gallery name"
              title="Gallery name"
            />
            <div className="admin-gallery-card-edit-actions">
              <button
                onClick={handleSave}
                className="admin-gallery-card-edit-button save"
                disabled={isUpdating || !editedName.trim()}
                title="Save"
              >
                <Check size={14} />
              </button>
              <button
                onClick={handleCancel}
                className="admin-gallery-card-edit-button cancel"
                disabled={isUpdating}
                title="Cancel"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="admin-gallery-card-header">
              <span className="admin-gallery-card-badge">Gallery</span>
              <h3 className="admin-gallery-card-title">{gallery.name}</h3>
            </div>
            <div className="admin-gallery-card-meta">
              {subfolderCount > 0 && (
                <span className="admin-gallery-card-meta-item">
                  {subfolderCount} {subfolderCount === 1 ? 'folder' : 'folders'}
                </span>
              )}
              {subfolderCount > 0 && artworkCount > 0 && (
                <span className="admin-gallery-card-meta-separator">•</span>
              )}
              {artworkCount > 0 && (
                <span className="admin-gallery-card-meta-item">
                  {artworkCount} {artworkCount === 1 ? 'post' : 'posts'}
                </span>
              )}
              {subfolderCount === 0 && artworkCount === 0 && (
                <span className="admin-gallery-card-meta-empty">Empty</span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

