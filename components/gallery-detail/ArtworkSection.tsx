import { ArtworkPost, Gallery } from '@/types/database';
import ArtworkGrid from '@/components/ArtworkGrid';

interface ArtworkSectionProps {
  artworks: ArtworkPost[];
  galleryName: string;
  parentUnlocked?: boolean;
  allGalleries?: Gallery[];
  adminView?: boolean;
}

export default function ArtworkSection({ artworks, galleryName, parentUnlocked = false, allGalleries = [], adminView = false }: ArtworkSectionProps) {
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
      <ArtworkGrid artworks={artworks} parentUnlocked={parentUnlocked} allGalleries={allGalleries} adminView={adminView} />
    </div>
  );
}

