'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Image as ImageIcon, Check, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import AdminLayout from './layout/AdminLayout';
import { Gallery, ArtworkPost } from '@/types/database';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

interface GalleryDetailClientProps {
  galleryId: string;
}

export default function GalleryDetailClient({ galleryId }: GalleryDetailClientProps) {
  const [gallery, setGallery] = useState<Gallery | null>(null);
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [artworks, setArtworks] = useState<ArtworkPost[]>([]);
  const [selectedArtworks, setSelectedArtworks] = useState<Set<string>>(new Set());
  const [moveToGallery, setMoveToGallery] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const router = useRouter();

  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };

  useEffect(() => {
    fetchGallery();
    fetchGalleries();
    fetchGalleryArtworks();
  }, [galleryId]);

  const fetchGallery = async () => {
    try {
      const res = await fetch('/api/galleries');
      const data = await res.json();
      const found = data.galleries?.find((g: Gallery) => g.id === galleryId);
      if (found) {
        setGallery(found);
      } else {
        showToast('Gallery not found', 'error');
        router.push('/admin/posts');
      }
    } catch {
      showToast('Failed to load gallery', 'error');
      router.push('/admin/posts');
    }
  };

  const fetchGalleries = async () => {
    try {
      const res = await fetch('/api/galleries');
      const data = await res.json();
      setGalleries(data.galleries || []);
    } catch {
      console.error('Error fetching galleries');
    }
  };

  const fetchGalleryArtworks = async () => {
    try {
      const res = await fetch(`/api/galleries/${galleryId}/artworks`);
      const data = await res.json();
      setArtworks(data.artworks || []);
    } catch {
      console.error('Error fetching gallery artworks');
    }
  };

  const toggleArtworkSelection = (artworkId: string) => {
    setSelectedArtworks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(artworkId)) {
        newSet.delete(artworkId);
      } else {
        newSet.add(artworkId);
      }
      return newSet;
    });
  };

  const moveSelectedArtworks = async () => {
    if (!moveToGallery || selectedArtworks.size === 0) return;

    const targetGalleryId = moveToGallery === 'none' ? null : moveToGallery;

    try {
      const updates = Array.from(selectedArtworks).map((artworkId) =>
        fetch(`/api/artwork/${artworkId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gallery_id: targetGalleryId }),
        })
      );

      await Promise.all(updates);
      showToast('Artworks moved successfully', 'success');
      setSelectedArtworks(new Set());
      setMoveToGallery('');
      fetchGalleryArtworks();
    } catch {
      showToast('Failed to move artworks', 'error');
    }
  };

  if (!gallery) {
    return (
      <AdminLayout>
        <div className="admin-loading-container">
          <p>Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Toast */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}
          >
            {toast.message}
          </div>
        ))}
      </div>

      <div className="admin-page-container">
        {/* Header */}
        <div className="admin-page-header">
          <div>
            <h1 className="admin-page-title">{gallery.name}</h1>
            <p className="admin-page-subtitle">View and move artworks in this gallery</p>
          </div>
          <button
            onClick={() => router.push('/admin/posts')}
            className="admin-back-link"
          >
            <ArrowLeft size={18} />
            Back to Posts
          </button>
        </div>

        {/* Selection Actions */}
        {selectedArtworks.size > 0 && (
          <div className="admin-info-box" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <p style={{ color: '#1E40AF', fontWeight: 600 }}>{selectedArtworks.size} artwork(s) selected</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <select
                  value={moveToGallery}
                  onChange={(e) => setMoveToGallery(e.target.value)}
                  className="admin-form-select"
                  style={{ width: 'auto', minWidth: '150px' }}
                  aria-label="Select destination gallery"
                >
                  <option value="">Move to...</option>
                  <option value="none">Main/No gallery</option>
                  {galleries
                    .filter((g) => g.id !== galleryId)
                    .map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                </select>
                <button
                  onClick={moveSelectedArtworks}
                  disabled={!moveToGallery}
                  className="admin-primary-button"
                  style={{ padding: '0.5rem 1.25rem' }}
                >
                  Move
                </button>
                <button
                  onClick={() => setSelectedArtworks(new Set())}
                  className="admin-secondary-button"
                  style={{ padding: '0.5rem 1rem' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Artworks List */}
        <div style={{ background: '#FFFFFF', border: '1px solid #e7e5e4', borderRadius: '12px', overflow: 'hidden' }}>
          {artworks.length === 0 ? (
            <div className="admin-empty-state">
              <p>No antiques in this gallery</p>
            </div>
          ) : (
            <div style={{ borderTop: '1px solid #e7e5e4' }}>
              {artworks.map((artwork) => (
                <div key={artwork.id} style={{ padding: '1.5rem', borderBottom: '1px solid #e7e5e4', transition: 'background 0.2s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedArtworks.has(artwork.id)}
                      onChange={() => toggleArtworkSelection(artwork.id)}
                      style={{ width: '1.25rem', height: '1.25rem', accentColor: '#1c1917' }}
                      aria-label={`Select ${artwork.title}`}
                    />

                    {/* Thumbnail */}
                    <div style={{ width: '80px', height: '80px', background: '#f5f5f4', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                      {artwork.images?.[0] ? (
                        <Image
                          src={artwork.images[0].image_url}
                          alt={artwork.title}
                          width={80}
                          height={80}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ImageIcon size={24} style={{ color: '#a8a29e' }} />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <h3 style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#1c1917', marginBottom: '0.25rem' }}>{artwork.title}</h3>
                      {artwork.price && (
                        <p style={{ fontSize: '0.875rem', color: '#78716c' }}>
                          <span style={{ fontWeight: 600 }}>Price:</span> ${artwork.price}
                        </p>
                      )}
                    </div>

                    {/* Edit Button */}
                    <button
                      onClick={() => router.push(`/admin/posts/${artwork.id}`)}
                      className="admin-text-button"
                    >
                      Edit Post
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

