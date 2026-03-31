'use client';

import Image from 'next/image';
import { useState, useEffect, useCallback, useRef } from 'react';

interface ImageSlideshowProps {
  images: string[];
  alt?: string;
  duration?: number;
  offset?: number;
  className?: string;
}

export function ImageSlideshow({ images, alt = '', duration = 5000, offset = 0, className = '' }: ImageSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasMultiple = images.length > 1;
  const loopedImages = hasMultiple ? [...images, images[0]] : images;

  const advanceSlide = useCallback(() => {
    setTransitioning(true);
    setCurrentIndex((i) => i + 1);
  }, []);

  const startSlideshow = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(advanceSlide, duration);
  }, [advanceSlide, duration]);

  const stopSlideshow = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  useEffect(() => {
    if (!hasMultiple) return;
    const t = setTimeout(startSlideshow, offset);
    return () => { clearTimeout(t); stopSlideshow(); };
  }, [hasMultiple, offset, startSlideshow, stopSlideshow]);

  function handleTransitionEnd() {
    if (currentIndex >= images.length) {
      setTransitioning(false);
      setCurrentIndex(0);
    }
  }

  if (!hasMultiple && images.length === 1) {
    return <Image src={images[0]} alt={alt} fill className="object-cover" />;
  }

  return (
    <div
      role="region"
      aria-label="Image slideshow"
      className={`relative w-full h-full overflow-hidden ${className}`}
      onMouseEnter={stopSlideshow}
      onMouseLeave={() => hasMultiple && startSlideshow()}
    >
      <div
        className="relative w-full h-full"
        style={{ transform: `translateX(-${currentIndex * 100}%)`, transition: transitioning ? 'transform 0.7s ease-in-out' : 'none' }}
        onTransitionEnd={handleTransitionEnd}
      >
        {loopedImages.map((image, index) => (
          <div key={index} className="absolute inset-0" style={{ transform: `translateX(${index * 100}%)` }}>
            <Image src={image} alt={alt} fill className="object-cover" loading="lazy" />
          </div>
        ))}
      </div>

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {images.map((_, index) => (
          <div key={index} className={`w-2 h-2 rounded-full transition-colors duration-300 ${index === (currentIndex % images.length) ? 'bg-white shadow-lg' : 'bg-white/50'}`} />
        ))}
      </div>
    </div>
  );
}
