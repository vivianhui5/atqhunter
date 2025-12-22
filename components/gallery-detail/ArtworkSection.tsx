import { ArtworkPost } from '@/types/database';
import ArtworkGrid from '@/components/ArtworkGrid';

interface ArtworkSectionProps {
  artworks: ArtworkPost[];
  galleryName: string;
}

export default function ArtworkSection({ artworks, galleryName }: ArtworkSectionProps) {
  if (artworks.length === 0) {
    return (
      <div className="empty-artworks">
        <p>No artworks in this gallery yet</p>
      </div>
    );
  }

  return (
    <div className="artworks-section">
      <div className="section-meta">
        <span className="artwork-count">{artworks.length} Artworks</span>
      </div>
      <ArtworkGrid artworks={artworks} />
    </div>
  );
}

