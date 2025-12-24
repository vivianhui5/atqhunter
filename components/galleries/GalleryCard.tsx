'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Gallery } from '@/types/database';
import { getEffectivePassword } from '@/lib/gallery-utils';
import { Lock } from 'lucide-react';

interface GalleryCardProps {
  gallery: Gallery & { previewImages?: string[]; subfolderCount?: number; artworkCount?: number };
  allGalleries?: Gallery[];
  parentUnlocked?: boolean;
}

export default function GalleryCard({ gallery, allGalleries = [], parentUnlocked = false }: GalleryCardProps) {
  const previewImages = gallery.previewImages || [];
  const subfolderCount = gallery.subfolderCount || 0;
  const artworkCount = gallery.artworkCount || 0;
  const effectivePassword = getEffectivePassword(gallery, allGalleries);
  const isPasswordProtected = effectivePassword !== null;
  const hasOwnPassword = gallery.password !== null && gallery.password.length > 0;
  
  // Show lock overlay if:
  // - Gallery is password protected AND
  // - Gallery has its own password (parent unlock doesn't bypass) OR
  // - Parent is not unlocked (if gallery inherits password)
  const showLockOverlay = isPasswordProtected && (hasOwnPassword || !parentUnlocked);
  
  // Build gallery URL - if parent is unlocked and gallery inherits password, pass unlocked parent ID
  // Also preserve any existing unlockedGallery parameter from current URL
  let galleryUrl = `/galleries/${gallery.id}`;
  if (parentUnlocked && !hasOwnPassword && gallery.parent_id) {
    // Get current unlocked gallery from URL if available, otherwise use parent
    const currentUrl = typeof window !== 'undefined' ? window.location.search : '';
    const params = new URLSearchParams(currentUrl);
    const existingUnlocked = params.get('unlockedGallery');
    // Use the highest level unlocked gallery (existing or parent)
    const unlockedId = existingUnlocked || gallery.parent_id;
    galleryUrl = `${galleryUrl}?unlockedGallery=${unlockedId}`;
  } else if (typeof window !== 'undefined') {
    // Preserve existing unlockedGallery parameter if present
    const currentUrl = window.location.search;
    const params = new URLSearchParams(currentUrl);
    const existingUnlocked = params.get('unlockedGallery');
    if (existingUnlocked) {
      galleryUrl = `${galleryUrl}?unlockedGallery=${existingUnlocked}`;
    }
  }

  return (
    <Link href={galleryUrl} className="gallery-card" style={{ position: 'relative' }}>
      {/* Image Preview Grid */}
      <div style={{ position: 'relative' }}>
      {previewImages.length > 0 ? (
        <div className="gallery-preview-grid">
          {previewImages.slice(0, 4).map((imageUrl, index) => (
            <div key={index} className="gallery-preview-image">
              <Image
                src={imageUrl}
                alt={`${gallery.name} preview ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            </div>
          ))}
          {/* Fill empty slots with placeholder */}
          {Array.from({ length: 4 - previewImages.length }).map((_, index) => (
            <div key={`empty-${index}`} className="gallery-preview-empty" />
          ))}
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
            <span className="gallery-lock-text">Password Protected</span>
          </div>
        )}
      </div>

      {/* Gallery Info */}
      <div className="gallery-card-content">
        <div className="gallery-card-title-wrapper">
          <h2 className="gallery-card-title">{gallery.name}</h2>
        </div>
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
  );
}

