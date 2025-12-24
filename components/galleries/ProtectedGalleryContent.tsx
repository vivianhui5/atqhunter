'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Gallery, ArtworkPost } from '@/types/database';
import { getEffectivePassword } from '@/lib/gallery-utils';
import PasswordPrompt from '../PasswordPrompt';
import GalleryHeader from '../gallery-detail/GalleryHeader';
import ArtworkSection from '../gallery-detail/ArtworkSection';
import GalleryBreadcrumbs from './GalleryBreadcrumbs';
import GalleryGrid from './GalleryGrid';
import { Lock } from 'lucide-react';

interface ProtectedGalleryContentProps {
  gallery: Gallery;
  allGalleries: Gallery[];
  childGalleries: (Gallery & { previewImages?: string[]; subfolderCount?: number; artworkCount?: number })[];
  artworks: ArtworkPost[];
  previewImages: string[];
}

export default function ProtectedGalleryContent({
  gallery,
  allGalleries,
  childGalleries,
  artworks,
  previewImages,
}: ProtectedGalleryContentProps) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const searchParams = useSearchParams();
  const effectivePassword = getEffectivePassword(gallery, allGalleries);
  const isPasswordProtected = effectivePassword !== null;
  const hasOwnPassword = gallery.password !== null && gallery.password.length > 0;

  useEffect(() => {
    if (isPasswordProtected) {
      // Check if parent gallery was unlocked (via URL parameter)
      const unlockedGalleryId = searchParams.get('unlockedGallery');
      
      // Check if any ancestor in the chain was unlocked
      let ancestorUnlocked = false;
      if (unlockedGalleryId && !hasOwnPassword) {
        // Check if unlockedGalleryId is an ancestor of this gallery
        let currentParentId = gallery.parent_id;
        while (currentParentId) {
          if (currentParentId === unlockedGalleryId) {
            ancestorUnlocked = true;
            break;
          }
          const parent = allGalleries.find(g => g.id === currentParentId);
          currentParentId = parent?.parent_id || null;
        }
      }
      
      if (ancestorUnlocked) {
        // An ancestor gallery was unlocked and this gallery inherits password - allow access
        setIsUnlocked(true);
      } else {
        // Need to prompt for password
        setShowPasswordPrompt(true);
      }
    } else {
      setIsUnlocked(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gallery.id, gallery.parent_id]);

  const handlePasswordSubmit = async (password: string) => {
    setIsVerifying(true);
    setPasswordError('');

    // Check password
    if (password === effectivePassword) {
      // Password correct - unlock for this page view only (no session storage)
      setIsUnlocked(true);
      setShowPasswordPrompt(false);
      
      // Update URL to include unlockedGallery parameter so children can access
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('unlockedGallery', gallery.id);
        window.history.replaceState({}, '', url.toString());
      }
    } else {
      setPasswordError('Incorrect password. Please try again.');
    }

    setIsVerifying(false);
  };

  // Show lock screen if password protected and not unlocked
  if (isPasswordProtected && !isUnlocked) {
    return (
      <>
        <div className="password-protected-screen">
          <div className="password-protected-content">
            <Lock size={64} style={{ color: '#DC2626', marginBottom: '1.5rem' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1c1917', marginBottom: '0.5rem' }}>
              Password Protected
            </h2>
            <p style={{ fontSize: '1rem', color: '#78716c', marginBottom: '2rem' }}>
              This gallery is password protected. Click below to enter the password.
            </p>
            <button
              onClick={() => setShowPasswordPrompt(true)}
              className="admin-primary-button"
              style={{ minWidth: '200px' }}
            >
              Enter Password
            </button>
          </div>
        </div>

        <PasswordPrompt
          isOpen={showPasswordPrompt}
          onClose={() => setShowPasswordPrompt(false)}
          onSubmit={handlePasswordSubmit}
          title={gallery.name}
          isVerifying={isVerifying}
          error={passwordError}
        />
      </>
    );
  }

  // Show content if unlocked or not password protected
  return (
    <>
      <GalleryBreadcrumbs gallery={gallery} allGalleries={allGalleries} />
      <GalleryHeader 
        name={gallery.name}
        previewImages={previewImages}
        subfolderCount={childGalleries.length}
        artworkCount={artworks.length}
      />
      
      {/* Sub-galleries (folders) */}
      {childGalleries.length > 0 && (
        <div className="gallery-subfolders-section">
          <h2 className="section-subtitle">Folders</h2>
          <GalleryGrid 
            galleries={childGalleries} 
            allGalleries={allGalleries}
            parentUnlocked={isUnlocked && isPasswordProtected}
          />
        </div>
      )}

      {/* Artworks in this gallery */}
      {artworks.length > 0 && (
        <div className="gallery-artworks-section">
          <ArtworkSection 
            artworks={artworks} 
            galleryName={gallery.name}
            parentUnlocked={isUnlocked && isPasswordProtected}
            allGalleries={allGalleries}
          />
        </div>
      )}

      {/* Empty state */}
      {childGalleries.length === 0 && artworks.length === 0 && (
        <div className="empty-state">
          <p>This gallery is empty</p>
        </div>
      )}
    </>
  );
}

