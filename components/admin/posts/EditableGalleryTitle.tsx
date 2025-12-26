'use client';

import { useState } from 'react';
import { Edit2, Check, X, Image as ImageIcon } from 'lucide-react';

interface EditableGalleryTitleProps {
  name: string;
  galleryId: string;
  onUpdate: (id: string, newName: string) => Promise<void>;
  onEditCoverImage?: (id: string, name: string, currentCoverImage: string | null, availableImages: string[]) => void;
  currentCoverImage?: string | null;
  availableImages?: string[];
}

export default function EditableGalleryTitle({ 
  name, 
  galleryId, 
  onUpdate, 
  onEditCoverImage,
  currentCoverImage,
  availableImages = []
}: EditableGalleryTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(name);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSave = async () => {
    if (editedName.trim() === name.trim()) {
      setIsEditing(false);
      return;
    }

    setIsUpdating(true);
    try {
      await onUpdate(galleryId, editedName.trim());
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

  if (isEditing) {
    return (
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
            disabled={isUpdating || !editedName.trim()}
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
    );
  }

  return (
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
  );
}

