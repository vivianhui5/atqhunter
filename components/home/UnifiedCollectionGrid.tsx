import { ArtworkPost, Gallery } from '@/types/database';
import GalleryCard from '@/components/galleries/GalleryCard';
import ArtworkCard from '@/components/ArtworkCard';

type UnifiedItem = 
  | { type: 'gallery'; data: Gallery & { previewImages?: string[] } }
  | { type: 'post'; data: ArtworkPost };

interface UnifiedCollectionGridProps {
  items: UnifiedItem[];
}

export default function UnifiedCollectionGrid({ items }: UnifiedCollectionGridProps) {
  if (items.length === 0) {
    return (
      <div className="empty-state">
        <p>No items available yet</p>
      </div>
    );
  }

  // Separate galleries and posts
  const galleries = items.filter(item => item.type === 'gallery');
  const posts = items.filter(item => item.type === 'post');

  return (
    <>
      {/* Galleries Section */}
      {galleries.length > 0 && (
        <div className="unified-collection-grid">
          {galleries.map((item) => (
            <GalleryCard
              key={`gallery-${item.data.id}`}
              gallery={item.data}
            />
          ))}
        </div>
      )}

      {/* Divider */}
      {galleries.length > 0 && posts.length > 0 && (
        <div className="unified-grid-divider" />
      )}

      {/* Posts Section */}
      {posts.length > 0 && (
        <div className="unified-collection-grid">
          {posts.map((item) => (
            <ArtworkCard
              key={`post-${item.data.id}`}
              artwork={item.data}
            />
          ))}
        </div>
      )}
    </>
  );
}

