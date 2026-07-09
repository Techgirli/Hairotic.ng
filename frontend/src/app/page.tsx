import React from 'react';
import Link from 'next/link';
import { Truck, ShieldCheck, CreditCard, Sparkles, MessageCircle, Heart } from 'lucide-react';

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
    const res = await fetch('http://localhost:3001/api/v1/products?limit=4', {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.products || [];
  } catch (err) {
    console.error('Failed to fetch featured products', err);
    return [];
  }
}

export default async function Homepage() {
  const products = await getFeaturedProducts();

  // Categories list with representative images copied to public/
  const categories = [
    { name: 'Bob Hairs', slug: 'bob-hairs', image: '/BOB Hairs/2d0454f23e05f4a8e3b6c76ff466b580.jpg' },
    { name: 'Straight Hairs', slug: 'straight-hairs', image: '/Straight Hairs/07f51f04c30a9ecd6659cb058a95859f.jpg' },
    { name: 'Curly Hairs', slug: 'curly-hairs', image: '/curly/0443d651affacccaf4e669a72ffc5247.jpg' },
    { name: 'Coily Hairs', slug: 'coily-hairs', image: '/coily hairs/061b881e9eb397ca7e74298a5a2bb46f.jpg' },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Promotion Announcement Bar */}
      <div className="w-full bg-[#E56717] h-10 flex items-center justify-center text-[13px] font-semibold text-[#FFFFFF] uppercase tracking-widest select-none">
        ✨ Free delivery within Lagos on orders above ₦250,000! ✨
      </div>

      {/* Sticky Premium Header */}
      <header className="sticky top-0 bg-[#FFFFFF]/90 backdrop-blur-md border-b border-[#222222]/5 z-50 h-20 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/" className="font-display text-[32px] tracking-wider text-[#222222] uppercase select-none">
            Hairotic
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-[15px] font-semibold text-[#222222] uppercase tracking-wider">
            <Link href="/shop" className="hover:text-[#E56717] transition-colors duration-200">Shop All</Link>
            <Link href="/collections/best-sellers" className="hover:text-[#E56717] transition-colors duration-200">Bestsellers</Link>
            <Link href="/collections/new-drops" className="hover:text-[#E56717] transition-colors duration-200">New Drops</Link>
            <Link href="/admin/login" className="hover:text-[#E56717] transition-colors duration-200">Admin</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link
              href="/shop"
              className="h-11 px-6 bg-[#222222] hover:bg-[#E56717] text-[#FFFFFF] text-[13px] font-bold uppercase tracking-widest rounded-[12px] transition-all duration-300 flex items-center justify-center"
            >
              Shop Collection
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Banner Section */}
      <section className="relative h-[80vh] flex items-center justify-center bg-[#222222] text-[#FFFFFF] overflow-hidden select-none">
        <div className="absolute inset-0 bg-cover bg-center opacity-40 bg-[url('/Straight%20Hairs/07f51f04c30a9ecd6659cb058a95859f.jpg')]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#222222] via-[#222222]/50 to-transparent" />
        <div className="relative max-w-4xl mx-auto px-6 text-center z-10 space-y-6">
          <span className="text-[#E56717] text-[14px] uppercase tracking-[0.3em] font-bold block animate-pulse">
            Premium Vietnamese Human Hair
          </span>
          <h2 className="font-display text-[48px] md:text-[76px] leading-[1.05] uppercase tracking-tight drop-shadow-md">
            Empower Your <br /> Boldest Self
          </h2>
          <p className="text-[18px] text-[#FAF7F4] max-w-xl mx-auto font-light leading-relaxed">
            Hair that turns heads and never holds you back. Crafted for the young, confident, and trend-driven woman.
          </p>
          <div className="pt-4">
            <Link
              href="/shop"
              className="inline-flex h-[52px] px-8 bg-[#E56717] hover:bg-[#C65A12] text-[#FFFFFF] text-[15px] font-bold uppercase tracking-widest rounded-[12px] shadow-lg active:scale-95 transition-all duration-200 items-center justify-center gap-2 cursor-pointer"
            >
              <span>Explore The Drop</span>
              <Sparkles className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="bg-[#FFF8F2] border-y border-[#222222]/5 py-8 select-none">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#E56717]/10 flex items-center justify-center text-[#E56717]">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-[16px] font-bold text-[#222222]">Nationwide Delivery</h4>
              <p className="text-[14px] text-[#6B7280]">Same-day Lagos, 48 hours nationwide.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#E56717]/10 flex items-center justify-center text-[#E56717]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-[16px] font-bold text-[#222222]">100% Authenticity</h4>
              <p className="text-[14px] text-[#6B7280]">Vietnamese donor extensions that hold curls.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#E56717]/10 flex items-center justify-center text-[#E56717]">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-[16px] font-bold text-[#222222]">Secure Paystack Payments</h4>
              <p className="text-[14px] text-[#6B7280]">Card, USSD, and bank transfers safely.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Shop Categories Grid */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h3 className="text-[32px] font-bold text-[#222222] uppercase tracking-wide">
            Shop By Texture
          </h3>
          <div className="w-12 h-1 bg-[#E56717] mx-auto mt-2" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/shop?categorySlug=${cat.slug}`}
              className="group relative h-[320px] rounded-[24px] overflow-hidden border border-[#222222]/5 shadow-sm hover:shadow-md transition-all duration-300 block"
            >
              <div
                className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                style={{ backgroundImage: `url('${cat.image}')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#222222]/90 via-[#222222]/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                <div>
                  <h4 className="text-[18px] font-bold text-[#FFFFFF] uppercase tracking-wider">{cat.name}</h4>
                  <span className="text-[12px] text-[#E56717] uppercase tracking-widest font-semibold">View Products</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Bestsellers */}
      {products.length > 0 && (
        <section className="bg-[#FAF7F4] py-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <h3 className="text-[32px] font-bold text-[#222222] uppercase tracking-wide">
                Bestselling Units
              </h3>
              <p className="text-[#6B7280] text-[15px] mt-1">Lagos favorites that turn heads.</p>
              <div className="w-12 h-1 bg-[#E56717] mx-auto mt-2" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => {
                const defaultVariant = product.variants[0];
                const priceInNgn = defaultVariant ? defaultVariant.price / 100 : 0;
                const comparePriceInNgn = defaultVariant?.compareAtPrice ? defaultVariant.compareAtPrice / 100 : null;
                const mainImage = defaultVariant?.images[0]?.url || '/Logo/photo_2023-09-25_16-13-56.jpg';

                return (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    className="group bg-white rounded-[24px] border border-[#222222]/5 p-4 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      {/* Product image container */}
                      <div className="relative h-[240px] rounded-[20px] overflow-hidden bg-[#FAF7F4] border border-[#222222]/5">
                        <img
                          src={mainImage}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                        />
                        <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 hover:bg-[#E56717] hover:text-white flex items-center justify-center text-[#222222] transition-colors duration-200 shadow-sm">
                          <Heart className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Info details */}
                      <div className="space-y-1 px-1">
                        <h4 className="text-[16px] font-bold text-[#222222] group-hover:text-[#E56717] transition-colors duration-200 line-clamp-1">
                          {product.name}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="text-[16px] font-extrabold text-[#E56717]">
                            ₦{priceInNgn.toLocaleString()}
                          </span>
                          {comparePriceInNgn && (
                            <span className="text-[13px] text-[#6B7280] line-through">
                              ₦{comparePriceInNgn.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 px-1">
                      <span className="w-full h-11 bg-[#FAF7F4] group-hover:bg-[#E56717] text-[#222222] group-hover:text-white text-[13px] font-bold uppercase tracking-widest rounded-[12px] transition-all duration-300 flex items-center justify-center">
                        Select Length
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Floating WhatsApp CTA */}
      <div className="fixed bottom-6 right-6 z-40 select-none">
        <a
          href="https://wa.me/2348000000000?text=Hello,%20I'm%20interested%20in%20custom%20hair%20units!"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-[#25D366] hover:bg-[#20BA5A] text-[#FFFFFF] px-5 py-3 rounded-full shadow-lg active:scale-95 transition-all duration-200 font-semibold text-[14px]"
        >
          <MessageCircle className="w-5 h-5 fill-white text-[#25D366]" />
          <span>Consult Hair Expert</span>
        </a>
      </div>

      {/* Premium Footer */}
      <footer className="bg-[#222222] text-[#FAF7F4] pt-16 pb-12 select-none border-t border-[#FFFFFF]/10 mt-auto">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="space-y-4">
            <h3 className="font-display text-[32px] tracking-wider text-[#FFFFFF] uppercase">Hairotic</h3>
            <p className="text-[14px] text-[#6B7280] leading-relaxed">
              Nigeria's premium hair drop destination. Authentic donor hair units that represent your energy.
            </p>
          </div>
          <div>
            <h5 className="text-[15px] font-bold uppercase tracking-wider text-[#FFFFFF] mb-4">Quick Links</h5>
            <ul className="space-y-2 text-[14px] text-[#6B7280]">
              <li><Link href="/shop" className="hover:text-[#E56717]">Shop All</Link></li>
              <li><Link href="/shop?categorySlug=bob-hairs" className="hover:text-[#E56717]">Bob Cut Wigs</Link></li>
              <li><Link href="/shop?categorySlug=straight-hairs" className="hover:text-[#E56717]">Bone Straight</Link></li>
              <li><Link href="/admin/login" className="hover:text-[#E56717]">Admin Portal</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="text-[15px] font-bold uppercase tracking-wider text-[#FFFFFF] mb-4">Our Policies</h5>
            <ul className="space-y-2 text-[14px] text-[#6B7280]">
              <li><Link href="#" className="hover:text-[#E56717]">Shipping & Delivery</Link></li>
              <li><Link href="#" className="hover:text-[#E56717]">Swaps & Refund Rules</Link></li>
              <li><Link href="#" className="hover:text-[#E56717]">Privacy Policy</Link></li>
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
    </div>
  );
}
