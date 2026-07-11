import React from 'react';
import type { Metadata } from 'next';
import { Truck, Clock, Compass, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Shipping & Delivery Policy',
  description: 'Learn about Hairotic.ng shipping timeframes, delivery rates within Lagos, nationwide shipping across Nigeria, and international delivery options.',
};

export default function ShippingDeliveryPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 font-sans">
      <div className="text-center space-y-3 mb-12">
        <h1 className="text-[32px] md:text-[40px] font-extrabold uppercase tracking-tight text-[#222222]">
          Shipping & Delivery
        </h1>
        <p className="text-[15px] text-[#6B7280] max-w-xl mx-auto leading-relaxed">
          How we dispatch and deliver your premium human hair units across Lagos, Nigeria, and worldwide.
        </p>
        <div className="w-16 h-1 bg-[#E56717] mx-auto mt-4" />
      </div>

      <div className="bg-white border border-[#222222]/5 rounded-[32px] shadow-sm p-8 md:p-10 space-y-10">
        
        {/* Lagos Delivery */}
        <div className="flex gap-6 items-start">
          <div className="w-12 h-12 rounded-2xl bg-[#E56717]/10 flex items-center justify-center text-[#E56717] shrink-0">
            <Truck className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h3 className="font-extrabold text-[#222222] uppercase tracking-wide text-[16px]">
              Lagos Deliveries (Local Dispatch)
            </h3>
            <p className="text-[14.5px] text-[#6B7280] leading-relaxed font-light">
              We offer same-day delivery for orders placed before <strong className="font-semibold text-[#222222]">10:00 AM WAT</strong>. Orders placed after 10:00 AM will be dispatched the following business day.
            </p>
            <ul className="list-disc pl-5 text-[14px] text-[#6B7280] space-y-1 font-light">
              <li><strong className="font-semibold text-[#222222]">Free delivery</strong> for all orders above ₦250,000.</li>
              <li>Flat delivery rate of <strong className="font-semibold text-[#222222]">₦5,000</strong> for orders under ₦250,000.</li>
            </ul>
          </div>
        </div>

        {/* Nationwide Delivery */}
        <div className="flex gap-6 items-start border-t border-[#222222]/5 pt-8">
          <div className="w-12 h-12 rounded-2xl bg-[#E56717]/10 flex items-center justify-center text-[#E56717] shrink-0">
            <Compass className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h3 className="font-extrabold text-[#222222] uppercase tracking-wide text-[16px]">
              Nationwide Shipping (Outside Lagos)
            </h3>
            <p className="text-[14.5px] text-[#6B7280] leading-relaxed font-light">
              We ship to all states across Nigeria (including Abuja, Port Harcourt, Kano, and Enugu) via our secure logistics partners.
            </p>
            <ul className="list-disc pl-5 text-[14px] text-[#6B7280] space-y-1 font-light">
              <li><strong className="font-semibold text-[#222222]">Delivery timeframe</strong>: 2 to 4 business days.</li>
              <li>Flat delivery rate of <strong className="font-semibold text-[#222222]">₦10,000</strong> applies to all nationwide shipments.</li>
            </ul>
          </div>
        </div>

        {/* International Delivery */}
        <div className="flex gap-6 items-start border-t border-[#222222]/5 pt-8">
          <div className="w-12 h-12 rounded-2xl bg-[#E56717]/10 flex items-center justify-center text-[#E56717] shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h3 className="font-extrabold text-[#222222] uppercase tracking-wide text-[16px]">
              International Shipping
            </h3>
            <p className="text-[14.5px] text-[#6B7280] leading-relaxed font-light">
              We deliver worldwide to the UK, US, Canada, and parts of Europe via DHL Express. 
            </p>
            <ul className="list-disc pl-5 text-[14px] text-[#6B7280] space-y-1 font-light">
              <li><strong className="font-semibold text-[#222222]">Delivery timeframe</strong>: 5 to 7 business days.</li>
              <li>Rates are calculated dynamically at checkout based on package weight and location.</li>
            </ul>
          </div>
        </div>

        {/* Order Verification */}
        <div className="flex gap-6 items-start border-t border-[#222222]/5 pt-8">
          <div className="w-12 h-12 rounded-2xl bg-[#E56717]/10 flex items-center justify-center text-[#E56717] shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h3 className="font-extrabold text-[#222222] uppercase tracking-wide text-[16px]">
              Tracking & Security
            </h3>
            <p className="text-[14.5px] text-[#6B7280] leading-relaxed font-light">
              Once your payment is verified and your hair unit is dispatched, you will receive an automated email confirmation and WhatsApp notification containing your package tracking details. All shipments require a signature upon delivery to prevent theft.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
