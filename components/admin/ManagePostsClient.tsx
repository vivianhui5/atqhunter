'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from './layout/AdminLayout';
import PostsHeader from './posts/PostsHeader';
import ArtworkGrid from './posts/ArtworkGrid';
import { ArtworkPost } from '@/types/database';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

export default function ManagePostsClient() {
  const [artworks, setArtworks] = useState<ArtworkPost[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };

  const fetchArtworks = useCallback(async () => {
    try {
      const res = await fetch('/api/artwork');
      const data = await res.json();
      setArtworks(data.artworks || []);
    } catch {
      console.error('Error fetching artworks');
    }
  }, []);

  useEffect(() => {
    void fetchArtworks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const togglePin = async (id: string, currentPinned: boolean) => {
    try {
      const res = await fetch(`/api/artwork/${id}/pin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_pinned: !currentPinned }),
      });

      if (res.ok) {
        showToast(currentPinned ? 'Artwork unpinned' : 'Artwork pinned!', 'success');
        fetchArtworks();
      }
    } catch {
      showToast('Failed to update pin status', 'error');
    }
  };

  const deleteArtwork = async (id: string) => {
    if (!confirm('Are you sure you want to delete this artwork?')) return;

    try {
      const res = await fetch(`/api/artwork/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Artwork deleted successfully', 'success');
        fetchArtworks();
      }
    } catch {
      showToast('Failed to delete artwork', 'error');
    }
  };

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
        <PostsHeader />
        <ArtworkGrid
          artworks={artworks}
          onTogglePin={togglePin}
          onDelete={deleteArtwork}
        />
        </div>
    </AdminLayout>
  );
}
