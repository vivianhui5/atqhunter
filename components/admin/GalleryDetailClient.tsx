'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Image as ImageIcon, Check, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import AdminLayout from './AdminLayout';
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
        router.push('/admin/galleries');
      }
    } catch {
      showToast('Failed to load gallery', 'error');
      router.push('/admin/galleries');
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
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-slate-500">Loading...</p>
        </div>
      </AdminLayout>
    );
  }

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
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1 md:mb-2">{gallery.name}</h2>
            <p className="text-sm md:text-base text-slate-600">View and move artworks in this gallery</p>
          </div>
          <button
            onClick={() => router.push('/admin/galleries')}
            className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium transition flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            Back to Galleries
          </button>
        </div>

        {/* Selection Actions */}
        {selectedArtworks.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <p className="text-blue-900 font-medium">{selectedArtworks.size} artwork(s) selected</p>
              <div className="flex items-center gap-3">
                <select
                  value={moveToGallery}
                  onChange={(e) => setMoveToGallery(e.target.value)}
                  className="px-4 py-2 text-sm border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500"
                  aria-label="Select destination gallery"
                >
                  <option value="">Move to...</option>
                  <option value="none">No Gallery</option>
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
                  className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition disabled:bg-slate-300"
                >
                  Move
                </button>
                <button
                  onClick={() => setSelectedArtworks(new Set())}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Artworks List */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {artworks.length === 0 ? (
            <div className="p-20 text-center">
              <p className="text-slate-500">No artworks in this gallery</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {artworks.map((artwork) => (
                <div key={artwork.id} className="p-4 md:p-6 hover:bg-slate-50 transition">
                  <div className="flex flex-wrap items-start gap-3 md:gap-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedArtworks.has(artwork.id)}
                      onChange={() => toggleArtworkSelection(artwork.id)}
                      className="mt-6 w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                      aria-label={`Select ${artwork.title}`}
                    />

                    {/* Thumbnail */}
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                      {artwork.images?.[0] ? (
                        <Image
                          src={artwork.images[0].image_url}
                          alt={artwork.title}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon size={24} className="text-slate-300" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-[200px]">
                      <h3 className="font-semibold text-sm md:text-base text-slate-900 mb-1">{artwork.title}</h3>
                      {artwork.price && (
                        <p className="text-xs md:text-sm text-slate-600">
                          <span className="font-medium">Price:</span> ${artwork.price}
                        </p>
                      )}
                    </div>

                    {/* Edit Button */}
                    <button
                      onClick={() => router.push(`/admin/posts/${artwork.id}`)}
                      className="px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition whitespace-nowrap flex-shrink-0"
                    >
                      Edit Post
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </AdminLayout>
  );
}

