'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Gallery, ArtworkPost } from '@/types/database';
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
  adminView?: boolean;
}

export default function ProtectedGalleryContent({
  gallery,
  allGalleries,
  childGalleries,
  artworks,
  previewImages,
  adminView = false,
}: ProtectedGalleryContentProps) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const searchParams = useSearchParams();
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
          body: JSON.stringify({ type: 'gallery', id: gallery.id }),
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
  }, [gallery.id, adminView]);

  // Helper to verify if a gallery is unlocked in session storage
  const isGalleryUnlockedInSession = (galleryId: string): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      const unlockedData = sessionStorage.getItem(`unlocked_${galleryId}`);
      if (!unlockedData) return false;
      
      const { passwordHash, timestamp } = JSON.parse(unlockedData);
      // Expire unlocks after 7 days (604800000 ms)
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - timestamp > sevenDays) {
        sessionStorage.removeItem(`unlocked_${galleryId}`);
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
      
      // Check if any ancestor in the chain was unlocked
      const checkUnlock = async () => {
        let ancestorUnlocked = false;
        if (unlockedGalleryId && !hasOwnPassword) {
          // Verify the gallery is actually unlocked in session storage
          if (isGalleryUnlockedInSession(unlockedGalleryId)) {
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
        }
        
        // Also check if this gallery itself is unlocked
        if (!ancestorUnlocked && isGalleryUnlockedInSession(gallery.id)) {
          ancestorUnlocked = true;
        }
        
        if (ancestorUnlocked) {
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
  }, [gallery.id, gallery.parent_id, isPasswordProtected, isCheckingProtection, hasOwnPassword]);

  const handlePasswordSubmit = async (password: string) => {
    setIsVerifying(true);
    setPasswordError('');

    try {
      // Verify password via server-side API
      const response = await fetch('/api/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'gallery', 
          id: gallery.id, 
          password 
        }),
      });

      const data = await response.json();

      if (data.valid) {
        // Password correct - store password hash in session storage
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(`unlocked_${gallery.id}`, JSON.stringify({
            passwordHash: data.passwordHash, // SHA-256 hash from server
            timestamp: Date.now(),
          }));
          
          // Update URL to include unlockedGallery parameter so children can access
          const url = new URL(window.location.href);
          url.searchParams.set('unlockedGallery', gallery.id);
          window.history.replaceState({}, '', url.toString());
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
            adminView={adminView}
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
            adminView={adminView}
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

