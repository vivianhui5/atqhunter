'use client';

import { useState } from 'react';
import { Edit2, Check, X, Image as ImageIcon, Eye } from 'lucide-react';

interface EditableGalleryTitleProps {
  name: string;
  galleryId: string;
  onUpdate: (id: string, newName: string) => Promise<void>;
  onEditCoverImage?: (id: string, name: string, currentCoverImage: string | null, availableImages: string[]) => void;
  currentCoverImage?: string | null;
  availableImages?: string[];
  /** Public folder page views (`/?gallery=id`); shown under the title when set. */
  pageViewCount?: number;
}

export default function EditableGalleryTitle({ 
  name, 
  galleryId, 
  onUpdate, 
  onEditCoverImage,
  currentCoverImage,
  availableImages = [],
  pageViewCount,
}: EditableGalleryTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(name);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSave = async () => {
    const trimmedName = editedName.trim();
    if (trimmedName === name.trim() || !trimmedName) {
      setIsEditing(false);
      return;
    }

    setIsUpdating(true);
    try {
      await onUpdate(galleryId, trimmedName);
      setIsEditing(false);
    } catch {
      // Error handled by parent
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setEditedName(name);
    setIsEditing(false);
  };

  const viewStats =
    pageViewCount !== undefined ? (
      <div className="admin-artwork-view-stats" role="status" aria-live="polite">
        <Eye size={18} className="admin-artwork-view-stats-icon" aria-hidden />
        <span className="admin-artwork-view-stats-value">{pageViewCount.toLocaleString()}</span>
        <span className="admin-artwork-view-stats-label">folder page views</span>
      </div>
    ) : null;

  if (isEditing) {
    return (
      <div className="admin-gallery-title-block">
        <div className="admin-editable-title">
          <input
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            className="admin-editable-input"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
            disabled={isUpdating}
            aria-label="Gallery name"
          />
          <div className="admin-editable-actions">
            <button
              onClick={handleSave}
              className="admin-editable-button save"
              disabled={isUpdating || !editedName.trim() || editedName.trim() === name.trim()}
              title="Save"
            >
              <Check size={16} />
            </button>
            <button
              onClick={handleCancel}
              className="admin-editable-button cancel"
              disabled={isUpdating}
              title="Cancel"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        {viewStats}
      </div>
    );
  }

  return (
    <div className="admin-gallery-title-block">
      <div className="admin-editable-title">
        <h2 className="admin-gallery-view-title">{name}</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {onEditCoverImage && (
            <button
              onClick={() => onEditCoverImage(galleryId, name, currentCoverImage || null, availableImages)}
              className="admin-editable-edit-button"
              title="Edit cover image"
            >
              <ImageIcon size={18} />
            </button>
          )}
          <button
            onClick={() => setIsEditing(true)}
            className="admin-editable-edit-button"
            title="Edit gallery name"
          >
            <Edit2 size={18} />
          </button>
        </div>
      </div>
      {viewStats}
    </div>
  );
}

