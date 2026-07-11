import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import FilterSidebar from './filter-sidebar';
import { Heart } from 'lucide-react';
import Header from '../../components/header';
import Footer from '@/components/footer';
import WishlistButton from '../../components/wishlist-button';

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

interface ProductWithCategory extends Product {
  categorySlug: string;
}

const WIG_IMAGES = [
  '02ab823d3a0c332042b5a6c3b3f99282.jpg',
  '0443d651affacccaf4e669a72ffc5247.jpg',
  '05fc97c545a00c437884cdf4cfb5c082.jpg',
  '061b881e9eb397ca7e74298a5a2bb46f.jpg',
  '07c47b76fed43496e3e9520dd7cbf54c.jpg',
  '07f51f04c30a9ecd6659cb058a95859f.jpg',
  '09940124d21243da88f68647ece45ded.jpg',
  '0f8a601422862360393536d6b810f2e0.jpg',
  '131a5b0c507705120a8fb52fddd7c6a2.jpg',
  '13f4b3f9d1e25df2f6a74d4600cb5766.jpg',
  '185fe686f5da0947e75f3bff9adfe1dc.jpg',
  '187f8747eb1b36732430abf7a9b8ea46.jpg',
  '1be61dcda9c3131f2d68602af76390e5.jpg',
  '2075bf9c80b569f51e669300e2264389.jpg',
  '229e1dd1e493a5e43ba7e89595315e18.jpg',
  '239ff6ec90727f2516f848079b374efa.jpg',
  '2d0454f23e05f4a8e3b6c76ff466b580.jpg',
  '2d90fbd186d907f4c9ae5dcb21eac261.jpg',
  '31e8670dd3cc32374263cef8f046e791.jpg',
  '3766bba0a3e81b0de1787d48e9004cd1.jpg',
  '3bf3e64b450bd319f4877f68089f9406.jpg',
  '41cd8a391a19f0c02de40eb5a270224e.jpg',
  '49751d1bfb1477449820f3d8921fc394.jpg',
  '4a2ed81e420631766c32e61652f67478.jpg',
  '4b2249f72bab268a1b71b7092f0376ff.jpg',
  '5b29c5f5a9618d4e02940daa96bcf35d.jpg',
  '63d96f649f15eec9baf345fbae1a1162.jpg',
  '6c0fb20fac12cc6f22b0e61943299717.jpg',
  '7278f759121ce463932193423992ff7a.jpg',
  '79f05317cc134a6702edc00d0d14f8c0.jpg',
  '7dfec8bb246f41c69cb983e331cfcaac.jpg',
  '7e5236d09c219ec9fe98a7c536fe8fd5.jpg',
  '85a54d19d6192818e17a31e55013011e.jpg',
  '86ab4bf6a840d8273b1ce727b9aa7b3d.jpg',
  '89e0db581f5e8904fb40ee48eb5b52a0.jpg',
  '8b68fb7b8dc91bf4a3505cd8f3957138.jpg',
  '8c0d47963ee081fd43afef5f0d9f6dd6.jpg',
  '8fbfe0474edd5027a101397c528a6830.jpg',
  '906b39c2d9c6045037e58fb74c658e96.jpg',
  '9bf0af63103d1ff802b1a1a1e63c44c9.jpg',
  '9c0938fcd9094c0d28af07b00298bcc5.jpg',
  '9e4dc4b86e63fe6fccc3d4cab8b96215.jpg',
  '9f4434bb79f7966ba60f469ddd804e7c.jpg',
  'a14d8543e60511923b22767b7f51bec4.jpg',
  'a658ccff807f5345a56326f18e7a41bd.jpg',
  'adc70ba5bab02153057cad2703c7f157.jpg',
  'b1c0118f823b1e1cb631d03496bc60f7.jpg',
  'b279932de72ec6c1344ea22020cf88dc.jpg',
  'b6a768f5ccb6e11f5c3d056c7df71062.jpg',
  'b730b67704963448e9376f1f519cdc8e.jpg',
  'b77328cbf7e968c3328c9aa96e3bd780.jpg',
  'bcb3bad5911f442426b8d37b3a86fa2b.jpg',
  'c090f28bd5ffbc16ba585bfb86a78b11.jpg',
  'c504ed2595d650d6264a7d0e01e9cf2d.jpg',
  'c5370e4d660b1e51732c000c851a512f.jpg',
  'c5c7aa3217ab8abc3be8218c15e4871a.jpg',
  'cb97d3608ba181d8947271aef6cd2d9a.jpg',
  'd889fc460dec62af86f73aed92407c15.jpg',
  'db6d40187408cffb320402c754d8ed91.jpg',
  'deb96943abdd8693bc7cd6910ff8a879.jpg',
  'e5ada6a44b4cee068499cac637d48d2a.jpg',
  'ebedc1773beb2660c967e60e3168e731.jpg',
  'ec72506e8ec4c09930e8e65cf7ea1ae6.jpg',
  'ed576d1a7e4299bfccf48bf9c9917988.jpg',
  'edff90d99fc08f81e06bc1c53eb614ab.jpg',
  'ef1f4295df51143174f8a626eec5ddfd.jpg',
  'f7603c772d72ae50f2c4fbb94a7ce4f5.jpg',
  'f97b745787e369d2e63bbb951305387c.jpg',
  'f9cf7ebc537293f547e939faf8f4ac17.jpg'
];

const EXTENSION_IMAGES = [
  'IMG_5204.JPG', 'IMG_5205.JPG', 'IMG_5206.JPG', 'IMG_5207.JPG', 'IMG_5208.JPG',
  'IMG_5209.JPG', 'IMG_5210.JPG', 'IMG_5211.JPG', 'IMG_5212.JPG', 'IMG_5213.JPG',
  'IMG_5216.JPG', 'IMG_5217.JPG', 'IMG_5240.JPG', 'IMG_5241.JPG'
];

const BUNDLE_IMAGES = [
  'IMG_5218.JPG', 'IMG_5219.JPG', 'IMG_5220.JPG', 'IMG_5221.JPG', 'IMG_5222.JPG',
  'IMG_5223.JPG', 'IMG_5224.JPG', 'IMG_5225.JPG', 'IMG_5226.JPG', 'IMG_5227.JPG',
  'IMG_5228.JPG', 'IMG_5229.JPG', 'IMG_5230.JPG', 'IMG_5231.JPG', 'IMG_5232.JPG',
  'IMG_5233.JPG', 'IMG_5234.JPG', 'IMG_5235.JPG', 'IMG_5236.JPG', 'IMG_5237.JPG',
  'IMG_5238.JPG', 'IMG_5239.JPG', 'IMG_5242.JPG'
];

const MOCK_PRODUCTS: ProductWithCategory[] = [
  // Wigs
  ...WIG_IMAGES.map((img, i) => {
    const price = 16000000 + ((i * 3500000) % 18000000);
    const compareAtPrice = price + 3000000;
    return {
      id: `wig-prod-${i}`,
      name: `Premium Wig Unit #${101 + i}`,
      slug: `wig-unit-${i}`,
      categorySlug: 'wigs',
      description: '100% premium Vietnamese human hair wig. Custom hairline, hd swiss lace melt.',
      variants: [{
        id: `wig-var-${i}`,
        price,
        compareAtPrice,
        attributes: { length: '16', texture: 'Straight' },
        images: [{ id: `wig-img-${i}`, url: `/wigs/${img}` }]
      }]
    };
  }),

  // Extensions
  ...EXTENSION_IMAGES.map((img, i) => {
    const price = 11000000 + ((i * 2500000) % 9000000);
    const compareAtPrice = price + 2000000;
    return {
      id: `ext-prod-${i}`,
      name: `Raw Premium Clip-in Extensions #${101 + i}`,
      slug: `extensions-unit-${i}`,
      categorySlug: 'extensions',
      description: 'Easy to install raw hair clip-ins for instant luxury length and thick volume.',
      variants: [{
        id: `ext-var-${i}`,
        price,
        compareAtPrice,
        attributes: { length: '18', texture: 'Straight' },
        images: [{ id: `ext-img-${i}`, url: `/extensions/${img}` }]
      }]
    };
  }),

  // Bundles
  ...BUNDLE_IMAGES.map((img, i) => {
    const price = 13500000 + ((i * 3000000) % 11500000);
    const compareAtPrice = price + 2500000;
    return {
      id: `bun-prod-${i}`,
      name: `Vietnamese Raw Donor Bundles #${101 + i}`,
      slug: `bundles-unit-${i}`,
      categorySlug: 'bundle',
      description: 'Super thick raw donor hair bundle. Excellent waves and full density.',
      variants: [{
        id: `bun-var-${i}`,
        price,
        compareAtPrice,
        attributes: { length: '20', texture: 'Wavy' },
        images: [{ id: `bun-img-${i}`, url: `/curly/${img}` }]
      }]
    };
  })
];

// Fetch categories for sidebar
async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch('http://localhost:3001/api/v1/categories', { cache: 'no-store' });
    if (!res.ok) throw new Error('API response not ok');
    return await res.json();
  } catch {
    return [
      { id: 'cat-1', name: 'Wigs', slug: 'wigs' },
      { id: 'cat-2', name: 'Bundles', slug: 'bundle' },
      { id: 'cat-3', name: 'Extensions', slug: 'extensions' },
      { id: 'cat-4', name: 'Styling', slug: 'styling' }
    ];
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
    if (!res.ok) throw new Error('API response not ok');
    const data = await res.json();
    return data.products || [];
  } catch (err) {
    console.error('Failed to query shop products, using mock fallback', err);
    const catSlug = searchParams.categorySlug;
    if (catSlug) {
      const targetSlug = Array.isArray(catSlug) ? catSlug[0] : catSlug;
      return MOCK_PRODUCTS.filter(p => p.categorySlug === targetSlug);
    }
    return MOCK_PRODUCTS;
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
                        <WishlistButton variantId={defaultVariant?.id} />
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
      <Footer />
    </div>
  );
}
