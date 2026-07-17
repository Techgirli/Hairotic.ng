import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import FilterSidebar from '../../shop/filter-sidebar';
import { Heart } from 'lucide-react';
import Header from '../../../components/header';
import Footer from '@/components/footer';

export const dynamic = 'force-dynamic';

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

interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
  bannerUrl?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_URL}/categories`, { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

async function getCollection(slug: string): Promise<Collection | null> {
  try {
    const res = await fetch(`${API_URL}/collections/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function getCollectionProducts(slug: string, searchParams: Record<string, string | string[] | undefined>): Promise<Product[]> {
  try {
    const query = new URLSearchParams();
    query.set('collectionSlug', slug);

    if (searchParams.sort) query.set('sort', Array.isArray(searchParams.sort) ? searchParams.sort[0] : searchParams.sort);
    if (searchParams.minPrice) query.set('minPrice', Array.isArray(searchParams.minPrice) ? searchParams.minPrice[0] : searchParams.minPrice);
    if (searchParams.maxPrice) query.set('maxPrice', Array.isArray(searchParams.maxPrice) ? searchParams.maxPrice[0] : searchParams.maxPrice);

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

    const res = await fetch(`${API_URL}/products?${query.toString()}`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.products || [];
  } catch {
    return [];
  }
}

function SortOptionLink({ label, value, activeSort, currentParams, slug }: {
  label: string;
  value: string;
  activeSort: string;
  currentParams: Record<string, string | string[] | undefined>;
  slug: string;
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
      href={`/collections/${slug}?${params.toString()}`}
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

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollection(slug);
  if (!collection) {
    return { title: 'Collection Not Found' };
  }
  return {
    title: collection.name,
    description: collection.description,
    openGraph: {
      title: `${collection.name} | Hairotic.ng`,
      description: collection.description,
      url: `/collections/${collection.slug}`,
      type: 'website',
    },
  };
}

export default async function CollectionPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const collection = await getCollection(resolvedParams.slug);
  if (!collection) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-16 select-none bg-[#FAF7F4] font-sans">
        <h2 className="text-[24px] font-bold text-[#222222]">Collection Not Found</h2>
        <p className="text-[#6B7280] text-[15px] mt-2 mb-4">The collection page does not exist or has been archived.</p>
        <Link href="/shop" className="h-11 px-6 bg-[#222222] text-[#FFFFFF] text-[13px] font-bold uppercase tracking-widest rounded-[12px] flex items-center justify-center">
          Back to Shop
        </Link>
      </div>
    );
  }

  const categories = await getCategories();
  const products = await getCollectionProducts(resolvedParams.slug, resolvedSearchParams);
  const activeSort = (Array.isArray(resolvedSearchParams.sort) ? resolvedSearchParams.sort[0] : resolvedSearchParams.sort) || 'newest';

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Premium Header */}
      <Header />

      {/* Collection Hero Banner */}
      <section className="bg-[#FFF8F2] border-b border-[#222222]/5 py-12 select-none">
        <div className="max-w-7xl mx-auto px-6 space-y-3">
          <span className="text-[#E56717] text-[13px] uppercase tracking-[0.25em] font-bold block">
            Exclusive Collection
          </span>
          <h2 className="text-[36px] md:text-[48px] font-bold text-[#222222] uppercase tracking-wide leading-tight">
            {collection.name}
          </h2>
          <p className="text-[#6B7280] text-[16px] max-w-2xl font-light">
            {collection.description}
          </p>
        </div>
      </section>

      {/* Main Browse Container */}
      <main className="max-w-7xl mx-auto px-6 py-12 flex-1 flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <FilterSidebar categories={categories} />

        {/* Products Grid Content Area */}
        <div className="flex-1 space-y-6">
          {/* Sorting controls bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222222]/5 pb-4 select-none">
            <div>
              <h3 className="text-[18px] font-bold text-[#222222] uppercase tracking-wide">Products In Drop</h3>
              <p className="text-[13px] text-[#6B7280]">Found {products.length} units</p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-[#6B7280] font-semibold mr-1">Sort:</span>
              <SortOptionLink label="Newest" value="newest" activeSort={activeSort} currentParams={resolvedSearchParams} slug={resolvedParams.slug} />
              <SortOptionLink label="₦ Low-High" value="price_asc" activeSort={activeSort} currentParams={resolvedSearchParams} slug={resolvedParams.slug} />
              <SortOptionLink label="₦ High-Low" value="price_desc" activeSort={activeSort} currentParams={resolvedSearchParams} slug={resolvedParams.slug} />
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
              <h3 className="text-[20px] font-bold text-[#222222]">No Products in Drop</h3>
              <p className="text-[#6B7280] text-[14px] max-w-sm mx-auto">
                No items are currently active matching the selected filters.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Premium Footer */}
      <Footer />
    </div>
  );
}
