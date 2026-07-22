'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Category {
  name: string;
  slug: string;
  image: string;
  customUrl?: string;
}

interface CategorySliderProps {
  categories: Category[];
}

export default function CategorySlider({ categories }: CategorySliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // ── Scroll position checker & disabled states ───────────────────────────
  const updateArrows = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    updateArrows();
    el.addEventListener('scroll', updateArrows, { passive: true });

    const onResize = () => {
      updateArrows();
      // Re-calibrate GSAP ScrollTriggers after layout reflow
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { ScrollTrigger } = require('gsap/ScrollTrigger');
        ScrollTrigger.refresh();
      } catch {
        // GSAP not loaded yet — no-op
      }
    };

    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('orientationchange', onResize, { passive: true });

    return () => {
      el.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, [categories, updateArrows]);

  // ── Button scroll handler ───────────────────────────────────────────────
  const scroll = (direction: 'left' | 'right') => {
    const el = containerRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.6; // ~1 card offset
    el.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
    setTimeout(updateArrows, 400);
  };

  return (
    <div className="relative w-full">
      {/* 
        Upper-Left Arrow Controls (Mobile only, hidden on sm: and up where cards fit in a static grid) 
      */}
      <div className="flex sm:hidden items-center justify-start gap-2 mb-3">
        <button
          onClick={() => scroll('left')}
          disabled={!canScrollLeft}
          aria-label="Scroll left"
          className="w-9 h-9 rounded-full border border-[#222222]/10 bg-white shadow-sm flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#E56717]/10 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-[#222222]" />
        </button>
        <button
          onClick={() => scroll('right')}
          disabled={!canScrollRight}
          aria-label="Scroll right"
          className="w-9 h-9 rounded-full border border-[#222222]/10 bg-white shadow-sm flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#E56717]/10 transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-[#222222]" />
        </button>
      </div>

      {/* 
        Horizontal scroll-snap carousel on mobile (<640px).
        Reflows to 2-col grid on tablet (sm: 640px) and 4-col grid on desktop (lg: 1024px).
      */}
      <div
        ref={containerRef}
        onScroll={updateArrows}
        className="flex gap-3 sm:gap-6 md:gap-8 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible pb-4 sm:pb-0"
      >
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={cat.customUrl || `/shop?categorySlug=${cat.slug}`}
            data-cat-card="true"
            className="shrink-0 w-[42vw] min-w-[150px] sm:w-auto snap-start sm:snap-align-none group relative h-[260px] sm:h-[320px] md:h-[380px] rounded-[20px] sm:rounded-[32px] overflow-hidden border border-[#222222]/5 shadow-md hover:shadow-2xl transition-all duration-500 block"
          >
            {/* Background image container for smooth parallax slide */}
            <div
              className="absolute inset-0 bg-cover bg-center scale-105 group-hover:scale-110 transition-transform duration-700 ease-out"
              style={{ backgroundImage: `url('${cat.image}')` }}
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#222222]/95 via-[#222222]/40 to-transparent group-hover:via-[#222222]/20 transition-all duration-500" />
            
            {/* Elegant lighting shine effect on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-tr from-transparent via-white/5 to-white/10 transition-opacity duration-700 pointer-events-none" />

            {/* Bottom info section */}
            <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 md:bottom-8 md:left-8 md:right-8 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500 ease-out">
              <div className="space-y-1 sm:space-y-2">
                <h3 className="text-[15px] sm:text-[20px] md:text-[26px] font-extrabold text-white uppercase tracking-wider group-hover:text-[#E56717] transition-colors duration-300 drop-shadow-md">
                  {cat.name}
                </h3>
                <span className="text-[10px] sm:text-[12px] md:text-[13px] text-[#E56717] uppercase tracking-widest font-bold flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                  View Collection 
                  <span className="transform translate-x-0 group-hover:translate-x-1 transition-transform duration-300">→</span>
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
