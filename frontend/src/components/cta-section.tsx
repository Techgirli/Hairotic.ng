'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function CtaSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const btnRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const mm = gsap.matchMedia();
    const targets = el.querySelectorAll('.cta-fade');

    mm.add("(min-width: 768px)", () => {
      // Fade-in layout elements with scale and ease
      gsap.fromTo(
        targets,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.15,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            once: true,
          },
        }
      );
    });

    mm.add("(max-width: 767px)", () => {
      gsap.set(targets, { y: 0, opacity: 1 });
    });

    return () => mm.revert();
  }, []);

  return (
    <section ref={containerRef} className="py-6 bg-white overflow-hidden select-none">
      <div className="max-w-7xl mx-auto px-6">
        <div className="relative rounded-[24px] bg-[#E56717] overflow-hidden py-10 px-6 md:px-12 text-center text-white shadow-xl flex flex-col items-center justify-center space-y-4">
          
          {/* Animated decorative shapes in background */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,_rgba(255,255,255,0.15)_0%,_transparent_60%)] pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,_rgba(0,0,0,0.15)_0%,_transparent_50%)] pointer-events-none" />

          {/* Icon Badge */}
          <div className="cta-fade flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em]">Hey Baddie!</span>
          </div>

          {/* Heading */}
          <h2
            ref={titleRef}
            className="cta-fade font-display text-[26px] md:text-[38px] leading-[1.1] uppercase tracking-tight drop-shadow-md max-w-2xl"
          >
            Upgrade Your Vibe. <br /> Shop Premium Raw Hair.
          </h2>

          {/* Subtext */}
          <p className="cta-fade text-[13.5px] md:text-[15px] text-white/90 max-w-lg font-light leading-relaxed">
            Invest in quality donor hair that stands out. Curls that bounce back, lace that disappears, and volume that commands attention.
          </p>

          {/* Catchy Button */}
          <div className="cta-fade pt-2">
            <a
              ref={btnRef as any}
              href="https://chat.whatsapp.com/DrRFipkycJE6j6b2ZLApLy"
              target="_blank"
              rel="noopener noreferrer"
              className="group/cta inline-flex h-[48px] px-8 bg-[#222222] hover:bg-black text-white text-[14px] font-bold uppercase tracking-widest rounded-[12px] shadow-lg items-center justify-center gap-2 active:scale-95 transition-all duration-300"
            >
              <span>Join WhatsApp Group</span>
              <ArrowRight className="w-4 h-4 group-hover/cta:translate-x-1.5 transition-transform duration-300" />
            </a>
          </div>

        </div>
      </div>
    </section>
  );
}
