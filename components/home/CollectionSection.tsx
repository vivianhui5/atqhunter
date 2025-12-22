'use client';

import { useState } from 'react';
import { ArtworkPost } from '@/types/database';
import ArtworkGrid from '@/components/ArtworkGrid';
import SearchBar from '@/components/SearchBar';

interface CollectionSectionProps {
  artworks: ArtworkPost[];
}

export default function CollectionSection({ artworks }: CollectionSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter artworks by search query
  const filteredArtworks = artworks.filter((artwork) =>
    artwork.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section className="section-collection">
      <div className="collection-header">
        <h2 className="section-title">Full Collection</h2>
        
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by antique..."
          className="collection-search"
        />
      </div>

      {filteredArtworks.length === 0 && searchQuery ? (
        <div className="empty-grid">
          <p>No artworks found matching &quot;{searchQuery}&quot;</p>
        </div>
      ) : (
        <ArtworkGrid artworks={filteredArtworks} small={true} />
      )}
    </section>
  );
}
