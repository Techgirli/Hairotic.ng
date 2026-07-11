'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface Particle {
  el: HTMLDivElement;
  x: number;
  y: number;
  size: number;
  delay: number;
}

export default function HeroParticles() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const particles: Particle[] = [];
    const count = 16;

    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      const size = Math.random() * 5 + 2;
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const delay = Math.random() * 3;

      el.style.cssText = `
        position: absolute;
        left: ${x}%;
        top: ${y}%;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: radial-gradient(circle, #E56717 0%, rgba(229,103,23,0.2) 100%);
        pointer-events: none;
        will-change: transform, opacity;
      `;
      container.appendChild(el);
      particles.push({ el, x, y, size, delay });
    }

    particles.forEach(({ el, delay }) => {
      // Floating up animation
      gsap.to(el, {
        y: -(Math.random() * 80 + 40),
        x: (Math.random() - 0.5) * 60,
        opacity: 0,
        duration: Math.random() * 4 + 3,
        delay,
        ease: 'power1.out',
        repeat: -1,
        repeatDelay: Math.random() * 2,
        onRepeat() {
          gsap.set(el, { y: 0, x: 0, opacity: Math.random() * 0.6 + 0.2 });
        },
      });

      // Pulse scale
      gsap.to(el, {
        scale: Math.random() * 1.5 + 0.8,
        duration: Math.random() * 2 + 1,
        delay,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });
    });

    return () => {
      particles.forEach(({ el }) => {
        gsap.killTweensOf(el);
        el.remove();
      });
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none z-[5]"
      aria-hidden="true"
    />
  );
}
