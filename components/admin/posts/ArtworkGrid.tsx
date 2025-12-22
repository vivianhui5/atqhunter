'use client';

import { ArtworkPost } from '@/types/database';
import ArtworkCard from './ArtworkCard';

interface ArtworkGridProps {
  artworks: ArtworkPost[];
  onTogglePin: (id: string, currentPinned: boolean) => void;
  onDelete: (id: string) => void;
}

export default function ArtworkGrid({ artworks, onTogglePin, onDelete }: ArtworkGridProps) {
  if (artworks.length === 0) {
    return (
      <div className="admin-empty-state">
        <p>No artworks yet. Create your first one!</p>
      </div>
    );
  }

  return (
    <div className="admin-artwork-grid">
      {artworks.map((artwork) => (
        <ArtworkCard
          key={artwork.id}
          artwork={artwork}
          onTogglePin={onTogglePin}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

