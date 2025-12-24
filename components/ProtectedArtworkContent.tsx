'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArtworkPost, Gallery } from '@/types/database';
import { getEffectivePasswordForPost } from '@/lib/gallery-utils';
import PasswordPrompt from './PasswordPrompt';
import ArtworkDetail from './ArtworkDetail';
import { Lock } from 'lucide-react';

interface ProtectedArtworkContentProps {
  artwork: ArtworkPost;
  allGalleries: Gallery[];
}

export default function ProtectedArtworkContent({
  artwork,
  allGalleries,
}: ProtectedArtworkContentProps) {
  const searchParams = useSearchParams();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const effectivePassword = getEffectivePasswordForPost(artwork, allGalleries);
  const isPasswordProtected = effectivePassword !== null;
  const hasOwnPassword = artwork.password !== null && artwork.password.length > 0;

  useEffect(() => {
    if (isPasswordProtected) {
      // Check if parent gallery was unlocked (via URL parameter)
      const unlockedGalleryId = searchParams.get('unlockedGallery');
      
      // Check if unlockedGalleryId is the artwork's gallery or an ancestor
      let galleryUnlocked = false;
      if (unlockedGalleryId && !hasOwnPassword && artwork.gallery_id) {
        // Check if unlockedGalleryId is the artwork's gallery or an ancestor
        if (artwork.gallery_id === unlockedGalleryId) {
          galleryUnlocked = true;
        } else {
          // Check if unlockedGalleryId is an ancestor of the artwork's gallery
          let currentGalleryId: string | null = artwork.gallery_id;
          while (currentGalleryId) {
            const gallery = allGalleries.find(g => g.id === currentGalleryId);
            if (!gallery) break;
            if (gallery.id === unlockedGalleryId || gallery.parent_id === unlockedGalleryId) {
              galleryUnlocked = true;
              break;
            }
            currentGalleryId = gallery.parent_id;
          }
        }
      }
      
      if (galleryUnlocked) {
        // Gallery or ancestor was unlocked and artwork inherits password - allow access
        setIsUnlocked(true);
      } else {
        // Need to prompt for password
        setShowPasswordPrompt(true);
      }
    } else {
      setIsUnlocked(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artwork.id, artwork.gallery_id]);

  const handlePasswordSubmit = async (password: string) => {
    setIsVerifying(true);
    setPasswordError('');

    // Check password - can be the artwork's own password or inherited from gallery
    if (password === effectivePassword) {
      // Password correct - unlock for this page view only (no session storage)
      setIsUnlocked(true);
      setShowPasswordPrompt(false);
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
              This artwork is password protected. Click below to enter the password.
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
          title={artwork.title}
          isVerifying={isVerifying}
          error={passwordError}
        />
      </>
    );
  }

  // Show content if unlocked or not password protected
  return (
    <Suspense fallback={<div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
      <ArtworkDetail artwork={artwork} />
    </Suspense>
  );
}

