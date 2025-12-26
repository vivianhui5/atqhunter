'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, Check } from 'lucide-react';

interface CoverImageSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  galleryId: string;
  currentCoverImage: string | null;
  availableImages: string[];
  onSelect: (imageUrl: string | null) => Promise<void>;
}

export default function CoverImageSelector({
  isOpen,
  onClose,
  galleryId,
  currentCoverImage,
  availableImages,
  onSelect,
}: CoverImageSelectorProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(currentCoverImage);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSelect(selectedImage);
      onClose();
    } catch (error) {
      console.error('Error saving cover image:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    setIsSaving(true);
    try {
      await onSelect(null);
      setSelectedImage(null);
      onClose();
    } catch (error) {
      console.error('Error removing cover image:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
        <div className="admin-modal-header">
          <h2>Select Cover Image</h2>
          <button onClick={onClose} className="admin-modal-close" aria-label="Close" title="Close">
            <X size={20} />
          </button>
        </div>

        <div className="admin-modal-content">
          <p style={{ marginBottom: '1.5rem', color: '#78716c', fontSize: '0.875rem' }}>
            Choose an image from this gallery to use as the cover photo. The cover image will be displayed on gallery cards.
          </p>

          {availableImages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#78716c' }}>
              <p>No images available in this gallery</p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
              gap: '1rem',
              maxHeight: '400px',
              overflowY: 'auto',
              padding: '0.5rem'
            }}>
              {/* Option to remove cover image */}
              <div
                onClick={() => setSelectedImage(null)}
                style={{
                  aspectRatio: '1',
                  border: selectedImage === null ? '3px solid #3b82f6' : '2px solid #e5e7eb',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  background: '#f9fafb',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (selectedImage !== null) {
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedImage !== null) {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }
                }}
              >
                {selectedImage === null && (
                  <div style={{
                    position: 'absolute',
                    top: '0.5rem',
                    right: '0.5rem',
                    background: '#3b82f6',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}>
                    <Check size={14} />
                  </div>
                )}
                <X size={32} style={{ color: '#9ca3af', marginBottom: '0.5rem' }} />
                <span style={{ fontSize: '0.75rem', color: '#6b7280', textAlign: 'center' }}>Remove Cover</span>
              </div>

              {/* Available images */}
              {availableImages.map((imageUrl, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedImage(imageUrl)}
                  style={{
                    aspectRatio: '1',
                    border: selectedImage === imageUrl ? '3px solid #3b82f6' : '2px solid #e5e7eb',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.2s',
                    background: '#f9fafb'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedImage !== imageUrl) {
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedImage !== imageUrl) {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }
                  }}
                >
                  {selectedImage === imageUrl && (
                    <div style={{
                      position: 'absolute',
                      top: '0.5rem',
                      right: '0.5rem',
                      background: '#3b82f6',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      zIndex: 10
                    }}>
                      <Check size={14} />
                    </div>
                  )}
                  <Image
                    src={imageUrl}
                    alt={`Cover option ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="150px"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="admin-modal-footer">
          <button
            onClick={onClose}
            className="admin-secondary-button"
            disabled={isSaving}
          >
            Cancel
          </button>
          {currentCoverImage && (
            <button
              onClick={handleRemove}
              className="admin-secondary-button"
              disabled={isSaving}
              style={{ marginRight: '0.5rem' }}
            >
              Remove Cover
            </button>
          )}
          <button
            onClick={handleSave}
            className="admin-primary-button"
            disabled={isSaving || availableImages.length === 0}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

