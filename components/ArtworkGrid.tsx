import { ArtworkPost } from '@/types/database';
import ArtworkCard from './ArtworkCard';

interface ArtworkGridProps {
  artworks: ArtworkPost[];
  small?: boolean;
}

export default function ArtworkGrid({ artworks, small = false }: ArtworkGridProps) {
  if (artworks.length === 0) {
    return (
      <div className="empty-grid">
        <p>No artworks to display</p>
      </div>
    );
  }

  return (
    <div className={`artwork-grid ${small ? 'artwork-grid-small' : ''}`}>
      {artworks.map((artwork) => (
        <ArtworkCard key={artwork.id} artwork={artwork} />
      ))}
    </div>
  );
}
