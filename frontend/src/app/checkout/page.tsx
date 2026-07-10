'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '../../store/cartStore';
import { ShieldCheck, Truck, ShoppingBag, ArrowLeft, CreditCard } from 'lucide-react';
import { trackEvent } from '../../lib/analytics';

// Popular Nigerian States and their Local Government Areas (LGAs)
const NIGERIAN_STATES_LGAS: Record<string, string[]> = {
  Lagos: [
    'Ikeja',
    'Eti-Osa (Lekki, Ikoyi, Victoria Island)',
    'Lagos Island',
    'Surulere',
    'Ikorodu',
    'Alimosho',
    'Kosofe',
    'Mushin',
    'Oshodi-Isolo',
    'Ojo',
    'Amuwo-Odofin',
    'Lagos Mainland',
    'Apapa',
    'Badagry',
    'Epe',
    'Ibeju-Lekki',
    'Agege',
    'Ifako-Ijaiye',
    'Somolu',
  ],
  Abuja: ['Municipal (AMAC)', 'Bwari', 'Gwagwalada', 'Kuje', 'Abaji', 'Kwali'],
  Rivers: ['Port Harcourt', 'Obio-Akpor', 'Bonny', 'Degema', 'Eleme', 'Okrika', 'Oyigbo', 'Ahoada East'],
  Oyo: ['Ibadan North', 'Ibadan North-East', 'Ibadan North-West', 'Ibadan South-East', 'Ibadan South-West', 'Ogbomosho North', 'Oyo East'],
  Delta: ['Warri South', 'Asaba (Oshimili South)', 'Uvwie', 'Ughelli North', 'Sapele'],
  Edo: ['Oredo (Benin City)', 'Ikpoba-Okha', 'Egor', 'Esan West'],
  Kano: ['Kano Municipal', 'Fagge', 'Nasarawa', 'Gwale', 'Tarauni'],
  Kaduna: ['Kaduna North', 'Kaduna South', 'Chikun', 'Zaria'],
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, sessionId, clearCart } = useCartStore();
  const subtotal = items.reduce((acc, item) => acc + item.variant.price * item.quantity, 0);
  const subtotalInNgn = subtotal / 100;

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    state: '',
    lga: '',
    street: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0 && !isSubmitting) {
      router.push('/shop');
    }
  }, [items, router, isSubmitting]);

  // Track checkout beginning
  useEffect(() => {
    if (items.length > 0) {
      trackEvent('begin_checkout', {
        cartItemsCount: items.length,
        subtotal: subtotalInNgn,
      });
    }
  }, [items.length, subtotalInNgn]);

  const handleStateChange = (stateName: string) => {
    setForm((prev) => ({ ...prev, state: stateName, lga: '' }));
  };

  const handleInputChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Shipping calculation logic:
  // Lagos: ₦5,000 flat, free if subtotal >= ₦250,000 (250,000,000 kobo)
  // Other states: ₦7,500 flat
  const isLagos = form.state.toLowerCase() === 'lagos';
  const shippingFeeInNgn = form.state
    ? isLagos
      ? subtotalInNgn >= 250000
        ? 0
        : 5000
      : 7500
    : 0;

  const totalInNgn = subtotalInNgn + shippingFeeInNgn;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.state || !form.lga || !form.street) {
      setError('Please fill in all address and contact details.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Generate unique idempotency key
    const idempotencyKey = `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    try {
      const res = await fetch('http://localhost:3001/api/v1/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          shippingAddress: form,
          idempotencyKey,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to place order');
      }

      const order = await res.json();

      // Initialize Paystack Payment
      const payRes = await fetch('http://localhost:3001/api/v1/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id }),
      });

      if (!payRes.ok) {
        const payData = await payRes.json();
        throw new Error(payData.message || 'Failed to initialize payment portal');
      }

      const paymentDetails = await payRes.json();

      // Clear local store cart items
      clearCart();

      // Redirect user directly to Paystack payment gateway (or mock success URL in dev)
      window.location.href = paymentDetails.authorization_url;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(message || 'Checkout failed. Please check variant stock.');
      setIsSubmitting(false);
    }
  };

  if (items.length === 0 && !isSubmitting) return null;

  return (
    <div className="min-h-screen bg-[#FAF7F4] font-sans text-[#222222] select-none py-10">
      <div className="max-w-6xl mx-auto px-6 space-y-6">
        
        {/* Header navigation bar */}
        <div className="flex items-center justify-between border-b border-[#222222]/5 pb-4">
          <Link href="/shop" className="flex items-center gap-2 text-[14px] font-bold text-[#6B7280] hover:text-[#222222] uppercase tracking-wider transition-colors duration-150">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Shop</span>
          </Link>
          <span className="font-display text-[28px] tracking-wider uppercase">
            Hairotic
          </span>
          <div className="w-20" /> {/* Spacer */}
        </div>

        {error && (
          <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 p-4 rounded-[16px] text-[#EF4444] text-[14px] font-bold">
            ⚠️ {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Shipping Details Form */}
          <div className="lg:col-span-7 bg-white rounded-[24px] border border-[#222222]/5 p-6 md:p-8 space-y-6 shadow-sm">
            <div>
              <h3 className="text-[20px] font-bold text-[#222222] uppercase tracking-wide">Shipping Address</h3>
              <p className="text-[13px] text-[#6B7280]">Enter contact details and delivery location.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-[#222222] uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="E.g., Sandra Obi"
                    className="w-full h-11 px-4 border border-[#222222]/10 rounded-[12px] bg-[#FAF7F4] text-[14px] focus:border-[#E56717] outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-[#222222] uppercase tracking-wider">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="E.g., +234 80 1234 5678"
                    className="w-full h-11 px-4 border border-[#222222]/10 rounded-[12px] bg-[#FAF7F4] text-[14px] focus:border-[#E56717] outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-[#222222] uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="sandra@example.com"
                  className="w-full h-11 px-4 border border-[#222222]/10 rounded-[12px] bg-[#FAF7F4] text-[14px] focus:border-[#E56717] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-[#222222] uppercase tracking-wider">State</label>
                  <select
                    required
                    value={form.state}
                    onChange={(e) => handleStateChange(e.target.value)}
                    className="w-full h-11 px-3 border border-[#222222]/10 rounded-[12px] bg-[#FAF7F4] text-[14px] outline-none focus:border-[#E56717]"
                  >
                    <option value="">Select Shipping State</option>
                    {Object.keys(NIGERIAN_STATES_LGAS).map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-[#222222] uppercase tracking-wider">LGA / Area</label>
                  <select
                    required
                    disabled={!form.state}
                    value={form.lga}
                    onChange={(e) => handleInputChange('lga', e.target.value)}
                    className="w-full h-11 px-3 border border-[#222222]/10 rounded-[12px] bg-[#FAF7F4] text-[14px] outline-none focus:border-[#E56717] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select LGA Area</option>
                    {form.state &&
                      NIGERIAN_STATES_LGAS[form.state].map((lga) => (
                        <option key={lga} value={lga}>
                          {lga}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-[#222222] uppercase tracking-wider">Street Address</label>
                <input
                  type="text"
                  required
                  value={form.street}
                  onChange={(e) => handleInputChange('street', e.target.value)}
                  placeholder="Street name, estate name, building details..."
                  className="w-full h-11 px-4 border border-[#222222]/10 rounded-[12px] bg-[#FAF7F4] text-[14px] focus:border-[#E56717] outline-none"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-[52px] bg-[#E56717] hover:bg-[#C65A12] disabled:bg-[#6B7280] text-white text-[15px] font-bold uppercase tracking-widest rounded-[12px] shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      <span>Place Order & Pay</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Order Summary Column */}
          <div className="lg:col-span-5 bg-white rounded-[24px] border border-[#222222]/5 p-6 shadow-sm space-y-6">
            <h3 className="text-[18px] font-bold text-[#222222] uppercase tracking-wide border-b border-[#222222]/5 pb-4 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#E56717]" />
              <span>Order Summary ({items.length})</span>
            </h3>

            {/* List items */}
            <div className="space-y-4 max-h-[280px] overflow-y-auto pr-1">
              {items.map((item) => {
                const variant = item.variant;
                const image = variant.images[0]?.url || '/Logo/photo_2023-09-25_16-13-56.jpg';
                return (
                  <div key={item.id} className="flex gap-4 items-center">
                    <div className="w-14 h-14 rounded-[8px] overflow-hidden shrink-0 border border-[#222222]/10">
                      <img src={image} alt="product" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-[13px] font-bold text-[#222222] truncate">
                        {variant.product.name}
                      </h5>
                      <span className="text-[11px] text-[#6B7280] font-semibold uppercase tracking-wider">
                        Length: {variant.attributes.length || 'Default'}&quot; x {item.quantity}
                      </span>
                    </div>
                    <span className="text-[14px] font-extrabold text-[#E56717] shrink-0">
                      ₦{((variant.price * item.quantity) / 100).toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Price rollups */}
            <div className="border-t border-[#222222]/5 pt-4 space-y-2">
              <div className="flex justify-between text-[14px] text-[#222222]">
                <span className="font-semibold">Subtotal</span>
                <span className="font-bold">₦{subtotalInNgn.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[14px] text-[#222222]">
                <span className="font-semibold">Delivery Fee</span>
                <span className="font-bold">
                  {shippingFeeInNgn === 0
                    ? form.state
                      ? 'Free'
                      : 'Calculated next'
                    : `₦${shippingFeeInNgn.toLocaleString()}`}
                </span>
              </div>
              <div className="flex justify-between text-[16px] text-[#222222] border-t border-[#222222]/5 pt-3">
                <span className="font-bold">Total Amount</span>
                <span className="font-extrabold text-[#E56717] text-[18px]">
                  ₦{totalInNgn.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Trust promises */}
            <div className="bg-[#FFF8F2] border border-[#E56717]/10 p-4 rounded-[16px] space-y-3 select-none text-[13px] text-[#6B7280]">
              <div className="flex items-center gap-3 text-[#222222] font-semibold">
                <ShieldCheck className="w-4 h-4 text-[#22C55E]" />
                <span>Paystack Encrypted Pay</span>
              </div>
              <p className="leading-relaxed font-light">
                Payment processed by Paystack. Card, bank transfer, and USSD are 100% secure.
              </p>
              <div className="flex items-center gap-3 text-[#222222] font-semibold pt-1">
                <Truck className="w-4 h-4 text-[#E56717]" />
                <span>Next-Day Lagos Courier</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
