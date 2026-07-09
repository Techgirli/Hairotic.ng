'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, MessageCircle, ShoppingBag, ArrowRight } from 'lucide-react';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('orderNumber') || 'HR-XXXXXX';

  const whatsappMessage = `Hello Hairotic! I just placed an order on the store. Order Reference: ${orderNumber}. Please confirm my order details!`;
  const whatsappUrl = `https://wa.me/2348000000000?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="max-w-md w-full bg-white border border-[#222222]/5 p-8 rounded-[28px] shadow-sm text-center space-y-6">
      
      {/* Success Icon */}
      <div className="w-16 h-16 rounded-full bg-[#22C55E]/10 flex items-center justify-center text-[#22C55E] mx-auto animate-bounce">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      {/* Text */}
      <div className="space-y-2">
        <span className="text-[#E56717] text-[12px] uppercase tracking-[0.2em] font-bold block">
          Order Placed Successfully
        </span>
        <h2 className="text-[24px] md:text-[28px] font-bold text-[#222222] uppercase tracking-wide">
          Thank You!
        </h2>
        <p className="text-[14px] text-[#6B7280] leading-relaxed">
          Your order has been received and is currently in status <span className="font-semibold text-[#222222]">Pending Payment</span>.
        </p>
      </div>

      {/* Reference Box */}
      <div className="bg-[#FAF7F4] border border-[#222222]/5 p-4 rounded-[16px] space-y-1">
        <span className="text-[11px] text-[#6B7280] uppercase tracking-widest font-bold block">Order Reference</span>
        <span className="text-[18px] font-extrabold text-[#E56717] font-mono">{orderNumber}</span>
      </div>

      {/* Action Button: WhatsApp */}
      <div className="space-y-3 pt-2">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full h-[52px] bg-[#25D366] hover:bg-[#20BA5A] text-[#FFFFFF] text-[14px] font-bold uppercase tracking-widest rounded-[12px] flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
        >
          <MessageCircle className="w-5 h-5 fill-white text-[#25D366]" />
          <span>Confirm on WhatsApp</span>
        </a>

        <Link
          href="/shop"
          className="w-full h-11 border border-[#222222]/15 hover:bg-[#222222]/5 text-[#222222] text-[13px] font-bold uppercase tracking-widest rounded-[12px] flex items-center justify-center gap-2 transition-colors"
        >
          <span>Continue Shopping</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <p className="text-[11px] text-[#9CA3AF] leading-relaxed font-light">
        A copy of your order invoice has been sent to your email. Confirm details on WhatsApp for faster dispatch!
      </p>

    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F4] flex flex-col items-center justify-center py-12 px-6 font-sans text-[#222222] select-none">
      <Suspense fallback={
        <div className="max-w-md w-full bg-white border border-[#222222]/5 p-8 rounded-[28px] shadow-sm text-center py-20 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#E56717]" />
        </div>
      }>
        <CheckoutSuccessContent />
      </Suspense>
    </div>
  );
}
