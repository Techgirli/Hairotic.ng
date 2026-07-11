import React from 'react';
import type { Metadata } from 'next';
import { RefreshCw, ShieldAlert, Award, HelpingHand } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Swaps & Refund Rules',
  description: 'Understand the return, exchange, and swap policy for human hair bundles and wigs at Hairotic.ng. Standard 7-day hygiene rules.',
};

export default function SwapsRefundsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 font-sans">
      <div className="text-center space-y-3 mb-12">
        <h1 className="text-[32px] md:text-[40px] font-extrabold uppercase tracking-tight text-[#222222]">
          Swaps & Refund Rules
        </h1>
        <p className="text-[15px] text-[#6B7280] max-w-xl mx-auto leading-relaxed">
          Hey Hairotic Baddie! We want you to feel completely confident in your unit. Here are our swap parameters.
        </p>
        <div className="w-16 h-1 bg-[#E56717] mx-auto mt-4" />
      </div>

      <div className="bg-white border border-[#222222]/5 rounded-[32px] shadow-sm p-8 md:p-10 space-y-10">
        
        {/* Swap Window */}
        <div className="flex gap-6 items-start">
          <div className="w-12 h-12 rounded-2xl bg-[#E56717]/10 flex items-center justify-center text-[#E56717] shrink-0">
            <RefreshCw className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h3 className="font-extrabold text-[#222222] uppercase tracking-wide text-[16px]">
              7-Day Swap Window
            </h3>
            <p className="text-[14.5px] text-[#6B7280] leading-relaxed font-light">
              You have exactly <strong className="font-semibold text-[#222222]">7 days</strong> from the date of package delivery to request an exchange or swap. Any request received after the 7-day period will unfortunately not be processed.
            </p>
          </div>
        </div>

        {/* Hygiene & Condition Policy */}
        <div className="flex gap-6 items-start border-t border-[#222222]/5 pt-8">
          <div className="w-12 h-12 rounded-2xl bg-[#E56717]/10 flex items-center justify-center text-[#E56717] shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h3 className="font-extrabold text-[#222222] uppercase tracking-wide text-[16px]">
              Hygiene & Condition Rules
            </h3>
            <p className="text-[14.5px] text-[#6B7280] leading-relaxed font-light">
              Due to hygienic constraints and safety guidelines, all human hair bundles, wigs, and closures must remain in their <strong className="font-semibold text-[#222222]">original pristine condition</strong>.
            </p>
            <p className="text-[14px] text-[#6B7280] leading-relaxed font-light">
              We will <strong className="font-semibold text-[#EF4444]">NOT</strong> accept swaps if the hair:
            </p>
            <ul className="list-disc pl-5 text-[14px] text-[#6B7280] space-y-1 font-light">
              <li>Has been unravelled, brushed, or combed out.</li>
              <li>Has been washed, dyed, bleached, or styled with heat.</li>
              <li>Has had the lace cut, pre-plucked, or customized.</li>
              <li>Is returned without its original tags, silk bags, and brand packaging.</li>
            </ul>
          </div>
        </div>

        {/* Store Credit Policy */}
        <div className="flex gap-6 items-start border-t border-[#222222]/5 pt-8">
          <div className="w-12 h-12 rounded-2xl bg-[#E56717]/10 flex items-center justify-center text-[#E56717] shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h3 className="font-extrabold text-[#222222] uppercase tracking-wide text-[16px]">
              Refund Method (Store Credit Only)
            </h3>
            <p className="text-[14.5px] text-[#6B7280] leading-relaxed font-light">
              We maintain a strict <strong className="font-semibold text-[#222222]">no direct cash refund</strong> policy. If a swap unit of equal value is not currently available, or if you prefer to wait for another collection drop, we will issue a store voucher or coupon credit of equivalent purchase price (excluding shipping costs). Store credits are valid for 180 days.
            </p>
          </div>
        </div>

        {/* Exchange Fees */}
        <div className="flex gap-6 items-start border-t border-[#222222]/5 pt-8">
          <div className="w-12 h-12 rounded-2xl bg-[#E56717]/10 flex items-center justify-center text-[#E56717] shrink-0">
            <HelpingHand className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h3 className="font-extrabold text-[#222222] uppercase tracking-wide text-[16px]">
              Shipping Costs for Exchanges
            </h3>
            <p className="text-[14.5px] text-[#6B7280] leading-relaxed font-light">
              The customer is responsible for covering return shipping fees to our Lagos office, as well as the delivery fee for the new exchange unit.
            </p>
            <p className="text-[14px] text-[#6B7280] leading-relaxed font-light">
              If the exchange is due to an error on our part (e.g., incorrect length, incorrect texture, or verified material defect), <strong className="font-semibold text-[#222222]">Hairotic.ng will cover all delivery and return expenses</strong>.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
