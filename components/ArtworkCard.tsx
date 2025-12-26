'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArtworkPost, Gallery } from '@/types/database';
import { isPostPasswordProtected } from '@/lib/gallery-utils';
import { Lock, Copy, Check } from 'lucide-react';
import PasswordPrompt from '@/components/PasswordPrompt';

interface ArtworkCardProps {
  artwork: ArtworkPost;
  allGalleries?: Gallery[];
  parentUnlocked?: boolean;
  adminView?: boolean;
}

export default function ArtworkCard({ artwork, allGalleries = [], parentUnlocked = false, adminView = false }: ArtworkCardProps) {
  const router = useRouter();
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Helper to check if artwork is unlocked in session storage
  const checkUnlockedInSession = (id: string): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      const unlockedData = sessionStorage.getItem(`unlocked_${id}`);
      if (!unlockedData) return false;
      
      const parsed = JSON.parse(unlockedData);
      const { passwordHash, timestamp } = parsed;
      
      // Check if expired (7 days = 604800000 ms)
      // Use a function to get current time to avoid linter issues
      const getCurrentTime = () => (typeof window !== 'undefined' ? Date.now() : 0);
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      const timeDiff = getCurrentTime() - timestamp;
      
      if (timeDiff > sevenDays) {
        sessionStorage.removeItem(`unlocked_${id}`);
        return false;
      }
      
      return !!passwordHash;
    } catch {
      return false;
    }
  };
  
  // Check if artwork or its parent gallery is unlocked
  const isUnlocked = useMemo(() => {
    if (adminView) {
      return true;
    }
    
    // Check if artwork itself is unlocked
    if (checkUnlockedInSession(artwork.id)) {
      return true;
    }
    
    // Check if parent gallery is unlocked (for artworks that inherit password)
    if (!artwork.hasOwnPassword && artwork.gallery_id) {
      // Check if gallery is unlocked
      if (checkUnlockedInSession(artwork.gallery_id)) {
        return true;
      }
      
      // Check ancestor galleries
      let currentGalleryId: string | null = artwork.gallery_id;
      while (currentGalleryId) {
        const gallery = allGalleries.find(g => g.id === currentGalleryId);
        if (!gallery) break;
        
        if (checkUnlockedInSession(gallery.id)) {
          return true;
        }
        
        currentGalleryId = gallery.parent_id;
      }
    }
    
    return false;
  }, [artwork.id, artwork.gallery_id, artwork.hasOwnPassword, allGalleries, adminView]);
  
  const firstImage = artwork.images?.sort((a, b) => a.display_order - b.display_order)[0];
  // Use protection flags from server if available, otherwise fall back to client-side check
  const isProtected = artwork.password_protected !== undefined 
    ? artwork.password_protected 
    : isPostPasswordProtected(artwork, allGalleries);
  const hasOwnPassword = artwork.hasOwnPassword !== undefined
    ? artwork.hasOwnPassword
    : (artwork.password !== null && artwork.password.length > 0);
  
  // Show lock overlay if:
  // - Not in admin view AND
  // - Post is password protected AND
  // - Not unlocked (either directly or via parent)
  const showLockOverlay = !adminView && isProtected && !isUnlocked;
  
  // Build artwork URL - if parent is unlocked and artwork inherits password, pass gallery ID
  // Also preserve any existing unlockedGallery parameter from current URL
  let artworkUrl = `/artwork/${artwork.id}`;
  if (!adminView && parentUnlocked && !hasOwnPassword && artwork.gallery_id) {
    // Get current unlocked gallery from URL if available, otherwise use artwork's gallery
    const currentUrl = typeof window !== 'undefined' ? window.location.search : '';
    const params = new URLSearchParams(currentUrl);
    const existingUnlocked = params.get('unlockedGallery');
    // Use the highest level unlocked gallery (existing or artwork's gallery)
    const unlockedId = existingUnlocked || artwork.gallery_id;
    artworkUrl = `${artworkUrl}?unlockedGallery=${unlockedId}`;
  } else if (!adminView && typeof window !== 'undefined') {
    // Preserve existing unlockedGallery parameter if present
    const currentUrl = window.location.search;
    const params = new URLSearchParams(currentUrl);
    const existingUnlocked = params.get('unlockedGallery');
    if (existingUnlocked) {
      artworkUrl = `${artworkUrl}?unlockedGallery=${existingUnlocked}`;
    }
  }
  
  const handlePasswordSubmit = async (password: string) => {
    setIsVerifying(true);
    setPasswordError('');

    try {
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
        // Password correct - store in session storage
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(`unlocked_${artwork.id}`, JSON.stringify({
            passwordHash: data.passwordHash,
            timestamp: Date.now(),
          }));
        }
        
        setShowPasswordPrompt(false);
        // Navigate to artwork page
        router.push(artworkUrl);
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
    <div 
      className="artwork-card" 
      style={{ position: 'relative', cursor: showLockOverlay ? 'pointer' : 'default' }}
      onClick={handleCardClick}
    >
      {/* Image - Clickable to artwork detail */}
      <div style={{ position: 'relative' }}>
        <Link href={artworkUrl} className="artwork-card-image-link" onClick={showLockOverlay ? (e) => e.preventDefault() : undefined}>
        {firstImage ? (
          <div className="artwork-card-image">
          <Image
            src={firstImage.image_url}
            alt={artwork.title}
            fill
              className="image-content"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          </div>
        ) : (
          <div className="artwork-card-image-empty">
            <span>No Image</span>
          </div>
        )}
      </Link>
        
        {/* Password Protection Overlay - only covers image area */}
        {showLockOverlay && (
          <div className="gallery-lock-overlay-image-only">
            <Lock size={32} />
            <span className="gallery-lock-text">Password Protected</span>
          </div>
        )}
      </div>
        
      {/* Info Section */}
      <div className="artwork-card-info">
        <Link href={artworkUrl} className="artwork-card-title-link">
          <h3 className="artwork-card-title">{artwork.title}</h3>
        </Link>
        
        {/* Show ID - always visible, not blurred */}
        <div className="artwork-card-id">
          <span>ID: {artwork.id}</span>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigator.clipboard.writeText(artwork.id);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="copy-id-button"
            title="Copy ID"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
          </button>
        </div>
        
        <div className="artwork-card-gallery-wrapper">
          <span className="gallery-label">From Gallery:</span>{' '}
      {artwork.gallery ? (
        <Link 
          href="/collection"
              className="artwork-card-gallery-link"
        >
              {artwork.gallery.name}
        </Link>
      ) : (
            <span className="artwork-card-gallery-link" style={{ color: '#78716c', cursor: 'default' }}>--</span>
      )}
        </div>
      </div>
    </div>
    
    <PasswordPrompt
      isOpen={showPasswordPrompt}
      onClose={() => {
        setShowPasswordPrompt(false);
        setPasswordError('');
      }}
      onSubmit={handlePasswordSubmit}
      title={artwork.title}
      isVerifying={isVerifying}
      error={passwordError}
    />
    </>
  );
}
