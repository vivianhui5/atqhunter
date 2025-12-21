'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Check, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AdminLayout from './AdminLayout';
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
  const [showNewGallery, setShowNewGallery] = useState(false);
  const [newGalleryName, setNewGalleryName] = useState('');
  const [creatingGallery, setCreatingGallery] = useState(false);
  const [editingGalleryId, setEditingGalleryId] = useState<string | null>(null);
  const [editingGalleryName, setEditingGalleryName] = useState('');
  const router = useRouter();

  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };

  useEffect(() => {
    fetchGalleries();
    fetchArtworks();
  }, []);

  const fetchGalleries = async () => {
    try {
      const res = await fetch('/api/galleries');
      const data = await res.json();
      setGalleries(data.galleries || []);
    } catch {
      console.error('Error fetching galleries');
    }
  };

  const fetchArtworks = async () => {
    try {
      const res = await fetch('/api/artwork');
      const data = await res.json();
      setArtworks(data.artworks || []);
    } catch {
      console.error('Error fetching artworks');
    }
  };

  const getGalleryArtworks = (galleryId: string) => {
    return artworks.filter((a) => a.gallery_id === galleryId);
  };

  const handleCreateGallery = async () => {
    const trimmedName = newGalleryName.trim();
    if (!trimmedName) return;

    const duplicate = galleries.find((g) => g.name.toLowerCase() === trimmedName.toLowerCase());
    if (duplicate) {
      showToast('A gallery with this name already exists', 'error');
      return;
    }

    setCreatingGallery(true);
    try {
      const res = await fetch('/api/galleries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName }),
      });

      if (res.ok) {
        await fetchGalleries();
        setShowNewGallery(false);
        setNewGalleryName('');
        showToast('Gallery created!', 'success');
      }
    } catch {
      showToast('Failed to create gallery', 'error');
    } finally {
      setCreatingGallery(false);
    }
  };

  const deleteGallery = async (galleryId: string, galleryName: string) => {
    if (!confirm(`Delete gallery "${galleryName}"? Artworks will not be deleted, just moved to "No Gallery".`)) return;

    try {
      const res = await fetch(`/api/galleries/${galleryId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Gallery deleted', 'success');
        fetchGalleries();
        fetchArtworks();
      } else {
        showToast('Failed to delete gallery', 'error');
      }
    } catch {
      showToast('Failed to delete gallery', 'error');
    }
  };

  const renameGallery = async (galleryId: string) => {
    const trimmedName = editingGalleryName.trim();
    if (!trimmedName) {
      showToast('Gallery name cannot be empty', 'error');
      return;
    }

    const duplicate = galleries.find(
      (g) => g.id !== galleryId && g.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicate) {
      showToast('A gallery with this name already exists', 'error');
      return;
    }

    try {
      const res = await fetch(`/api/galleries/${galleryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName }),
      });

      if (res.ok) {
        showToast('Gallery renamed', 'success');
        fetchGalleries();
        setEditingGalleryId(null);
        setEditingGalleryName('');
      }
    } catch {
      showToast('Failed to rename gallery', 'error');
    }
  };

  return (
    <AdminLayout>
      {/* Toast */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg backdrop-blur-sm ${
              toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {toast.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
            <span className="font-medium">{toast.message}</span>
          </div>
        ))}
      </div>

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-16">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1 md:mb-2">Manage Galleries</h2>
            <p className="text-sm md:text-base text-slate-600">Organize your artwork galleries</p>
          </div>
          <button
            onClick={() => setShowNewGallery(true)}
            className="px-6 py-3 md:px-8 md:py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm md:text-base font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all flex items-center gap-2 md:gap-3 flex-shrink-0"
          >
            <Plus size={18} className="md:w-5 md:h-5" />
            New Gallery
          </button>
        </div>

        {/* Gallery List */}
        <div className="space-y-6">
          {/* New Gallery Form */}
          {showNewGallery && (
            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-blue-500">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Create New Gallery</h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newGalleryName}
                  onChange={(e) => setNewGalleryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateGallery();
                    if (e.key === 'Escape') {
                      setShowNewGallery(false);
                      setNewGalleryName('');
                    }
                  }}
                  placeholder="Enter gallery name"
                  className="flex-1 px-4 py-3 text-base border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  autoFocus
                />
                <button
                  onClick={handleCreateGallery}
                  disabled={creatingGallery || !newGalleryName.trim()}
                  className="px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition disabled:bg-slate-300"
                >
                  {creatingGallery ? 'Creating...' : 'Create'}
                </button>
                <button
                  onClick={() => {
                    setShowNewGallery(false);
                    setNewGalleryName('');
                  }}
                  className="px-6 py-3 bg-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-300 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Gallery List */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="divide-y divide-slate-200">
              {galleries.map((gallery) => {
                const galleryArtworks = getGalleryArtworks(gallery.id);
                const isEditing = editingGalleryId === gallery.id;

                return (
                  <div key={gallery.id} className="p-6 hover:bg-slate-50 transition">
                    <div className="flex items-center justify-between gap-4">
                      {/* Gallery Name */}
                      <div className="flex-1">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingGalleryName}
                            onChange={(e) => setEditingGalleryName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') renameGallery(gallery.id);
                              if (e.key === 'Escape') {
                                setEditingGalleryId(null);
                                setEditingGalleryName('');
                              }
                            }}
                            className="px-4 py-2 text-lg font-bold border-2 border-blue-500 rounded-lg focus:outline-none w-full max-w-md"
                            placeholder="Gallery name"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                            aria-label="Gallery name"
                          />
                        ) : (
                          <>
                            <h3 className="text-xl font-bold text-slate-900 mb-1">{gallery.name}</h3>
                            <p className="text-sm text-slate-500">
                              {galleryArtworks.length} {galleryArtworks.length === 1 ? 'artwork' : 'artworks'}
                            </p>
                          </>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => renameGallery(gallery.id)}
                              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingGalleryId(null);
                                setEditingGalleryName('');
                              }}
                              className="px-4 py-2 bg-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-300 transition"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => router.push(`/admin/galleries/${gallery.id}`)}
                              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
                            >
                              Manage
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingGalleryId(gallery.id);
                                setEditingGalleryName(gallery.name);
                              }}
                              className="px-4 py-2 bg-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-300 transition"
                            >
                              Rename
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteGallery(gallery.id, gallery.name);
                              }}
                              className="px-4 py-2 bg-red-100 text-red-600 text-sm font-medium rounded-lg hover:bg-red-200 transition"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </AdminLayout>
  );
}

