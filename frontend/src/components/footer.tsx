'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { ArrowUp, Send, MapPin, Mail, Phone, Sparkles } from 'lucide-react';
import gsap from 'gsap';
import { useToastStore } from '../store/toastStore';

export default function Footer() {
  const emailInputRef = useRef<HTMLInputElement>(null);
  const newsletterBtnRef = useRef<HTMLButtonElement>(null);
  const backToTopRef = useRef<HTMLButtonElement>(null);

  // Smooth scroll back to top using GSAP
  const scrollToTop = () => {
    gsap.to([document.documentElement, document.body], {
      scrollTop: 0,
      duration: 1.2,
      ease: 'power3.inOut',
    });
  };

  // Magnetic effect for the Back to Top button
  const handleMagneticMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = backToTopRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) * 0.35;
    const dy = (e.clientY - cy) * 0.35;
    gsap.to(btn, { x: dx, y: dy, scale: 1.1, duration: 0.3, ease: 'power2.out' });
  };

  const handleMagneticLeave = () => {
    const btn = backToTopRef.current;
    if (!btn) return;
    gsap.to(btn, { x: 0, y: 0, scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
  };

  // Submit hander for the custom newsletter
  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInputRef.current?.value) {
      // Pop subscription success animation
      if (newsletterBtnRef.current) {
        gsap.timeline()
          .to(newsletterBtnRef.current, { scale: 0.9, duration: 0.1 })
          .to(newsletterBtnRef.current, { scale: 1.1, color: '#E56717', duration: 0.2 })
          .to(newsletterBtnRef.current, { scale: 1, color: '#FFFFFF', duration: 0.3, ease: 'power2.out' });
      }
      useToastStore.getState().showToast('Welcome to the Hairotic Baddie club! ✨ Check your inbox soon.', 'success');
      emailInputRef.current.value = '';
    }
  };

  return (
    <footer className="relative bg-[#0F0F0F] text-[#FAF7F4] pt-10 pb-6 overflow-hidden select-none border-t-2 border-gradient-to-r border-[#E56717]/35 mt-auto">
      
      {/* Decorative background grid and glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_800px_600px_at_bottom,_rgba(229,103,23,0.1),_transparent)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Top Section: Newsletter Card */}
        <div className="footer-col w-full bg-[#181818] border border-[#ffffff]/5 rounded-[20px] p-5 md:p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-[#E56717]/0 via-[#E56717]/5 to-[#E56717]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
          
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2 text-[#E56717]">
              <Sparkles className="w-5 h-5 animate-pulse" />
              <span className="text-[13px] font-extrabold uppercase tracking-widest">Join the Club</span>
            </div>
            <h4 className="text-[22px] md:text-[26px] font-black uppercase tracking-tight leading-none text-white">
              Get Early Access To <br /> The Next Hair Drop
            </h4>
            <p className="text-[14px] text-gray-400">
              Zero spam. Only fresh Vietnamese raw donor hair updates, baddie style guides, and VIP promos.
            </p>
          </div>

          <form onSubmit={handleSubscribe} className="w-full md:w-auto flex items-center bg-[#222222] border border-white/10 focus-within:border-[#E56717] rounded-full p-2 pl-6 transition-all duration-300 md:min-w-[420px]">
            <input
              ref={emailInputRef}
              type="email"
              placeholder="Enter your email address"
              required
              className="bg-transparent border-none outline-none text-[14px] w-full text-white placeholder-gray-500 pr-4"
            />
            <button
              ref={newsletterBtnRef}
              type="submit"
              className="w-12 h-12 rounded-full bg-[#E56717] hover:bg-[#C65A12] text-white flex items-center justify-center transition-transform active:scale-95 shadow-md shadow-[#E56717]/25 cursor-pointer"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>

        {/* Middle Section: Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          
          {/* Brand Info */}
          <div className="footer-col space-y-4">
            <h3 className="font-display text-[38px] tracking-wider text-white uppercase leading-none">
              Hairotic
            </h3>
            <p className="text-[14px] text-gray-400 leading-relaxed">
              Nigeria&apos;s premium hair drop destination. Authentic, double-drawn Vietnamese donor hair units that match your boldest energy.
            </p>
            {/* Animated Social Icons */}
            <div className="flex gap-4">
              {/* Instagram */}
              <a
                href="https://www.instagram.com/hairotic.ng?igsh=NjQxNjY4ejV4OW5r"
                target="_blank"
                rel="noopener noreferrer"
                className="group/social w-11 h-11 rounded-full bg-[#181818] border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-[#E56717] transition-all duration-300 shadow-sm relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-[#E56717] translate-y-full group-hover/social:translate-y-0 transition-transform duration-300 ease-out z-0" />
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5 relative z-10 group-hover/social:scale-110 transition-transform duration-300"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>

              {/* TikTok */}
              <a
                href="https://www.tiktok.com/@hairotic.ng?_r=1&_t=ZS-97wmOmcjDr6"
                target="_blank"
                rel="noopener noreferrer"
                className="group/social w-11 h-11 rounded-full bg-[#181818] border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-[#E56717] transition-all duration-300 shadow-sm relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-[#E56717] translate-y-full group-hover/social:translate-y-0 transition-transform duration-300 ease-out z-0" />
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5 relative z-10 group-hover/social:scale-110 transition-transform duration-300"
                >
                  <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-col space-y-6">
            <h5 className="text-[16px] font-extrabold uppercase tracking-widest text-white relative inline-block after:content-[''] after:absolute after:bottom-[-6px] after:left-0 after:w-8 after:h-0.5 after:bg-[#E56717]">
              Quick Links
            </h5>
            <ul className="space-y-3 text-[14px] text-gray-400">
              {[
                { label: 'Shop All Drops', href: '/shop' },
                { label: 'Wig Collections', href: '/shop?categorySlug=wigs' },
                { label: 'Raw Extensions', href: '/shop?categorySlug=extensions' },
                { label: 'Premium Bundles', href: '/shop?categorySlug=bundle' },
                { label: 'Styling Services', href: '/styling' },
              ].map((link, idx) => (
                <li key={idx}>
                  <Link
                    href={link.href}
                    className="hover:text-[#E56717] transition-colors duration-200 flex items-center gap-1 group/link"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E56717] opacity-0 group-hover/link:opacity-100 transition-opacity duration-300" />
                    <span className="relative overflow-hidden inline-block pb-0.5">
                      {link.label}
                      <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#E56717] group-hover/link:w-full transition-all duration-300" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Our Policies */}
          <div className="footer-col space-y-6">
            <h5 className="text-[16px] font-extrabold uppercase tracking-widest text-white relative inline-block after:content-[''] after:absolute after:bottom-[-6px] after:left-0 after:w-8 after:h-0.5 after:bg-[#E56717]">
              Policies
            </h5>
            <ul className="space-y-3 text-[14px] text-gray-400">
              {[
                { label: 'Shipping & Delivery', href: '/policies/shipping-delivery' },
                { label: 'Swaps & Refund Rules', href: '/policies/swaps-refunds' },
                { label: 'Privacy Policy', href: '/policies/privacy-policy' },
              ].map((link, idx) => (
                <li key={idx}>
                  <Link
                    href={link.href}
                    className="hover:text-[#E56717] transition-colors duration-200 flex items-center gap-1 group/link"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E56717] opacity-0 group-hover/link:opacity-100 transition-opacity duration-300" />
                    <span className="relative overflow-hidden inline-block pb-0.5">
                      {link.label}
                      <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#E56717] group-hover/link:w-full transition-all duration-300" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Direct Contact */}
          <div className="footer-col space-y-6">
            <h5 className="text-[16px] font-extrabold uppercase tracking-widest text-white relative inline-block after:content-[''] after:absolute after:bottom-[-6px] after:left-0 after:w-8 after:h-0.5 after:bg-[#E56717]">
              Direct Contact
            </h5>
            <ul className="space-y-4 text-[14px] text-gray-400">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#E56717] shrink-0 mt-0.5" />
                <span>Lekki Phase 1, Lagos, Nigeria</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[#E56717] shrink-0" />
                <a href="mailto:favcollections1@gmail.com" className="hover:text-[#E56717] transition-colors duration-200">
                  favcollections1@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-[#E56717] shrink-0" />
                <a href="tel:+2348087794441" className="hover:text-[#E56717] transition-colors duration-200">
                  +234 808 779 4441
                </a>
              </li>
              <li className="pt-2">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#181818] border border-[#E56717]/20 text-[12px] text-gray-300 font-semibold shadow-inner">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping inline-block shrink-0" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block shrink-0 absolute" />
                  <span>Showroom Open: 9 AM - 6 PM</span>
                </div>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 pt-4 flex flex-col md:flex-row items-center justify-between gap-6 text-[13px] text-gray-500">
          <span>© 2026 Hairotic.ng. All rights reserved.</span>
          
          {/* Animated Back to top button */}
          <button
            ref={backToTopRef}
            onClick={scrollToTop}
            onMouseMove={handleMagneticMove}
            onMouseLeave={handleMagneticLeave}
            className="w-12 h-12 rounded-full bg-[#181818] hover:bg-[#E56717] hover:text-white border border-white/10 hover:border-[#E56717] flex items-center justify-center text-gray-400 transition-colors duration-300 shadow-lg active:scale-95 cursor-pointer"
            title="Back to Top"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
          
          <span>Designed for Boldness & Trust.</span>
        </div>

      </div>
    </footer>
  );
}
