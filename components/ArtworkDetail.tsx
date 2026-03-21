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
  /** Scale factor: image is drawn at natural pixels, then this scales it. Range [fitScale, 1] — fit-to-viewport … native resolution (no upscaling). */
  const [zoom, setZoom] = useState(1);
  const [fitScale, setFitScale] = useState(1);
  /** Last decoded dimensions; only applies when index matches current slide (avoids stale size when switching images). */
  const [imageLayout, setImageLayout] = useState<{
    index: number;
    w: number;
    h: number;
  } | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const pinchStartDistanceRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef<number>(1);
  const fitScaleRef = useRef(1);
  const lightboxImageRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  const images = artwork.images?.sort((a, b) => a.display_order - b.display_order) || [];

  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

  const computeFitScale = useCallback((naturalWidth: number, naturalHeight: number) => {
    if (naturalWidth <= 0 || naturalHeight <= 0) return 1;
    const padW = window.innerWidth * 0.9;
    const padH = window.innerHeight * 0.9;
    return Math.min(padW / naturalWidth, padH / naturalHeight, 1);
  }, []);

  const handleImageLoad = () => {
    const img = imageRef.current;
    if (!img) return;
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    const fs = computeFitScale(nw, nh);
    fitScaleRef.current = fs;
    setFitScale(fs);
    setImageLayout({ index: currentImageIndex, w: nw, h: nh });
    setZoom(fs);
    setPosition({ x: 0, y: 0 });
  };

  // Reset zoom when image changes - use a key change to trigger recalculation
  const imageKey = `${currentImageIndex}-${showLightbox}`;

  const naturalSize =
    imageLayout && imageLayout.index === currentImageIndex
      ? { w: imageLayout.w, h: imageLayout.h }
      : null;

  useEffect(() => {
    if (!showLightbox || !naturalSize) return;
    const recalc = () => {
      const img = imageRef.current;
      if (!img || img.naturalWidth <= 0) return;
      const fs = computeFitScale(img.naturalWidth, img.naturalHeight);
      fitScaleRef.current = fs;
      setFitScale(fs);
      setZoom((z) => clamp(z, fs, 1));
    };
    window.addEventListener('resize', recalc);
    return () => window.removeEventListener('resize', recalc);
  }, [showLightbox, naturalSize, computeFitScale]);

  const ZOOM_STEP = 0.08;

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + ZOOM_STEP, 1));
  };

  const handleZoomOut = () => {
    setZoom((prev) => {
      const fs = fitScaleRef.current;
      const next = Math.max(prev - ZOOM_STEP, fs);
      if (next <= fs + 1e-6) {
        setPosition({ x: 0, y: 0 });
      }
      return next;
    });
  };

  const handleResetZoom = useCallback(() => {
    const fs = fitScaleRef.current;
    setZoom(fs);
    setPosition({ x: 0, y: 0 });
    setIsDragging(false);
    setDragStart({ x: 0, y: 0 });
    pinchStartDistanceRef.current = null;
    pinchStartZoomRef.current = fs;
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

  type TouchPoint = Pick<React.Touch, 'clientX' | 'clientY'>;

  const getPinchDistance = (t1: TouchPoint, t2: TouchPoint) => {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.hypot(dx, dy);
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!naturalSize) return;
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setZoom((prev) => {
      const fs = fitScaleRef.current;
      const newZoom = clamp(prev + delta, fs, 1);
      if (newZoom <= fs + 1e-6) {
        setPosition({ x: 0, y: 0 });
      }
      return newZoom;
    });
  };

  const canPan = naturalSize !== null && zoom > fitScale + 1e-6;

  // Pan/drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (canPan) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && canPan) {
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
      if (!naturalSize) return;
      e.preventDefault();
      const dist = getPinchDistance(e.touches[0], e.touches[1]);
      pinchStartDistanceRef.current = dist;
      pinchStartZoomRef.current = zoom;
      setIsDragging(false);
      return;
    }

    // One-finger pan start (only when zoomed past fit)
    if (e.touches.length === 1 && naturalSize && zoom > fitScale + 1e-6) {
      e.preventDefault();
      const t = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: t.clientX - position.x, y: t.clientY - position.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Pinch to zoom
    if (e.touches.length === 2 && pinchStartDistanceRef.current !== null && naturalSize) {
      e.preventDefault();
      const dist = getPinchDistance(e.touches[0], e.touches[1]);
      const ratio = dist / pinchStartDistanceRef.current;
      const fs = fitScaleRef.current;
      const nextZoom = clamp(pinchStartZoomRef.current * ratio, fs, 1);
      setZoom(nextZoom);
      if (nextZoom <= fs + 1e-6) {
        setPosition({ x: 0, y: 0 });
      }
      return;
    }

    // One-finger pan (only when zoomed past fit)
    if (e.touches.length === 1 && isDragging && naturalSize && zoom > fitScale + 1e-6) {
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

  // Double-click: toggle between fit-to-screen and native resolution (1:1 pixels)
  const handleDoubleClick = () => {
    if (!naturalSize) return;
    const fs = fitScaleRef.current;
    if (zoom >= 1 - 1e-3) {
      setZoom(fs);
      setPosition({ x: 0, y: 0 });
    } else {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
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
              disabled={!naturalSize || zoom >= 1 - 1e-6}
              className="lightbox-zoom-button"
              title="Zoom in (up to full resolution)"
              aria-label="Zoom in"
            >
              <ZoomIn size={20} />
            </button>
            <span className="lightbox-zoom-level">{Math.round(zoom * 100)}%</span>
            <button 
              onClick={handleZoomOut}
              disabled={!naturalSize || zoom <= fitScale + 1e-6}
              className="lightbox-zoom-button"
              title="Zoom out (down to fit screen)"
              aria-label="Zoom out"
            >
              <ZoomOut size={20} />
            </button>
            <button 
              onClick={handleResetZoom}
              disabled={!naturalSize || Math.abs(zoom - fitScale) < 1e-6}
              className="lightbox-zoom-button"
              title="Fit image to screen"
              aria-label="Fit to screen"
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
            className={`lightbox-image-container ${isDragging ? 'dragging' : ''} ${canPan ? 'zoomed' : ''}`}
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
              transform: naturalSize
                ? `translate(${position.x}px, ${position.y}px) scale(${zoom})`
                : undefined,
              cursor: naturalSize
                ? canPan
                  ? isDragging
                    ? 'grabbing'
                    : 'grab'
                  : 'zoom-in'
                : 'wait',
              opacity: naturalSize ? 1 : 0,
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
              style={
                naturalSize
                  ? {
                      width: naturalSize.w,
                      height: naturalSize.h,
                      pointerEvents: 'none',
                    }
                  : { pointerEvents: 'none' }
              }
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
