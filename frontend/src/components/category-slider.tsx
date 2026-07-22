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

    const onResize = () => {
      checkScroll();
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
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, [categories, checkScroll]);

  // ── Button scroll: advances by one card width to align with snap points ──
  const scroll = (direction: 'left' | 'right') => {
    const el = containerRef.current;
    if (!el) return;
    const firstCard = el.querySelector<HTMLElement>('[data-cat-card]');
    const cardWidth = firstCard ? firstCard.offsetWidth + 12 : 220; // 12 = gap
    el.scrollBy({ left: direction === 'left' ? -cardWidth : cardWidth, behavior: 'smooth' });
    setTimeout(checkScroll, 450);
  };

  return (
    // Outer wrapper: position:relative so desktop arrow buttons position correctly.
    // No overflow:hidden here — the section in page.tsx handles containment.
    <div style={{ position: 'relative', width: '100%' }}>

      {/* ── Desktop arrow buttons — hidden on mobile via Tailwind sm: ── */}
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

      {/*
        ── Scroll track ──────────────────────────────────────────────────────
        All scroll/snap/touch rules are inline styles — guaranteed to reach
        the DOM regardless of Tailwind v4 build pipeline CSS ordering.
        scrollbar-hide class from globals.css hides the webkit scrollbar.
      */}
      <div
        ref={containerRef}
        className="scrollbar-hide"
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'nowrap',
          gap: '12px',
          paddingBottom: '12px',
          paddingTop: '8px',
          paddingLeft: '4px',
          paddingRight: '4px',
          overflowX: 'scroll',
          overflowY: 'hidden',
          overscrollBehaviorX: 'contain',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-x',
          willChange: 'scroll-position',
          cursor: 'grab',
        } as React.CSSProperties}
      >
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={cat.customUrl || `/shop?categorySlug=${cat.slug}`}
            data-cat-card="true"
            className="group border border-[#222222]/5 shadow-md hover:shadow-2xl transition-shadow duration-500"
            style={{
              // Mobile-first: ~42vw so two cards peek at 375px.
              // clamp() ensures it never collapses below 150px or exceeds 440px.
              // On tablet/desktop we switch to a larger fixed width below via the
              // CSS custom property trick — but since we can't do @media in inline
              // styles, we use a JS calculation on mount via CSS var.
              flex: '0 0 clamp(150px, 42vw, 220px)',
              width: 'clamp(150px, 42vw, 220px)',
              minWidth: 'clamp(150px, 42vw, 220px)',
              height: '260px',
              flexShrink: 0,
              scrollSnapAlign: 'start',
              borderRadius: '20px',
              overflow: 'hidden',
              position: 'relative',
              display: 'block',
            } as React.CSSProperties}
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
            <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500 ease-out">
              <div className="space-y-1">
                <h3 className="text-[15px] sm:text-[20px] md:text-[24px] font-extrabold text-white uppercase tracking-wider group-hover:text-[#E56717] transition-colors duration-300 drop-shadow-md">
                  {cat.name}
                </h3>
                <span className="text-[10px] sm:text-[12px] text-[#E56717] uppercase tracking-widest font-bold flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                  View Collection{' '}
                  <span className="transform translate-x-0 group-hover:translate-x-1 transition-transform duration-300">→</span>
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Mobile arrow buttons — centered below track, hidden on ≥640px ── */}
      <div className="flex sm:hidden justify-center items-center gap-6 mt-4">
        <button
          onPointerDown={() => scroll('left')}
          disabled={!canScrollLeft}
          style={{ touchAction: 'manipulation' }}
          aria-label="Scroll left"
          className={`w-11 h-11 rounded-full border flex items-center justify-center transition-all duration-200 ${
            canScrollLeft
              ? 'bg-white border-[#222222]/20 text-[#222222] active:bg-[#E56717] active:text-white active:border-[#E56717] shadow-md active:scale-95'
              : 'bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed opacity-40'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button
          onPointerDown={() => scroll('right')}
          disabled={!canScrollRight}
          style={{ touchAction: 'manipulation' }}
          aria-label="Scroll right"
          className={`w-11 h-11 rounded-full border flex items-center justify-center transition-all duration-200 ${
            canScrollRight
              ? 'bg-[#E56717] border-[#E56717] text-white shadow-md active:scale-95 active:opacity-80'
              : 'bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed opacity-40'
          }`}
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
