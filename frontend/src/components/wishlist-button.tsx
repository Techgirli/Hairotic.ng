'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import gsap from 'gsap';
import { useAuthStore } from '../store/authStore';

interface WishlistButtonProps {
  variantId?: string;
}

export default function WishlistButton({ variantId }: WishlistButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { user } = useAuthStore();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  // Check if this variant is already in the user's wishlist
  useEffect(() => {
    if (!user || !variantId) return;

    const checkWishlist = async () => {
      try {
        const res = await fetch(`${API_URL}/wishlist`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          // Check if variantId exists in user's saved wishlist items
          const found = data.some((item: any) => item.productVariantId === variantId);
          setIsFavorited(found);
        }
      } catch (e) {
        console.error('Failed to check wishlist state', e);
      }
    };

    checkWishlist();
  }, [user, variantId, API_URL]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      alert('Please create a profile or sign in to save favorites!');
      window.location.href = '/account';
      return;
    }

    if (!variantId || isChecking) return;

    setIsChecking(true);
    const btn = buttonRef.current;

    // Heart bounce animation
    if (btn) {
      gsap.timeline()
        .to(btn, { scale: 1.5, duration: 0.15, ease: 'power2.out' })
        .to(btn, { scale: 1, duration: 0.4, ease: 'elastic.out(1.5, 0.4)' });
    }

    try {
      if (isFavorited) {
        // Remove from wishlist
        const res = await fetch(`${API_URL}/wishlist/${variantId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        if (res.ok) {
          setIsFavorited(false);
        }
      } else {
        // Add to wishlist
        const res = await fetch(`${API_URL}/wishlist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ variantId }),
          credentials: 'include',
        });
        if (res.ok) {
          setIsFavorited(true);
          // Show quick alert
          alert('Added to favorites! You can manage it from your Dashboard.');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <button
      ref={buttonRef}
      onClick={handleToggle}
      className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm z-20 cursor-pointer ${
        isFavorited
          ? 'bg-[#E56717] text-white'
          : 'bg-white/80 text-[#222222] hover:bg-[#E56717] hover:text-white'
      }`}
      aria-label={isFavorited ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : 'fill-none'}`} />
    </button>
  );
}
