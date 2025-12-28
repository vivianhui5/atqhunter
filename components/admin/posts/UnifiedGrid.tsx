'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArtworkPost, Gallery } from '@/types/database';
import AdminGalleryCard from './AdminGalleryCard';
import ArtworkCard from './ArtworkCard';
import React from 'react';
import { GripVertical } from 'lucide-react';

type UnifiedItem = 
  | { type: 'gallery'; data: Gallery & { previewImages?: string[]; allImages?: string[] }; artworkCount: number; subfolderCount?: number; id: string }
  | { type: 'post'; data: ArtworkPost; id: string };

interface UnifiedGridProps {
  items: UnifiedItem[];
  onDelete: (id: string) => void;
  onDeleteGallery?: (id: string, name: string) => void;
  onUpdateGalleryName?: (id: string, newName: string) => Promise<void>;
  onManageGalleryPassword?: (id: string, name: string, currentPassword: string | null) => void;
  onManagePostPassword?: (id: string, title: string, currentPassword: string | null) => void;
  onEditGalleryCoverImage?: (id: string, name: string, currentCoverImage: string | null, availableImages: string[]) => void;
  onMoveItem?: (itemId: string, itemType: 'gallery' | 'post', targetGalleryId: string | null) => Promise<void>;
  onReorder?: (items: UnifiedItem[]) => Promise<void>;
  galleries?: Gallery[];
  currentGalleryId?: string | null;
}

// Sortable wrapper for gallery card
function SortableGalleryCard({ item, ...props }: { item: UnifiedItem & { type: 'gallery' } } & Omit<React.ComponentProps<typeof AdminGalleryCard>, 'gallery' | 'artworkCount' | 'subfolderCount'>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 1000 : 1,
    boxShadow: isDragging ? '0 8px 24px rgba(0, 0, 0, 0.2)' : 'none',
  };

  return (
    <div 
      ref={setNodeRef} 
      {...attributes}
      {...listeners}
      style={{
        ...style,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      className={isDragging ? 'dragging-item' : ''}
    >
      <div style={{ display: 'flex', alignItems: 'stretch', gap: '0.5rem' }}>
        <div
          className="drag-handle"
          style={{
            padding: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            color: isDragging ? '#1c1917' : '#78716c',
            transition: 'all 0.2s',
            alignSelf: 'flex-start',
            marginTop: '0.5rem',
            pointerEvents: 'none',
          }}
        >
          <GripVertical size={18} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <AdminGalleryCard
            gallery={item.data}
            artworkCount={item.artworkCount}
            subfolderCount={item.subfolderCount}
            {...props}
          />
        </div>
      </div>
    </div>
  );
}

// Sortable wrapper for artwork card
function SortableArtworkCard({ item, ...props }: { item: UnifiedItem & { type: 'post' } } & Omit<React.ComponentProps<typeof ArtworkCard>, 'artwork'>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 1000 : 1,
    boxShadow: isDragging ? '0 8px 24px rgba(0, 0, 0, 0.2)' : 'none',
  };

  return (
    <div 
      ref={setNodeRef} 
      {...attributes}
      {...listeners}
      style={{
        ...style,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      className={isDragging ? 'dragging-item' : ''}
    >
      <div style={{ display: 'flex', alignItems: 'stretch', gap: '0.5rem' }}>
        <div
          className="drag-handle"
          style={{
            padding: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            color: isDragging ? '#1c1917' : '#78716c',
            transition: 'all 0.2s',
            alignSelf: 'flex-start',
            marginTop: '0.5rem',
            pointerEvents: 'none',
          }}
        >
          <GripVertical size={18} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <ArtworkCard
            artwork={item.data}
            {...props}
          />
        </div>
      </div>
    </div>
  );
}

export default function UnifiedGrid({ 
  items, 
  onDelete,
  onDeleteGallery,
  onUpdateGalleryName,
  onManageGalleryPassword,
  onManagePostPassword,
  onEditGalleryCoverImage,
  onMoveItem: _onMoveItem,
  onReorder,
  galleries: _allGalleries = [],
  currentGalleryId: _currentGalleryId = null
}: UnifiedGridProps) {
  const [localItems, setLocalItems] = useState<UnifiedItem[]>(items);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Update local items when props change
  React.useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // Reduced from 8px to 3px for faster response
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = localItems.findIndex(item => item.id === active.id);
      const newIndex = localItems.findIndex(item => item.id === over.id);

      const newItems = arrayMove(localItems, oldIndex, newIndex);
      setLocalItems(newItems);

      // Update display_order for all items
      if (onReorder) {
        const itemsWithOrder = newItems.map((item, index) => ({
          type: item.type,
          id: item.id,
          display_order: index,
        }));

        try {
          await fetch('/api/reorder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: itemsWithOrder }),
          });
          await onReorder(newItems);
        } catch (error) {
          console.error('Error reordering:', error);
          // Revert on error
          setLocalItems(items);
        }
      }
    }
  };

  const activeItem = activeId ? localItems.find(item => item.id === activeId) : null;

  if (localItems.length === 0) {
    return null;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={localItems.map(item => item.id)} strategy={rectSortingStrategy}>
        <div className="admin-unified-grid">
          {localItems.map((item) => {
            if (item.type === 'gallery') {
              return (
                <SortableGalleryCard
                  key={item.id}
                  item={item}
                  onUpdateName={onUpdateGalleryName}
                  onDelete={onDeleteGallery}
                  onManagePassword={onManageGalleryPassword}
                  onEditCoverImage={onEditGalleryCoverImage}
                />
              );
            } else {
              return (
                <SortableArtworkCard
                  key={item.id}
                  item={item}
                  onDelete={onDelete}
                  onManagePassword={onManagePostPassword}
                />
              );
            }
          })}
        </div>
      </SortableContext>
      <DragOverlay>
        {activeItem ? (
          <div style={{ 
            opacity: 0.9,
            transform: 'rotate(2deg)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.3)',
            cursor: 'grabbing',
          }}>
            {activeItem.type === 'gallery' ? (
              <div style={{ display: 'flex', alignItems: 'stretch', gap: '0.5rem' }}>
                <div
                  className="drag-handle"
                  style={{
                    padding: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#1c1917',
                    alignSelf: 'flex-start',
                    marginTop: '0.5rem',
                  }}
                >
                  <GripVertical size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <AdminGalleryCard
                    gallery={activeItem.data}
                    artworkCount={activeItem.artworkCount}
                    subfolderCount={activeItem.subfolderCount}
                    onUpdateName={onUpdateGalleryName}
                    onDelete={onDeleteGallery}
                    onManagePassword={onManageGalleryPassword}
                    onEditCoverImage={onEditGalleryCoverImage}
                  />
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'stretch', gap: '0.5rem' }}>
                <div
                  className="drag-handle"
                  style={{
                    padding: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#1c1917',
                    alignSelf: 'flex-start',
                    marginTop: '0.5rem',
                  }}
                >
                  <GripVertical size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <ArtworkCard
                    artwork={activeItem.data}
                    onDelete={onDelete}
                    onManagePassword={onManagePostPassword}
                  />
                </div>
              </div>
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
