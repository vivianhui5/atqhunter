'use client';

import { ArtworkPost } from '@/types/database';
import { useCallback, useEffect, useRef, useState } from 'react';
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
  const pinchStartDistanceRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef<number>(1);
  const lightboxImageRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  const images = artwork.images?.sort((a, b) => a.display_order - b.display_order) || [];

  // Calculate initial zoom when image loads - start at 100% (natural size)
  // zoom = 1 means image is at its natural/original size (100% of original pixels)
  const handleImageLoad = () => {
    if (imageRef.current && lightboxImageRef.current) {
      // Start at 100% zoom (natural size)
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  // Reset zoom when image changes - use a key change to trigger recalculation
  const imageKey = `${currentImageIndex}-${showLightbox}`;

  // Zoom handlers - zoom is relative to natural size (1 = 100% = natural size)
  const handleZoomIn = () => {
    setZoom(prev => {
      const maxZoom = 5; // Max zoom is 5x natural size (500%)
      return Math.min(prev + 0.1, maxZoom);
    });
  };

  const handleZoomOut = () => {
    setZoom(prev => {
      // Calculate minimum zoom to fit in container
      if (imageRef.current && lightboxImageRef.current) {
        const img = imageRef.current;
        const naturalWidth = img.naturalWidth;
        const naturalHeight = img.naturalHeight;
        if (naturalWidth > 0 && naturalHeight > 0) {
          const containerWidth = window.innerWidth * 0.9;
          const containerHeight = window.innerHeight * 0.9;
          const scaleX = containerWidth / naturalWidth;
          const scaleY = containerHeight / naturalHeight;
          const minZoom = Math.min(scaleX, scaleY, 1);
          const newZoom = Math.max(prev - 0.1, minZoom);
          if (newZoom <= minZoom) {
            setPosition({ x: 0, y: 0 }); // Reset position when at fit size
          }
          return newZoom;
        }
      }
      return Math.max(prev - 0.1, 0.1);
    });
  };

  const handleResetZoom = useCallback(() => {
    // Reset to natural size (100% = 1)
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setIsDragging(false);
    setDragStart({ x: 0, y: 0 });
    pinchStartDistanceRef.current = null;
    pinchStartZoomRef.current = 1;
  }, []);

  // iOS Safari pinch zooms the *page/viewport* by default. You can't reliably "reset" that zoom
  // in JS, so instead we disable page pinch-zoom while the lightbox is open and implement
  // pinch-to-zoom on the artwork itself (which we can reset on Next/Prev).
  useEffect(() => {
    if (!showLightbox) return;

    const preventGesture = (e: Event) => {
      e.preventDefault();
    };

    const preventMultiTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // These are iOS Safari-specific events.
    document.addEventListener('gesturestart', preventGesture, { passive: false } as AddEventListenerOptions);
    document.addEventListener('gesturechange', preventGesture, { passive: false } as AddEventListenerOptions);
    document.addEventListener('gestureend', preventGesture, { passive: false } as AddEventListenerOptions);
    document.addEventListener('touchmove', preventMultiTouchMove, { passive: false });

    return () => {
      document.removeEventListener('gesturestart', preventGesture as EventListener);
      document.removeEventListener('gesturechange', preventGesture as EventListener);
      document.removeEventListener('gestureend', preventGesture as EventListener);
      document.removeEventListener('touchmove', preventMultiTouchMove as EventListener);
    };
  }, [showLightbox]);

  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

  type TouchPoint = Pick<React.Touch, 'clientX' | 'clientY'>;

  const getPinchDistance = (t1: TouchPoint, t2: TouchPoint) => {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.hypot(dx, dy);
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setZoom(prev => {
      // Calculate minimum zoom to fit in container
      let minZoom = 0.1;
      if (imageRef.current) {
        const img = imageRef.current;
        const naturalWidth = img.naturalWidth;
        const naturalHeight = img.naturalHeight;
        if (naturalWidth > 0 && naturalHeight > 0) {
          const containerWidth = window.innerWidth * 0.9;
          const containerHeight = window.innerHeight * 0.9;
          const scaleX = containerWidth / naturalWidth;
          const scaleY = containerHeight / naturalHeight;
          minZoom = Math.min(scaleX, scaleY, 1);
        }
      }
      const maxZoom = 5; // 500% of natural size
      const newZoom = Math.max(minZoom, Math.min(prev + delta, maxZoom));
      if (newZoom <= minZoom) {
        setPosition({ x: 0, y: 0 });
      }
      return newZoom;
    });
  };

  // Pan/drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) { // Can drag when zoomed beyond natural size
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

  // Touch handlers (mobile)
  const handleTouchStart = (e: React.TouchEvent) => {
    // Two-finger pinch start
    if (e.touches.length === 2) {
      e.preventDefault();
      const dist = getPinchDistance(e.touches[0], e.touches[1]);
      pinchStartDistanceRef.current = dist;
      pinchStartZoomRef.current = zoom;
      setIsDragging(false);
      return;
    }

    // One-finger pan start (only when zoomed in)
    if (e.touches.length === 1 && zoom > 1) {
      e.preventDefault();
      const t = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: t.clientX - position.x, y: t.clientY - position.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Pinch to zoom
    if (e.touches.length === 2 && pinchStartDistanceRef.current !== null) {
      e.preventDefault();
      const dist = getPinchDistance(e.touches[0], e.touches[1]);
      const ratio = dist / pinchStartDistanceRef.current;
      const nextZoom = clamp(pinchStartZoomRef.current * ratio, 1, 5);
      setZoom(nextZoom);
      if (nextZoom <= 1) {
        setPosition({ x: 0, y: 0 });
      }
      return;
    }

    // One-finger pan (only when zoomed in)
    if (e.touches.length === 1 && isDragging && zoom > 1) {
      e.preventDefault();
      const t = e.touches[0];
      setPosition({
        x: t.clientX - dragStart.x,
        y: t.clientY - dragStart.y,
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // If pinch ended
    if (e.touches.length < 2) {
      pinchStartDistanceRef.current = null;
    }
    if (e.touches.length === 0) {
      setIsDragging(false);
    }
  };

  // Double-click to reset or zoom in
  const handleDoubleClick = () => {
    if (zoom > 1) {
      handleResetZoom(); // Reset to natural size (100%)
    } else {
      handleZoomIn();
    }
  };

  return (
    <div className="artwork-detail-page">
      <div className="artwork-container">
      {/* Breadcrumb */}
        {(() => {
          // Determine back link: gallery if exists, otherwise home
          let backHref = '/';
          let backText = '← Back to Collection';
          
          if (artwork.gallery) {
            backHref = `/`;
            backText = `← Back to Collection`;
          }
          
          return (
            <Link href={backHref} className="breadcrumb">
              {backText}
        </Link>
          );
        })()}

        {/* Main Layout */}
        <div className="artwork-layout">
          {/* Images */}
          <div className="artwork-images">
            {images.length > 0 && (
              <>
                <div className="image-container-wrapper">
                    <div className="main-image" onClick={() => {
                      setShowLightbox(true);
                      handleResetZoom();
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
                      if (currentImageIndex > 0) {
                        setCurrentImageIndex(currentImageIndex - 1);
                      }
                    }}
                    className={`carousel-arrow carousel-arrow-left ${currentImageIndex === 0 ? 'carousel-arrow-disabled' : ''}`}
                    aria-label="Previous image"
                    disabled={currentImageIndex === 0}
                  >
                    ‹
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (currentImageIndex < images.length - 1) {
                        setCurrentImageIndex(currentImageIndex + 1);
                      }
                    }}
                    className={`carousel-arrow carousel-arrow-right ${currentImageIndex === images.length - 1 ? 'carousel-arrow-disabled' : ''}`}
                    aria-label="Next image"
                    disabled={currentImageIndex === images.length - 1}
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
                  <Link href="/" className="metadata-link">
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
              Contact / 联系我们
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

          {/* Thumbnail Indicators */}
          {images.length > 1 && (
            <div className="lightbox-thumbnails">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(i);
                    handleResetZoom();
                  }}
                  className={`lightbox-thumbnail ${i === currentImageIndex ? 'active' : ''}`}
                  aria-label={`View image ${i + 1}`}
                >
                  <Image src={img.image_url} alt="" fill className="lightbox-thumbnail-image" sizes="60px" />
                </button>
              ))}
            </div>
          )}

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
              disabled={zoom <= 0.1}
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
              title="Reset to 100% (natural size)"
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
                  if (currentImageIndex > 0) {
                    setCurrentImageIndex(currentImageIndex - 1);
                    handleResetZoom();
                  }
                }}
                className={`lightbox-arrow lightbox-arrow-left ${currentImageIndex === 0 ? 'lightbox-arrow-disabled' : ''}`}
                aria-label="Previous image"
                disabled={currentImageIndex === 0}
              >
                ‹
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (currentImageIndex < images.length - 1) {
                    setCurrentImageIndex(currentImageIndex + 1);
                    handleResetZoom();
                  }
                }}
                className={`lightbox-arrow lightbox-arrow-right ${currentImageIndex === images.length - 1 ? 'lightbox-arrow-disabled' : ''}`}
                aria-label="Next image"
                disabled={currentImageIndex === images.length - 1}
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
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
              cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={imageKey}
              ref={imageRef}
              src={images[currentImageIndex].image_url}
              alt={artwork.title}
              className="lightbox-image"
              onLoad={handleImageLoad}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>
      )}

      {/* Inquiry Modal */}
      <InquiryModal
        isOpen={showInquiry}
        onClose={() => setShowInquiry(false)}
        artworkTitle={artwork.title}
        artworkId={artwork.id}
      />
    </div>
  );
}
