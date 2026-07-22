'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

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

  // ── Scroll state checker ─────────────────────────────────────────────────
  const checkScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });

    // Re-check on resize AND re-calibrate any GSAP ScrollTriggers that
    // depend on element positions (they need to re-read layout after reflow).
    const onResize = () => {
      checkScroll();
      // Safely refresh ScrollTrigger if it has been registered by GSAPAnimations.
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
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, [categories, checkScroll]);

  // ── Button scroll: advance by one card width so snap points align ────────
  const scroll = (direction: 'left' | 'right') => {
    const el = containerRef.current;
    if (!el) return;

    // Measure the first card's actual rendered width (includes gap via scrollLeft delta)
    const firstCard = el.querySelector<HTMLElement>('.cat-card');
    const cardWidth = firstCard ? firstCard.offsetWidth + 16 : 220; // 16 = gap fallback

    const delta = direction === 'left' ? -cardWidth : cardWidth;
    el.scrollBy({ left: delta, behavior: 'smooth' });

    // Re-check state after animation settles
    setTimeout(checkScroll, 450);
  };

  return (
    /* cat-slider-outer uses clip-path instead of overflow:hidden so the
       inner scroll track can still receive touch events on iOS/Android.    */
    <div className="cat-slider-outer">

      {/* ── Desktop arrow buttons (hidden on mobile) ────────────────── */}
      <div className="absolute -top-20 right-6 hidden sm:flex items-center gap-3 z-20">
        <button
          onClick={() => scroll('left')}
          disabled={!canScrollLeft}
          aria-label="Scroll left"
          className={`w-12 h-12 rounded-full border border-[#222222]/10 flex items-center justify-center transition-all duration-300 ${
            canScrollLeft
              ? 'bg-white text-[#222222] hover:bg-[#E56717] hover:text-white hover:border-[#E56717] shadow-md hover:scale-105 active:scale-95'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
          }`}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => scroll('right')}
          disabled={!canScrollRight}
          aria-label="Scroll right"
          className={`w-12 h-12 rounded-full border border-[#222222]/10 flex items-center justify-center transition-all duration-300 ${
            canScrollRight
              ? 'bg-white text-[#222222] hover:bg-[#E56717] hover:text-white hover:border-[#E56717] shadow-md hover:scale-105 active:scale-95'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
          }`}
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* ── Scroll track — all sizing/snap/overflow in globals.css ───── */}
      <div ref={containerRef} className="cat-slider-track">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={cat.customUrl || `/shop?categorySlug=${cat.slug}`}
            /* cat-card: width/height/border-radius set per-breakpoint in CSS */
            className="cat-card group border border-[#222222]/5 shadow-md hover:shadow-2xl transition-shadow duration-500"
          >
            {/* BG image */}
            <div
              className="absolute inset-0 bg-cover bg-center scale-105 group-hover:scale-110 transition-transform duration-700 ease-out"
              style={{ backgroundImage: `url('${cat.image}')` }}
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#222222]/95 via-[#222222]/40 to-transparent group-hover:via-[#222222]/20 transition-all duration-500" />
            {/* Shine on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-tr from-transparent via-white/5 to-white/10 transition-opacity duration-700 pointer-events-none" />

            {/* Label */}
            <div className="absolute bottom-4 left-4 right-4 sm:bottom-8 sm:left-8 sm:right-8 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500 ease-out">
              <div className="space-y-1 sm:space-y-2">
                <h3 className="text-[18px] sm:text-[22px] md:text-[26px] font-extrabold text-white uppercase tracking-wider group-hover:text-[#E56717] transition-colors duration-300 drop-shadow-md">
                  {cat.name}
                </h3>
                <span className="text-[11px] sm:text-[13px] text-[#E56717] uppercase tracking-widest font-bold flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                  View Collection{' '}
                  <span className="transform translate-x-0 group-hover:translate-x-1 transition-transform duration-300">→</span>
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Mobile arrow buttons (below the track, hidden on ≥640px) ── */}
      <div className="flex sm:hidden justify-center items-center gap-6 mt-5">
        <button
          onPointerDown={() => scroll('left')}
          disabled={!canScrollLeft}
          style={{ touchAction: 'manipulation' }}
          aria-label="Scroll left"
          className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all duration-200 ${
            canScrollLeft
              ? 'bg-white border-[#222222]/20 text-[#222222] active:bg-[#E56717] active:text-white active:border-[#E56717] shadow-md active:scale-95'
              : 'bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed opacity-40'
          }`}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button
          onPointerDown={() => scroll('right')}
          disabled={!canScrollRight}
          style={{ touchAction: 'manipulation' }}
          aria-label="Scroll right"
          className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all duration-200 ${
            canScrollRight
              ? 'bg-[#E56717] border-[#E56717] text-white shadow-md active:scale-95 active:opacity-80'
              : 'bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed opacity-40'
          }`}
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
