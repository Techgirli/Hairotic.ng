'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function GSAPAnimations() {
  useEffect(() => {
    let mm: any = null;

    // Small delay so the DOM is fully painted before GSAP reads it
    const timer = setTimeout(() => {
      mm = gsap.matchMedia();

      // ── 1. HERO: Cinematic entrance (runs on all screens on load)
      const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      heroTl
        .fromTo('.hero-badge',
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, duration: 1, delay: 0.3 }
        )
        .fromTo('.hero-title-word',
          { y: 100, opacity: 0, rotateX: -70 },
          { y: 0, opacity: 1, rotateX: 0, stagger: 0.15, duration: 1.3, ease: 'expo.out' },
          '-=0.5'
        )
        .fromTo('.hero-subtitle',
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 1 },
          '-=0.7'
        )
        .fromTo('.hero-cta',
          { scale: 0.75, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.9, ease: 'back.out(2)' },
          '-=0.6'
        );

      // ── 2. RESPONSIVE SCROLL TRIGGER ANIMATIONS (Desktop/Tablet Only, >=768px) ──
      mm.add("(min-width: 768px)", () => {
        // HERO BG: Slow parallax zoom on scroll
        gsap.to('.hero-bg-image', {
          scale: 1.12,
          scrollTrigger: {
            trigger: '.hero-section',
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        });
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mm) {
        mm.revert();
      }
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return null;
}

// ── Magnetic tilt hook for product cards ────────────────────────────────────
export function useMagneticTilt(strength = 12) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);
      gsap.to(el, {
        rotateY: dx * strength,
        rotateX: -dy * strength,
        transformPerspective: 800,
        ease: 'power2.out',
        duration: 0.5,
      });
    };

    const handleLeave = () => {
      gsap.to(el, {
        rotateY: 0,
        rotateX: 0,
        duration: 0.9,
        ease: 'elastic.out(1, 0.5)',
      });
    };

    el.addEventListener('mousemove', handleMove);
    el.addEventListener('mouseleave', handleLeave);
    return () => {
      el.removeEventListener('mousemove', handleMove);
      el.removeEventListener('mouseleave', handleLeave);
    };
  }, [strength]);

  return ref;
}
