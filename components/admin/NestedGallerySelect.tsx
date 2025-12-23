'use client';

import { useState, useEffect, useRef } from 'react';
import { Gallery } from '@/types/database';
import { buildGalleryTree } from '@/lib/gallery-utils';
import { ChevronRight, ChevronDown, Folder } from 'lucide-react';

interface NestedGallerySelectProps {
  value: string;
  onChange: (value: string) => void;
  galleries: Gallery[];
  excludeId?: string;
  placeholder?: string;
}

type GalleryTreeNode = Gallery & { children: GalleryTreeNode[] };

export default function NestedGallerySelect({
  value,
  onChange,
  galleries,
  excludeId,
  placeholder = 'Select a gallery...',
}: NestedGallerySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

  const tree = buildGalleryTree(galleries) as unknown as GalleryTreeNode[];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const getSelectedGalleryName = () => {
    if (!value) return placeholder;
    const gallery = galleries.find((g) => g.id === value);
    return gallery?.name || placeholder;
  };

  const renderTreeNode = (node: GalleryTreeNode, level: number = 0): React.ReactNode => {
    const children = ('children' in node && Array.isArray(node.children)) ? node.children : [];
    const hasChildren = children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = value === node.id;
    const isExcluded = excludeId === node.id;

    if (isExcluded) return null;

    return (
      <div key={node.id}>
        <div
          className={`nested-select-option ${isSelected ? 'selected' : ''}`}
          style={{ paddingLeft: `${level * 1.5 + 0.75}rem` }}
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) {
              toggleNode(node.id);
            } else {
              onChange(node.id);
              setIsOpen(false);
            }
          }}
        >
          <div className="nested-select-option-content">
            {hasChildren ? (
              <button
                type="button"
                className="nested-select-toggle"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(node.id);
                }}
              >
                {isExpanded ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </button>
            ) : (
              <span className="nested-select-spacer" />
            )}
            <Folder size={16} className="nested-select-icon" />
            <span className="nested-select-label">{node.name}</span>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className="nested-select-children">
            {children.map((child: GalleryTreeNode) => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="nested-select-wrapper" ref={dropdownRef}>
      <button
        type="button"
        className="nested-select-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={value ? '' : 'nested-select-placeholder'}>
          {getSelectedGalleryName()}
        </span>
        <ChevronDown size={16} className={isOpen ? 'open' : ''} />
      </button>

      {isOpen && (
        <div className="nested-select-dropdown">
          <div
            className="nested-select-option"
            onClick={() => {
              onChange('');
              setIsOpen(false);
            }}
          >
            <span className={value === '' ? 'selected' : ''}>Main/No gallery</span>
          </div>
          {tree.map((node) => renderTreeNode(node))}
        </div>
      )}
    </div>
  );
}

