'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import gsap from 'gsap';

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
  const sliderRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Check scroll position to show/hide navigation buttons
  const checkScroll = () => {
    const container = containerRef.current;
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      // Run once initially
      checkScroll();
      
      // Also check on window resize
      window.addEventListener('resize', checkScroll);
    }
    return () => {
      if (container) {
        container.removeEventListener('scroll', checkScroll);
      }
      window.removeEventListener('resize', checkScroll);
    };
  }, [categories]);

  // Scroll function — uses native scrollTo for iOS/mobile WebKit compatibility
  // (GSAP cannot animate scrollLeft reliably on mobile Safari)
  const scroll = (direction: 'left' | 'right') => {
    const container = containerRef.current;
    if (!container) return;

    const isMobile = container.clientWidth < 640;
    const scrollAmount = isMobile ? 200 : 460;
    const delta = direction === 'left' ? -scrollAmount : scrollAmount;
    const targetScroll = container.scrollLeft + delta;

    container.scrollTo({ left: targetScroll, behavior: 'smooth' });
    // Give scroll time to complete before rechecking
    setTimeout(checkScroll, 400);
  };

  return (
    <div className="relative group/slider w-full" ref={sliderRef}>
      {/* Desktop Navigation Buttons (Top Right, Hidden on Mobile) */}
      <div className="absolute -top-20 right-6 hidden sm:flex items-center gap-3 z-20">
        <button
          onClick={() => scroll('left')}
          disabled={!canScrollLeft}
          className={`w-12 h-12 rounded-full border border-[#222222]/10 flex items-center justify-center transition-all duration-300 ${
            canScrollLeft
              ? 'bg-white text-[#222222] hover:bg-[#E56717] hover:text-white hover:border-[#E56717] shadow-md hover:scale-105 active:scale-95'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
          }`}
          aria-label="Scroll left"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => scroll('right')}
          disabled={!canScrollRight}
          className={`w-12 h-12 rounded-full border border-[#222222]/10 flex items-center justify-center transition-all duration-300 ${
            canScrollRight
              ? 'bg-white text-[#222222] hover:bg-[#E56717] hover:text-white hover:border-[#E56717] shadow-md hover:scale-105 active:scale-95'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
          }`}
          aria-label="Scroll right"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
      <div
        ref={containerRef}
        className="flex flex-row flex-nowrap gap-6 md:gap-8 pb-8 pt-2 overflow-x-auto overflow-y-hidden scrollbar-hide px-2 w-full"
        style={{
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          overflowX: 'auto',
          touchAction: 'pan-x',
          cursor: 'grab',
        }}
      >
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={cat.customUrl || `/shop?categorySlug=${cat.slug}`}
            className="category-card group relative h-[260px] sm:h-[320px] md:h-[380px] w-[180px] sm:w-[300px] md:w-[380px] lg:w-[440px] shrink-0 rounded-[20px] sm:rounded-[32px] overflow-hidden border border-[#222222]/5 shadow-md hover:shadow-2xl transition-all duration-500 block"
            style={{ flexShrink: 0 }}
          >
            {/* Background image container for smooth parallax slide */}
            <div
              className="absolute inset-0 bg-cover bg-center scale-105 group-hover:scale-110 transition-transform duration-700 ease-out"
              style={{ backgroundImage: `url('${cat.image}')` }}
            />
            {/* Gradient overlay - deepens on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#222222]/95 via-[#222222]/40 to-transparent group-hover:via-[#222222]/20 transition-all duration-500" />
            
            {/* Elegant lighting shine effect on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-tr from-transparent via-white/5 to-white/10 transition-opacity duration-700 pointer-events-none" />

            {/* Bottom info section with subtle slide up */}
            <div className="absolute bottom-4 left-4 right-4 sm:bottom-8 sm:left-8 sm:right-8 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500 ease-out">
              <div className="space-y-1 sm:space-y-2">
                <h3 className="text-[18px] sm:text-[22px] md:text-[26px] font-extrabold text-white uppercase tracking-wider group-hover:text-[#E56717] transition-colors duration-300 drop-shadow-md">
                  {cat.name}
                </h3>
                <span className="text-[11px] sm:text-[13px] text-[#E56717] uppercase tracking-widest font-bold flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                  View Collection 
                  <span className="transform translate-x-0 group-hover:translate-x-1 transition-transform duration-300">→</span>
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Mobile Navigation Buttons (Centered below the slider, visible only on Mobile) */}
      <div className="flex sm:hidden justify-center items-center gap-6 mt-5">
        <button
          onPointerDown={() => scroll('left')}
          disabled={!canScrollLeft}
          style={{ touchAction: 'manipulation' }}
          className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all duration-200 ${
            canScrollLeft
              ? 'bg-white border-[#222222]/20 text-[#222222] active:bg-[#E56717] active:text-white active:border-[#E56717] shadow-md active:scale-95'
              : 'bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed opacity-40'
          }`}
          aria-label="Scroll left"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button
          onPointerDown={() => scroll('right')}
          disabled={!canScrollRight}
          style={{ touchAction: 'manipulation' }}
          className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all duration-200 ${
            canScrollRight
              ? 'bg-[#E56717] border-[#E56717] text-white shadow-md active:scale-95 active:opacity-80'
              : 'bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed opacity-40'
          }`}
          aria-label="Scroll right"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
