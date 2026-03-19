import { useState, useCallback } from 'react';
import { Home, ChevronLeft, ChevronRight, X, Expand } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// ImageGallery
// ---------------------------------------------------------------------------

const MAX_THUMBNAILS = 5;

function getImgUrl(img) {
  const url = typeof img === 'string' ? img : (img?.image || img?.url);
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const baseUrl = import.meta.env.VITE_IMAGE_BASE_URL || 'https://gestion-locative-fqax.onrender.com';
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}

export default function ImageGallery({ images = [], maisonNom = 'Propriété' }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const hasImages = images.length > 0;
  const mainImage = hasImages ? images[activeIndex] : null;

  const visibleThumbs = images.slice(0, MAX_THUMBNAILS);
  const extraCount = images.length - MAX_THUMBNAILS;

  // ── Lightbox navigation ──────────────────────────────────────────────────
  const goToPrev = useCallback(() => {
    setLightboxIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  }, [images.length]);

  const goToNext = useCallback(() => {
    setLightboxIndex((i) => (i === images.length - 1 ? 0 : i + 1));
  }, [images.length]);

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') goToPrev();
    if (e.key === 'ArrowRight') goToNext();
  };

  // ── Empty state ──────────────────────────────────────────────────────────
  if (!hasImages) {
    return (
      <div className="flex flex-col items-center justify-center h-56 rounded-lg bg-gray-100 text-gray-300 select-none">
        <Home className="h-14 w-14 mb-2" />
        <p className="text-sm text-gray-400">Aucune image disponible</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* ------------------------------------------------------------------ */}
      {/* Main image                                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="relative rounded-lg overflow-hidden bg-gray-100 h-64 md:h-80">
        <img
          src={getImgUrl(mainImage)}
          alt={mainImage.legende ?? maisonNom}
          className="w-full h-full object-cover"
        />

        {/* "Voir en plein écran" button */}
        <button
          onClick={() => openLightbox(activeIndex)}
          className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-md bg-black/60 hover:bg-black/75 text-white text-xs px-3 py-1.5 transition-colors"
        >
          <Expand className="h-3.5 w-3.5" />
          Voir en plein écran
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Thumbnail strip                                                     */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex gap-2">
        {visibleThumbs.map((img, idx) => {
          const isActive = idx === activeIndex;
          const isLast = idx === MAX_THUMBNAILS - 1 && extraCount > 0;

          return (
            <button
              key={img.id ?? idx}
              onClick={() => setActiveIndex(idx)}
              className={cn(
                'relative flex-1 min-w-0 h-16 rounded-md overflow-hidden bg-gray-100 border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]',
                isActive
                  ? 'border-[var(--primary)] shadow-sm'
                  : 'border-transparent hover:border-[var(--secondary)]'
              )}
            >
              <img
                src={getImgUrl(img)}
                alt={img.legende ?? `Image ${idx + 1}`}
                className="w-full h-full object-cover"
              />

              {/* "+N more" overlay on the last visible thumbnail */}
              {isLast && (
                <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    +{extraCount}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Lightbox dialog                                                     */}
      {/* ------------------------------------------------------------------ */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent
          className="max-w-4xl w-full p-0 overflow-hidden bg-black border-0 outline-none"
          onKeyDown={handleKeyDown}
        >
          {/* Visually hidden title for accessibility */}
          <DialogTitle className="sr-only">
            Galerie — {maisonNom}
          </DialogTitle>

          {/* Top bar: counter + close */}
          <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/70 to-transparent">
            <span className="text-white text-sm font-medium">
              {lightboxIndex + 1} / {images.length}
            </span>
            <button
              onClick={() => setLightboxOpen(false)}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Image */}
          <div className="relative flex items-center justify-center w-full h-[75vh]">
            <img
              src={getImgUrl(images[lightboxIndex])}
              alt={images[lightboxIndex].legende ?? maisonNom}
              className="max-w-full max-h-full object-contain select-none"
              draggable={false}
            />

            {/* Prev arrow */}
            {images.length > 1 && (
              <button
                onClick={goToPrev}
                className="absolute left-3 p-2 rounded-full bg-black/40 hover:bg-black/65 text-white transition-colors"
                aria-label="Image précédente"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            {/* Next arrow */}
            {images.length > 1 && (
              <button
                onClick={goToNext}
                className="absolute right-3 p-2 rounded-full bg-black/40 hover:bg-black/65 text-white transition-colors"
                aria-label="Image suivante"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
          </div>

          {/* Bottom caption */}
          {images[lightboxIndex].legende && (
            <div className="absolute bottom-0 inset-x-0 flex items-center justify-center px-4 py-3 bg-gradient-to-t from-black/70 to-transparent">
              <span className="text-white/80 text-sm truncate">
                {images[lightboxIndex].legende}
              </span>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
