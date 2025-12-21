import { ArtworkPost } from '@/types/database';
import ArtworkCard from './ArtworkCard';

interface ArtworkGridProps {
  artworks: ArtworkPost[];
  small?: boolean;
}

export default function ArtworkGrid({ artworks, small = false }: ArtworkGridProps) {
  if (artworks.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-stone-400 text-sm tracking-wide">
          No artwork available yet
        </p>
      </div>
    );
  }

  return (
    <div className={`grid ${small ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 md:gap-3' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8'}`}>
      {artworks.map((artwork, index) => (
        <ArtworkCard 
          key={artwork.id} 
          artwork={artwork} 
          index={index}
          featured={artwork.is_pinned}
          small={small}
        />
      ))}
    </div>
  );
}
