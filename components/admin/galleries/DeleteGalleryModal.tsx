'use client';

import { X, AlertTriangle } from 'lucide-react';

interface DeleteGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  galleryName: string;
  artworkCount: number;
  subGalleryCount: number;
  isDeleting?: boolean;
}

export default function DeleteGalleryModal({
  isOpen,
  onClose,
  onConfirm,
  galleryName,
  artworkCount,
  subGalleryCount,
  isDeleting = false,
}: DeleteGalleryModalProps) {
  if (!isOpen) return null;

  const hasContents = artworkCount > 0 || subGalleryCount > 0;

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={24} style={{ color: '#DC2626' }} />
            <h2>Delete Gallery</h2>
          </div>
          <button 
            onClick={onClose} 
            className="admin-modal-close" 
            aria-label="Close" 
            title="Close"
            disabled={isDeleting}
          >
            <X size={20} />
          </button>
        </div>

        <div className="admin-modal-content">
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '1rem', lineHeight: '1.6', color: '#57534e', marginBottom: '1rem' }}>
              Are you sure you want to delete <strong>&ldquo;{galleryName}&rdquo;</strong>?
            </p>
            
            {hasContents && (
              <div style={{ 
                background: '#FEF2F2', 
                border: '1px solid #FECACA', 
                borderRadius: '8px', 
                padding: '1rem',
                marginBottom: '1rem'
              }}>
                <p style={{ 
                  fontSize: '0.875rem', 
                  fontWeight: 600, 
                  color: '#DC2626',
                  marginBottom: '0.5rem'
                }}>
                  ⚠️ Warning: This action cannot be undone
                </p>
                <ul style={{ 
                  fontSize: '0.875rem', 
                  color: '#991B1B',
                  margin: 0,
                  paddingLeft: '1.25rem',
                  lineHeight: '1.6'
                }}>
                  {subGalleryCount > 0 && (
                    <li>{subGalleryCount} {subGalleryCount === 1 ? 'sub-gallery' : 'sub-galleries'} will be deleted</li>
                  )}
                  {artworkCount > 0 && (
                    <li>{artworkCount} {artworkCount === 1 ? 'artwork' : 'artworks'} will be removed from galleries</li>
                  )}
                </ul>
              </div>
            )}
            
            <p style={{ 
              fontSize: '0.875rem', 
              color: '#78716c',
              fontWeight: 600
            }}>
              This folder and all contents inside will be deleted. Can&apos;t be undone.
            </p>
          </div>

          <div className="admin-modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="admin-secondary-button"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="admin-primary-button"
              disabled={isDeleting}
              style={{ 
                background: '#DC2626',
                color: 'white'
              }}
            >
              {isDeleting ? 'Deleting...' : 'Delete Gallery'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

