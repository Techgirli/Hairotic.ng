import React from 'react';
import Link from 'next/link';
import { Truck, ShieldCheck, CreditCard, Sparkles } from 'lucide-react';
import Header from '../components/header';
import Footer from '@/components/footer';
// Animation components — all lazy-loaded through a 'use client' shell
// (next/dynamic with ssr:false is only legal inside client components)
import {
  GSAPAnimations,
  HeroParticles,
  PromoTicker,
  AnimatedWhatsApp,
  ScrollHint,
} from '@/components/animations-shell';
import MagneticProductCard from '@/components/magnetic-product-card';
import CategorySlider from '@/components/category-slider';


interface ProductImage {
  id: string;
  url: string;
}

interface ProductVariant {
  id: string;
  price: number;
  compareAtPrice?: number;
  attributes: { length?: string; texture?: string };
  images: ProductImage[];
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  variants: ProductVariant[];
}

async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000); // 3s max wait
    const res = await fetch('http://localhost:3001/api/v1/products?limit=4', {
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const data = await res.json();
    return data.products || [];
  } catch {
    // Backend offline or timed out — render page without products
    return [];
  }
}

export default async function Homepage() {
  const products = await getFeaturedProducts();

  const categories = [
    { name: 'Wigs', slug: 'wigs', image: '/wigs/2d0454f23e05f4a8e3b6c76ff466b580.jpg' },
    { name: 'Extensions', slug: 'extensions', image: '/extensions/IMG_5204.JPG' },
    { name: 'Bundles', slug: 'bundle', image: '/curly/IMG_5218.JPG' },
    { name: 'Styling', slug: 'styling', image: '/styling/wig_install.jpg', customUrl: '/styling' },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* GSAP orchestrator (client, no UI output) */}
      <GSAPAnimations />

      {/* Promotion Announcement Bar – animated ticker */}
      <PromoTicker />

      {/* Sticky Premium Header */}
      <Header />

      {/* ── Hero Banner ─────────────────────────────────────────────── */}
      <section
        className="hero-section relative h-[90vh] flex items-center justify-center bg-[#222222] text-white overflow-hidden select-none"
      >
        {/* Parallax BG */}
        <div
          className="hero-bg-image absolute inset-0 bg-cover bg-center opacity-45"
          style={{ backgroundImage: "url('/wigs/07f51f04c30a9ecd6659cb058a95859f.jpg')" }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#222222] via-[#222222]/55 to-transparent" />

        {/* Floating particles */}
        <HeroParticles />

        {/* Hero content */}
        <div className="relative max-w-4xl mx-auto px-6 text-center z-10 space-y-6"
          style={{ perspective: '1200px' }}
        >
          <span className="hero-badge text-white text-[13px] uppercase tracking-[0.32em] font-bold block
            bg-[#E56717]/20 border border-[#E56717]/40 rounded-full px-6 py-2 inline-block
            backdrop-blur-sm shadow-lg shadow-[#E56717]/10">
            Hey Hairotic Baddie!! · Shop Premium Vietnamese Human Hair
          </span>

          <h1 className="font-display leading-[1.0] uppercase tracking-tight drop-shadow-lg"
            style={{ fontSize: 'clamp(52px, 8vw, 86px)' }}
          >
            <span className="hero-title-word inline-block">Empower</span>{' '}
            <span className="hero-title-word inline-block text-[#E56717]">Your</span>
            <br />
            <span className="hero-title-word inline-block">Boldest</span>{' '}
            <span className="hero-title-word inline-block">Self</span>
          </h1>

          <p className="hero-subtitle text-[18px] text-[#FAF7F4] max-w-xl mx-auto font-light leading-relaxed">
            Hair that turns heads and never holds you back. Crafted for the young, confident, and trend-driven woman.
          </p>

          <div className="hero-cta pt-4 flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/shop"
              id="hero-cta-primary"
              className="inline-flex h-[54px] px-10 bg-[#E56717] hover:bg-[#C65A12] text-white text-[15px] font-bold uppercase tracking-widest rounded-[14px] shadow-xl shadow-[#E56717]/30 active:scale-95 transition-all duration-200 items-center justify-center gap-2 cursor-pointer"
            >
              <span>Explore The Drop</span>
              <Sparkles className="w-5 h-5" />
            </Link>
            <Link
              href="/collections/new-drops"
              id="hero-cta-secondary"
              className="inline-flex h-[54px] px-8 bg-white/10 hover:bg-white/20 text-white text-[15px] font-semibold uppercase tracking-widest rounded-[14px] border border-white/20 backdrop-blur-sm active:scale-95 transition-all duration-200 items-center justify-center gap-2 cursor-pointer"
            >
              New Drops
            </Link>
          </div>
        </div>

        {/* Scroll hint */}
        <ScrollHint />
      </section>

      {/* ── Trust Bar ───────────────────────────────────────────────── */}
      <section className="trust-section bg-[#FFF8F2] border-y border-[#222222]/5 py-10 select-none">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: <Truck className="w-6 h-6" />,
              title: 'Nationwide Delivery',
              sub: 'Same-day Lagos, 48 hours nationwide.',
            },
            {
              icon: <ShieldCheck className="w-6 h-6" />,
              title: '100% Authenticity',
              sub: 'Vietnamese donor extensions that hold curls.',
            },
            {
              icon: <CreditCard className="w-6 h-6" />,
              title: 'Secure Paystack Payments',
              sub: 'Card, USSD, and bank transfers safely.',
            },
          ].map((item, i) => (
            <div key={i} className="trust-item flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#E56717]/10 flex items-center justify-center text-[#E56717] flex-shrink-0 shadow-sm">
                {item.icon}
              </div>
              <div>
                <h4 className="text-[16px] font-bold text-[#222222]">{item.title}</h4>
                <p className="text-[14px] text-[#6B7280]">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Shop Categories Grid ─────────────────────────────────────── */}
      <section className="categories-section max-w-[1600px] mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="section-header-reveal text-[32px] font-bold text-[#222222] uppercase tracking-wide inline-block">
            Shop By Texture
          </h2>
          <div className="section-divider w-14 h-1 bg-[#E56717] mx-auto mt-3 rounded-full" />
        </div>
        <CategorySlider categories={categories} />
      </section>

      {/* ── Featured Bestsellers ─────────────────────────────────────── */}
      {products.length > 0 && (
        <section className="products-section bg-[#FAF7F4] py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-14">
              <h2 className="section-header-reveal text-[32px] font-bold text-[#222222] uppercase tracking-wide inline-block">
                Bestselling Units
              </h2>
              <p className="text-[#6B7280] text-[15px] mt-2">Lagos favorites that turn heads.</p>
              <div className="section-divider w-14 h-1 bg-[#E56717] mx-auto mt-3 rounded-full" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => {
                const defaultVariant = product.variants[0];
                const priceInNgn = defaultVariant ? defaultVariant.price / 100 : 0;
                const comparePriceInNgn = defaultVariant?.compareAtPrice
                  ? defaultVariant.compareAtPrice / 100
                  : null;
                const mainImage =
                  defaultVariant?.images[0]?.url || '/Logo/photo_2023-09-25_16-13-56.jpg';

                return (
                  <MagneticProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    slug={product.slug}
                    imageUrl={mainImage}
                    price={priceInNgn}
                    comparePrice={comparePriceInNgn}
                  />
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Animated WhatsApp CTA */}
      <AnimatedWhatsApp />

      {/* Premium Footer */}
      <Footer />
    </div>
  );
}
