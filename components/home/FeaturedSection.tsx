import { ArtworkPost } from '@/types/database';
import ArtworkGrid from '@/components/ArtworkGrid';

interface FeaturedSectionProps {
  artworks: ArtworkPost[];
}

export default function FeaturedSection({ artworks }: FeaturedSectionProps) {
  if (artworks.length === 0) return null;

  return (
    <section className="section-featured">
      <h2 className="section-title">Featured</h2>
      <ArtworkGrid artworks={artworks} />
    </section>
  );
}

