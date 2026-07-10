import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import FilterSidebar from './filter-sidebar';
import { Heart } from 'lucide-react';
import Header from '../../components/header';

export const metadata: Metadata = {
  title: 'Shop All Hair',
  description: 'Browse all premium human hair wigs, bundles, and closures at Hairotic.ng. Bob cuts, bone straight, deep waves, and coily kinky textures. Shop by length, texture, and price.',
  openGraph: {
    title: 'Shop All Hair | Hairotic.ng',
    description: 'Premium human hair wigs and bundles. Shop the full Hairotic.ng catalog — sorted by length, texture, and price.',
    url: '/shop',
    type: 'website',
  },
};

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

interface Category {
  id: string;
  name: string;
  slug: string;
}

// Fetch categories for sidebar
async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch('http://localhost:3001/api/v1/categories', { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

// Fetch filtered products
async function getFilteredProducts(searchParams: Record<string, string | string[] | undefined>): Promise<Product[]> {
  try {
    const query = new URLSearchParams();

    // Map parameters safely
    if (searchParams.categorySlug) query.set('categorySlug', Array.isArray(searchParams.categorySlug) ? searchParams.categorySlug[0] : searchParams.categorySlug);
    if (searchParams.sort) query.set('sort', Array.isArray(searchParams.sort) ? searchParams.sort[0] : searchParams.sort);
    if (searchParams.minPrice) query.set('minPrice', Array.isArray(searchParams.minPrice) ? searchParams.minPrice[0] : searchParams.minPrice);
    if (searchParams.maxPrice) query.set('maxPrice', Array.isArray(searchParams.maxPrice) ? searchParams.maxPrice[0] : searchParams.maxPrice);
    if (searchParams.search) query.set('search', Array.isArray(searchParams.search) ? searchParams.search[0] : searchParams.search);

    // Propagate multiple array values
    const lengths = searchParams.lengths;
    if (lengths) {
      if (Array.isArray(lengths)) {
        lengths.forEach((len) => query.append('lengths', len));
      } else {
        query.append('lengths', lengths);
      }
    }

    const textures = searchParams.textures;
    if (textures) {
      if (Array.isArray(textures)) {
        textures.forEach((tex) => query.append('textures', tex));
      } else {
        query.append('textures', textures);
      }
    }

    const res = await fetch(`http://localhost:3001/api/v1/products?${query.toString()}`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.products || [];
  } catch (err) {
    console.error('Failed to query shop products', err);
    return [];
  }
}

// Helper to construct sorting links
function SortOptionLink({ label, value, activeSort, currentParams }: {
  label: string;
  value: string;
  activeSort: string;
  currentParams: Record<string, string | string[] | undefined>;
}) {
  const params = new URLSearchParams();
  Object.keys(currentParams).forEach((key) => {
    const val = currentParams[key];
    if (Array.isArray(val)) {
      val.forEach((v) => params.append(key, v));
    } else if (val) {
      params.set(key, val);
    }
  });
  params.set('sort', value);

  return (
    <Link
      href={`/shop?${params.toString()}`}
      className={`px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-colors duration-150 ${
        activeSort === value
          ? 'bg-[#E56717] text-[#FFFFFF]'
          : 'bg-[#FAF7F4] text-[#6B7280] hover:text-[#222222]'
      }`}
    >
      {label}
    </Link>
  );
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  // Resolve searchParams promise in Next.js 15+ App Router
  const resolvedParams = await searchParams;
  const categories = await getCategories();
  const products = await getFilteredProducts(resolvedParams);
  
  const activeSort = (Array.isArray(resolvedParams.sort) ? resolvedParams.sort[0] : resolvedParams.sort) || 'newest';

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Premium Header */}
      <Header />

      {/* Main Browse Container */}
      <main className="max-w-7xl mx-auto px-6 py-12 flex-1 flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <FilterSidebar categories={categories} />

        {/* Products Grid Content Area */}
        <div className="flex-1 space-y-6">
          {/* Sorting controls bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222222]/5 pb-4 select-none">
            <div>
              <h2 className="text-[20px] font-bold text-[#222222] uppercase tracking-wide">Catalog Products</h2>
              <p className="text-[13px] text-[#6B7280]">Found {products.length} units</p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-[#6B7280] font-semibold mr-1">Sort:</span>
              <SortOptionLink label="Newest" value="newest" activeSort={activeSort} currentParams={resolvedParams} />
              <SortOptionLink label="₦ Low-High" value="price_asc" activeSort={activeSort} currentParams={resolvedParams} />
              <SortOptionLink label="₦ High-Low" value="price_desc" activeSort={activeSort} currentParams={resolvedParams} />
            </div>
          </div>

          {/* Product grid list */}
          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                      <div className="relative h-[260px] rounded-[20px] overflow-hidden bg-[#FAF7F4] border border-[#222222]/5">
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
          ) : (
            /* Empty state */
            <div className="bg-[#FAF7F4] border border-[#222222]/5 rounded-[24px] p-16 text-center select-none space-y-4">
              <h3 className="text-[20px] font-bold text-[#222222]">No Products Found</h3>
              <p className="text-[#6B7280] text-[14px] max-w-sm mx-auto">
                We couldn&apos;t find any hair units matching your combination of filters. Try clearing some selections.
              </p>
              <div className="pt-2">
                <Link
                  href="/shop"
                  className="inline-flex h-11 px-6 bg-[#222222] hover:bg-[#E56717] text-white text-[13px] font-bold uppercase tracking-wider rounded-[12px] transition-colors duration-200 items-center justify-center"
                >
                  Clear Filters
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Premium Footer */}
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
