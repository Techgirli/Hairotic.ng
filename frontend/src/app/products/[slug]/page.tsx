import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import ProductDetailView from './product-detail-view';
import Header from '@/components/header';
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1 space-y-12 sm:space-y-16">
        {/* Gallery + Variants selectors + Interactive Reviews */}
        <ProductDetailView product={product} />
      </main>

      {/* Premium Footer */}
      <Footer />
    </div>
  );
}
