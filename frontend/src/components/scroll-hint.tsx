'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function ScrollHint() {
  const containerRef = useRef<HTMLDivElement>(null);
  const arrowsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Fade in after hero lands — fromTo guarantees end state
    gsap.fromTo(container,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, delay: 2.8, duration: 0.9, ease: 'power2.out' }
    );

    // Staggered cascading arrows
    gsap.to(arrowsRef.current, {
      y: 8,
      stagger: 0.2,
      duration: 0.8,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });

    // Fade out on first scroll
    const onScroll = () => {
      if (window.scrollY > 50) {
        gsap.to(container, { opacity: 0, pointerEvents: 'none', duration: 0.5 });
        window.removeEventListener('scroll', onScroll);
      }
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);


  return (
    <div
      ref={containerRef}
      className="hero-scroll-hint absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-20"
      style={{ opacity: 0 }}
      aria-hidden="true"
    >
      <span className="text-white/50 text-[11px] uppercase tracking-[0.25em] font-semibold mb-1">Scroll</span>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          ref={(el) => { if (el) arrowsRef.current[i] = el; }}
          className="w-[18px] h-[18px] border-r-2 border-b-2 border-white/60 rotate-45"
          style={{ opacity: 0.2 + i * 0.25 }}
        />
      ))}
    </div>
  );
}
