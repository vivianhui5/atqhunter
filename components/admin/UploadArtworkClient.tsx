'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, FolderPlus, X, Plus, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import RichTextEditor from '../RichTextEditor';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import AdminLayout from './layout/AdminLayout';
import { Gallery } from '@/types/database';
import NestedGallerySelect from './NestedGallerySelect';
import { isGalleryPasswordProtected } from '@/lib/gallery-utils';

interface ImageFile {
  id: string;
  file: File;
  preview: string;
  isConverting?: boolean;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function UploadArtworkClient() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [selectedGallery, setSelectedGallery] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showNewGallery, setShowNewGallery] = useState(false);
  const [newGalleryName, setNewGalleryName] = useState('');
  const [selectedParentGallery, setSelectedParentGallery] = useState('');
  const [newGalleryPassword, setNewGalleryPassword] = useState('');
  const [showNewGalleryPassword, setShowNewGalleryPassword] = useState(false);
  const [creatingGallery, setCreatingGallery] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const isSubmittingRef = useRef(false);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    // Prevent duplicate toasts with the same message
    setToasts((prev) => {
      const isDuplicate = prev.some((t) => t.message === message && t.type === type);
      if (isDuplicate) return prev;
      
      const id = Date.now();
      const newToast = { id, message, type };
      setTimeout(() => {
        setToasts((current) => current.filter((t) => t.id !== id));
      }, 3500);
      return [...prev, newToast];
    });
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
      if (data.galleries) {
        setGalleries(data.galleries);
      }
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
        body: JSON.stringify({ 
          name: trimmedName,
          parent_id: selectedParentGallery || null,
          password: newGalleryPassword.trim() || null
        }),
      });

      if (res.ok) {
        await fetchGalleries();
        const data = await res.json();
        setSelectedGallery(data.gallery.id);
        setShowNewGallery(false);
        setNewGalleryName('');
        setSelectedParentGallery('');
        setNewGalleryPassword('');
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

  const clearAllImagesState = () => {
    imageFiles.forEach((img) => URL.revokeObjectURL(img.preview));
    setImageFiles([]);
  };

  const clearAllImages = () => {
    if (!confirm('Are you sure you want to remove all images? This action cannot be undone.')) return;
    clearAllImagesState();
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...imageFiles];
    const draggedItem = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedItem);

    setDraggedIndex(index);
    setImageFiles(newImages);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const uploadImageToR2 = async (file: File, fileName: string): Promise<string> => {
    // Convert HEIC to JPEG if needed
    let fileToUpload = file;
    let contentType = file.type;

    if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
      const convertedBlob = await convertHeicToJpeg(file);
      fileToUpload = new File([convertedBlob], fileName.replace(/\.heic$/i, '.jpg'), {
        type: 'image/jpeg',
      });
      contentType = 'image/jpeg';
    }

    // Get presigned URL
    const presignedRes = await fetch('/api/upload/presigned', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: fileToUpload.name,
        contentType: contentType || 'image/jpeg',
      }),
    });

    if (!presignedRes.ok) {
      const error = await presignedRes.json().catch(() => ({ error: 'Failed to get upload URL' }));
      throw new Error(error.error || 'Failed to get upload URL');
    }

    const { uploadUrl, publicUrl } = await presignedRes.json();

    // Upload directly to R2
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      body: fileToUpload,
      headers: {
        'Content-Type': contentType || 'image/jpeg',
      },
    });

    if (!uploadRes.ok) {
      throw new Error(`Failed to upload image: ${uploadRes.statusText}`);
    }

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || imageFiles.length === 0) return;
    
    // Prevent double submission
    if (isSubmittingRef.current || loading) return;
    isSubmittingRef.current = true;
    setLoading(true);

    try {
      // Step 1: Upload all images directly to R2
      const imageUrls = await Promise.all(
        imageFiles.map((img) => uploadImageToR2(img.file, img.file.name))
      );

      // Step 2: Send metadata and image URLs to API
      const res = await fetch('/api/artwork/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description,
          price: price || null,
          gallery_id: selectedGallery || null,
          password: password.trim() || null,
          imageUrls,
        }),
      });

      if (res.ok) {
        showToast('Artwork uploaded successfully!', 'success');
        clearForm();
        setTimeout(() => router.push('/admin'), 1000);
      } else {
        const error = await res.json().catch(() => ({ error: 'Upload failed' }));
        showToast(error.error || 'Upload failed', 'error');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      showToast(errorMessage, 'error');
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const clearForm = () => {
    setTitle('');
    setDescription('');
    setPrice('');
    setSelectedGallery('');
    clearAllImagesState(); // Clear without confirmation (e.g. after successful upload)
  };

  // Check if selected gallery is password protected
  const selectedGalleryObj = selectedGallery ? galleries.find(g => g.id === selectedGallery) : null;
  const isGalleryProtected = selectedGalleryObj ? isGalleryPasswordProtected(selectedGalleryObj, galleries) : false;

  return (
    <AdminLayout>
      {/* Toast */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast ${
              toast.type === 'success' 
                ? 'toast-success' 
                : toast.type === 'error' 
                ? 'toast-error' 
                : 'toast-info'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>

      <div className="admin-form-page">
        <div className="admin-form-page-header">
          <button
            onClick={() => router.push('/admin')}
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
                  <div style={{ marginTop: '0.75rem' }}>
                    <NestedGallerySelect
                      value={selectedParentGallery}
                      onChange={setSelectedParentGallery}
                      galleries={galleries}
                      placeholder="Parent Gallery"
                    />
                  </div>
                  <div style={{ marginTop: '0.75rem' }}>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showNewGalleryPassword ? 'text' : 'password'}
                        value={newGalleryPassword}
                        onChange={(e) => setNewGalleryPassword(e.target.value)}
                        placeholder="Password (optional)"
                        className="admin-form-input"
                        style={{ paddingRight: '2.5rem' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewGalleryPassword(!showNewGalleryPassword)}
                        style={{
                          position: 'absolute',
                          right: '0.75rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#78716c',
                          padding: '0.25rem',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        title={showNewGalleryPassword ? 'Hide password' : 'Show password'}
                      >
                        {showNewGalleryPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#78716c', marginTop: '0.5rem', margin: 0 }}>
                      Set a password to protect this gallery and all its contents
                    </p>
                  </div>
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
                        setSelectedParentGallery('');
                        setNewGalleryPassword('');
                      }}
                        className="admin-secondary-button"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="admin-gallery-selector">
                    <NestedGallerySelect
                      value={selectedGallery}
                      onChange={setSelectedGallery}
                      galleries={galleries}
                      placeholder="Select a gallery..."
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewGallery(true)}
                      className="admin-add-gallery-button"
                      title="Create new gallery"
                    >
                      <FolderPlus size={20} />
                    </button>
                  </div>
                  {selectedGallery && isGalleryProtected && (
                    <div style={{ 
                      marginTop: '0.75rem', 
                      padding: '0.75rem', 
                      background: '#FEF3C7', 
                      border: '1px solid #FCD34D', 
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      color: '#92400E'
                    }}>
                      <strong>⚠️ Password Protected:</strong> This gallery is password protected. The post will inherit this protection.
                    </div>
                  )}
                </>
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
                    <div
                      key={img.id}
                      className="admin-image-preview-item"
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      style={{
                        cursor: 'grab',
                        opacity: draggedIndex === index ? 0.5 : 1,
                        transition: 'opacity 0.2s'
                      }}
                    >
                      {img.isConverting ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                          <Loader2 size={28} className="admin-spinner" />
                        </div>
                      ) : (
                        <Image src={img.preview} alt={`${index + 1}`} fill style={{ objectFit: 'cover' }} />
                      )}
                      
                      {/* Drag indicator */}
                      <div style={{ 
                        position: 'absolute', 
                        top: '0.5rem', 
                        left: '0.5rem', 
                        background: 'rgba(0,0,0,0.7)', 
                        color: 'white', 
                        fontSize: '0.75rem', 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        pointerEvents: 'none'
                      }}>
                        <span style={{ fontSize: '0.875rem' }}>⋮⋮</span>
                        <span>Drag to reorder</span>
                      </div>

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

          {/* Password Protection */}
          <div className="admin-form-section">
            <label htmlFor="password" className="admin-form-label">Password (optional)</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="admin-form-input"
                placeholder="Leave empty to inherit from gallery or no protection"
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#78716c',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="admin-form-help-text">
              {selectedGallery && isGalleryProtected 
                ? 'This post will inherit the gallery password. Set a password here to override it for this post only.'
                : 'Set a password to protect this post independently. If in a gallery, this overrides the gallery password.'}
            </p>
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

