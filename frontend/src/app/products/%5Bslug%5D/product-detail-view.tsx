'use client';

import React, { useState } from 'react';
import { ShoppingBag, MessageCircle, Heart, Star, Sparkles } from 'lucide-react';

interface ProductImage {
  id: string;
  url: string;
  position?: number;
}

interface Inventory {
  quantity: number;
  lowStockThreshold?: number;
}

interface ProductVariant {
  id: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  attributes: { length?: string; texture?: string };
  images: ProductImage[];
  inventory?: Inventory | null;
}

interface Review {
  id: string;
  rating: number;
  body: string;
  verifiedPurchase: boolean;
  createdAt: string;
  customer: { email: string };
}

interface ProductDetailViewProps {
  product: {
    id: string;
    name: string;
    description: string;
    variants: ProductVariant[];
    reviews: Review[];
  };
}

export default function ProductDetailView({ product }: ProductDetailViewProps) {
  const variants = product.variants;
  
  // Default to first variant
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(variants[0]);
  const [activeImage, setActiveImage] = useState<string>(
    selectedVariant.images[0]?.url || '/Logo/photo_2023-09-25_16-13-56.jpg'
  );
  const [quantity, setQuantity] = useState(1);

  const handleVariantSelect = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    if (variant.images[0]) {
      setActiveImage(variant.images[0].url);
    }
  };

  const handleQuantityChange = (type: 'inc' | 'dec') => {
    if (type === 'inc') {
      const maxStock = selectedVariant.inventory?.quantity ?? 10;
      if (quantity < maxStock) {
        setQuantity(quantity + 1);
      }
    } else {
      if (quantity > 1) {
        setQuantity(quantity - 1);
      }
    }
  };

  const priceInNgn = selectedVariant.price / 100;
  const comparePriceInNgn = selectedVariant.compareAtPrice ? selectedVariant.compareAtPrice / 100 : null;
  const stock = selectedVariant.inventory?.quantity ?? 0;
  const isOutOfStock = stock <= 0;

  // Calculate average rating
  const avgRating = product.reviews.length > 0
    ? (product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length).toFixed(1)
    : '5.0';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 select-none font-sans">
      
      {/* Product Image Gallery */}
      <div className="space-y-4">
        {/* Main image presentation */}
        <div className="relative h-[480px] rounded-[24px] overflow-hidden bg-[#FAF7F4] border border-[#222222]/5">
          <img
            src={activeImage}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          <button className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/80 hover:bg-[#E56717] hover:text-white flex items-center justify-center text-[#222222] transition-colors duration-200 shadow-md">
            <Heart className="w-5 h-5" />
          </button>
        </div>

        {/* Thumbnail list */}
        {selectedVariant.images.length > 1 && (
          <div className="flex gap-4">
            {selectedVariant.images.map((img) => (
              <button
                key={img.id}
                onClick={() => setActiveImage(img.url)}
                className={`w-20 h-20 rounded-[12px] overflow-hidden bg-[#FAF7F4] border-2 transition-all duration-200 ${
                  activeImage === img.url ? 'border-[#E56717]' : 'border-transparent'
                }`}
              >
                <img src={img.url} alt="thumbnail" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Purchase Area */}
      <div className="space-y-8">
        <div className="space-y-3">
          <h2 className="text-[28px] md:text-[36px] font-bold text-[#222222] uppercase tracking-wide leading-tight">
            {product.name}
          </h2>
          <div className="flex items-center gap-4 text-[14px]">
            <div className="flex items-center text-[#E56717] gap-1 font-bold">
              <Star className="w-4 h-4 fill-[#E56717]" />
              <span>{avgRating}</span>
              <span className="text-[#6B7280] font-normal">({product.reviews.length} reviews)</span>
            </div>
            <span className="text-[#6B7280]">|</span>
            <span className="text-[#6B7280] font-mono">SKU: {selectedVariant.sku}</span>
          </div>
        </div>

        {/* Price list */}
        <div className="flex items-baseline gap-4 py-2 border-y border-[#222222]/5">
          <span className="text-[32px] font-extrabold text-[#E56717]">
            ₦{priceInNgn.toLocaleString()}
          </span>
          {comparePriceInNgn && (
            <span className="text-[18px] text-[#6B7280] line-through font-medium">
              ₦{comparePriceInNgn.toLocaleString()}
            </span>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <h5 className="text-[14px] font-bold text-[#222222] uppercase tracking-wider">Description</h5>
          <p className="text-[16px] text-[#6B7280] leading-relaxed font-light">{product.description}</p>
        </div>

        {/* Length Select Variant */}
        <div className="space-y-3">
          <h5 className="text-[14px] font-bold text-[#222222] uppercase tracking-wider">Select Length</h5>
          <div className="flex flex-wrap gap-3">
            {variants.map((v) => {
              const len = v.attributes.length || 'Default';
              const isSelected = selectedVariant.id === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => handleVariantSelect(v)}
                  className={`h-11 px-5 border rounded-[12px] text-[14px] font-bold transition-all duration-200 ${
                    isSelected
                      ? 'border-[#E56717] bg-[#E56717]/5 text-[#E56717]'
                      : 'border-[#222222]/10 text-[#222222] hover:border-[#222222]/30'
                  }`}
                >
                  {len}" Inches
                </button>
              );
            })}
          </div>
        </div>

        {/* Stock status indicator */}
        <div className="flex items-center gap-2 text-[14px]">
          <span className="font-semibold text-[#222222]">Stock Availability:</span>
          {isOutOfStock ? (
            <span className="text-[#EF4444] font-bold uppercase tracking-wider">Out of Stock</span>
          ) : stock <= 5 ? (
            <span className="text-[#F59E0B] font-bold uppercase tracking-wider">Low Stock ({stock} left)</span>
          ) : (
            <span className="text-[#22C55E] font-bold uppercase tracking-wider">In Stock ({stock} available)</span>
          )}
        </div>

        {/* Quantity and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-[#222222]/5">
          <div className="flex items-center h-[52px] border border-[#222222]/10 rounded-[12px] overflow-hidden w-full sm:w-[130px] shrink-0 bg-[#F8F8F8]">
            <button
              onClick={() => handleQuantityChange('dec')}
              disabled={isOutOfStock || quantity <= 1}
              className="flex-1 h-full text-[18px] text-[#222222] font-bold disabled:opacity-30"
            >
              -
            </button>
            <span className="w-10 text-center font-bold text-[16px] text-[#222222]">{quantity}</span>
            <button
              onClick={() => handleQuantityChange('inc')}
              disabled={isOutOfStock || quantity >= stock}
              className="flex-1 h-full text-[18px] text-[#222222] font-bold disabled:opacity-30"
            >
              +
            </button>
          </div>

          <button
            disabled={isOutOfStock}
            className="flex-1 h-[52px] bg-[#E56717] hover:bg-[#C65A12] disabled:bg-[#FAF7F4] disabled:border disabled:border-[#222222]/10 disabled:text-[#6B7280] text-white text-[15px] font-bold uppercase tracking-widest rounded-[12px] shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer disabled:cursor-not-allowed"
          >
            <ShoppingBag className="w-5 h-5" />
            <span>{isOutOfStock ? 'Sold Out' : 'Add to Bag'}</span>
          </button>
        </div>

        {/* WhatsApp direct help */}
        <div className="p-4 bg-[#FFF8F2] border border-[#E56717]/10 rounded-[16px] flex items-start gap-4">
          <MessageCircle className="w-6 h-6 text-[#25D366] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h6 className="text-[14px] font-bold text-[#222222]">Need Help Customizing?</h6>
            <p className="text-[13px] text-[#6B7280]">
              Get real-time advice from our stylist. Ask about density, lace types, and care on WhatsApp.
            </p>
            <a
              href={`https://wa.me/2348000000000?text=Hello,%20I%20have%20questions%20about%20the%20${product.name}%20(SKU:%20${selectedVariant.sku})`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-[13px] font-bold text-[#E56717] hover:text-[#C65A12] uppercase tracking-wide pt-1"
            >
              Consult Hair Expert →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
