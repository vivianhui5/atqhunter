import Image from 'next/image';
import { Gallery, ArtworkPost } from '@/types/database';

interface GalleryHeaderProps {
  name: string;
  previewImages?: string[];
  subfolderCount?: number;
  artworkCount?: number;
}

export default function GalleryHeader({ 
  name, 
  previewImages = [], 
  subfolderCount = 0,
  artworkCount = 0 
}: GalleryHeaderProps) {
  const hasContent = previewImages.length > 0 || subfolderCount > 0 || artworkCount > 0;

  return (
    <div className="gallery-detail-header">
      <h1 className="gallery-detail-title">{name}</h1>
      
      {/* Preview Images */}
      {previewImages.length > 0 && (
        <div className="gallery-preview-section">
          <div className="gallery-preview-grid-header">
            {previewImages.slice(0, 4).map((imageUrl, index) => (
              <div key={index} className="gallery-preview-image-header">
                <Image
                  src={imageUrl}
                  alt={`${name} preview ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 25vw, 200px"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Folder Structure Info */}
      {hasContent && (
        <div className="gallery-structure-info">
          {subfolderCount > 0 && (
            <span className="structure-item">
              {subfolderCount} {subfolderCount === 1 ? 'folder' : 'folders'}
            </span>
          )}
          {subfolderCount > 0 && artworkCount > 0 && (
            <span className="structure-separator">•</span>
          )}
          {artworkCount > 0 && (
            <span className="structure-item">
              {artworkCount} {artworkCount === 1 ? 'artwork' : 'artworks'}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

