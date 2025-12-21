'use client';

import { ArtworkPost } from '@/types/database';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import Link from 'next/link';

interface ArtworkDetailProps {
  artwork: ArtworkPost;
}

export default function ArtworkDetail({ artwork }: ArtworkDetailProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [imageError, setImageError] = useState<Record<number, boolean>>({});

  const sortedImages = [...(artwork.images || [])].sort(
    (a, b) => a.display_order - b.display_order
  );

  const nextImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev + 1) % sortedImages.length);
  }, [sortedImages.length]);

  const prevImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev - 1 + sortedImages.length) % sortedImages.length);
  }, [sortedImages.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLightboxOpen) {
        if (e.key === 'ArrowRight') nextImage();
        if (e.key === 'ArrowLeft') prevImage();
        if (e.key === 'Escape') setIsLightboxOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, nextImage, prevImage]);

  return (
    <main className="max-w-6xl mx-auto px-6 md:px-12 lg:px-16 py-10 md:py-16">
      {/* Breadcrumb */}
      <div className="mb-8">
        <Link
          href="/"
          className="text-sm text-stone-400 hover:text-stone-600 transition-colors"
        >
          ← Back to Full Collection
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
        {/* Image Gallery */}
        <div>
          {sortedImages.length > 0 && (
            <>
              {/* Main Image with Navigation */}
              <div className="relative aspect-square bg-stone-100 rounded-sm overflow-hidden">
                {!imageError[currentImageIndex] ? (
                  <Image
                    src={sortedImages[currentImageIndex].image_url}
                    alt={`${artwork.title} - Image ${currentImageIndex + 1}`}
                    fill
                    className="object-contain p-4 cursor-zoom-in"
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    onClick={() => setIsLightboxOpen(true)}
                    onError={() => setImageError({ ...imageError, [currentImageIndex]: true })}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-stone-400">
                    Image unavailable
                  </div>
                )}

                {/* Navigation Arrows on Main Image */}
                {sortedImages.length > 1 && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); prevImage(); }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition"
                      aria-label="Previous image"
                    >
                      <ChevronLeft size={20} className="text-stone-700" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); nextImage(); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition"
                      aria-label="Next image"
                    >
                      <ChevronRight size={20} className="text-stone-700" />
                    </button>
                  </>
                )}

                {/* Image Counter */}
                {sortedImages.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/90 px-3 py-1 rounded-full text-xs text-stone-600">
                    {currentImageIndex + 1} / {sortedImages.length}
                  </div>
                )}
              </div>

              {/* Thumbnail Strip */}
              {sortedImages.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                  {sortedImages.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => setCurrentImageIndex(index)}
                      title={`View image ${index + 1}`}
                      aria-label={`View image ${index + 1}`}
                      className={`relative flex-shrink-0 w-14 h-14 md:w-16 md:h-16 overflow-hidden bg-stone-100 rounded-sm transition ${
                        currentImageIndex === index
                          ? 'ring-2 ring-stone-800'
                          : 'opacity-60 hover:opacity-100'
                      }`}
                    >
                      <Image
                        src={image.image_url}
                        alt={`Thumbnail ${index + 1}`}
                        fill
                        className="object-contain p-1"
                        sizes="64px"
                      />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Details */}
        <div className="lg:py-4">
          {/* Gallery Tag */}
          {artwork.gallery && (
            <p className="text-xs text-stone-400 uppercase tracking-wider mb-2">
              {artwork.gallery.name}
            </p>
          )}

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-medium text-stone-800 mb-4">
            {artwork.title}
          </h1>

          {/* Price */}
          {artwork.price && (
            <p className="text-xl text-stone-600 mb-6">
              ${parseFloat(artwork.price.toString()).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          )}

          {/* Divider */}
          <div className="w-12 h-px bg-stone-200 mb-6" />

          {/* Description */}
          {artwork.description && (
            <div className="prose prose-stone prose-sm max-w-none">
              <div
                className="text-stone-600 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: artwork.description }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {isLightboxOpen && sortedImages.length > 0 && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 md:top-6 md:right-6 text-white/70 hover:text-white transition p-2"
            aria-label="Close"
          >
            <X size={28} />
          </button>

          {sortedImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                className="absolute left-4 md:left-8 text-white/70 hover:text-white transition p-2"
                aria-label="Previous"
              >
                <ChevronLeft size={40} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                className="absolute right-4 md:right-8 text-white/70 hover:text-white transition p-2"
                aria-label="Next"
              >
                <ChevronRight size={40} />
              </button>
            </>
          )}

          <div 
            className="relative w-full h-full max-w-5xl max-h-[85vh] mx-4" 
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={sortedImages[currentImageIndex].image_url}
              alt={`${artwork.title} - Image ${currentImageIndex + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>

          {sortedImages.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70 text-sm">
              {currentImageIndex + 1} / {sortedImages.length}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
