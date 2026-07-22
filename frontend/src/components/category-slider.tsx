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

  // ── 1. GSAP ScrollTrigger Entrance Animation ────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let ctx: any = null;
    const timer = setTimeout(() => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { gsap } = require('gsap');
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { ScrollTrigger } = require('gsap/ScrollTrigger');
        gsap.registerPlugin(ScrollTrigger);

        const cards = el.querySelectorAll('[data-cat-card]');
        if (cards.length > 0) {
          ctx = gsap.context(() => {
            gsap.fromTo(
              cards,
              { y: 45, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 0.85,
                stagger: 0.12,
                ease: 'power3.out',
                scrollTrigger: {
                  trigger: el,
                  start: 'top 85%',
                  once: true,
                },
              }
            );
          }, el);
        }
      } catch {
        // Fallback if GSAP is unavailable
      }
    }, 50);

    return () => {
      clearTimeout(timer);
      if (ctx) ctx.revert();
    };
  }, [categories]);

  // ── 2. Scroll position checker & arrow state ────────────────────────────
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
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { ScrollTrigger } = require('gsap/ScrollTrigger');
        ScrollTrigger.refresh();
      } catch {
        // no-op
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

  // ── 3. Scroll handler ───────────────────────────────────────────────────
  const scroll = (direction: 'left' | 'right') => {
    const el = containerRef.current;
    if (!el) return;
    const firstCard = el.querySelector<HTMLElement>('[data-cat-card]');
    const cardWidth = firstCard ? firstCard.offsetWidth + 12 : el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === 'left' ? -cardWidth : cardWidth,
      behavior: 'smooth',
    });
    setTimeout(updateArrows, 400);
  };

  return (
    <div className="relative w-full">
      {/* 
        Top Header Row: Swipe hint on left, small circular navigation arrows top-right 
      */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 px-1">
        <p className="text-[12px] sm:text-[13px] text-[#6B7280] font-medium tracking-wide flex items-center gap-1.5">
          <span className="text-[#E56717] font-bold">←</span> Swipe to explore <span className="text-[#E56717] font-bold">→</span>
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            aria-label="Scroll left"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-[#222222]/10 bg-white shadow-sm flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#E56717]/10 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-[#222222]" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            aria-label="Scroll right"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-[#222222]/10 bg-white shadow-sm flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#E56717]/10 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-[#222222]" />
          </button>
        </div>
      </div>

      {/* 
        Peeking-carousel on mobile (<640px): w-[75vw] shows ~1.3–1.5 cards with 15-20% peeking edge.
        Reflows to 2-col grid on tablet (sm: 640px) and 4-col grid on desktop (lg: 1024px).
      */}
      <div
        ref={containerRef}
        onScroll={updateArrows}
        className="flex gap-3 sm:gap-6 md:gap-8 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible pb-4 sm:pb-0"
        style={{
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-x',
        }}
      >
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={cat.customUrl || `/shop?categorySlug=${cat.slug}`}
            data-cat-card="true"
            className="shrink-0 w-[75vw] max-w-[300px] sm:max-w-none sm:w-auto snap-start sm:snap-align-none group relative h-[250px] sm:h-[320px] md:h-[380px] rounded-[24px] sm:rounded-[32px] overflow-hidden border border-[#222222]/5 shadow-md hover:shadow-2xl transition-all duration-500 block"
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
                <h3 className="text-[16px] sm:text-[20px] md:text-[26px] font-extrabold text-white uppercase tracking-wider group-hover:text-[#E56717] transition-colors duration-300 drop-shadow-md">
                  {cat.name}
                </h3>
                <span className="text-[11px] sm:text-[12px] md:text-[13px] text-[#E56717] uppercase tracking-widest font-bold flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
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
