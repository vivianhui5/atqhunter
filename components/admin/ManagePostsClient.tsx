'use client';

import { useState, useEffect } from 'react';
import { Plus, Pin, PinOff, Trash2, Eye, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import AdminLayout from './AdminLayout';
import { ArtworkPost } from '@/types/database';
import { Check, AlertCircle } from 'lucide-react';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

export default function ManagePostsClient() {
  const [artworks, setArtworks] = useState<ArtworkPost[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const router = useRouter();

  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };

  useEffect(() => {
    fetchArtworks();
  }, []);

  const fetchArtworks = async () => {
    try {
      const res = await fetch('/api/artwork');
      const data = await res.json();
      setArtworks(data.artworks || []);
    } catch {
      console.error('Error fetching artworks');
    }
  };

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
        {/* Header with Upload Button */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1 md:mb-2">Your Artworks</h2>
            <p className="text-sm md:text-base text-slate-600">Manage your collection</p>
          </div>
          <button
            onClick={() => router.push('/admin/posts/new')}
            className="px-6 py-3 md:px-8 md:py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm md:text-base font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all flex items-center gap-2 md:gap-3 flex-shrink-0"
          >
            <Plus size={18} className="md:w-5 md:h-5" />
            Upload New
          </button>
        </div>

        {/* Manage Posts Section */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {artworks.length === 0 ? (
            <div className="p-20 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ImageIcon size={36} className="text-slate-400" />
              </div>
              <p className="text-xl font-semibold text-slate-700 mb-2">No artworks yet</p>
              <p className="text-base text-slate-500 mb-8">Upload your first piece to get started</p>
              <button
                onClick={() => router.push('/admin/posts/new')}
                className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition"
              >
                Upload Artwork
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {artworks.map((artwork) => (
                <div key={artwork.id} className="p-4 md:p-6 hover:bg-slate-50 transition">
                  <div className="flex flex-wrap items-start gap-3 md:gap-4">
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
                      <div className="text-xs md:text-sm text-slate-500 space-y-0.5">
                        <p className="truncate">
                          <span className="font-medium text-slate-600">Gallery:</span>{' '}
                          {artwork.gallery ? artwork.gallery.name : '--'}
                        </p>
                        {artwork.description && (
                          <p className="line-clamp-1">
                            <span className="font-medium text-slate-600">Description:</span>{' '}
                            {stripHtml(artwork.description).substring(0, 100)}
                            {stripHtml(artwork.description).length > 100 ? '...' : ''}
                          </p>
                        )}
                        {artwork.price && (
                          <p>
                            <span className="font-medium text-slate-600">Price:</span> ${artwork.price}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <div className="flex gap-1.5 md:gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePin(artwork.id, artwork.is_pinned);
                          }}
                          className={`p-2 md:p-2.5 rounded-lg transition ${
                            artwork.is_pinned
                              ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                          title={artwork.is_pinned ? 'Unpin' : 'Pin'}
                          aria-label={artwork.is_pinned ? 'Unpin artwork' : 'Pin artwork'}
                        >
                          {artwork.is_pinned ? <PinOff size={16} /> : <Pin size={16} />}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`/artwork/${artwork.id}`, '_blank');
                          }}
                          className="p-2 md:p-2.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
                          title="View"
                          aria-label="View artwork"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteArtwork(artwork.id);
                          }}
                          className="p-2 md:p-2.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-red-100 hover:text-red-600 transition"
                          title="Delete"
                          aria-label="Delete artwork"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <button
                        onClick={() => router.push(`/admin/posts/${artwork.id}`)}
                        className="px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition whitespace-nowrap"
                      >
                        Edit Post
                      </button>
                    </div>
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

