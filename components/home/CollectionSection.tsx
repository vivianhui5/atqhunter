import { ArtworkPost } from '@/types/database';
import ArtworkGrid from '@/components/ArtworkGrid';

interface CollectionSectionProps {
  artworks: ArtworkPost[];
}

export default function CollectionSection({ artworks }: CollectionSectionProps) {
  return (
    <section className="section-collection">
      <h2 className="section-title">Full Collection</h2>
      <ArtworkGrid artworks={artworks} small={true} />
    </section>
  );
}

