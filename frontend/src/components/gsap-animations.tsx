'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function GSAPAnimations() {
  useEffect(() => {
    // Small delay so the DOM is fully painted before GSAP reads it
    const timer = setTimeout(() => {
      const mm = gsap.matchMedia();

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

      // ── 2. DESKTOP ANIMATIONS (768px and up) ──────────────────────────────
      mm.add("(min-width: 768px)", () => {
        // HERO BG: Slow parallax zoom on scroll
        gsap.to('.hero-bg-image', {
          scale: 1.12,
          scrollTrigger: {
            trigger: '.hero-section',
            start: 'top top',
            end: 'bottom top',
            scrub: 2,
          },
        });

        // TRUST BAR: Slide up
        gsap.fromTo('.trust-item',
          { y: 50, opacity: 0 },
          {
            y: 0, opacity: 1,
            stagger: 0.2,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: '.trust-section',
              start: 'top 88%',
              once: true,
            },
          }
        );

        // SECTION HEADERS: Wipe reveal
        gsap.utils.toArray<HTMLElement>('.section-header-reveal').forEach((el) => {
          gsap.fromTo(el,
            { clipPath: 'inset(0 100% 0 0)', opacity: 0 },
            {
              clipPath: 'inset(0 0% 0 0)',
              opacity: 1,
              duration: 1.4,
              ease: 'power4.inOut',
              scrollTrigger: {
                trigger: el,
                start: 'top 90%',
                once: true,
              },
            }
          );
        });

        gsap.utils.toArray<HTMLElement>('.section-divider').forEach((el) => {
          gsap.fromTo(el,
            { scaleX: 0 },
            {
              scaleX: 1,
              transformOrigin: 'left center',
              duration: 1.2,
              ease: 'expo.out',
              scrollTrigger: {
                trigger: el,
                start: 'top 92%',
                once: true,
              },
            }
          );
        });

        // CATEGORY CARDS: Stagger reveal
        const categoryCards = gsap.utils.toArray<HTMLElement>('.category-card');
        categoryCards.forEach((card, i) => {
          gsap.fromTo(card,
            { y: 70, opacity: 0, scale: 0.94 },
            {
              y: 0, opacity: 1, scale: 1,
              duration: 1.1,
              delay: i * 0.12,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: '.categories-section',
                start: 'top 85%',
                once: true,
              },
            }
          );
        });

        // PRODUCT CARDS: Stagger fade-up
        gsap.fromTo('.product-card',
          { y: 60, opacity: 0 },
          {
            y: 0, opacity: 1,
            stagger: 0.13,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: '.products-section',
              start: 'top 85%',
              once: true,
            },
          }
        );

        // FOOTER REVEAL
        gsap.fromTo('.footer-col',
          { y: 40, opacity: 0 },
          {
            y: 0, opacity: 1,
            stagger: 0.12,
            duration: 0.9,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: 'footer',
              start: 'top 92%',
              once: true,
            },
          }
        );
      });

      // ── 3. MOBILE/TABLET FALLBACK (under 768px): Instant reveal ──────────
      mm.add("(max-width: 767px)", () => {
        gsap.set('.section-header-reveal', { clipPath: 'inset(0 0% 0 0)', opacity: 1 });
        gsap.set('.section-divider', { scaleX: 1 });
        gsap.set('.category-card', { y: 0, opacity: 1, scale: 1 });
        gsap.set('.trust-item', { y: 0, opacity: 1 });
        gsap.set('.product-card', { y: 0, opacity: 1 });
        gsap.set('.footer-col', { y: 0, opacity: 1 });
      });

      return () => mm.revert();
    }, 100);

    return () => clearTimeout(timer);
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
