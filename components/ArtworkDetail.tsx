'use client';

import { ArtworkPost } from '@/types/database';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function ArtworkDetail({ artwork }: { artwork: ArtworkPost }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  
  const images = artwork.images?.sort((a, b) => a.display_order - b.display_order) || [];

  return (
    <div className="artwork-detail-page">
      <div className="artwork-container">
      {/* Breadcrumb */}
        <Link href="/" className="breadcrumb">
          ← Back to Collection
        </Link>

        {/* Main Layout */}
        <div className="artwork-layout">
          {/* Images */}
          <div className="artwork-images">
            {images.length > 0 && (
              <>
                <div className="image-container-wrapper">
                  <div className="main-image" onClick={() => setShowLightbox(true)}>
                    <Image
                      src={images[currentImageIndex].image_url}
                      alt={artwork.title}
                      fill
                      className="image"
                      sizes="(max-width: 1024px) 100vw, 60vw"
                    />
                  </div>
                  
                  {/* Carousel Arrows - Always show */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (images.length > 1) {
                        setCurrentImageIndex((currentImageIndex - 1 + images.length) % images.length);
                      }
                    }}
                    className={`carousel-arrow carousel-arrow-left ${images.length === 1 ? 'carousel-arrow-disabled' : ''}`}
                    aria-label="Previous image"
                    disabled={images.length === 1}
                  >
                    ‹
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (images.length > 1) {
                        setCurrentImageIndex((currentImageIndex + 1) % images.length);
                      }
                    }}
                    className={`carousel-arrow carousel-arrow-right ${images.length === 1 ? 'carousel-arrow-disabled' : ''}`}
                    aria-label="Next image"
                    disabled={images.length === 1}
                  >
                    ›
                  </button>
                </div>
                
                {/* Thumbnails - Always show */}
                <div className="thumbnails">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImageIndex(i)}
                      className={`thumbnail ${i === currentImageIndex ? 'active' : ''}`}
                      aria-label={`View image ${i + 1}`}
                    >
                      <Image src={img.image_url} alt="" fill className="image" sizes="80px" />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Content */}
          <div className="artwork-content">
            <h1 className="artwork-title">{artwork.title}</h1>
            
            {/* Price and Gallery on same row */}
            <div className="metadata-row">
              <div className="metadata-item">
                <span className="metadata-label">Price</span>
                {artwork.price ? (
                  <span className="metadata-value">
                    ${parseFloat(artwork.price.toString()).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                ) : (
                  <span className="metadata-value" style={{ color: '#78716c' }}>--</span>
                )}
              </div>

              <div className="metadata-item">
                <span className="metadata-label">Gallery</span>
                {artwork.gallery ? (
                  <Link href={`/galleries/${artwork.gallery.id}`} className="metadata-link">
                    {artwork.gallery.name}
                  </Link>
                ) : (
                  <span className="metadata-link" style={{ color: '#78716c', cursor: 'default' }}>--</span>
                )}
              </div>
            </div>

            {/* Description below */}
            <div className="artwork-section">
              <h2 className="section-label">Description</h2>
              {artwork.description ? (
                <div
                  className="description-text"
                  dangerouslySetInnerHTML={{ __html: artwork.description }}
                />
              ) : (
                <div className="description-text" style={{ color: '#78716c' }}>
                  No description available
                </div>
              )}
            </div>
            </div>
        </div>
      </div>

      {/* Lightbox */}
      {showLightbox && (
        <div className="lightbox" onClick={() => setShowLightbox(false)}>
          <button className="lightbox-close">×</button>
            <Image
            src={images[currentImageIndex].image_url}
            alt={artwork.title}
              fill
            className="lightbox-image"
              sizes="100vw"
            />
        </div>
      )}
    </div>
  );
}
