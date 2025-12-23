'use client';

import { ArtworkPost } from '@/types/database';
import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ZoomIn, ZoomOut, Maximize2, Mail } from 'lucide-react';
import InquiryModal from './InquiryModal';

export default function ArtworkDetail({ artwork }: { artwork: ArtworkPost }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showInquiry, setShowInquiry] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const lightboxImageRef = useRef<HTMLDivElement>(null);
  
  const images = artwork.images?.sort((a, b) => a.display_order - b.display_order) || [];

  // Zoom handlers
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.5, 5));
  };

  const handleZoomOut = () => {
    setZoom(prev => {
      const newZoom = Math.max(prev - 0.5, 1);
      if (newZoom === 1) {
        setPosition({ x: 0, y: 0 }); // Reset position when fully zoomed out
      }
      return newZoom;
    });
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    setZoom(prev => {
      const newZoom = Math.max(1, Math.min(prev + delta, 5));
      if (newZoom === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newZoom;
    });
  };

  // Pan/drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Double-click to reset
  const handleDoubleClick = () => {
    if (zoom > 1) {
      handleResetZoom();
    } else {
      handleZoomIn();
    }
  };

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
                    <div className="main-image" onClick={() => {
                      setShowLightbox(true);
                      setZoom(1);
                      setPosition({ x: 0, y: 0 });
                    }}>
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

            {/* Inquire Button - spans full width */}
            <button
              onClick={() => setShowInquiry(true)}
              className="inquire-button"
            >
              <Mail size={20} />
              Contact
            </button>

            {/* Separator */}
            <div className="artwork-separator"></div>

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

      {/* Lightbox with Zoom */}
      {showLightbox && (
        <div 
          className="lightbox" 
          onClick={(e) => {
            // Only close if clicking the background, not the image or controls
            if (e.target === e.currentTarget) {
              setShowLightbox(false);
            }
          }}
        >
          <button 
            className="lightbox-close" 
            onClick={() => setShowLightbox(false)}
            aria-label="Close lightbox"
          >
            ×
          </button>

          {/* Zoom Controls */}
          <div className="lightbox-zoom-controls">
            <button 
              onClick={handleZoomIn}
              disabled={zoom >= 5}
              className="lightbox-zoom-button"
              title="Zoom in"
              aria-label="Zoom in"
            >
              <ZoomIn size={20} />
            </button>
            <span className="lightbox-zoom-level">{Math.round(zoom * 100)}%</span>
            <button 
              onClick={handleZoomOut}
              disabled={zoom <= 1}
              className="lightbox-zoom-button"
              title="Zoom out"
              aria-label="Zoom out"
            >
              <ZoomOut size={20} />
            </button>
            <button 
              onClick={handleResetZoom}
              disabled={zoom === 1}
              className="lightbox-zoom-button"
              title="Reset zoom"
              aria-label="Reset zoom"
            >
              <Maximize2 size={20} />
            </button>
          </div>

          {/* Image Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex((currentImageIndex - 1 + images.length) % images.length);
                  setZoom(1);
                  setPosition({ x: 0, y: 0 });
                }}
                className="lightbox-arrow lightbox-arrow-left"
                aria-label="Previous image"
              >
                ‹
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex((currentImageIndex + 1) % images.length);
                  setZoom(1);
                  setPosition({ x: 0, y: 0 });
                }}
                className="lightbox-arrow lightbox-arrow-right"
                aria-label="Next image"
              >
                ›
              </button>
            </>
          )}

          {/* Zoomable Image */}
          <div
            ref={lightboxImageRef}
            className={`lightbox-image-container ${isDragging ? 'dragging' : ''} ${zoom > 1 ? 'zoomed' : ''}`}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDoubleClick={handleDoubleClick}
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
              cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
            }}
          >
            <Image
              src={images[currentImageIndex].image_url}
              alt={artwork.title}
              fill
              className="lightbox-image"
              sizes="100vw"
              quality={100}
              priority
            />
          </div>
        </div>
      )}

      {/* Inquiry Modal */}
      <InquiryModal
        isOpen={showInquiry}
        onClose={() => setShowInquiry(false)}
        artworkTitle={artwork.title}
      />
    </div>
  );
}
