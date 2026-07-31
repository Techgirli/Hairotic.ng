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
                  start: 'top 95%',
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
    const cardWidth = firstCard ? firstCard.offsetWidth + 24 : el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === 'left' ? -cardWidth : cardWidth,
      behavior: 'smooth',
    });
    setTimeout(updateArrows, 400);
  };

  return (
    <div className="relative w-full">
      {/* 
        Top Header Controls Row: Active navigation arrows on all screen sizes
      */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 px-1">
        <p className="text-[13px] sm:text-[14px] text-[#6B7280] font-medium tracking-wide flex items-center gap-1.5">
          <span className="text-[#E56717] font-bold">←</span> Scroll or swipe to explore <span className="text-[#E56717] font-bold">→</span>
        </p>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            aria-label="Scroll left"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[#222222]/15 bg-white shadow-sm flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#E56717] hover:text-white hover:border-[#E56717] transition-all cursor-pointer group"
          >
            <ChevronLeft className="w-5 h-5 text-[#222222] group-hover:text-white transition-colors" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            aria-label="Scroll right"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[#222222]/15 bg-white shadow-sm flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#E56717] hover:text-white hover:border-[#E56717] transition-all cursor-pointer group"
          >
            <ChevronRight className="w-5 h-5 text-[#222222] group-hover:text-white transition-colors" />
          </button>
        </div>
      </div>

      {/* 
        Full Horizontal Carousel with wider card width on mobile, tablet & desktop
      */}
      <div
        ref={containerRef}
        onScroll={updateArrows}
        className="flex gap-4 sm:gap-6 md:gap-8 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 sm:-mx-6 sm:px-6 pb-4"
        style={{
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={cat.customUrl || `/shop?categorySlug=${cat.slug}`}
            data-cat-card="true"
            className="shrink-0 w-[82vw] sm:w-[350px] md:w-[400px] lg:w-[440px] snap-start group relative h-[300px] sm:h-[360px] md:h-[420px] rounded-[24px] sm:rounded-[32px] overflow-hidden border border-[#222222]/5 shadow-md hover:shadow-2xl transition-all duration-500 block"
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
            <div className="absolute bottom-5 left-5 right-5 sm:bottom-7 sm:left-7 sm:right-7 md:bottom-9 md:left-9 md:right-9 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500 ease-out">
              <div className="space-y-1.5 sm:space-y-2.5">
                <h3 className="text-[18px] sm:text-[22px] md:text-[28px] font-extrabold text-white uppercase tracking-wider group-hover:text-[#E56717] transition-colors duration-300 drop-shadow-md">
                  {cat.name}
                </h3>
                <span className="text-[12px] sm:text-[13px] md:text-[14px] text-[#E56717] uppercase tracking-widest font-bold flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                  View Collection 
                  <span className="transform translate-x-0 group-hover:translate-x-1.5 transition-transform duration-300">→</span>
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
