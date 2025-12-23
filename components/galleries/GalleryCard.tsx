import Link from 'next/link';
import Image from 'next/image';
import { Gallery } from '@/types/database';

interface GalleryCardProps {
  gallery: Gallery & { previewImages?: string[]; subfolderCount?: number; artworkCount?: number };
}

export default function GalleryCard({ gallery }: GalleryCardProps) {
  const previewImages = gallery.previewImages || [];
  const subfolderCount = gallery.subfolderCount || 0;
  const artworkCount = gallery.artworkCount || 0;

  return (
    <Link href={`/galleries/${gallery.id}`} className="gallery-card">
      {/* Image Preview Grid */}
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

