'use client';

import { useState, useEffect, useRef } from 'react';
import { FolderPlus, Check, Loader2, ArrowLeft, X, Plus } from 'lucide-react';
import RichTextEditor from '../RichTextEditor';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import AdminLayout from './layout/AdminLayout';
import { Gallery } from '@/types/database';
import { isGalleryPasswordProtected } from '@/lib/gallery-utils';
import NestedGallerySelect from './NestedGallerySelect';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ArtworkImage {
  id: string;
  image_url: string;
  display_order: number;
}

interface ImageFile {
  file: File;
  preview: string;
  isConverting?: boolean;
}

interface EditArtworkClientProps {
  artworkId: string;
}

export default function EditArtworkClient({ artworkId }: EditArtworkClientProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [selectedGallery, setSelectedGallery] = useState('');
  const [password, setPassword] = useState('');
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showNewGallery, setShowNewGallery] = useState(false);
  const [newGalleryName, setNewGalleryName] = useState('');
  const [creatingGallery, setCreatingGallery] = useState(false);
  const [isLoadingArtwork, setIsLoadingArtwork] = useState(true);
  const [existingImages, setExistingImages] = useState<ArtworkImage[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<ImageFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };

  useEffect(() => {
    void fetchGalleries();
    void fetchArtwork();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artworkId]);

  useEffect(() => {
    return () => {
      newImageFiles.forEach((img) => URL.revokeObjectURL(img.preview));
    };
  }, [newImageFiles]);

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


  const fetchArtwork = async () => {
    try {
      const res = await fetch(`/api/artwork/${artworkId}?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (!res.ok) {
        showToast('Artwork not found', 'error');
        router.push('/admin');
        return;
      }

      const data = await res.json();
      setTitle(data.artwork.title);
      setDescription(data.artwork.description || '');
      setPrice(data.artwork.price?.toString() || '');
      setSelectedGallery(data.artwork.gallery_id || '');
      setPassword(data.artwork.password || '');
      
      // Load existing images
      if (data.artwork.images) {
        const sortedImages = data.artwork.images.sort(
          (a: ArtworkImage, b: ArtworkImage) => a.display_order - b.display_order
        );
        setExistingImages(sortedImages);
      } else {
        setExistingImages([]);
      }
    } catch (err) {
      console.error('Failed to fetch artwork:', err);
      showToast('Failed to load artwork', 'error');
        router.push('/admin');
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

  // Image management functions
  const deleteExistingImage = async (imageId: string) => {
    try {
      const res = await fetch(`/api/artwork/${artworkId}/images?imageId=${imageId}`, {
        method: 'DELETE',
      });


      if (res.ok) {
        showToast('Image deleted', 'success');
        // Refetch the artwork data to ensure sync
        await fetchArtwork();
      } else {
        const error = await res.json();
        console.error('Delete error:', error);
        showToast(error.error || 'Failed to delete image', 'error');
      }
    } catch (err) {
      console.error('Delete exception:', err);
      showToast('Failed to delete image', 'error');
    }
  };

  // Drag and drop handlers
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...existingImages];
    const draggedItem = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedItem);

    setDraggedIndex(index);
    setExistingImages(newImages);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null) return;
    setDraggedIndex(null);

    // Update display orders in database
    const updatedImages = existingImages.map((img, i) => ({ ...img, display_order: i }));

    try {
      const res = await fetch(`/api/artwork/${artworkId}/images`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: updatedImages.map((img) => ({ id: img.id, display_order: img.display_order })),
        }),
      });

      if (res.ok) {
        showToast('Order updated', 'success');
      } else {
        showToast('Failed to update order', 'error');
        await fetchArtwork(); // Revert on error
      }
    } catch {
      showToast('Failed to update order', 'error');
      await fetchArtwork(); // Revert on error
    }
  };

  const convertHeicToJpeg = async (file: File): Promise<Blob> => {
    const heic2any = (await import('heic2any')).default;
    // Use quality: 1 for maximum quality / no compression
    const convertedBlob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 1 });
    return Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
  };

  const handleNewImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 24 - (existingImages.length + newImageFiles.length);
    const filesToAdd = files.slice(0, remaining);

    for (const file of filesToAdd) {
      if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
        const tempPreview = URL.createObjectURL(file);
        setNewImageFiles((prev) => [...prev, { file, preview: tempPreview, isConverting: true }]);

        try {
          const convertedBlob = await convertHeicToJpeg(file);
          const convertedFile = new File([convertedBlob], file.name.replace(/\.heic$/i, '.jpg'), {
            type: 'image/jpeg',
          });
          const preview = URL.createObjectURL(convertedBlob);

          setNewImageFiles((prev) =>
            prev.map((img) => (img.file === file ? { file: convertedFile, preview, isConverting: false } : img))
          );
          URL.revokeObjectURL(tempPreview);
        } catch {
          showToast('Failed to convert HEIC image', 'error');
          setNewImageFiles((prev) => prev.filter((img) => img.file !== file));
          URL.revokeObjectURL(tempPreview);
        }
      } else {
        const preview = URL.createObjectURL(file);
        setNewImageFiles((prev) => [...prev, { file, preview }]);
      }
    }

    if (e.target) e.target.value = '';
  };

  const removeNewImage = (index: number) => {
    URL.revokeObjectURL(newImageFiles[index].preview);
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeAllExistingImages = async () => {
    if (!confirm('Are you sure you want to remove all images? This action cannot be undone.')) return;
    
    try {
      // Delete all images from database and storage
      const deletePromises = existingImages.map((img) =>
        fetch(`/api/artwork/${artworkId}/images?imageId=${img.id}`, {
          method: 'DELETE',
        })
      );
      
      await Promise.all(deletePromises);
      showToast('All images removed', 'success');
      await fetchArtwork();
    } catch (err) {
      console.error('Failed to remove all images:', err);
      showToast('Failed to remove all images', 'error');
    }
  };

  const removeAllNewImages = () => {
    if (!confirm('Are you sure you want to remove all new images? This action cannot be undone.')) return;
    
    newImageFiles.forEach((img) => URL.revokeObjectURL(img.preview));
    setNewImageFiles([]);
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
    if (!title.trim()) return;

    setLoading(true);

    try {
      // First, upload any new images directly to R2
      if (newImageFiles.length > 0) {
        showToast('Uploading images...', 'info');
        const uploadedUrls = await Promise.all(
          newImageFiles.map(({ file }) => uploadImageToR2(file, file.name))
        );

        // Add uploaded images to database
        if (uploadedUrls.length > 0) {
          const startOrder = existingImages.length;
          const imagesToAdd = uploadedUrls.map((url, i) => ({
            image_url: url,
            display_order: startOrder + i,
          }));

          const imageRes = await fetch(`/api/artwork/${artworkId}/images`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ images: imagesToAdd }),
          });

          if (!imageRes.ok) {
            console.error('Failed to add images to database');
            showToast('Failed to save images', 'error');
            setLoading(false);
            return;
          }
        }
      }

      // Update artwork metadata
      const res = await fetch(`/api/artwork/${artworkId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description,
          price: price ? parseFloat(price) : null,
          gallery_id: selectedGallery || null,
          password: password.trim() || null,
        }),
      });

      if (res.ok) {
        showToast('Artwork updated successfully!', 'success');
        setTimeout(() => router.push('/admin/posts'), 1000);
      } else {
        const error = await res.json();
        showToast(error.error || 'Update failed', 'error');
      }
    } catch (err) {
      console.error('Submit error:', err);
      showToast('Update failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (isLoadingArtwork) {
    return (
      <AdminLayout>
        <div className="admin-loading-container">
          <Loader2 size={48} className="admin-spinner" />
        </div>
      </AdminLayout>
    );
  }

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
          <h1 className="admin-form-page-title">Edit Artwork</h1>
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
            <div className="admin-form-label" style={{ marginBottom: '1rem' }}>
              Images ({existingImages.length + newImageFiles.length} / 24)
            </div>

            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#57534e', margin: 0 }}>
                    Current Images
                  </h4>
                  <button 
                    type="button" 
                    onClick={removeAllExistingImages} 
                    style={{ fontSize: '0.875rem', color: '#DC2626', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Remove all
                  </button>
                </div>
                <div className="admin-image-preview-grid">
                  {existingImages.map((img, index) => (
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
                      <Image src={img.image_url} alt={`Image ${index + 1}`} fill style={{ objectFit: 'cover' }} />
                      
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
                        gap: '0.25rem'
                      }}>
                        <span style={{ fontSize: '0.875rem' }}>⋮⋮</span>
                        <span>Drag to reorder</span>
                      </div>
                      
                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => deleteExistingImage(img.id)}
                        className="admin-image-remove-button"
                        aria-label="Remove image"
                      >
                        <X size={16} />
                      </button>
                      
                      {/* Image number */}
                      <div style={{ position: 'absolute', bottom: '0.5rem', left: '0.5rem', background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Images to Upload */}
            {newImageFiles.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#57534e', margin: 0 }}>
                    New Images (will be uploaded on save)
                  </h4>
                  <button 
                    type="button" 
                    onClick={removeAllNewImages} 
                    style={{ fontSize: '0.875rem', color: '#DC2626', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Remove all
                  </button>
                </div>
                <div className="admin-image-preview-grid">
                  {newImageFiles.map((img, index) => (
                    <div key={index} className="admin-image-preview-item">
                      {img.isConverting ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                          <Loader2 size={28} className="admin-spinner" />
                        </div>
                      ) : (
                        <Image src={img.preview} alt={`New ${index + 1}`} fill style={{ objectFit: 'cover' }} />
                      )}
                      <button
                        type="button"
                        onClick={() => removeNewImage(index)}
                        className="admin-image-remove-button"
                        aria-label="Remove image"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add More Images Button */}
            {existingImages.length + newImageFiles.length < 24 && (
              <label className="admin-image-upload-area" style={{ marginTop: newImageFiles.length > 0 || existingImages.length > 0 ? '1rem' : 0 }}>
                <div className="admin-image-upload-icon">
                  <Plus size={40} />
                </div>
                <div className="admin-image-upload-text">
                  {existingImages.length === 0 && newImageFiles.length === 0
                    ? 'Click to upload images'
                    : 'Add more images'}
                </div>
                <div className="admin-image-upload-hint">
                  {24 - (existingImages.length + newImageFiles.length)} more images allowed
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleNewImageSelect}
                  style={{ display: 'none' }}
                />
              </label>
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
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="admin-form-input"
              placeholder="Leave empty to inherit from gallery or no protection"
            />
            <p className="admin-form-help-text">
              {selectedGallery && isGalleryProtected 
                ? 'This post will inherit the gallery password. Set a password here to override it for this post only.'
                : 'Set a password to protect this post independently. If in a gallery, this overrides the gallery password.'}
            </p>
          </div>

          {/* Submit */}
            <button
              type="submit"
              disabled={loading || !title.trim()}
            className="admin-submit-button"
            >
              {loading ? (
                <>
                <Loader2 size={20} className="admin-spinner" />
                <span>Updating...</span>
                </>
              ) : (
                <>
                <Check size={20} />
                <span>Update Artwork</span>
                </>
              )}
            </button>
        </form>
      </div>
    </AdminLayout>
  );
}

