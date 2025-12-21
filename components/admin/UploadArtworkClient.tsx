'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, FolderPlus, X, Plus, Loader2, ArrowLeft } from 'lucide-react';
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

export default function UploadArtworkClient() {
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };

  useEffect(() => {
    fetchGalleries();
  }, []);

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
    if (!title.trim() || imageFiles.length === 0) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('description', description);
    if (price) formData.append('price', price);
    if (selectedGallery) formData.append('gallery_id', selectedGallery);
    formData.append('is_pinned', isPinned.toString());

    imageFiles.forEach((img) => formData.append('images', img.file));

    try {
      const res = await fetch('/api/artwork/upload', { method: 'POST', body: formData });

      if (res.ok) {
        showToast('Artwork uploaded successfully!', 'success');
        clearForm();
        setTimeout(() => router.push('/admin/posts'), 1000);
      } else {
        const error = await res.json();
        showToast(error.error || 'Upload failed', 'error');
      }
    } catch {
      showToast('Upload failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setTitle('');
    setDescription('');
    setPrice('');
    setSelectedGallery('');
    setIsPinned(false);
    clearAllImages();
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
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Upload New Artwork</h2>
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

          {/* Images */}
          <div>
            <label className="block text-2xl font-bold text-slate-900 mb-6">IMAGES *</label>
            {imageFiles.length === 0 ? (
              <label className="block border-2 border-dashed border-slate-300 rounded-2xl p-12 md:p-20 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all bg-slate-50">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Upload size={32} className="text-blue-600 md:w-10 md:h-10" />
                </div>
                <p className="text-lg md:text-xl font-semibold text-slate-700 mb-2">Click to upload images</p>
                <p className="text-base md:text-lg text-slate-500">Up to 10 images • JPG, PNG, HEIC</p>
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
              </label>
            ) : (
              <div className="border-2 border-slate-200 rounded-2xl p-8 bg-slate-50">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-lg font-semibold text-slate-600">{imageFiles.length} of 10</span>
                  <button type="button" onClick={clearAllImages} className="text-lg text-red-600 hover:text-red-700 font-semibold">
                    Remove all
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-4">
                  {imageFiles.map((img, index) => (
                    <div key={index} className="relative aspect-square bg-slate-200 rounded-xl overflow-hidden group">
                      {img.isConverting ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 size={28} className="text-slate-400 animate-spin" />
                        </div>
                      ) : (
                        <Image src={img.preview} alt={`${index + 1}`} fill className="object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg transition"
                        aria-label="Remove image"
                      >
                        <X size={18} className="text-white" />
                      </button>
                      <div className="absolute bottom-2 left-2 bg-black/70 text-white text-sm font-bold px-2 py-1 rounded">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                  {imageFiles.length < 10 && (
                    <label className="aspect-square border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center cursor-pointer hover:border-slate-400 hover:bg-white transition">
                      <Plus size={24} className="text-slate-400" />
                      <input type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" aria-label="Add more images" />
                    </label>
                  )}
                </div>
              </div>
            )}
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
              disabled={loading || imageFiles.length === 0 || !title.trim()}
              className="w-full py-6 bg-blue-600 text-white text-xl font-semibold rounded-xl hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 transition-all disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <Loader2 size={28} className="animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={28} />
                  Submit Artwork
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </AdminLayout>
  );
}

