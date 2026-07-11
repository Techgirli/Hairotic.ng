'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

const ITEMS = [
  '✨ Free delivery within Lagos on orders above ₦250,000',
  '🔥 New Drop: Body Wave Bundles just landed',
  '💎 100% Vietnamese Donor Hair — No shedding guaranteed',
  '🚚 Same-day delivery in Lagos • 48-hr nationwide',
  '👑 Hairotic Baddies get exclusive early access — Join now',
];

export default function PromoTicker() {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    // Measure one set of items and scroll infinitely
    const totalWidth = track.scrollWidth / 2;

    const tween = gsap.to(track, {
      x: -totalWidth,
      duration: 28,
      ease: 'none',
      repeat: -1,
      modifiers: {
        x: (x) => `${parseFloat(x) % totalWidth}px`,
      },
    });

    // Pause on hover for readability
    const parent = track.parentElement;
    const pause = () => tween.pause();
    const play = () => tween.play();
    parent?.addEventListener('mouseenter', pause);
    parent?.addEventListener('mouseleave', play);

    return () => {
      tween.kill();
      parent?.removeEventListener('mouseenter', pause);
      parent?.removeEventListener('mouseleave', play);
    };
  }, []);

  // Render items twice for seamless loop
  const allItems = [...ITEMS, ...ITEMS];

  return (
    <div className="promo-bar w-full bg-[#E56717] h-11 flex items-center overflow-hidden cursor-default select-none">
      <div
        ref={trackRef}
        className="flex gap-0 whitespace-nowrap will-change-transform"
        style={{ display: 'flex' }}
      >
        {allItems.map((item, i) => (
          <span
            key={i}
            className="text-[13px] font-semibold text-white uppercase tracking-widest px-10 flex-shrink-0 flex items-center gap-2"
          >
            {item}
            <span className="text-white/40 mx-4">•</span>
          </span>
        ))}
      </div>
    </div>
  );
}
