'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import Link from 'next/link';
import { Heart } from 'lucide-react';

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  price: number;
  comparePrice: number | null;
}

export default function MagneticProductCard({
  name,
  slug,
  imageUrl,
  price,
  comparePrice,
}: ProductCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    const glow = glowRef.current;
    const img = imgRef.current;
    if (!card || !glow) return;

    const handleMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);

      gsap.to(card, {
        rotateY: dx * 10,
        rotateX: -dy * 10,
        transformPerspective: 900,
        ease: 'power2.out',
        duration: 0.4,
      });

      // Move the glow radial with mouse
      const glowX = ((e.clientX - rect.left) / rect.width) * 100;
      const glowY = ((e.clientY - rect.top) / rect.height) * 100;
      gsap.to(glow, {
        background: `radial-gradient(200px circle at ${glowX}% ${glowY}%, rgba(229,103,23,0.12) 0%, transparent 70%)`,
        opacity: 1,
        duration: 0.3,
      });

      if (img) {
        gsap.to(img, {
          scale: 1.06,
          duration: 0.5,
          ease: 'power2.out',
        });
      }
    };

    const handleLeave = () => {
      gsap.to(card, {
        rotateY: 0,
        rotateX: 0,
        duration: 0.8,
        ease: 'elastic.out(1, 0.5)',
      });
      gsap.to(glow, { opacity: 0, duration: 0.4 });
      if (img) {
        gsap.to(img, { scale: 1, duration: 0.5, ease: 'power2.out' });
      }
    };

    card.addEventListener('mousemove', handleMove);
    card.addEventListener('mouseleave', handleLeave);
    return () => {
      card.removeEventListener('mousemove', handleMove);
      card.removeEventListener('mouseleave', handleLeave);
    };
  }, []);

  return (
    <div ref={cardRef} style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}>
      <Link
        href={`/products/${slug}`}
        className="product-card group bg-white rounded-[24px] border border-[#222222]/5 p-4 shadow-sm hover:shadow-xl transition-shadow duration-300 flex flex-col justify-between relative overflow-hidden block"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Glow overlay */}
        <div
          ref={glowRef}
          className="absolute inset-0 rounded-[24px] pointer-events-none z-10 opacity-0"
          aria-hidden="true"
        />

        <div className="space-y-4">
          {/* Product image container */}
          <div className="relative h-[240px] rounded-[20px] overflow-hidden bg-[#FAF7F4] border border-[#222222]/5">
            <img
              ref={imgRef}
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover"
              style={{ willChange: 'transform' }}
            />
            <WishlistButton />
          </div>

          {/* Info details */}
          <div className="space-y-1 px-1">
            <h4 className="text-[16px] font-bold text-[#222222] group-hover:text-[#E56717] transition-colors duration-200 line-clamp-1">
              {name}
            </h4>
            <div className="flex items-center gap-2">
              <span className="text-[16px] font-extrabold text-[#E56717]">
                ₦{price.toLocaleString()}
              </span>
              {comparePrice && (
                <span className="text-[13px] text-[#6B7280] line-through">
                  ₦{comparePrice.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="pt-4 px-1 relative z-20">
          <span className="w-full h-11 bg-[#FAF7F4] group-hover:bg-[#E56717] text-[#222222] group-hover:text-white text-[13px] font-bold uppercase tracking-widest rounded-[12px] transition-all duration-300 flex items-center justify-center">
            Select Length
          </span>
        </div>
      </Link>
    </div>
  );
}

function WishlistButton() {
  const ref = useRef<HTMLButtonElement>(null);

  const handleClick = () => {
    if (!ref.current) return;
    gsap.timeline()
      .to(ref.current, { scale: 1.5, duration: 0.15, ease: 'power2.out' })
      .to(ref.current, { scale: 1, duration: 0.4, ease: 'elastic.out(1.5, 0.4)' });
  };

  return (
    <button
      ref={ref}
      onClick={(e) => { e.preventDefault(); handleClick(); }}
      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 hover:bg-[#E56717] hover:text-white flex items-center justify-center text-[#222222] transition-colors duration-200 shadow-sm z-20"
      aria-label="Add to wishlist"
    >
      <Heart className="w-4 h-4" />
    </button>
  );
}
