'use client';

import { useState } from 'react';
import { ArtworkPost, Gallery } from '@/types/database';
import AdminGalleryCard from './AdminGalleryCard';
import ArtworkCard from './ArtworkCard';

type UnifiedItem = 
  | { type: 'gallery'; data: Gallery & { previewImages?: string[] }; artworkCount: number; subfolderCount?: number }
  | { type: 'post'; data: ArtworkPost };

interface UnifiedGridProps {
  items: UnifiedItem[];
  onTogglePin: (id: string, currentPinned: boolean) => void;
  onDelete: (id: string) => void;
  onDeleteGallery?: (id: string, name: string) => void;
  onUpdateGalleryName?: (id: string, newName: string) => Promise<void>;
  onMoveItem?: (itemId: string, itemType: 'gallery' | 'post', targetGalleryId: string | null) => Promise<void>;
  galleries?: Gallery[];
  currentGalleryId?: string | null;
}

export default function UnifiedGrid({ 
  items, 
  onTogglePin, 
  onDelete,
  onDeleteGallery,
  onUpdateGalleryName,
  onMoveItem,
  galleries: allGalleries = [],
  currentGalleryId = null
}: UnifiedGridProps) {
  const [dragOverRoot, setDragOverRoot] = useState(false);

  if (items.length === 0) {
    return null;
  }

  // Separate galleries and posts
  const galleries = items.filter(item => item.type === 'gallery');
  const posts = items.filter(item => item.type === 'post');

  const handleGalleryDrop = (targetGalleryId: string) => (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onMoveItem) {
      try {
        const data = JSON.parse(e.dataTransfer.getData('application/json'));
        // Prevent moving gallery into itself
        if (data.type === 'gallery' && data.id === targetGalleryId) {
          return;
        }
        
        // Prevent moving gallery into its descendants
        if (data.type === 'gallery') {
          const draggedGallery = allGalleries.find(g => g.id === data.id);
          if (draggedGallery) {
            let currentParentId = draggedGallery.parent_id;
            let isDescendant = false;
            while (currentParentId) {
              if (currentParentId === targetGalleryId) {
                isDescendant = true;
                break;
              }
              const parent = allGalleries.find(g => g.id === currentParentId);
              currentParentId = parent?.parent_id || null;
            }
            if (isDescendant) {
              return;
            }
          }
        }
        
        // Perform the move
        if (data.type === 'gallery' && data.id !== targetGalleryId) {
          onMoveItem(data.id, 'gallery', targetGalleryId);
        } else if (data.type === 'post') {
          onMoveItem(data.id, 'post', targetGalleryId);
        }
      } catch (err) {
        console.error('Error parsing drag data:', err);
      }
    }
    e.currentTarget.classList.remove('drag-over');
  };

  return (
    <>
      {/* Root Drop Zone (only show when inside a gallery) */}
      {currentGalleryId && onMoveItem && (
        <div
          className={`root-drop-zone ${dragOverRoot ? 'drag-over' : ''}`}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onMoveItem) {
              try {
                const data = JSON.parse(e.dataTransfer.getData('application/json'));
                // Move to parent gallery (one level up), or to root if already at root level
                const currentGallery = allGalleries.find(g => g.id === currentGalleryId);
                const targetParentId = currentGallery?.parent_id || null;
                onMoveItem(data.id, data.type, targetParentId);
              } catch (err) {
                console.error('Error parsing drag data:', err);
              }
            }
            setDragOverRoot(false);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOverRoot(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragOverRoot(false);
          }}
        >
          <span>Drop here to move up one level</span>
        </div>
      )}

      {/* Galleries Section */}
      {galleries.length > 0 && (
        <div className="admin-unified-grid">
          {galleries.map((item) => (
            <AdminGalleryCard
              key={`gallery-${item.data.id}`}
              gallery={item.data}
              artworkCount={item.artworkCount}
              subfolderCount={item.subfolderCount}
              onUpdateName={onUpdateGalleryName}
              onDelete={onDeleteGallery}
              draggable={!!onMoveItem}
              onDragStart={(e) => {
                if (onMoveItem) {
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('application/json', JSON.stringify({
                    type: 'gallery',
                    id: item.data.id
                  }));
                }
              }}
              onDrop={handleGalleryDrop(item.data.id)}
              onDragOver={(e) => {
                if (onMoveItem) {
                  e.preventDefault();
                  e.stopPropagation();
                  e.currentTarget.classList.add('drag-over');
                }
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove('drag-over');
              }}
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
        <div className="admin-unified-grid">
          {posts.map((item) => (
            <ArtworkCard
              key={`post-${item.data.id}`}
              artwork={item.data}
              onTogglePin={onTogglePin}
              onDelete={onDelete}
              draggable={!!onMoveItem}
              onDragStart={(e) => {
                if (onMoveItem) {
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('application/json', JSON.stringify({
                    type: 'post',
                    id: item.data.id
                  }));
                }
              }}
            />
          ))}
        </div>
      )}
    </>
  );
}

