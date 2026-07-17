'use client';

import React, { useState } from 'react';
import { ShoppingBag, MessageCircle, Heart, Star, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { trackEvent } from '../../../lib/analytics';
import { useCartStore } from '../../../store/cartStore';
import { useToastStore } from '../../../store/toastStore';

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
  const { addItem, toggleDrawer } = useCartStore();

  React.useEffect(() => {
    trackEvent('view_product', {
      productId: product.id,
      name: product.name,
    });
  }, [product.id, product.name]);

  const handleAddToCart = async () => {
    trackEvent('add_to_cart', {
      productId: product.id,
      variantId: selectedVariant.id,
      quantity,
      price: selectedVariant.price,
    });
    try {
      await addItem(selectedVariant.id, quantity);
      toggleDrawer(true);
    } catch (e) {
      console.error('Failed to add item to cart', e);
      useToastStore.getState().showToast('Failed to add item to bag. Please try again.', 'error');
    }
  };

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
                  {len}&quot; Inches
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
            onClick={handleAddToCart}
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
              href={`https://wa.me/2348087794441?text=Hello,%20I%20have%20questions%20about%20the%20${product.name}%20(SKU:%20${selectedVariant.sku})`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-[13px] font-bold text-[#E56717] hover:text-[#C65A12] uppercase tracking-wide pt-1"
            >
              Consult Hair Expert →
            </a>
          </div>
        </div>
      </div>

      {/* Product Reviews & Ratings Section */}
      <ProductReviewsSection productId={product.id} initialReviews={product.reviews} />

    </div>
  );
}

// Sub-component for reviews
interface ReviewWithPhotos extends Review {
  photos?: { id: string; url: string }[];
}

function ProductReviewsSection({ productId, initialReviews }: { productId: string; initialReviews: Review[] }) {
  const [reviews, setReviews] = useState<ReviewWithPhotos[]>(initialReviews);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState('');
  const [photosInput, setPhotosInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  const checkUserSession = async () => {
    try {
      const res = await fetch(`${API_URL}/users/me`, { credentials: 'include' });
      setIsLoggedIn(res.ok);
    } catch {
      setIsLoggedIn(false);
    }
  };

  const fetchLiveReviews = async () => {
    try {
      const res = await fetch(`${API_URL}/products/${productId}/reviews`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  React.useEffect(() => {
    checkUserSession();
    fetchLiveReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);
    setIsSubmitting(true);

    try {
      const photosArray = photosInput
        .split(',')
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      const res = await fetch(`${API_URL}/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          body,
          photos: photosArray.length > 0 ? photosArray : undefined,
        }),
        credentials: 'include',
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to submit review');
      }

      setBody('');
      setPhotosInput('');
      setRating(5);
      setSubmitSuccess(true);
      fetchLiveReviews();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const maskEmail = (email: string) => {
    if (!email) return 'Customer';
    const [name, domain] = email.split('@');
    if (!domain) return email;
    return `${name.substring(0, 2)}***${name.substring(name.length - 1)}@${domain}`;
  };

  return (
    <div className="lg:col-span-2 border-t border-[#222222]/5 pt-12 mt-12 grid grid-cols-1 md:grid-cols-3 gap-12">
      
      {/* Summary and Form */}
      <div className="space-y-6 md:col-span-1">
        <div>
          <h3 className="text-[20px] font-extrabold uppercase tracking-tight text-[#222222]">Customer Reviews</h3>
          <p className="text-[13px] text-[#6B7280] mt-0.5">Read experiences of verified bundlers.</p>
        </div>

        {/* Rating Breakdown summary card */}
        <div className="bg-[#FAF7F4] p-5 rounded-[20px] border border-[#222222]/5 space-y-3">
          <div className="flex items-center gap-3">
            <h4 className="text-[36px] font-extrabold text-[#E56717]">
              {reviews.length > 0
                ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
                : '5.0'}
            </h4>
            <div>
              <div className="flex text-[#E56717]">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-4 h-4 fill-[#E56717] stroke-transparent" />
                ))}
              </div>
              <span className="text-[11px] text-[#6B7280] font-bold uppercase tracking-wider">
                based on {reviews.length} reviews
              </span>
            </div>
          </div>
        </div>

        {/* Write Review Form Card */}
        <div className="bg-white border border-[#222222]/5 p-5 rounded-[20px] shadow-sm space-y-4">
          <h4 className="text-[13px] font-bold uppercase tracking-wider text-[#222222]">
            Write a Review
          </h4>

          {!isLoggedIn ? (
            <div className="bg-[#FAF7F4] p-4 rounded-[12px] border border-[#222222]/5 text-center text-[12.5px] text-[#6B7280] space-y-2">
              <p>You must be signed in to submit product reviews.</p>
              <Link href="/account" className="inline-block text-[#E56717] font-bold hover:underline">
                Sign In now →
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-4">
              
              {/* Star selector */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider block">Your Rating</label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-0.5 cursor-pointer hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= rating
                            ? 'fill-[#E56717] stroke-[#E56717]'
                            : 'stroke-[#6B7280] fill-transparent'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Review text */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider">Review Comments</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe bundle softness, lace quality, shedding..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full p-3 border border-[#222222]/10 rounded-[10px] bg-[#FAF7F4] text-[13px] focus:border-[#E56717] outline-none resize-none"
                />
              </div>

              {/* Cloudinary mock photo url list */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider">Photo Attachments (Optional)</label>
                <input
                  type="text"
                  placeholder="Image URLs (comma separated)..."
                  value={photosInput}
                  onChange={(e) => setPhotosInput(e.target.value)}
                  className="w-full h-10 px-3 border border-[#222222]/10 rounded-[10px] bg-[#FAF7F4] text-[13px] focus:border-[#E56717] outline-none"
                />
                <span className="text-[9px] text-[#6B7280] leading-tight block">
                  For demonstration, you can append photo URLs directly e.g. `/Logo/photo_2023-09-25_16-13-56.jpg`.
                </span>
              </div>

              {submitError && (
                <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 p-3 rounded-[10px] text-[#EF4444] text-[11px] font-bold">
                  ⚠️ {submitError}
                </div>
              )}

              {submitSuccess && (
                <div className="bg-[#22C55E]/10 border border-[#22C55E]/20 p-3 rounded-[10px] text-[#22C55E] text-[11px] font-bold">
                  ✓ Review submitted successfully!
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-10 bg-[#E56717] hover:bg-[#C65A12] disabled:bg-[#6B7280] text-white text-[12px] font-bold uppercase tracking-widest rounded-[10px] shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <span>Publish Review</span>
                )}
              </button>

            </form>
          )}
        </div>
      </div>

      {/* Reviews feed */}
      <div className="md:col-span-2 space-y-6">
        <h4 className="text-[14px] font-bold uppercase tracking-wider text-[#222222]">
          Shopper Reviews ({reviews.length})
        </h4>

        {reviews.length === 0 ? (
          <div className="py-12 text-center text-[#6B7280] border border-dashed border-[#222222]/10 rounded-[24px]">
            No reviews published yet for this product. Be the first to purchase and review!
          </div>
        ) : (
          <div className="divide-y divide-[#222222]/5">
            {reviews.map((r) => (
              <div key={r.id} className="py-6 first:pt-0 last:pb-0 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-bold text-[#222222] text-[13.5px]">
                      {maskEmail(r.customer?.email)}
                    </h5>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex text-[#E56717]">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${
                              star <= r.rating ? 'fill-[#E56717] stroke-transparent' : 'stroke-[#6B7280]/30 fill-transparent'
                            }`}
                          />
                        ))}
                      </div>
                      {r.verifiedPurchase && (
                        <span className="bg-[#22C55E]/10 text-[#22C55E] text-[8.5px] font-extrabold px-1.5 py-0.5 rounded-[4px] uppercase tracking-wider flex items-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>Verified Buyer</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] text-[#6B7280] font-medium">
                    {new Date(r.createdAt).toLocaleDateString('en-NG', { dateStyle: 'medium' })}
                  </span>
                </div>

                <p className="text-[14.5px] text-[#6B7280] leading-relaxed font-light">{r.body}</p>

                {/* Review images preview grid */}
                {r.photos && r.photos.length > 0 && (
                  <div className="flex gap-2 pt-1 overflow-x-auto">
                    {r.photos.map((photo) => (
                      <div
                        key={photo.id}
                        className="w-20 h-20 rounded-[8px] overflow-hidden border border-[#222222]/10 bg-[#FAF7F4] shrink-0"
                      >
                        <img
                          src={photo.url}
                          alt="review upload"
                          className="w-full h-full object-cover cursor-pointer hover:opacity-85 transition-opacity"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

