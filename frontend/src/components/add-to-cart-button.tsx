'use client';

import React, { useState } from 'react';
import { ShoppingBag, Check, Loader2 } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useToastStore } from '../store/toastStore';

interface AddToCartButtonProps {
  variantId?: string;
  compact?: boolean;
}

export default function AddToCartButton({ variantId, compact = false }: AddToCartButtonProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');
  const { addItem, toggleDrawer } = useCartStore();

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!variantId || status !== 'idle') return;

    setStatus('loading');
    try {
      await addItem(variantId, 1);
      setStatus('done');
      useToastStore.getState().showToast('Added to your bag!', 'success');
      toggleDrawer(true);
      setTimeout(() => setStatus('idle'), 2000);
    } catch {
      useToastStore.getState().showToast('Could not add to bag. Please try again.', 'error');
      setStatus('idle');
    }
  };

  if (compact) {
    return (
      <button
        onClick={handleAdd}
        disabled={status !== 'idle'}
        className={`absolute bottom-3 left-3 h-8 px-3 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all duration-300 shadow-sm z-20 cursor-pointer ${
          status === 'done'
            ? 'bg-[#22C55E] text-white'
            : 'bg-white/90 text-[#222222] hover:bg-[#E56717] hover:text-white'
        }`}
        aria-label="Add to cart"
      >
        {status === 'loading' ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : status === 'done' ? (
          <Check className="w-3.5 h-3.5" />
        ) : (
          <ShoppingBag className="w-3.5 h-3.5" />
        )}
        <span>{status === 'done' ? 'Added!' : 'Add to Bag'}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleAdd}
      disabled={status !== 'idle'}
      className={`w-full h-11 text-[13px] font-bold uppercase tracking-widest rounded-[12px] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
        status === 'done'
          ? 'bg-[#22C55E] text-white'
          : 'bg-[#FAF7F4] hover:bg-[#E56717] text-[#222222] hover:text-white'
      }`}
      aria-label="Add to cart"
    >
      {status === 'loading' ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : status === 'done' ? (
        <Check className="w-4 h-4" />
      ) : (
        <ShoppingBag className="w-4 h-4" />
      )}
      <span>{status === 'done' ? 'Added to Bag!' : 'Add to Bag'}</span>
    </button>
  );
}
