'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { MessageCircle } from 'lucide-react';

export default function AnimatedWhatsApp() {
  const buttonRef = useRef<HTMLAnchorElement>(null);
  const ring1Ref = useRef<HTMLDivElement>(null);
  const ring2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const btn = buttonRef.current;
    const r1 = ring1Ref.current;
    const r2 = ring2Ref.current;
    if (!btn || !r1 || !r2) return;

    // Bounce in — use fromTo so we always end at scale:1, opacity:1
    gsap.fromTo(btn,
      { scale: 0.4, opacity: 0, y: 20 },
      { scale: 1, opacity: 1, y: 0, duration: 1, delay: 0.8, ease: 'back.out(2.5)' }
    );

    // Pulse rings — start after button appears
    const pulseTl = gsap.timeline({ repeat: -1, repeatDelay: 2, delay: 2 });
    pulseTl
      .fromTo(r1,
        { scale: 1, opacity: 0.7 },
        { scale: 2.4, opacity: 0, duration: 1.4, ease: 'power2.out' }
      )
      .fromTo(r2,
        { scale: 1, opacity: 0.5 },
        { scale: 3, opacity: 0, duration: 1.8, ease: 'power2.out' },
        '-=1.2'
      );

    // Idle float — subtle bob up/down
    gsap.to(btn, {
      y: -5,
      duration: 2,
      delay: 1.8,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });

    // Magnetic hover
    const handleMove = (e: MouseEvent) => {
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) * 0.25;
      const dy = (e.clientY - cy) * 0.25;
      gsap.to(btn, { x: dx, y: dy, duration: 0.35, ease: 'power2.out', overwrite: 'auto' });
    };

    const handleLeave = () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.4)', overwrite: 'auto' });
    };

    btn.addEventListener('mousemove', handleMove);
    btn.addEventListener('mouseleave', handleLeave);

    return () => {
      pulseTl.kill();
      gsap.killTweensOf(btn);
      btn.removeEventListener('mousemove', handleMove);
      btn.removeEventListener('mouseleave', handleLeave);
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-40 select-none">
      <div className="relative flex items-center justify-center">
        {/* Pulse rings — sized to match the button */}
        <div
          ref={ring1Ref}
          className="absolute rounded-full bg-[#25D366] pointer-events-none"
          style={{ inset: 0, opacity: 0 }}
          aria-hidden="true"
        />
        <div
          ref={ring2Ref}
          className="absolute rounded-full bg-[#25D366] pointer-events-none"
          style={{ inset: 0, opacity: 0 }}
          aria-hidden="true"
        />

        <a
          ref={buttonRef}
          href="https://wa.me/2348087794441?text=Hello,%20I'm%20interested%20in%20custom%20hair%20units!"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex items-center justify-center bg-[#25D366] hover:bg-[#20BA5A] text-white p-3 hover:px-5 rounded-full shadow-2xl font-semibold text-[14px] cursor-pointer transition-all duration-300 ease-in-out"
          style={{ opacity: 0, willChange: 'transform' }}
        >
          <MessageCircle className="w-5 h-5 fill-white text-[#25D366] shrink-0" />
          <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap">
            Consult Hair Expert
          </span>
        </a>
      </div>
    </div>
  );
}
