'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#222222] text-[#FAF7F4] pt-16 pb-12 select-none border-t border-[#FFFFFF]/10 mt-auto">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="space-y-4">
          <h3 className="font-display text-[32px] tracking-wider text-[#FFFFFF] uppercase">Hairotic</h3>
          <p className="text-[14px] text-[#6B7280] leading-relaxed">
            Nigeria&apos;s premium hair drop destination. Authentic donor hair units that represent your energy.
          </p>
        </div>
        <div>
          <h5 className="text-[15px] font-bold uppercase tracking-wider text-[#FFFFFF] mb-4">Quick Links</h5>
          <ul className="space-y-2 text-[14px] text-[#6B7280]">
            <li><Link href="/shop" className="hover:text-[#E56717] transition-colors duration-200">Shop All</Link></li>
            <li><Link href="/shop?categorySlug=wigs" className="hover:text-[#E56717] transition-colors duration-200">Wigs</Link></li>
            <li><Link href="/shop?categorySlug=extensions" className="hover:text-[#E56717] transition-colors duration-200">Extensions</Link></li>
            <li><Link href="/shop?categorySlug=bundle" className="hover:text-[#E56717] transition-colors duration-200">Bundles</Link></li>
            <li><Link href="/styling" className="hover:text-[#E56717] transition-colors duration-200">Styling Services</Link></li>
            <li><Link href="/admin/login" className="hover:text-[#E56717] transition-colors duration-200">Admin Portal</Link></li>
          </ul>
        </div>
        <div>
          <h5 className="text-[15px] font-bold uppercase tracking-wider text-[#FFFFFF] mb-4">Our Policies</h5>
          <ul className="space-y-2 text-[14px] text-[#6B7280]">
            <li><Link href="/policies/shipping-delivery" className="hover:text-[#E56717] transition-colors duration-200">Shipping & Delivery</Link></li>
            <li><Link href="/policies/swaps-refunds" className="hover:text-[#E56717] transition-colors duration-200">Swaps & Refund Rules</Link></li>
            <li><Link href="/policies/privacy-policy" className="hover:text-[#E56717] transition-colors duration-200">Privacy Policy</Link></li>
          </ul>
        </div>
        <div>
          <h5 className="text-[15px] font-bold uppercase tracking-wider text-[#FFFFFF] mb-4">Direct Contact</h5>
          <p className="text-[14px] text-[#6B7280] leading-relaxed">
            Lekki Phase 1, Lagos, Nigeria <br />
            Email: support@hairotic.ng <br />
            Tel: +234 80 0000 0000
          </p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 border-t border-[#FFFFFF]/5 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between text-[13px] text-[#6B7280]">
        <span>© 2026 Hairotic.ng. All rights reserved.</span>
        <span>Designed for Boldness & Trust.</span>
      </div>
    </footer>
  );
}
