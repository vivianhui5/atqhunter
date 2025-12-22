'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from './layout/AdminLayout';
import GalleriesHeader from './galleries/GalleriesHeader';
import GalleryGrid from './galleries/GalleryGrid';
import NewGalleryModal from './galleries/NewGalleryModal';
import EditGalleryModal from './galleries/EditGalleryModal';
import { Gallery, ArtworkPost } from '@/types/database';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

export default function ManageGalleriesClient() {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [artworks, setArtworks] = useState<ArtworkPost[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingGalleryId, setEditingGalleryId] = useState<string | null>(null);
  const [editingGalleryName, setEditingGalleryName] = useState('');

  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };

  const fetchGalleries = useCallback(async () => {
    try {
      const res = await fetch('/api/galleries');
      const data = await res.json();
      setGalleries(data.galleries || []);
    } catch {
      console.error('Error fetching galleries');
    }
  }, []);

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
    void fetchGalleries();
    void fetchArtworks();
  }, [fetchGalleries, fetchArtworks]);

  const handleCreateGallery = async (name: string) => {
    const duplicate = galleries.find((g) => g.name.toLowerCase() === name.toLowerCase());
    if (duplicate) {
      showToast('A gallery with this name already exists', 'error');
      return;
    }

    try {
      const res = await fetch('/api/galleries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (res.ok) {
        await fetchGalleries();
        setShowNewModal(false);
        showToast('Gallery created!', 'success');
      }
    } catch {
      showToast('Failed to create gallery', 'error');
    }
  };

  const handleUpdateGallery = async (id: string, name: string) => {
    const duplicate = galleries.find(
      (g) => g.id !== id && g.name.toLowerCase() === name.toLowerCase()
    );
    if (duplicate) {
      showToast('A gallery with this name already exists', 'error');
      return;
    }

    try {
      const res = await fetch(`/api/galleries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (res.ok) {
        await fetchGalleries();
        setEditingGalleryId(null);
        setEditingGalleryName('');
        showToast('Gallery updated!', 'success');
      }
    } catch {
      showToast('Failed to update gallery', 'error');
    }
  };

  const handleDeleteGallery = async (id: string, name: string) => {
    if (!confirm(`Delete gallery "${name}"? Artworks will not be deleted.`)) return;

    try {
      const res = await fetch(`/api/galleries/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Gallery deleted', 'success');
        await fetchGalleries();
        await fetchArtworks();
      }
    } catch {
      showToast('Failed to delete gallery', 'error');
    }
  };

  const handleEditClick = (id: string, name: string) => {
    setEditingGalleryId(id);
    setEditingGalleryName(name);
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
        <GalleriesHeader onCreateClick={() => setShowNewModal(true)} />
        <GalleryGrid
          galleries={galleries}
          artworks={artworks}
          onDelete={handleDeleteGallery}
          onEdit={handleEditClick}
        />
        </div>

      <NewGalleryModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onCreate={handleCreateGallery}
      />

      <EditGalleryModal
        isOpen={!!editingGalleryId}
        galleryId={editingGalleryId}
        currentName={editingGalleryName}
        onClose={() => {
                                setEditingGalleryId(null);
                                setEditingGalleryName('');
                              }}
        onUpdate={handleUpdateGallery}
      />
    </AdminLayout>
  );
}
