'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Gallery } from '@/types/database';
import { flattenGalleryTree, buildGalleryTree } from '@/lib/gallery-utils';

interface EditGalleryModalProps {
  isOpen: boolean;
  galleryId: string | null;
  currentName: string;
  currentParentId: string | null;
  galleries?: Gallery[];
  onClose: () => void;
  onUpdate: (id: string, name: string, parentId: string | null) => Promise<void>;
}

export default function EditGalleryModal({ 
  isOpen, 
  galleryId, 
  currentName,
  currentParentId,
  galleries = [],
  onClose, 
  onUpdate 
}: EditGalleryModalProps) {
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(currentName);
      setParentId(currentParentId);
    }
  }, [currentName, currentParentId, isOpen]);

  if (!isOpen || !galleryId) return null;

  // Filter out current gallery and its descendants to prevent circular references
  const availableGalleries = galleries.filter((g) => g.id !== galleryId);
  const tree = buildGalleryTree(availableGalleries);
  const flatList = flattenGalleryTree(tree);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName || (trimmedName === currentName && parentId === currentParentId)) return;

    setIsUpdating(true);
    await onUpdate(galleryId, trimmedName, parentId);
    setIsUpdating(false);
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h2>Edit Gallery</h2>
          <button onClick={onClose} className="admin-modal-close" aria-label="Close" title="Close">
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

          {galleries.length > 0 && (
            <div className="admin-form-group">
              <label htmlFor="edit-gallery-parent" className="admin-form-label">
                Parent Gallery
              </label>
              <select
                id="edit-gallery-parent"
                value={parentId || ''}
                onChange={(e) => setParentId(e.target.value || null)}
                className="admin-form-select"
              >
                <option value="">No parent (root gallery)</option>
                {flatList.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.displayName}
                  </option>
                ))}
              </select>
              <p className="admin-form-help-text">
                Move this gallery to a different parent or make it a root gallery
              </p>
            </div>
          )}

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
              disabled={!name.trim() || (name.trim() === currentName && parentId === currentParentId) || isUpdating}
            >
              {isUpdating ? 'Updating...' : 'Update Gallery'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

