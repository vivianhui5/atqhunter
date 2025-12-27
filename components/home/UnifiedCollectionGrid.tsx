import { ArtworkPost, Gallery } from '@/types/database';
import GalleryCard from '@/components/galleries/GalleryCard';
import ArtworkCard from '@/components/ArtworkCard';

type UnifiedItem = 
  | { type: 'gallery'; data: Gallery & { previewImages?: string[] } }
  | { type: 'post'; data: ArtworkPost };

interface UnifiedCollectionGridProps {
  items: UnifiedItem[];
  allGalleries?: Gallery[];
  adminView?: boolean;
}

export default function UnifiedCollectionGrid({ items, allGalleries = [], adminView = false }: UnifiedCollectionGridProps) {
  if (items.length === 0) {
    return (
      <div className="empty-state">
        <p>No items available yet</p>
      </div>
    );
  }

  // Render all items in a single grid, interleaved by display_order
  return (
    <div className="unified-collection-grid">
      {items.map((item) => {
        if (item.type === 'gallery') {
          return (
            <GalleryCard
              key={`gallery-${item.data.id}`}
              gallery={item.data}
              allGalleries={allGalleries}
              adminView={adminView}
            />
          );
        } else {
          return (
            <ArtworkCard
              key={`post-${item.data.id}`}
              artwork={item.data}
              allGalleries={allGalleries}
              adminView={adminView}
            />
          );
        }
      })}
    </div>
  );
}

