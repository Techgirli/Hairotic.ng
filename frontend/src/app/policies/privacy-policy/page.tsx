import React from 'react';
import type { Metadata } from 'next';
import { Lock, Eye, Database, Share2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Understand how Hairotic.ng handles data security, processes secure Paystack transactions, and protects customer privacy.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 font-sans">
      <div className="text-center space-y-3 mb-12">
        <h1 className="text-[32px] md:text-[40px] font-extrabold uppercase tracking-tight text-[#222222]">
          Privacy & Security Policy
        </h1>
        <p className="text-[15px] text-[#6B7280] max-w-xl mx-auto leading-relaxed">
          How we collect, manage, and protect your details to deliver a secure and premium shopping experience.
        </p>
        <div className="w-16 h-1 bg-[#E56717] mx-auto mt-4" />
      </div>

      <div className="bg-white border border-[#222222]/5 rounded-[32px] shadow-sm p-8 md:p-10 space-y-10">
        
        {/* Information Collected */}
        <div className="flex gap-6 items-start">
          <div className="w-12 h-12 rounded-2xl bg-[#E56717]/10 flex items-center justify-center text-[#E56717] shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h3 className="font-extrabold text-[#222222] uppercase tracking-wide text-[16px]">
              Information We Collect
            </h3>
            <p className="text-[14.5px] text-[#6B7280] leading-relaxed font-light">
              We collect necessary details when you place an order, register an account, or contact support:
            </p>
            <ul className="list-disc pl-5 text-[14px] text-[#6B7280] space-y-1 font-light">
              <li><strong className="font-semibold text-[#222222]">Contact Info</strong>: Name, email address, and phone number.</li>
              <li><strong className="font-semibold text-[#222222]">Delivery Details</strong>: Shipping address, state, and city.</li>
              <li><strong className="font-semibold text-[#222222]">Device Information</strong>: IP address, browser type, and cookie logs to prevent fraud.</li>
            </ul>
          </div>
        </div>

        {/* Secure Checkout Paystack */}
        <div className="flex gap-6 items-start border-t border-[#222222]/5 pt-8">
          <div className="w-12 h-12 rounded-2xl bg-[#E56717]/10 flex items-center justify-center text-[#E56717] shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h3 className="font-extrabold text-[#222222] uppercase tracking-wide text-[16px]">
              Secure Payments via Paystack
            </h3>
            <p className="text-[14.5px] text-[#6B7280] leading-relaxed font-light">
              All financial details (credit cards, USSD codes, bank transfer payloads) are processed securely through our verified payment gateway provider, <strong className="font-semibold text-[#222222]">Paystack</strong>. 
            </p>
            <p className="text-[14px] text-[#6B7280] leading-relaxed font-light">
              Hairotic.ng does <strong className="font-semibold text-[#EF4444]">NOT</strong> store or have access to your raw credit card numbers or PIN codes. All transaction channels are fortified using standard PCI-DSS level security.
            </p>
          </div>
        </div>

        {/* Data Security */}
        <div className="flex gap-6 items-start border-t border-[#222222]/5 pt-8">
          <div className="w-12 h-12 rounded-2xl bg-[#E56717]/10 flex items-center justify-center text-[#E56717] shrink-0">
            <Eye className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h3 className="font-extrabold text-[#222222] uppercase tracking-wide text-[16px]">
              How We Use Your Data
            </h3>
            <p className="text-[14.5px] text-[#6B7280] leading-relaxed font-light">
              We process details solely to execute transactions, arrange shipping, send order verification receipts, and periodically communicate exclusive hair drop launches. We do not sell or lease any user data to third-party marketing firms.
            </p>
          </div>
        </div>

        {/* Third-Party sharing */}
        <div className="flex gap-6 items-start border-t border-[#222222]/5 pt-8">
          <div className="w-12 h-12 rounded-2xl bg-[#E56717]/10 flex items-center justify-center text-[#E56717] shrink-0">
            <Share2 className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h3 className="font-extrabold text-[#222222] uppercase tracking-wide text-[16px]">
              Third-Party Data Sharing
            </h3>
            <p className="text-[14.5px] text-[#6B7280] leading-relaxed font-light">
              We share necessary information with our logistics partners (DHL and local courier networks) to complete delivery. Additionally, browser interactions and search stats are utilized anonymously via Google Analytics to refine site layouts.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
