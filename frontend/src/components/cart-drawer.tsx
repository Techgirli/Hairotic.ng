'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useCartStore } from '../store/cartStore';
import { X, Trash2, ShoppingBag, Plus, Minus, ArrowRight } from 'lucide-react';

export default function CartDrawer() {
  const {
    items,
    sessionId,
    isDrawerOpen,
    initializeSession,
    fetchCart,
    updateQuantity,
    removeItem,
    toggleDrawer,
  } = useCartStore();

  const drawerRef = useRef<HTMLDivElement>(null);

  // Initialize session and fetch cart
  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  useEffect(() => {
    if (sessionId) {
      fetchCart();
    }
  }, [sessionId, fetchCart]);

  // Close drawer on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        isDrawerOpen &&
        drawerRef.current &&
        !drawerRef.current.contains(e.target as Node)
      ) {
        toggleDrawer(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isDrawerOpen, toggleDrawer]);

  if (!isDrawerOpen) return null;

  // Calculate subtotals
  const subtotal = items.reduce(
    (acc, item) => acc + item.variant.price * item.quantity,
    0
  );
  const subtotalInNgn = subtotal / 100;
  const isLagosFree = subtotalInNgn >= 250000;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none font-sans">
      {/* Dark blur overlay backdrop */}
      <div className="absolute inset-0 bg-[#222222]/60 backdrop-blur-sm transition-opacity duration-300" />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div
          ref={drawerRef}
          className="w-screen max-w-md bg-white flex flex-col shadow-2xl h-full"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#222222]/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#E56717]" />
              <h3 className="text-[18px] font-bold text-[#222222] uppercase tracking-wide">
                Your Shopping Bag ({items.length})
              </h3>
            </div>
            <button
              onClick={() => toggleDrawer(false)}
              className="p-1.5 rounded-full text-[#6B7280] hover:text-[#222222] hover:bg-[#FAF7F4] transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto py-4 px-6 space-y-4">
            {items.length > 0 ? (
              items.map((item) => {
                const variant = item.variant;
                const priceInNgn = variant.price / 100;
                const image =
                  variant.images[0]?.url || '/Logo/photo_2023-09-25_16-13-56.jpg';

                return (
                  <div
                    key={item.id}
                    className="flex gap-4 p-3 bg-[#FAF7F4] rounded-[16px] border border-[#222222]/5"
                  >
                    {/* Thumbnail */}
                    <div className="w-20 h-20 rounded-[12px] overflow-hidden shrink-0 border border-[#222222]/10 bg-white">
                      <img
                        src={image}
                        alt={variant.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <h4 className="text-[14px] font-bold text-[#222222] truncate">
                          {variant.product.name}
                        </h4>
                        <p className="text-[12px] text-[#6B7280] font-medium uppercase tracking-wider">
                          Length: {variant.attributes.length || 'Default'}&quot; Inches |{' '}
                          {variant.attributes.texture || 'straight'}
                        </p>
                      </div>

                      {/* Quantity control & pricing */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center border border-[#222222]/10 rounded-[8px] overflow-hidden bg-white h-7">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-full text-[#222222] hover:bg-[#222222]/5 flex items-center justify-center font-bold"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-[12px] font-bold text-[#222222]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-full text-[#222222] hover:bg-[#222222]/5 flex items-center justify-center font-bold"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="text-[14px] font-extrabold text-[#E56717]">
                          ₦{priceInNgn.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Remove Action */}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-[#6B7280] hover:text-[#EF4444] self-start pt-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20 select-none">
                <div className="w-16 h-16 rounded-full bg-[#E56717]/10 flex items-center justify-center text-[#E56717]">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-[16px] font-bold text-[#222222]">Your bag is empty</h4>
                  <p className="text-[13px] text-[#6B7280] max-w-[200px] mx-auto mt-1">
                    Add custom hair units or bone straight bundles to get started.
                  </p>
                </div>
                <button
                  onClick={() => toggleDrawer(false)}
                  className="h-10 px-5 bg-[#222222] hover:bg-[#E56717] text-white text-[13px] font-bold uppercase tracking-wider rounded-[12px] transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </div>

          {/* Footer controls */}
          {items.length > 0 && (
            <div className="border-t border-[#222222]/10 py-6 px-6 bg-[#FAF7F4] space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-[16px] text-[#222222]">
                  <span className="font-semibold">Subtotal</span>
                  <span className="font-extrabold text-[#E56717]">
                    ₦{subtotalInNgn.toLocaleString()}
                  </span>
                </div>
                <p className="text-[12px] text-[#6B7280] leading-normal">
                  {isLagosFree
                    ? '🎉 You qualify for free shipping within Lagos!'
                    : 'Shipping and payments are computed at checkout.'}
                </p>
              </div>

              <div className="space-y-2">
                <Link
                  href="/checkout"
                  onClick={() => toggleDrawer(false)}
                  className="w-full h-[52px] bg-[#E56717] hover:bg-[#C65A12] text-[#FFFFFF] text-[14px] font-bold uppercase tracking-widest rounded-[12px] flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                >
                  <span>Checkout Now</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => toggleDrawer(false)}
                  className="w-full h-11 border border-[#222222]/15 text-[#222222] hover:bg-[#222222]/5 text-[13px] font-bold uppercase tracking-widest rounded-[12px] transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
