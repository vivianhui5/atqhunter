'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface EditGalleryModalProps {
  isOpen: boolean;
  galleryId: string | null;
  currentName: string;
  onClose: () => void;
  onUpdate: (id: string, name: string) => Promise<void>;
}

export default function EditGalleryModal({ 
  isOpen, 
  galleryId, 
  currentName, 
  onClose, 
  onUpdate 
}: EditGalleryModalProps) {
  const [name, setName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setName(currentName);
  }, [currentName, isOpen]);

  if (!isOpen || !galleryId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim() === currentName) return;

    setIsUpdating(true);
    await onUpdate(galleryId, name.trim());
    setIsUpdating(false);
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h2>Edit Gallery</h2>
          <button onClick={onClose} className="admin-modal-close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="admin-modal-content">
          <div className="admin-form-group">
            <label htmlFor="edit-gallery-name" className="admin-form-label">
              Gallery Name
            </label>
            <input
              id="edit-gallery-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="admin-form-input"
              placeholder="Enter gallery name"
              autoFocus
              required
            />
          </div>

          <div className="admin-modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="admin-secondary-button"
              disabled={isUpdating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="admin-primary-button"
              disabled={!name.trim() || name.trim() === currentName || isUpdating}
            >
              {isUpdating ? 'Updating...' : 'Update Gallery'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

