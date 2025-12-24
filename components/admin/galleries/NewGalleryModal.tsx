'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Gallery } from '@/types/database';
import { flattenGalleryTree, buildGalleryTree } from '@/lib/gallery-utils';
import NestedGallerySelect from '../NestedGallerySelect';

interface NewGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, parentId: string | null, password: string | null) => Promise<void>;
  parentId?: string | null; // Pre-select a parent when creating from a gallery
  galleries?: Gallery[]; // All galleries for parent selection
}

export default function NewGalleryModal({ 
  isOpen, 
  onClose, 
  onCreate,
  parentId: initialParentId,
  galleries = []
}: NewGalleryModalProps) {
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string | null>(initialParentId || null);
  const [password, setPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setParentId(initialParentId || null);
      setPassword('');
    }
  }, [isOpen, initialParentId]);

  if (!isOpen) return null;

  const tree = buildGalleryTree(galleries);
  const flatList = flattenGalleryTree(tree);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsCreating(true);
    await onCreate(name.trim(), parentId, password.trim() || null);
    setIsCreating(false);
    setName('');
    setParentId(null);
    setPassword('');
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h2>Create New Gallery</h2>
          <button onClick={onClose} className="admin-modal-close" aria-label="Close" title="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="admin-modal-content">
          <div className="admin-form-group">
            <label htmlFor="gallery-name" className="admin-form-label">
              Gallery Name
            </label>
            <input
              id="gallery-name"
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
              <label htmlFor="gallery-parent" className="admin-form-label">
                Parent Gallery (optional)
              </label>
              <NestedGallerySelect
                value={parentId || ''}
                onChange={(value) => setParentId(value || null)}
                galleries={galleries}
                placeholder="Main/No gallery"
              />
              <p className="admin-form-help-text">
                Select a parent gallery to create a nested structure
              </p>
            </div>
          )}

          <div className="admin-form-group">
            <label htmlFor="gallery-password" className="admin-form-label">
              Password (optional)
            </label>
            <input
              id="gallery-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="admin-form-input"
              placeholder="Leave empty for no password protection"
            />
            <p className="admin-form-help-text">
              Set a password to protect this gallery and all its contents
            </p>
          </div>

          <div className="admin-modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="admin-secondary-button"
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="admin-primary-button"
              disabled={!name.trim() || isCreating}
            >
              {isCreating ? 'Creating...' : 'Create Gallery'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

