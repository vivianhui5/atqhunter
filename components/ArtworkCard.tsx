import Image from 'next/image';
import Link from 'next/link';
import { ArtworkPost } from '@/types/database';

interface ArtworkCardProps {
  artwork: ArtworkPost;
}

export default function ArtworkCard({ artwork }: ArtworkCardProps) {
  const firstImage = artwork.images?.sort((a, b) => a.display_order - b.display_order)[0];

  return (
    <div className="artwork-card">
      {/* Image - Clickable to artwork detail */}
      <Link href={`/artwork/${artwork.id}`} className="artwork-card-image-link">
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
        
      {/* Info Section */}
      <div className="artwork-card-info">
        <Link href={`/artwork/${artwork.id}`} className="artwork-card-title-link">
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
