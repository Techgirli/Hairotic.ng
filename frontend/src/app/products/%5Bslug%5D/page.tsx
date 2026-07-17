import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import ProductDetailView from './product-detail-view';
import { Star, ShieldCheck } from 'lucide-react';
import Header from '../../../components/header';
import Footer from '@/components/footer';

export const dynamic = 'force-dynamic';

interface ProductImage {
  id: string;
  url: string;
}

interface ProductVariant {
  id: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  attributes: { length?: string; texture?: string };
  images: ProductImage[];
  inventory?: { quantity: number } | null;
}

interface Review {
  id: string;
  rating: number;
  body: string;
  verifiedPurchase: boolean;
  createdAt: string;
  customer: { email: string };
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  variants: ProductVariant[];
  reviews: Review[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

async function getProduct(slug: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API_URL}/products/${slug}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Error fetching product by slug', err);
    return null;
  }
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) {
    return { title: 'Product Not Found' };
  }

  const defaultVariant = product.variants[0];
  const image = defaultVariant?.images[0]?.url;
  const priceInNgn = defaultVariant ? defaultVariant.price / 100 : 0;

  return {
    title: product.name,
    description: `${product.description.slice(0, 155)}… Buy now from ₦${priceInNgn.toLocaleString()} at Hairotic.ng.`,
    openGraph: {
      title: `${product.name} | Hairotic.ng`,
      description: product.description,
      url: `${SITE_URL}/products/${product.slug}`,
      type: 'website',
      images: image
        ? [{ url: `${SITE_URL}${image}`, width: 1200, height: 630, alt: product.name }]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | Hairotic.ng`,
      description: product.description,
      images: image ? [`${SITE_URL}${image}`] : [],
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const resolvedParams = await params;
  const product = await getProduct(resolvedParams.slug);

  if (!product) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-16 select-none bg-[#FAF7F4] font-sans">
        <h2 className="text-[24px] font-bold text-[#222222]">Product Not Found</h2>
        <p className="text-[#6B7280] text-[15px] mt-2 mb-4">The product you are trying to view does not exist or has been removed.</p>
        <Link href="/shop" className="h-11 px-6 bg-[#222222] text-[#FFFFFF] text-[13px] font-bold uppercase tracking-widest rounded-[12px] flex items-center justify-center">
          Back to Shop
        </Link>
      </div>
    );
  }

  const defaultVariant = product.variants[0];
  const defaultPrice = defaultVariant ? defaultVariant.price / 100 : 0;
  const defaultImage = defaultVariant?.images[0]?.url || '/Logo/photo_2023-09-25_16-13-56.jpg';
  const defaultSku = defaultVariant?.sku || '';
  const inStock = defaultVariant?.inventory ? defaultVariant.inventory.quantity > 0 : false;

  // JSON-LD structured data for Google Search SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': product.name,
    'image': `${SITE_URL}${defaultImage}`,
    'description': product.description,
    'sku': defaultSku,
    'offers': {
      '@type': 'Offer',
      'url': `${SITE_URL}/products/${product.slug}`,
      'priceCurrency': 'NGN',
      'price': defaultPrice,
      'itemCondition': 'https://schema.org/NewCondition',
      'availability': inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Inject JSON-LD Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />

      {/* Premium Header */}
      <Header />

      {/* Main PDP Layout */}
      <main className="max-w-7xl mx-auto px-6 py-12 flex-1 space-y-16">
        
        {/* Gallery + Variants selectors */}
        <ProductDetailView product={product} />

        {/* Verified Customer Reviews list */}
        <section className="border-t border-[#222222]/5 pt-12 space-y-8 select-none">
          <div className="flex items-center justify-between">
            <h3 className="text-[20px] font-bold text-[#222222] uppercase tracking-wide">
              Customer Reviews ({product.reviews.length})
            </h3>
            <span className="text-[14px] text-[#6B7280] font-semibold">Verified Purchases Only</span>
          </div>

          {product.reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {product.reviews.map((review) => {
                const anonymizedEmail = review.customer.email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
                return (
                  <div
                    key={review.id}
                    className="bg-[#FAF7F4] border border-[#222222]/5 rounded-[20px] p-6 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="text-[14px] font-bold text-[#222222]">{anonymizedEmail}</span>
                        <div className="flex items-center text-[#E56717] gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < review.rating ? 'fill-[#E56717]' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-[12px] text-[#6B7280]">
                        {new Date(review.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    <p className="text-[14px] text-[#222222] font-light leading-relaxed">
                      {review.body}
                    </p>

                    {review.verifiedPurchase && (
                      <div className="flex items-center gap-1.5 text-[12px] text-[#22C55E] font-semibold">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Verified Purchase</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-[#FAF7F4] border border-[#222222]/5 rounded-[20px] p-10 text-center text-[#6B7280] text-[14px]">
              No reviews have been written for this unit yet. Verified customers are emailed review prompts 7 days post-delivery.
            </div>
          )}
        </section>
      </main>

      {/* Premium Footer */}
      <Footer />
    </div>
  );
}
