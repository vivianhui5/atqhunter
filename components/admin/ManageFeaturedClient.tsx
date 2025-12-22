'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from './layout/AdminLayout';
import SearchBar from '@/components/SearchBar';
import { ArtworkPost } from '@/types/database';
import { Pin, PinOff, Loader2, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

export default function ManageFeaturedClient() {
  const [allArtworks, setAllArtworks] = useState<ArtworkPost[]>([]);
  const [featuredArtworks, setFeaturedArtworks] = useState<ArtworkPost[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };

  const fetchArtworks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/artwork');
      const data = await res.json();
      const artworks = data.artworks || [];
      setAllArtworks(artworks);
      setFeaturedArtworks(artworks.filter((a: ArtworkPost) => a.is_pinned));
    } catch (error) {
      console.error('Error fetching antiques:', error);
      showToast('Failed to fetch antiques', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchArtworks();
  }, [fetchArtworks]);

  // Filter non-featured artworks by search query
  const nonFeaturedArtworks = allArtworks.filter(
    (artwork) => !artwork.is_pinned
  );

  const filteredArtworks = nonFeaturedArtworks.filter((artwork) =>
    artwork.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTogglePin = async (id: string, currentPinned: boolean) => {
    try {
      const res = await fetch(`/api/artwork/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_pinned: !currentPinned }),
      });

      if (res.ok) {
        showToast(
          currentPinned
            ? 'Removed from featured'
            : 'Added to featured',
          'success'
        );
        await fetchArtworks();
      } else {
        showToast('Failed to update featured status', 'error');
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
      showToast('Failed to update featured status', 'error');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-loading-state">
          <Loader2 size={48} className="admin-spinner" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Toast Container */}
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
        <div className="admin-posts-header">
          <div>
            <h1 className="admin-page-title">Manage Featured</h1>
            <p className="admin-page-description">
              {featuredArtworks.length} {featuredArtworks.length === 1 ? 'antique' : 'antiques'} currently featured
            </p>
          </div>
        </div>

        {/* Featured Artworks Section */}
        {featuredArtworks.length > 0 && (
          <div className="admin-featured-section">
            <h2 className="admin-section-title">Currently Featured</h2>
            <div className="admin-featured-grid">
              {featuredArtworks.map((artwork) => {
                const firstImage = artwork.images?.sort(
                  (a, b) => a.display_order - b.display_order
                )[0];

                return (
                  <div key={artwork.id} className="admin-featured-card">
                    <Link
                      href={`/artwork/${artwork.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="admin-featured-image-link"
                    >
                      {firstImage ? (
                        <div className="admin-featured-image">
                          <Image
                            src={firstImage.image_url}
                            alt={artwork.title}
                            fill
                            className="object-cover"
                            sizes="200px"
                          />
                        </div>
                      ) : (
                        <div className="admin-featured-no-image">
                          <span>No Image</span>
                        </div>
                      )}
                    </Link>
                    <div className="admin-featured-info">
                      <Link
                        href={`/artwork/${artwork.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="admin-featured-title-link"
                      >
                        <h3 className="admin-featured-title">{artwork.title}</h3>
                      </Link>
                      <button
                        onClick={() => handleTogglePin(artwork.id, true)}
                        className="admin-featured-remove-button"
                        title="Remove from featured"
                      >
                        <PinOff size={18} />
                        Remove from Featured
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Add to Featured Section */}
        <div className="admin-featured-section">
          <h2 className="admin-section-title">Add to Featured</h2>
          <div className="admin-featured-search">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search antiques to feature..."
              className="admin-search"
            />
          </div>

          {searchQuery && (
            <div className="admin-featured-results">
              {filteredArtworks.length > 0 ? (
                <div className="admin-featured-grid">
                  {filteredArtworks.map((artwork) => {
                    const firstImage = artwork.images?.sort(
                      (a, b) => a.display_order - b.display_order
                    )[0];

                    return (
                      <div key={artwork.id} className="admin-featured-card">
                        <Link
                          href={`/artwork/${artwork.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="admin-featured-image-link"
                        >
                          {firstImage ? (
                            <div className="admin-featured-image">
                              <Image
                                src={firstImage.image_url}
                                alt={artwork.title}
                                fill
                                className="object-cover"
                                sizes="200px"
                              />
                            </div>
                          ) : (
                            <div className="admin-featured-no-image">
                              <span>No Image</span>
                            </div>
                          )}
                        </Link>
                        <div className="admin-featured-info">
                          <Link
                            href={`/artwork/${artwork.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="admin-featured-title-link"
                          >
                            <h3 className="admin-featured-title">{artwork.title}</h3>
                          </Link>
                          <button
                            onClick={() => handleTogglePin(artwork.id, false)}
                            className="admin-featured-add-button"
                            title="Add to featured"
                          >
                            <Pin size={18} />
                            Add to Featured
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="admin-empty-state">
                  <p>No antiques found matching "{searchQuery}"</p>
                </div>
              )}
            </div>
          )}

          {!searchQuery && (
            <div className="admin-featured-empty-search">
              <p>Start typing to search for antiques to feature...</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

