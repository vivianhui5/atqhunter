'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, FolderPlus, X, Plus, Loader2, ArrowLeft } from 'lucide-react';
import RichTextEditor from '../RichTextEditor';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import AdminLayout from './layout/AdminLayout';
import { Gallery } from '@/types/database';

interface ImageFile {
  id: string;
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
    // Use quality: 1 for maximum quality / no compression
    const convertedBlob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 1 });
    return Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 24 - imageFiles.length;
    const filesToAdd = files.slice(0, remaining);

    for (const file of filesToAdd) {
      const fileId = `${Date.now()}-${Math.random()}`;
      
      if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
        const tempPreview = URL.createObjectURL(file);
        setImageFiles((prev) => [...prev, { id: fileId, file, preview: tempPreview, isConverting: true }]);

        try {
          const convertedBlob = await convertHeicToJpeg(file);
          const convertedFile = new File([convertedBlob], file.name.replace(/\.heic$/i, '.jpg'), {
            type: 'image/jpeg',
          });
          const preview = URL.createObjectURL(convertedBlob);

          setImageFiles((prev) =>
            prev.map((img) => (img.id === fileId ? { ...img, file: convertedFile, preview, isConverting: false } : img))
          );
          URL.revokeObjectURL(tempPreview);
        } catch {
          showToast('Failed to convert HEIC image', 'error');
          setImageFiles((prev) => prev.filter((img) => img.id !== fileId));
          URL.revokeObjectURL(tempPreview);
        }
      } else {
        const preview = URL.createObjectURL(file);
        setImageFiles((prev) => [...prev, { id: fileId, file, preview }]);
      }
    }

    if (e.target) e.target.value = '';
  };

  const removeImage = (id: string) => {
    const imgToRemove = imageFiles.find(img => img.id === id);
    if (imgToRemove) {
      URL.revokeObjectURL(imgToRemove.preview);
    }
    setImageFiles((prev) => prev.filter((img) => img.id !== id));
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

      <div className="admin-form-page">
        <div className="admin-form-page-header">
          <button
            onClick={() => router.push('/admin/posts')}
            className="admin-back-link"
          >
            <ArrowLeft size={18} />
            Back 
          </button>
          <h1 className="admin-form-page-title">Upload New Artwork</h1>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div className="admin-form-section">
            <label htmlFor="title" className="admin-form-label">Title *</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter artwork title"
              className="admin-form-input"
              required
            />
          </div>

          {/* Gallery & Price */}
          <div className="admin-form-section">
            <div className="admin-form-row two-cols">
              {/* Gallery */}
              <div className="admin-form-group">
                <label htmlFor="gallery" className="admin-form-label">Gallery</label>
              {showNewGallery ? (
                  <div>
                  <input
                    type="text"
                    value={newGalleryName}
                    onChange={(e) => setNewGalleryName(e.target.value)}
                    placeholder="Gallery name"
                    autoFocus
                      className="admin-form-input"
                  />
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={handleCreateGallery}
                      disabled={creatingGallery}
                        className="admin-primary-button"
                    >
                      {creatingGallery ? 'Creating...' : 'Create'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewGallery(false);
                        setNewGalleryName('');
                      }}
                        className="admin-secondary-button"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                  <div className="admin-gallery-selector">
                  <select
                      id="gallery"
                    value={selectedGallery}
                    onChange={(e) => setSelectedGallery(e.target.value)}
                      className="admin-form-select"
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
                      className="admin-add-gallery-button"
                      title="Create new gallery"
                  >
                      <FolderPlus size={20} />
                  </button>
                </div>
              )}
            </div>

              {/* Price */}
              <div className="admin-form-group">
                <label htmlFor="price" className="admin-form-label">Price</label>
                <div className="admin-price-input-wrapper">
                  <span className="admin-price-symbol">$</span>
                <input
                    id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                    className="admin-form-input"
                />
                </div>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="admin-image-upload-section">
            <div className="admin-form-label" style={{ marginBottom: '1rem' }}>Images *</div>
            {imageFiles.length === 0 ? (
              <label className="admin-image-upload-area">
                <div className="admin-image-upload-icon">
                  <Upload size={40} />
                </div>
                <div className="admin-image-upload-text">Click to upload images</div>
                <div className="admin-image-upload-hint">Up to 24 images • JPG, PNG, HEIC</div>
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageSelect} style={{ display: 'none' }} />
              </label>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#78716c' }}>{imageFiles.length} of 24 images</span>
                  <button type="button" onClick={clearAllImages} style={{ fontSize: '0.875rem', color: '#DC2626', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                    Remove all
                  </button>
                </div>
                <div className="admin-image-preview-grid">
                  {imageFiles.map((img, index) => (
                    <div key={img.id} className="admin-image-preview-item">
                      {img.isConverting ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                          <Loader2 size={28} className="admin-spinner" />
                        </div>
                      ) : (
                        <Image src={img.preview} alt={`${index + 1}`} fill style={{ objectFit: 'cover' }} />
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(img.id)}
                        className="admin-image-remove-button"
                        aria-label="Remove image"
                      >
                        <X size={16} />
                      </button>
                      <div style={{ position: 'absolute', bottom: '0.5rem', left: '0.5rem', background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                        {index + 1}
                      </div>
                    </div>
                  ))}
                  {imageFiles.length < 24 && (
                    <label style={{ border: '2px dashed #d6d3d1', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', aspectRatio: '1' }}>
                      <Plus size={24} style={{ color: '#a8a29e' }} />
                      <input type="file" accept="image/*" multiple onChange={handleImageSelect} style={{ display: 'none' }} aria-label="Add more images" />
                    </label>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="admin-form-section">
            <label htmlFor="description" className="admin-form-label">Description</label>
            <RichTextEditor content={description} onChange={setDescription} />
          </div>

          {/* Featured */}
          <div className="admin-form-section">
            <h3 className="admin-form-label">Featured</h3>
            <label className="admin-checkbox-wrapper">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
              />
              <div className="admin-checkbox-label">
                <p className="admin-checkbox-title">Pin to homepage</p>
                <p className="admin-checkbox-description">Featured items appear first</p>
              </div>
            </label>
          </div>

          {/* Submit */}
            <button
              type="submit"
              disabled={loading || imageFiles.length === 0 || !title.trim()}
            className="admin-submit-button"
            >
              {loading ? (
                <>
                <Loader2 size={20} className="admin-spinner" />
                <span>Uploading...</span>
                </>
              ) : (
                <>
                <Upload size={20} />
                <span>Submit Artwork</span>
                </>
              )}
            </button>
        </form>
      </div>
    </AdminLayout>
  );
}

