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

  // Scroll function using GSAP for smooth custom easing
  const scroll = (direction: 'left' | 'right') => {
    const container = containerRef.current;
    if (!container) return;

    const scrollAmount = direction === 'left' ? -460 : 460;
    const targetScroll = container.scrollLeft + scrollAmount;

    // Animate the scrollLeft property smoothly
    gsap.to(container, {
      scrollLeft: targetScroll,
      duration: 0.7,
      ease: 'power3.out',
      onComplete: checkScroll,
    });
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

      {/* Mobile Navigation Buttons (Floating on Left & Right Sides, Visible only on Mobile) */}
      <div className="absolute -left-2 top-[190px] -translate-y-1/2 z-25 flex sm:hidden">
        <button
          onClick={() => scroll('left')}
          disabled={!canScrollLeft}
          className={`w-10 h-10 rounded-full border border-[#222222]/10 flex items-center justify-center bg-white text-[#222222] shadow-lg transition-all duration-300 ${
            canScrollLeft ? 'opacity-90 scale-100' : 'opacity-0 scale-75 pointer-events-none'
          }`}
          aria-label="Scroll left"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>
      <div className="absolute -right-2 top-[190px] -translate-y-1/2 z-25 flex sm:hidden">
        <button
          onClick={() => scroll('right')}
          disabled={!canScrollRight}
          className={`w-10 h-10 rounded-full border border-[#222222]/10 flex items-center justify-center bg-white text-[#222222] shadow-lg transition-all duration-300 ${
            canScrollRight ? 'opacity-90 scale-100' : 'opacity-0 scale-75 pointer-events-none'
          }`}
          aria-label="Scroll right"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      <div
        ref={containerRef}
        className="flex flex-row flex-nowrap gap-6 md:gap-8 pb-8 pt-2 scrollbar-hide px-2 w-full"
        style={{
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          display: 'flex',
          flexWrap: 'nowrap',
          overflowX: 'auto',
          overflowY: 'hidden',
        }}
      >
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={cat.customUrl || `/shop?categorySlug=${cat.slug}`}
            className="category-card group relative h-[380px] w-[280px] sm:w-[380px] md:w-[440px] shrink-0 rounded-[32px] overflow-hidden border border-[#222222]/5 shadow-md hover:shadow-2xl transition-all duration-500 block select-none"
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
            <div className="absolute bottom-8 left-8 right-8 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500 ease-out">
              <div className="space-y-2">
                <h3 className="text-[26px] font-extrabold text-white uppercase tracking-wider group-hover:text-[#E56717] transition-colors duration-300 drop-shadow-md">
                  {cat.name}
                </h3>
                <span className="text-[13px] text-[#E56717] uppercase tracking-widest font-bold flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
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
