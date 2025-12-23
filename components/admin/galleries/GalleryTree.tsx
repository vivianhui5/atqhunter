'use client';

import { Gallery, ArtworkPost } from '@/types/database';
import { buildGalleryTree } from '@/lib/gallery-utils';
import GalleryTreeNode from './GalleryTreeNode';

interface GalleryTreeProps {
  galleries: Gallery[];
  artworks: ArtworkPost[];
  onDelete: (id: string, name: string) => void;
  onEdit: (id: string, name: string, parentId: string | null) => void;
  onCreateChild: (parentId: string) => void;
  onSelect?: (id: string) => void;
}

export default function GalleryTree({
  galleries,
  artworks,
  onDelete,
  onEdit,
  onCreateChild,
  onSelect,
}: GalleryTreeProps) {
  // Build tree structure
  const tree = buildGalleryTree(galleries);

  // Calculate artwork counts for each gallery (including children)
  const getArtworkCount = (galleryId: string): number => {
    const directCount = artworks.filter((a) => a.gallery_id === galleryId).length;
    
    // Find children and sum their counts
    const children = galleries.filter((g) => g.parent_id === galleryId);
    const childrenCount = children.reduce((sum, child) => sum + getArtworkCount(child.id), 0);
    
    return directCount + childrenCount;
  };

  // Add artwork counts and preview images to tree
  type EnrichedGallery = Gallery & { 
    previewImages?: string[]; 
    children?: EnrichedGallery[] 
  };

  const enrichGallery = (gallery: Gallery & { children?: Gallery[] }): EnrichedGallery => {
    // Get preview images (first 4 images from artworks in this gallery)
    const galleryArtworks = artworks.filter((a) => a.gallery_id === gallery.id);
    const previewImages = galleryArtworks
      .flatMap((a) => a.images?.map((img) => img.image_url) || [])
      .filter(Boolean)
      .slice(0, 4);

    return {
      ...gallery,
      previewImages,
      children: gallery.children?.map(enrichGallery),
    };
  };

  const enrichedTree = tree.map(enrichGallery);

  if (enrichedTree.length === 0) {
    return (
      <div className="admin-empty-state">
        <p>No galleries yet. Create your first one!</p>
      </div>
    );
  }

  return (
    <div className="gallery-tree">
      {enrichedTree.map((gallery) => (
        <GalleryTreeNode
          key={gallery.id}
          gallery={gallery}
          artworkCount={getArtworkCount(gallery.id)}
          level={0}
          onDelete={onDelete}
          onEdit={onEdit}
          onCreateChild={onCreateChild}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

