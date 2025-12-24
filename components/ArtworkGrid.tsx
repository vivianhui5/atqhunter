import { ArtworkPost, Gallery } from '@/types/database';
import ArtworkCard from './ArtworkCard';

interface ArtworkGridProps {
  artworks: ArtworkPost[];
  small?: boolean;
  parentUnlocked?: boolean;
  allGalleries?: Gallery[];
}

export default function ArtworkGrid({ artworks, small = false, parentUnlocked = false, allGalleries = [] }: ArtworkGridProps) {
  if (artworks.length === 0) {
    return (
      <div className="empty-grid">
        <p>No antiques to display</p>
      </div>
    );
  }

  return (
    <div className={`artwork-grid ${small ? 'artwork-grid-small' : ''}`}>
      {artworks.map((artwork) => (
        <ArtworkCard 
          key={artwork.id} 
          artwork={artwork} 
          allGalleries={allGalleries}
          parentUnlocked={parentUnlocked}
        />
      ))}
    </div>
  );
}
