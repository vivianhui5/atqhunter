'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ArtworkPost, Gallery } from '@/types/database';
import ArtworkCard from '@/components/ArtworkCard';
import GalleryCard from '@/components/galleries/GalleryCard';

interface FeaturedCarouselProps {
  items: (ArtworkPost | (Gallery & { coverImageUrl?: string }))[];
  allGalleries?: Gallery[];
  adminView?: boolean;
}

export default function FeaturedCarousel({ items, allGalleries = [], adminView = false }: FeaturedCarouselProps) {
  const [currentPage, setCurrentPage] = useState(0);
  
  // Always ensure we have at least 3 slots (fill with null if needed)
  const itemsPerPage = 3;
  
  // If no items, show empty slots
  if (items.length === 0) {
    return (
      <div className="featured-carousel-container">
        <div className="featured-carousel-wrapper">
          <div className="featured-carousel-slides-container">
            <div className="featured-carousel-slides">
              <div className="featured-carousel-page">
                <div className="featured-carousel-slide">
                  <div className="featured-carousel-empty-slot" />
                </div>
                <div className="featured-carousel-slide">
                  <div className="featured-carousel-empty-slot" />
                </div>
                <div className="featured-carousel-slide">
                  <div className="featured-carousel-empty-slot" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Create all items with padding to ensure each page has exactly 3 slots
  const allItemsWithPadding: ((ArtworkPost | (Gallery & { coverImageUrl?: string })) | null)[] = [...items];
  while (allItemsWithPadding.length % itemsPerPage !== 0) {
    allItemsWithPadding.push(null);
  }

  const totalPages = allItemsWithPadding.length / itemsPerPage;

  const nextPage = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  const prevPage = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="featured-carousel-container">
      <div className="featured-carousel-wrapper">
        {totalPages > 1 && (
          <button
            className="featured-carousel-button featured-carousel-button-prev"
            onClick={prevPage}
            aria-label="Previous"
          >
            <ChevronLeft size={24} />
          </button>
        )}
        
        <div className="featured-carousel-slides-container">
          <div 
            className="featured-carousel-slides"
            style={{ transform: `translateX(-${currentPage * 100}%)` }}
          >
            {Array.from({ length: totalPages }).map((_, pageIndex) => {
              const pageStart = pageIndex * itemsPerPage;
              const pageItems = allItemsWithPadding.slice(pageStart, pageStart + itemsPerPage);
              
              return (
                <div key={pageIndex} className="featured-carousel-page">
                  {pageItems.map((item, index) => (
                    <div
                      key={item ? item.id : `empty-${pageIndex}-${index}`}
                      className="featured-carousel-slide"
                    >
                      {item ? (
                        'title' in item ? (
                          <ArtworkCard 
                            artwork={item as ArtworkPost} 
                            allGalleries={allGalleries}
                            adminView={adminView}
                          />
                        ) : (
                          <GalleryCard 
                            gallery={item as Gallery & { coverImageUrl?: string }}
                            allGalleries={allGalleries}
                            adminView={adminView}
                          />
                        )
                      ) : (
                        <div className="featured-carousel-empty-slot" />
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {totalPages > 1 && (
          <button
            className="featured-carousel-button featured-carousel-button-next"
            onClick={nextPage}
            aria-label="Next"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>

      {totalPages > 1 && (
        <div className="featured-carousel-dots">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              className={`featured-carousel-dot ${index === currentPage ? 'active' : ''}`}
              onClick={() => goToPage(index)}
              aria-label={`Go to page ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

