'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface NewGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
}

export default function NewGalleryModal({ isOpen, onClose, onCreate }: NewGalleryModalProps) {
  const [name, setName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsCreating(true);
    await onCreate(name.trim());
    setIsCreating(false);
    setName('');
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h2>Create New Gallery</h2>
          <button onClick={onClose} className="admin-modal-close">
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

