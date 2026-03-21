'use client';

import { ArtworkPost } from '@/types/database';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail } from 'lucide-react';
import InquiryModal from './InquiryModal';

/** Usable size for “fit to screen” — visualViewport on mobile (iOS URL bar / pinch) avoids off-center scaling. */
function getLightboxViewportPad(): { padW: number; padH: number } {
  if (typeof window === 'undefined') {
    return { padW: 0, padH: 0 };
  }
  const vv = window.visualViewport;
  if (vv && vv.width > 0 && vv.height > 0) {
    return { padW: vv.width * 0.9, padH: vv.height * 0.9 };
  }
  return { padW: window.innerWidth * 0.9, padH: window.innerHeight * 0.9 };
}

export default function ArtworkDetail({ artwork }: { artwork: ArtworkPost }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showInquiry, setShowInquiry] = useState(false);
  /** Scale factor: only `fitScale` (fit screen) or `1` (full resolution); pan allowed at full when image exceeds viewport. */
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
  const lastTapRef = useRef<{ t: number; x: number; y: number } | null>(null);
  const lightboxImageRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  const images = artwork.images?.sort((a, b) => a.display_order - b.display_order) || [];

  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

  const computeFitScale = useCallback((naturalWidth: number, naturalHeight: number) => {
    if (naturalWidth <= 0 || naturalHeight <= 0) return 1;
    const { padW, padH } = getLightboxViewportPad();
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
      setZoom((z) => (z >= 1 - 1e-3 ? 1 : fs));
    };
    window.addEventListener('resize', recalc);
    const vv = window.visualViewport;
    vv?.addEventListener('resize', recalc);
    vv?.addEventListener('scroll', recalc);
    return () => {
      window.removeEventListener('resize', recalc);
      vv?.removeEventListener('resize', recalc);
      vv?.removeEventListener('scroll', recalc);
    };
  }, [showLightbox, naturalSize, computeFitScale]);

  const setViewFit = useCallback(() => {
    const fs = fitScaleRef.current;
    setZoom(fs);
    setPosition({ x: 0, y: 0 });
    setIsDragging(false);
    pinchStartDistanceRef.current = null;
    pinchStartZoomRef.current = fs;
  }, []);

  const setViewFull = useCallback(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setIsDragging(false);
    pinchStartDistanceRef.current = null;
    pinchStartZoomRef.current = 1;
  }, []);

  const handleResetZoom = useCallback(() => {
    setViewFit();
    setDragStart({ x: 0, y: 0 });
    pinchStartZoomRef.current = fitScaleRef.current;
    lastTapRef.current = null;
  }, [setViewFit]);

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

  // Wheel: only two modes — scroll out → fit, scroll in → full
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!naturalSize) return;
    const fs = fitScaleRef.current;
    if (Math.abs(1 - fs) < 1e-6) return;
    if (e.deltaY > 0) {
      setViewFit();
    } else {
      setViewFull();
    }
  };

  const canPan = naturalSize !== null && zoom > fitScale + 1e-6;
  const fullSizeAvailable =
    naturalSize !== null && Math.abs(1 - fitScale) >= 1e-6;
  const atFit =
    naturalSize !== null &&
    Math.abs(zoom - fitScale) <= Math.max(0.002, fitScale * 0.04);
  const atFull = naturalSize !== null && zoom >= 1 - 1e-3;

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
    // Pinch: interpolate between fit and full while moving; snap on release
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
    const pinchWasActive = pinchStartDistanceRef.current !== null;
    if (e.touches.length < 2) {
      pinchStartDistanceRef.current = null;
    }
    if (pinchWasActive && e.touches.length < 2 && naturalSize) {
      const fs = fitScaleRef.current;
      lastTapRef.current = null;
      if (Math.abs(1 - fs) >= 1e-6) {
        setZoom((z) => {
          const snapped = z >= (fs + 1) / 2 ? 1 : fs;
          if (snapped <= fs + 1e-6) {
            setPosition({ x: 0, y: 0 });
          }
          return snapped;
        });
      }
    }
    if (e.touches.length === 0) {
      setIsDragging(false);
    }
    // Double-tap toggle (mobile; onDoubleClick is unreliable on touch)
    if (
      e.touches.length === 0 &&
      e.changedTouches.length === 1 &&
      !pinchWasActive &&
      naturalSize &&
      Math.abs(1 - fitScale) >= 1e-6
    ) {
      const t = e.changedTouches[0];
      const now = Date.now();
      const last = lastTapRef.current;
      if (
        last &&
        now - last.t < 280 &&
        Math.hypot(t.clientX - last.x, t.clientY - last.y) < 36
      ) {
        lastTapRef.current = null;
        setZoom((z) => {
          if (z >= 1 - 1e-3) {
            setPosition({ x: 0, y: 0 });
            return fitScaleRef.current;
          }
          setPosition({ x: 0, y: 0 });
          return 1;
        });
      } else {
        lastTapRef.current = { t: now, x: t.clientX, y: t.clientY };
      }
    }
  };

  // Double-click / double-tap: toggle fit ↔ full
  const handleDoubleClick = () => {
    if (!naturalSize) return;
    const fs = fitScaleRef.current;
    if (Math.abs(1 - fs) < 1e-6) return;
    if (zoom >= 1 - 1e-3) {
      setViewFit();
    } else {
      setViewFull();
    }
  };

  return (
    <div className="artwork-detail-page">
      <div className="artwork-container">
      {/* Back — go up one level */}
        <Link
          href={artwork.gallery ? `/?gallery=${artwork.gallery.id}` : '/'}
          className="back-button"
        >
          {artwork.gallery ? `← ${artwork.gallery.name}` : '← Full Collection'}
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
        <div className="lightbox">
          <button
            type="button"
            className="lightbox-backdrop"
            aria-label="Close gallery view"
            onClick={() => setShowLightbox(false)}
          />
          <div className="lightbox-stage">
            {/* Zoomable Image — only flex child so centering is stable on mobile */}
            <div
              ref={lightboxImageRef}
              className={`lightbox-image-container ${isDragging ? 'dragging' : ''} ${canPan ? 'zoomed' : ''}`}
              onClick={(e) => e.stopPropagation()}
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

          <button
            type="button"
            className="lightbox-close"
            onClick={() => setShowLightbox(false)}
            aria-label="Close lightbox"
          >
            ×
          </button>

          {images.length > 1 && (
            <div className="lightbox-thumbnails">
              {images.map((img, i) => (
                <button
                  key={i}
                  type="button"
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

          <div className="lightbox-view-controls" role="group" aria-label="Image view size">
            <button
              type="button"
              className={`lightbox-view-btn${atFit ? ' lightbox-view-btn--active' : ''}`}
              onClick={() => naturalSize && setViewFit()}
              disabled={!naturalSize}
              aria-pressed={atFit}
            >
              Fit Screen/ 屏幕大小
            </button>
            <button
              type="button"
              className={`lightbox-view-btn${atFull && fullSizeAvailable ? ' lightbox-view-btn--active' : ''}`}
              onClick={() => naturalSize && fullSizeAvailable && setViewFull()}
              disabled={!naturalSize || !fullSizeAvailable}
              aria-pressed={atFull && fullSizeAvailable}
              title={
                !fullSizeAvailable
                  ? 'Already at full resolution for this screen'
                  : 'Actual image pixels (pan to move)'
              }
            >
              Full Size/ 放大原图
            </button>
          </div>

          {images.length > 1 && (
            <>
              <button
                type="button"
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
                type="button"
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
