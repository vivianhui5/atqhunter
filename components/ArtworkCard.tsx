'use client';

import { ArtworkPost } from '@/types/database';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

interface ArtworkCardProps {
  artwork: ArtworkPost;
  index?: number;
  featured?: boolean;
  small?: boolean;
}

export default function ArtworkCard({ artwork, index = 0, featured = false, small = false }: ArtworkCardProps) {
  const [imageError, setImageError] = useState(false);
  const firstImage = artwork.images?.[0];

  return (
    <Link
      href={`/artwork/${artwork.id}`}
      className="artwork-card group block"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* Square Image Container */}
      <div className={`relative aspect-square overflow-hidden bg-stone-100 rounded-sm mb-3`}>
        {firstImage && !imageError ? (
          <Image
            src={firstImage.image_url}
            alt={artwork.title}
            fill
            className="artwork-image object-contain p-2"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-stone-300 text-xs">No image</span>
          </div>
        )}
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/5 transition-colors duration-300 pointer-events-none" />
      </div>

      {/* Title - Centered */}
      <h3 className="text-sm font-medium text-stone-800 group-hover:text-stone-600 transition-colors duration-200 line-clamp-2 text-center">
        {artwork.title}
      </h3>
      
      {/* Gallery Link - Centered */}
      {artwork.gallery ? (
        <Link 
          href={`/galleries/${artwork.gallery.id}`}
          className="text-xs text-stone-500 hover:text-stone-700 transition-colors mt-1 block text-center"
          onClick={(e) => e.stopPropagation()}
        >
          Gallery: {artwork.gallery.name}
        </Link>
      ) : (
        <p className="text-xs text-stone-400 mt-1 text-center">
          Gallery: --
        </p>
      )}
    </Link>
  );
}
