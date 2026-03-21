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
  const [passwordDraft, setPasswordDraft] = useState('');
  const [passwordApplied, setPasswordApplied] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setParentId(initialParentId || null);
      setPasswordDraft('');
      setPasswordApplied(null);
    }
  }, [isOpen, initialParentId]);

  if (!isOpen) return null;

  const tree = buildGalleryTree(galleries);
  const flatList = flattenGalleryTree(tree);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsCreating(true);
    await onCreate(name.trim(), parentId, passwordApplied);
    setIsCreating(false);
    setName('');
    setParentId(null);
    setPasswordDraft('');
    setPasswordApplied(null);
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
              autoComplete="new-password"
              value={passwordDraft}
              onChange={(e) => setPasswordDraft(e.target.value)}
              className="admin-form-input"
              placeholder="Type a password, then click Set password"
            />
            <p className="admin-form-help-text">
              Set a password to protect this gallery and all its contents
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
              <button
                type="button"
                onClick={() => {
                  const t = passwordDraft.trim();
                  if (t.length < 3) return;
                  setPasswordApplied(t);
                  setPasswordDraft('');
                }}
                className="admin-primary-button"
                disabled={isCreating || passwordDraft.trim().length < 3}
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.8125rem' }}
              >
                Set password
              </button>

              {passwordApplied && (
                <button
                  type="button"
                  onClick={() => {
                    setPasswordApplied(null);
                    setPasswordDraft('');
                  }}
                  className="admin-secondary-button"
                  disabled={isCreating}
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.8125rem' }}
                >
                  Clear password
                </button>
              )}
            </div>

            <p className="admin-form-help-text" style={{ marginTop: '0.5rem' }}>
              {passwordApplied
                ? 'Password will be applied when you create the gallery.'
                : 'If you type here but don’t click Set password, nothing will be applied.'}
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

