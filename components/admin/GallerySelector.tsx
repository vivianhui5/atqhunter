'use client';

import { useState, useEffect } from 'react';
import { Gallery } from '@/types/database';
import { flattenGalleryTree, buildGalleryTree } from '@/lib/gallery-utils';

interface GallerySelectorProps {
  value: string;
  onChange: (value: string) => void;
  showNewGallery?: boolean;
  onShowNewGallery?: () => void;
  excludeId?: string; // Exclude a gallery (e.g., when editing to prevent self-selection)
}

export default function GallerySelector({
  value,
  onChange,
  showNewGallery,
  onShowNewGallery,
  excludeId,
}: GallerySelectorProps) {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGalleries();
  }, []);

  const fetchGalleries = async () => {
    try {
      const res = await fetch('/api/galleries');
      const data = await res.json();
      if (data.galleries) {
        setGalleries(data.galleries);
      }
    } catch (error) {
      console.error('Error fetching galleries:', error);
    } finally {
      setLoading(false);
    }
  };

  const tree = buildGalleryTree(galleries);
  const flatList = flattenGalleryTree(tree);

  // Filter out excluded gallery
  const availableGalleries = excludeId
    ? flatList.filter((g) => g.id !== excludeId)
    : flatList;

  return (
    <div className="admin-form-group">
      <label htmlFor="gallery" className="admin-form-label">Gallery</label>
      {showNewGallery ? (
        <div>
          <input
            type="text"
            placeholder="Gallery name"
            autoFocus
            className="admin-form-input"
            id="new-gallery-name"
          />
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
            <button
              type="button"
              className="admin-primary-button"
              onClick={onShowNewGallery}
            >
              Create
            </button>
            <button
              type="button"
              className="admin-secondary-button"
              onClick={() => onShowNewGallery?.()}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <select
          id="gallery"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="admin-form-select"
        >
          <option value="">Main/No gallery</option>
          {loading ? (
            <option disabled>Loading galleries...</option>
          ) : (
            availableGalleries.map((gallery) => (
              <option key={gallery.id} value={gallery.id}>
                {gallery.displayName}
              </option>
            ))
          )}
        </select>
      )}
    </div>
  );
}

