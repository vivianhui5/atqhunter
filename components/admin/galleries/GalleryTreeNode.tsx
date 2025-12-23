'use client';

import { useState } from 'react';
import { Gallery } from '@/types/database';
import { ChevronRight, ChevronDown, FolderPlus, Edit2, Trash2, Plus } from 'lucide-react';
import Image from 'next/image';

interface GalleryTreeNodeProps {
  gallery: Gallery & { previewImages?: string[]; children?: GalleryTreeNodeProps['gallery'][] };
  artworkCount: number;
  level: number;
  onDelete: (id: string, name: string) => void;
  onEdit: (id: string, name: string, parentId: string | null) => void;
  onCreateChild: (parentId: string) => void;
  onSelect?: (id: string) => void;
}

export default function GalleryTreeNode({
  gallery,
  artworkCount,
  level,
  onDelete,
  onEdit,
  onCreateChild,
  onSelect,
}: GalleryTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand first 2 levels
  const [showCreateChild, setShowCreateChild] = useState(false);
  const hasChildren = gallery.children && gallery.children.length > 0;
  const previewImages = gallery.previewImages || [];

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleCreateChildClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCreateChild(gallery.id);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(gallery.id, gallery.name, gallery.parent_id);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(gallery.id, gallery.name);
  };

  const handleCardClick = () => {
    onSelect?.(gallery.id);
  };

  return (
    <div className="gallery-tree-node">
      <div
        className={`gallery-tree-item ${onSelect ? 'clickable' : ''}`}
        onClick={handleCardClick}
        data-level={level}
      >
        {/* Expand/Collapse Button */}
        <div className="gallery-tree-expand">
          {hasChildren ? (
            <button
              onClick={handleToggleExpand}
              className="gallery-tree-toggle"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          ) : (
            <span className="gallery-tree-spacer" />
          )}
        </div>

        {/* Preview Images */}
        <div className="gallery-tree-preview">
          {previewImages.length > 0 ? (
            <div className="gallery-tree-preview-grid">
              {previewImages.slice(0, 4).map((imageUrl, index) => (
                <div key={index} className="gallery-tree-preview-image">
                  <Image
                    src={imageUrl}
                    alt={`Preview ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="60px"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="gallery-tree-preview-empty">
              <FolderPlus size={20} />
            </div>
          )}
        </div>

        {/* Gallery Info */}
        <div className="gallery-tree-info">
          <h3 className="gallery-tree-name">{gallery.name}</h3>
          <p className="gallery-tree-meta">
            {artworkCount} {artworkCount === 1 ? 'artwork' : 'artworks'}
            {hasChildren && ` • ${gallery.children?.length} ${gallery.children?.length === 1 ? 'sub-gallery' : 'sub-galleries'}`}
          </p>
        </div>

        {/* Actions */}
        <div className="gallery-tree-actions">
          <button
            onClick={handleCreateChildClick}
            className="gallery-tree-action-button"
            title="Create sub-gallery"
          >
            <Plus size={16} />
          </button>
          <button
            onClick={handleEditClick}
            className="gallery-tree-action-button"
            title="Edit gallery"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={handleDeleteClick}
            className="gallery-tree-action-button delete"
            title="Delete gallery"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="gallery-tree-children">
          {gallery.children!.map((child) => (
            <GalleryTreeNode
              key={child.id}
              gallery={child}
              artworkCount={0} // Will be calculated by parent
              level={level + 1}
              onDelete={onDelete}
              onEdit={onEdit}
              onCreateChild={onCreateChild}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

