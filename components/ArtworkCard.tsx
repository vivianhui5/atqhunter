'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArtworkPost, Gallery } from '@/types/database';
import { isPostPasswordProtected } from '@/lib/gallery-utils';
import { Lock } from 'lucide-react';

interface ArtworkCardProps {
  artwork: ArtworkPost;
  allGalleries?: Gallery[];
  parentUnlocked?: boolean;
}

export default function ArtworkCard({ artwork, allGalleries = [], parentUnlocked = false }: ArtworkCardProps) {
  const firstImage = artwork.images?.sort((a, b) => a.display_order - b.display_order)[0];
  const isProtected = isPostPasswordProtected(artwork, allGalleries);
  const hasOwnPassword = artwork.password !== null && artwork.password.length > 0;
  
  // Show lock overlay if:
  // - Post is password protected AND
  // - Post has its own password (parent unlock doesn't bypass) OR
  // - Parent is not unlocked (if post inherits password)
  const showLockOverlay = isProtected && (hasOwnPassword || !parentUnlocked);
  
  // Build artwork URL - if parent is unlocked and artwork inherits password, pass gallery ID
  // Also preserve any existing unlockedGallery parameter from current URL
  let artworkUrl = `/artwork/${artwork.id}`;
  if (parentUnlocked && !hasOwnPassword && artwork.gallery_id) {
    // Get current unlocked gallery from URL if available, otherwise use artwork's gallery
    const currentUrl = typeof window !== 'undefined' ? window.location.search : '';
    const params = new URLSearchParams(currentUrl);
    const existingUnlocked = params.get('unlockedGallery');
    // Use the highest level unlocked gallery (existing or artwork's gallery)
    const unlockedId = existingUnlocked || artwork.gallery_id;
    artworkUrl = `${artworkUrl}?unlockedGallery=${unlockedId}`;
  } else if (typeof window !== 'undefined') {
    // Preserve existing unlockedGallery parameter if present
    const currentUrl = window.location.search;
    const params = new URLSearchParams(currentUrl);
    const existingUnlocked = params.get('unlockedGallery');
    if (existingUnlocked) {
      artworkUrl = `${artworkUrl}?unlockedGallery=${existingUnlocked}`;
    }
  }

  return (
    <div className="artwork-card" style={{ position: 'relative' }}>
      {/* Image - Clickable to artwork detail */}
      <div style={{ position: 'relative' }}>
        <Link href={artworkUrl} className="artwork-card-image-link">
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
        
        <div className="artwork-card-gallery-wrapper">
          <span className="gallery-label">From Gallery:</span>{' '}
      {artwork.gallery ? (
        <Link 
          href={`/galleries/${artwork.gallery.id}`}
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
  );
}
