'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useToastStore } from '../../store/toastStore';
import { Trash2, ShoppingBag, Heart, LogIn } from 'lucide-react';
import Header from '../../components/header';
import Footer from '@/components/footer';

import { useRouter } from 'next/navigation';

interface ProductImage {
  id: string;
  url: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
}

interface ProductVariant {
  id: string;
  sku: string;
  price: number;
  attributes: { length?: string; texture?: string };
  product: Product;
  images: ProductImage[];
  inventory?: { quantity: number } | null;
}

interface WishlistItem {
  id: string;
  productVariantId: string;
  variant: ProductVariant;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export default function WishlistPage() {
  const router = useRouter();
  const { user, checkMe } = useAuthStore();
  const { addItem } = useCartStore();

  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Run auth check on mount
  useEffect(() => {
    checkMe().finally(() => setIsLoading(false));
  }, [checkMe]);

  useEffect(() => {
    if (user) {
      router.push('/account');
    }
  }, [user, router]);

  const handleRemove = async (variantId: string) => {
    try {
      const res = await fetch(`${API_URL}/wishlist/${variantId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to remove item');
      setWishlist((prev) => prev.filter((item) => item.productVariantId !== variantId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMoveToBag = async (item: WishlistItem) => {
    try {
      await addItem(item.productVariantId, 1);
      // Remove from wishlist on successful add
      await handleRemove(item.productVariantId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      useToastStore.getState().showToast(message || 'Failed to move to bag', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-16 select-none bg-[#FAF7F4] min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#E56717]" />
      </div>
    );
  }

  // Not logged in state
  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-16 select-none bg-[#FAF7F4] min-h-screen text-center font-sans">
        <div className="max-w-md space-y-6 bg-white border border-[#222222]/5 p-8 rounded-[24px] shadow-sm">
          <div className="w-16 h-16 rounded-full bg-[#E56717]/10 flex items-center justify-center text-[#E56717] mx-auto">
            <Heart className="w-8 h-8 fill-[#E56717]" />
          </div>
          <div className="space-y-2">
            <h3 className="text-[20px] font-bold text-[#222222] uppercase tracking-wide">Save Your Favorites</h3>
            <p className="text-[14px] text-[#6B7280] leading-relaxed">
              Create an account or log in to build your personal wishlist and track hair drops.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/admin/login"
              className="inline-flex h-12 px-6 bg-[#222222] hover:bg-[#E56717] text-white text-[13px] font-bold uppercase tracking-widest rounded-[12px] shadow-md hover:shadow-lg transition-all items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Log In To Save</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-white">
      {/* Header */}
      <Header />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-12 flex-1 space-y-8 select-none">
        <div>
          <h2 className="text-[28px] font-bold text-[#222222] uppercase tracking-wide">My Wishlist</h2>
          <p className="text-[13px] text-[#6B7280]">Saved {wishlist.length} items</p>
        </div>

        {wishlist.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {wishlist.map((item) => {
              const variant = item.variant;
              const priceInNgn = variant.price / 100;
              const image = variant.images[0]?.url || '/Logo/photo_2023-09-25_16-13-56.jpg';
              const stock = variant.inventory?.quantity ?? 0;
              const isOutOfStock = stock <= 0;

              return (
                <div
                  key={item.id}
                  className="group bg-white rounded-[24px] border border-[#222222]/5 p-4 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Image container */}
                    <div className="relative h-[220px] rounded-[20px] overflow-hidden bg-[#FAF7F4] border border-[#222222]/5">
                      <img
                        src={image}
                        alt={variant.product.name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => handleRemove(item.productVariantId)}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 hover:bg-[#EF4444] hover:text-white flex items-center justify-center text-[#6B7280] transition-colors duration-200 shadow-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Information */}
                    <div className="space-y-1 px-1">
                      <h4 className="text-[15px] font-bold text-[#222222] line-clamp-1">
                        {variant.product.name}
                      </h4>
                      <p className="text-[11px] text-[#6B7280] font-semibold uppercase tracking-wider">
                        Length: {variant.attributes.length || 'Default'}&quot; | {variant.attributes.texture || 'straight'}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-[16px] font-extrabold text-[#E56717]">
                          ₦{priceInNgn.toLocaleString()}
                        </span>
                        {isOutOfStock && (
                          <span className="text-[10px] text-[#EF4444] font-bold uppercase tracking-wider border border-[#EF4444]/20 px-1.5 py-0.5 rounded">
                            Sold Out
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 px-1">
                    <button
                      disabled={isOutOfStock}
                      onClick={() => handleMoveToBag(item)}
                      className="w-full h-11 bg-[#FAF7F4] hover:bg-[#E56717] disabled:bg-[#FAF7F4]/50 disabled:text-[#6B7280]/40 text-[#222222] hover:text-white text-[12px] font-bold uppercase tracking-widest rounded-[12px] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Move To Bag</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty state */
          <div className="bg-[#FAF7F4] border border-[#222222]/5 rounded-[24px] p-16 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#E56717]/10 flex items-center justify-center text-[#E56717] mx-auto">
              <Heart className="w-8 h-8 fill-none" />
            </div>
            <h3 className="text-[18px] font-bold text-[#222222]">Your Wishlist Is Empty</h3>
            <p className="text-[#6B7280] text-[14px] max-w-sm mx-auto">
              Save hair units you love to see them here, compare prices, and move them directly to your bag.
            </p>
            <div className="pt-2">
              <Link
                href="/shop"
                className="inline-flex h-11 px-6 bg-[#222222] hover:bg-[#E56717] text-white text-[13px] font-bold uppercase tracking-wider rounded-[12px] transition-colors duration-200 items-center justify-center"
              >
                Start Browsing
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Premium Footer */}
      <Footer />
    </div>
  );
}
