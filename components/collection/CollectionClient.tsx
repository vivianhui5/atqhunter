'use client';

import { useState, useMemo } from 'react';
import { ArtworkPost, Gallery } from '@/types/database';
import UnifiedCollectionGrid from '@/components/home/UnifiedCollectionGrid';
import SearchBar from '@/components/SearchBar';

type UnifiedItem = 
  | { type: 'gallery'; data: Gallery & { coverImageUrl?: string; previewImages?: string[] }; sortKey: string }
  | { type: 'post'; data: ArtworkPost; sortKey: string };

interface CollectionClientProps {
  items: UnifiedItem[];
  allGalleries: Gallery[];
  adminView: boolean;
}

export default function CollectionClient({ items, allGalleries, adminView }: CollectionClientProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter items by search query (name, title, or ID)
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return items;
    }

    const query = searchQuery.toLowerCase();
    return items.filter((item) => {
      if (item.type === 'gallery') {
        return (
          item.data.name.toLowerCase().includes(query) ||
          item.data.id.toLowerCase().includes(query)
        );
      } else {
        return (
          item.data.title.toLowerCase().includes(query) ||
          item.data.id.toLowerCase().includes(query)
        );
      }
    });
  }, [items, searchQuery]);

  return (
    <>
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search by name or ID..."
        className="collection-search"
      />
      <UnifiedCollectionGrid items={filteredItems} allGalleries={allGalleries} adminView={adminView} />
    </>
  );
}

