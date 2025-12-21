'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, FolderPlus, X, Plus, Check, Loader2, ArrowLeft } from 'lucide-react';
import RichTextEditor from '../RichTextEditor';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import AdminLayout from './AdminLayout';
import { Gallery } from '@/types/database';
import { Check as CheckIcon, AlertCircle } from 'lucide-react';

interface ImageFile {
  file: File;
  preview: string;
  isConverting?: boolean;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

interface EditArtworkClientProps {
  artworkId: string;
}

export default function EditArtworkClient({ artworkId }: EditArtworkClientProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [selectedGallery, setSelectedGallery] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showNewGallery, setShowNewGallery] = useState(false);
  const [newGalleryName, setNewGalleryName] = useState('');
  const [creatingGallery, setCreatingGallery] = useState(false);
  const [isLoadingArtwork, setIsLoadingArtwork] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };

  useEffect(() => {
    fetchGalleries();
    fetchArtwork();
  }, [artworkId]);

  useEffect(() => {
    return () => {
      imageFiles.forEach((img) => URL.revokeObjectURL(img.preview));
    };
  }, [imageFiles]);

  const fetchGalleries = async () => {
    try {
      const res = await fetch('/api/galleries');
      const data = await res.json();
      setGalleries(data.galleries || []);
    } catch {
      console.error('Error fetching galleries');
    }
  };

  const fetchArtwork = async () => {
    try {
      const res = await fetch(`/api/artwork/${artworkId}`);
      if (!res.ok) {
        showToast('Artwork not found', 'error');
        router.push('/admin/posts');
        return;
      }

      const data = await res.json();
      setTitle(data.artwork.title);
      setDescription(data.artwork.description || '');
      setPrice(data.artwork.price?.toString() || '');
      setSelectedGallery(data.artwork.gallery_id || '');
      setIsPinned(data.artwork.is_pinned);
      
      // Note: Existing images are already uploaded, we don't need to populate imageFiles
      // The user can add new images if they want
    } catch {
      showToast('Failed to load artwork', 'error');
      router.push('/admin/posts');
    } finally {
      setIsLoadingArtwork(false);
    }
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
        const data = await res.json();
        setSelectedGallery(data.gallery.id);
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

  const convertHeicToJpeg = async (file: File): Promise<Blob> => {
    const heic2any = (await import('heic2any')).default;
    const convertedBlob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
    return Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 10 - imageFiles.length;
    const filesToAdd = files.slice(0, remaining);

    for (const file of filesToAdd) {
      if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
        const tempPreview = URL.createObjectURL(file);
        setImageFiles((prev) => [...prev, { file, preview: tempPreview, isConverting: true }]);

        try {
          const convertedBlob = await convertHeicToJpeg(file);
          const convertedFile = new File([convertedBlob], file.name.replace(/\.heic$/i, '.jpg'), {
            type: 'image/jpeg',
          });
          const preview = URL.createObjectURL(convertedBlob);

          setImageFiles((prev) =>
            prev.map((img) => (img.file === file ? { file: convertedFile, preview, isConverting: false } : img))
          );
          URL.revokeObjectURL(tempPreview);
        } catch {
          showToast('Failed to convert HEIC image', 'error');
          setImageFiles((prev) => prev.filter((img) => img.file !== file));
          URL.revokeObjectURL(tempPreview);
        }
      } else {
        const preview = URL.createObjectURL(file);
        setImageFiles((prev) => [...prev, { file, preview }]);
      }
    }

    if (e.target) e.target.value = '';
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imageFiles[index].preview);
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAllImages = () => {
    imageFiles.forEach((img) => URL.revokeObjectURL(img.preview));
    setImageFiles([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);

    try {
      // Update artwork metadata
      const res = await fetch(`/api/artwork/${artworkId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description,
          price: price ? parseFloat(price) : null,
          gallery_id: selectedGallery || null,
          is_pinned: isPinned,
        }),
      });

      if (res.ok) {
        showToast('Artwork updated successfully!', 'success');
        setTimeout(() => router.push('/admin/posts'), 1000);
      } else {
        const error = await res.json();
        showToast(error.error || 'Update failed', 'error');
      }
    } catch {
      showToast('Update failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (isLoadingArtwork) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 size={48} className="text-blue-600 animate-spin" />
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
            {toast.type === 'success' ? <CheckIcon size={20} /> : <AlertCircle size={20} />}
            <span className="font-medium">{toast.message}</span>
          </div>
        ))}
      </div>

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-16">
        <div className="mb-8">
          <button
            onClick={() => router.push('/admin/posts')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium transition mb-4"
          >
            <ArrowLeft size={20} />
            Back to Manage Posts
          </button>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Edit Artwork</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 md:space-y-10 lg:space-y-14">
          {/* Title */}
          <div>
            <label className="block text-2xl font-bold text-slate-900 mb-6">TITLE *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter artwork title"
              className="w-full px-6 py-6 text-xl bg-slate-50 border-2 border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
            />
          </div>

          {/* Gallery & Price */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Gallery - 2/3 width */}
            <div className="md:col-span-2">
              <label className="block text-2xl font-bold text-slate-900 mb-6">GALLERY</label>
              {showNewGallery ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newGalleryName}
                    onChange={(e) => setNewGalleryName(e.target.value)}
                    placeholder="Gallery name"
                    autoFocus
                    className="w-full px-6 py-6 text-xl bg-slate-50 border-2 border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCreateGallery}
                      disabled={creatingGallery}
                      className="px-6 py-3 bg-blue-600 text-white text-base font-medium rounded-lg hover:bg-blue-700 transition disabled:bg-slate-400"
                    >
                      {creatingGallery ? 'Creating...' : 'Create'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewGallery(false);
                        setNewGalleryName('');
                      }}
                      className="px-6 py-3 text-slate-600 text-base font-medium hover:bg-slate-100 rounded-lg transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <select
                    value={selectedGallery}
                    onChange={(e) => setSelectedGallery(e.target.value)}
                    className="flex-1 px-6 py-6 text-xl bg-slate-50 border-2 border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
                    aria-label="Select gallery"
                  >
                    <option value="">No gallery</option>
                    {galleries.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewGallery(true)}
                    className="px-6 py-6 text-blue-600 font-medium hover:bg-blue-50 rounded-xl transition flex items-center gap-2"
                    aria-label="Create new gallery"
                  >
                    <FolderPlus size={24} />
                  </button>
                </div>
              )}
            </div>

            {/* Price - 1/3 width */}
            <div>
              <label className="block text-2xl font-bold text-slate-900 mb-6">PRICE</label>
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 text-xl font-medium">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-14 pr-6 py-6 text-xl bg-slate-50 border-2 border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
                />
              </div>
            </div>
          </div>

          {/* Note about images */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
            <p className="text-blue-900 font-medium">
              Note: Image management will be added in a future update. To change images, please delete and re-upload the artwork.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-2xl font-bold text-slate-900 mb-6">DESCRIPTION</label>
            <RichTextEditor content={description} onChange={setDescription} />
          </div>

          {/* Featured */}
          <div>
            <label className="block text-2xl font-bold text-slate-900 mb-6">FEATURED</label>
            <label className="flex items-center gap-5 cursor-pointer p-6 bg-slate-50 rounded-xl hover:bg-slate-100 transition">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="w-6 h-6 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div>
                <p className="text-lg font-medium text-slate-900">Pin to homepage</p>
                <p className="text-base text-slate-500">Featured items appear first</p>
              </div>
            </label>
          </div>

          {/* Submit */}
          <div className="pt-8">
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="w-full py-6 bg-blue-600 text-white text-xl font-semibold rounded-xl hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 transition-all disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <Loader2 size={28} className="animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Check size={28} />
                  Update Artwork
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </AdminLayout>
  );
}

