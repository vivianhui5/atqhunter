'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Gallery } from '@/types/database';
import { getEffectivePassword } from '@/lib/gallery-utils';
import { Lock, Copy, Check } from 'lucide-react';
import PasswordPrompt from '@/components/PasswordPrompt';

interface GalleryCardProps {
  gallery: Gallery & { coverImageUrl?: string; previewImages?: string[]; subfolderCount?: number; artworkCount?: number };
  allGalleries?: Gallery[];
  parentUnlocked?: boolean;
  adminView?: boolean;
}

export default function GalleryCard({ gallery, allGalleries = [], parentUnlocked = false, adminView = false }: GalleryCardProps) {
  const router = useRouter();
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Helper to check if gallery is unlocked in session storage
  const checkUnlockedInSession = (galleryId: string): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      const unlockedData = sessionStorage.getItem(`unlocked_${galleryId}`);
      if (!unlockedData) return false;
      
      const parsed = JSON.parse(unlockedData);
      const { passwordHash, timestamp } = parsed;
      
      // Check if expired (7 days = 604800000 ms)
      // Use a function to get current time to avoid linter issues
      const getCurrentTime = () => (typeof window !== 'undefined' ? Date.now() : 0);
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      const timeDiff = getCurrentTime() - timestamp;
      
      if (timeDiff > sevenDays) {
        sessionStorage.removeItem(`unlocked_${galleryId}`);
        return false;
      }
      
      return !!passwordHash;
    } catch {
      return false;
    }
  };
  
  // Check if gallery or its parent is unlocked
  const isUnlocked = useMemo(() => {
    if (adminView) {
      return true;
    }
    
    // Check if gallery itself is unlocked
    if (checkUnlockedInSession(gallery.id)) {
      return true;
    }
    
    // Check if parent gallery is unlocked (for galleries that inherit password)
    if (!gallery.hasOwnPassword && gallery.parent_id) {
      let currentParentId: string | null = gallery.parent_id;
      while (currentParentId) {
        if (checkUnlockedInSession(currentParentId)) {
          return true;
        }
        
        const parent = allGalleries.find(g => g.id === currentParentId);
        currentParentId = parent?.parent_id || null;
      }
    }
    
    return false;
  }, [gallery.id, gallery.parent_id, gallery.hasOwnPassword, allGalleries, adminView]);
  
  const coverImageUrl = gallery.coverImageUrl || gallery.cover_image_url;
  const previewImages = gallery.previewImages || [];
  // Use cover image if available, otherwise fall back to first preview image
  const displayImage = coverImageUrl || previewImages[0] || null;
  const subfolderCount = gallery.subfolderCount || 0;
  const artworkCount = gallery.artworkCount || 0;
  // Use protection flags from server (should always be set)
  // Fall back to client-side check only if flags are missing (shouldn't happen)
  const isPasswordProtected = gallery.password_protected !== undefined
    ? gallery.password_protected
    : (getEffectivePassword(gallery, allGalleries) !== null);
  const hasOwnPassword = gallery.hasOwnPassword !== undefined
    ? gallery.hasOwnPassword
    : (gallery.password !== null && gallery.password.length > 0);
  
  // Show lock overlay if:
  // - Not in admin view AND
  // - Gallery is password protected AND
  // - Not unlocked (either directly or via parent)
  const showLockOverlay = !adminView && isPasswordProtected && !isUnlocked;
  
  // Gallery cards link to collection page with gallery filter
  const galleryUrl = `/?gallery=${gallery.id}`;
  
  const handlePasswordSubmit = async (password: string) => {
    setIsVerifying(true);
    setPasswordError('');

    try {
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
        // Password correct - store in session storage
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(`unlocked_${gallery.id}`, JSON.stringify({
            passwordHash: data.passwordHash,
            timestamp: Date.now(),
          }));
          
          // Update URL to include unlockedGallery parameter
          const url = new URL(window.location.href);
          url.searchParams.set('unlockedGallery', gallery.id);
          window.history.replaceState({}, '', url.toString());
        }
        
        setShowPasswordPrompt(false);
        // Navigate to gallery page with unlockedGallery parameter
        // galleryUrl already has ?gallery=id, so we need to append with &
        const separator = galleryUrl.includes('?') ? '&' : '?';
        router.push(`${galleryUrl}${separator}unlockedGallery=${gallery.id}`);
      } else {
        setPasswordError('Incorrect password. Please try again.');
      }
    } catch (error) {
      console.error('Error verifying password:', error);
      setPasswordError('Failed to verify password. Please try again.');
    }

    setIsVerifying(false);
  };
  
  const handleCardClick = (e: React.MouseEvent) => {
    if (showLockOverlay && !adminView) {
      e.preventDefault();
      e.stopPropagation();
      setShowPasswordPrompt(true);
    }
  };

  return (
    <>
    <Link 
      href={galleryUrl} 
      className="gallery-card" 
      style={{ position: 'relative', cursor: showLockOverlay ? 'pointer' : 'default' }}
      onClick={handleCardClick}
    >
      {/* Cover Image */}
      <div style={{ position: 'relative' }}>
      {displayImage ? (
        <div className="gallery-cover-image">
          <Image
            src={displayImage}
            alt={gallery.name}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
        </div>
      ) : (
        <div className="gallery-preview-empty-all">
          <span>None</span>
        </div>
      )}

        {/* Password Protection Overlay - only covers image area */}
        {showLockOverlay && (
          <div className="gallery-lock-overlay-image-only">
            <Lock size={32} />
            <span className="gallery-lock-text">ID: {gallery.id} is password protected</span>
          </div>
        )}
      </div>

      {/* Gallery Info */}
      <div className="gallery-card-content">
        <div className="gallery-card-title-wrapper">
          <div className="gallery-card-header">
            <span className="gallery-card-badge">Gallery</span>
            <h2 className="gallery-card-title">{gallery.name}</h2>
          </div>
        </div>
        {/* Show ID - always visible, not blurred, below the title */}
        <span className="gallery-card-arrow">→</span>
        <div className="gallery-card-meta">
          {subfolderCount > 0 && (
            <span className="gallery-card-meta-item">
              {subfolderCount} {subfolderCount === 1 ? 'folder' : 'folders'}
            </span>
          )}
          {subfolderCount > 0 && artworkCount > 0 && (
            <span className="gallery-card-meta-separator">•</span>
          )}
          {artworkCount > 0 && (
            <span className="gallery-card-meta-item">
              {artworkCount} {artworkCount === 1 ? 'artwork' : 'artworks'}
            </span>
          )}
          {subfolderCount === 0 && artworkCount === 0 && (
            <span className="gallery-card-label">Empty</span>
          )}
        </div>
      </div>
    </Link>
    
    <PasswordPrompt
      isOpen={showPasswordPrompt}
      onClose={() => {
        setShowPasswordPrompt(false);
        setPasswordError('');
      }}
      onSubmit={handlePasswordSubmit}
      title={gallery.name}
      isVerifying={isVerifying}
      error={passwordError}
    />
    </>
  );
}

