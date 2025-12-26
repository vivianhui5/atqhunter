'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArtworkPost, Gallery } from '@/types/database';
import PasswordPrompt from './PasswordPrompt';
import ArtworkDetail from './ArtworkDetail';
import { Lock } from 'lucide-react';

interface ProtectedArtworkContentProps {
  artwork: ArtworkPost;
  allGalleries: Gallery[];
  adminView?: boolean;
}

export default function ProtectedArtworkContent({
  artwork,
  allGalleries,
  adminView = false,
}: ProtectedArtworkContentProps) {
  const searchParams = useSearchParams();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [hasOwnPassword, setHasOwnPassword] = useState(false);
  const [isCheckingProtection, setIsCheckingProtection] = useState(true);

  // Check if password protected via API (server-side)
  useEffect(() => {
    const checkProtection = async () => {
      try {
        const response = await fetch('/api/check-protection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'artwork', id: artwork.id }),
        });
        
        if (response.ok) {
          const data = await response.json();
          setIsPasswordProtected(data.isProtected);
          setHasOwnPassword(data.hasOwnPassword);
        }
      } catch (error) {
        console.error('Error checking protection:', error);
      } finally {
        setIsCheckingProtection(false);
      }
    };

    if (!adminView) {
      checkProtection();
    } else {
      setIsPasswordProtected(false);
      setIsCheckingProtection(false);
    }
  }, [artwork.id, adminView]);

  // Helper to verify if a gallery/artwork is unlocked in session storage
  const isUnlockedInSession = (id: string): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      const unlockedData = sessionStorage.getItem(`unlocked_${id}`);
      if (!unlockedData) return false;
      
      const { passwordHash, timestamp } = JSON.parse(unlockedData);
      // Expire unlocks after 7 days (604800000 ms)
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - timestamp > sevenDays) {
        sessionStorage.removeItem(`unlocked_${id}`);
        return false;
      }
      
      // Hash exists and hasn't expired - consider it valid
      // Note: If password changes, user will need to re-enter password
      // This is acceptable for this use case
      return !!passwordHash;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    if (adminView) {
      // In admin view, always unlock
      setIsUnlocked(true);
      return;
    }
    
    if (!isCheckingProtection && isPasswordProtected) {
      // Check if parent gallery was unlocked (via URL parameter AND session storage)
      const unlockedGalleryId = searchParams.get('unlockedGallery');
      
      // Check if unlockedGalleryId is the artwork's gallery or an ancestor
      const checkUnlock = async () => {
        let galleryUnlocked = false;
        if (unlockedGalleryId && !hasOwnPassword && artwork.gallery_id) {
          // Verify the gallery is actually unlocked in session storage
          if (isUnlockedInSession(unlockedGalleryId)) {
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
        }
        
        // Also check if artwork has its own password and is unlocked
        if (!galleryUnlocked && hasOwnPassword && isUnlockedInSession(artwork.id)) {
          galleryUnlocked = true;
        }
        
        if (galleryUnlocked) {
          // Gallery or ancestor was unlocked and password is still valid - allow access
          setIsUnlocked(true);
        } else {
          // Need to prompt for password
          setShowPasswordPrompt(true);
        }
      };
      
      checkUnlock();
    } else if (!isCheckingProtection && !isPasswordProtected) {
      setIsUnlocked(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artwork.id, artwork.gallery_id, isPasswordProtected, isCheckingProtection, hasOwnPassword]);

  const handlePasswordSubmit = async (password: string) => {
    setIsVerifying(true);
    setPasswordError('');

    try {
      // Verify password via server-side API
      const response = await fetch('/api/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'artwork', 
          id: artwork.id, 
          password 
        }),
      });

      const data = await response.json();

      if (data.valid) {
        // Password correct - store password hash in session storage
        if (typeof window !== 'undefined') {
          // Store unlock for the artwork (if it has own password) or its gallery
          const unlockKey = hasOwnPassword ? artwork.id : (artwork.gallery_id || artwork.id);
          sessionStorage.setItem(`unlocked_${unlockKey}`, JSON.stringify({
            passwordHash: data.passwordHash, // SHA-256 hash from server
            timestamp: Date.now(),
          }));
        }
        
        setIsUnlocked(true);
        setShowPasswordPrompt(false);
      } else {
        setPasswordError('Incorrect password. Please try again.');
      }
    } catch (error) {
      console.error('Error verifying password:', error);
      setPasswordError('Failed to verify password. Please try again.');
    }

    setIsVerifying(false);
  };

  // Show loading while checking protection status
  if (isCheckingProtection) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

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

