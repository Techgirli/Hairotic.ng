'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Calendar, Truck, CreditCard, Box, CheckCircle2, ShieldAlert } from 'lucide-react';

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  variant: {
    sku: string;
    attributes: any;
    product: {
      name: string;
    };
    images: { url: string }[];
  };
}

interface StatusHistory {
  id: string;
  status: string;
  note: string;
  createdAt: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  shippingName: string;
  shippingEmail: string;
  shippingPhone: string;
  shippingState: string;
  shippingLga: string;
  shippingStreet: string;
  createdAt: string;
  items: OrderItem[];
  statusHistory: StatusHistory[];
}

export default function OrderTrackingPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber || !contactInfo) {
      setError('Please provide both Order Number and Email or Phone.');
      return;
    }

    setLoading(true);
    setError(null);
    setOrder(null);

    const isEmail = contactInfo.includes('@');
    const emailParam = isEmail ? `&email=${encodeURIComponent(contactInfo.trim())}` : '';
    const phoneParam = !isEmail ? `&phone=${encodeURIComponent(contactInfo.trim())}` : '';
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

    try {
      const res = await fetch(
        `${API_URL}/orders/track?orderNumber=${orderNumber.trim()}${emailParam}${phoneParam}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Order not found. Check details and try again.');
      }

      setOrder(data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { key: 'PENDING_PAYMENT', label: 'Placed', icon: Calendar, description: 'Order placed, awaiting checkout payment.' },
    { key: 'PAID', label: 'Paid', icon: CreditCard, description: 'Payment verified successfully.' },
    { key: 'PROCESSING', label: 'Processing', icon: Box, description: 'Order packaging and preparations.' },
    { key: 'SHIPPED', label: 'Shipped', icon: Truck, description: 'Courier dispatched.' },
    { key: 'DELIVERED', label: 'Delivered', icon: CheckCircle2, description: 'Handed over successfully.' },
  ];

  const getStepStatus = (stepKey: string, currentStatus: string, history: StatusHistory[]) => {
    const statusOrder = ['PENDING_PAYMENT', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const stepIndex = statusOrder.indexOf(stepKey);

    const isCancelled = ['CANCELLED', 'REFUNDED'].includes(currentStatus);

    if (isCancelled) {
      // Check if step happened in history before cancellation
      const wasReached = history.some((h) => h.status === stepKey);
      return wasReached ? 'completed' : 'skipped';
    }

    if (currentIndex >= stepIndex) {
      return 'completed';
    }
    if (currentIndex + 1 === stepIndex) {
      return 'active';
    }
    return 'upcoming';
  };

  const getStepDate = (stepKey: string, history: StatusHistory[]) => {
    const record = history.find((h) => h.status === stepKey);
    if (!record) return null;
    return new Date(record.createdAt).toLocaleDateString('en-NG', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF7F4] font-sans text-[#222222] py-10 select-none">
      <div className="max-w-4xl mx-auto px-6 space-y-8">
        
        {/* Navigation Header */}
        <div className="flex items-center justify-between border-b border-[#222222]/5 pb-4">
          <Link href="/shop" className="flex items-center gap-2 text-[14px] font-bold text-[#6B7280] hover:text-[#222222] uppercase tracking-wider transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Shop</span>
          </Link>
          <span className="font-display text-[26px] tracking-wider uppercase font-bold text-[#E56717]">
            Hairotic
          </span>
          <div className="w-20" />
        </div>

        {/* Info/Intro */}
        {!order && (
          <div className="text-center space-y-2 max-w-lg mx-auto">
            <h1 className="text-[32px] font-extrabold tracking-tight uppercase">Track Your Order</h1>
            <p className="text-[14px] text-[#6B7280]">
              See real-time status of your premium bundles. Enter order reference and contact info.
            </p>
          </div>
        )}

        {/* Search Panel */}
        <div className="bg-white border border-[#222222]/5 rounded-[24px] p-6 shadow-sm max-w-xl mx-auto space-y-4">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#222222] uppercase tracking-wider">Order Number</label>
                <input
                  type="text"
                  required
                  placeholder="E.g. HR-XXXXXX-YYYY"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="w-full h-11 px-4 border border-[#222222]/10 rounded-[12px] bg-[#FAF7F4] text-[14px] focus:border-[#E56717] outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#222222] uppercase tracking-wider">Email or Phone</label>
                <input
                  type="text"
                  required
                  placeholder="sandra@example.com"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  className="w-full h-11 px-4 border border-[#222222]/10 rounded-[12px] bg-[#FAF7F4] text-[14px] focus:border-[#E56717] outline-none"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#E56717] hover:bg-[#C65A12] disabled:bg-[#6B7280] text-white text-[14px] font-bold uppercase tracking-widest rounded-[12px] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Locate Order</span>
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 p-3 rounded-[12px] text-[#EF4444] text-[13px] font-semibold text-center">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Tracking Details Results */}
        {order && (
          <div className="space-y-8 animate-fade-in">
            {/* Order Top Banner */}
            <div className="bg-[#FFF8F2] border border-[#E56717]/10 p-6 rounded-[24px] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">Order Reference</span>
                <h2 className="text-[22px] font-extrabold text-[#E56717]">{order.orderNumber}</h2>
                <p className="text-[13px] text-[#6B7280] mt-1">
                  Placed on {new Date(order.createdAt).toLocaleDateString('en-NG', { dateStyle: 'long' })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {['CANCELLED', 'REFUNDED'].includes(order.status) ? (
                  <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] px-4 py-2 rounded-[16px] flex items-center gap-2 font-bold text-[13px] uppercase tracking-wider">
                    <ShieldAlert className="w-4 h-4" />
                    <span>{order.status}</span>
                  </div>
                ) : (
                  <div className="bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] px-4 py-2 rounded-[16px] font-bold text-[13px] uppercase tracking-wider">
                    Status: {order.status.replace('_', ' ')}
                  </div>
                )}
              </div>
            </div>

            {/* Stepper Timeline */}
            <div className="bg-white border border-[#222222]/5 p-6 md:p-8 rounded-[24px] shadow-sm space-y-6">
              <h3 className="text-[16px] font-bold uppercase tracking-wider border-b border-[#222222]/5 pb-4">
                Delivery Tracker
              </h3>

              <div className="relative pl-6 sm:pl-0 grid grid-cols-1 sm:grid-cols-5 gap-6 sm:gap-4">
                {steps.map((step, idx) => {
                  const stepStatus = getStepStatus(step.key, order.status, order.statusHistory);
                  const stepDate = getStepDate(step.key, order.statusHistory);
                  const Icon = step.icon;

                  return (
                    <div key={step.key} className="flex sm:flex-col items-start sm:items-center text-left sm:text-center relative">
                      {/* Connector Line (Desktop) */}
                      {idx < steps.length - 1 && (
                        <div className="hidden sm:block absolute left-[50%] right-[-50%] top-6 h-0.5 bg-[#222222]/5 -z-1">
                          <div
                            className={`h-full bg-[#E56717] transition-all duration-300 ${
                              stepStatus === 'completed' ? 'w-full' : 'w-0'
                            }`}
                          />
                        </div>
                      )}

                      {/* Icon Circle */}
                      <div
                        className={`w-12 h-12 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${
                          stepStatus === 'completed'
                            ? 'bg-[#E56717] border-[#E56717] text-white shadow-md'
                            : stepStatus === 'active'
                            ? 'bg-[#FFF8F2] border-[#E56717] text-[#E56717]'
                            : 'bg-white border-[#222222]/10 text-[#6B7280]'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      {/* Label and Info */}
                      <div className="ml-4 sm:ml-0 sm:mt-3 space-y-1">
                        <h4 className="text-[14px] font-bold tracking-wide uppercase">{step.label}</h4>
                        {stepDate && <p className="text-[11px] font-bold text-[#E56717]">{stepDate}</p>}
                        <p className="text-[11px] text-[#6B7280] leading-relaxed hidden sm:block">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Address & Invoice Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Shipping address details */}
              <div className="bg-white border border-[#222222]/5 p-6 rounded-[24px] shadow-sm space-y-4">
                <h4 className="text-[15px] font-bold uppercase tracking-wider border-b border-[#222222]/5 pb-3">
                  Shipping Address
                </h4>
                <div className="text-[14px] leading-relaxed space-y-1">
                  <p className="font-bold text-[#222222]">{order.shippingName}</p>
                  <p className="text-[#6B7280]">{order.shippingStreet}</p>
                  <p className="text-[#6B7280]">
                    {order.shippingLga}, {order.shippingState} State
                  </p>
                  <p className="text-[#6B7280] font-semibold mt-2">{order.shippingPhone}</p>
                  <p className="text-[#6B7280] text-[13px]">{order.shippingEmail}</p>
                </div>
              </div>

              {/* Order total card */}
              <div className="bg-white border border-[#222222]/5 p-6 rounded-[24px] shadow-sm space-y-4 flex flex-col justify-between">
                <div>
                  <h4 className="text-[15px] font-bold uppercase tracking-wider border-b border-[#222222]/5 pb-3">
                    Billing Details
                  </h4>
                  <div className="space-y-2 mt-3">
                    <div className="flex justify-between text-[13px] text-[#6B7280]">
                      <span>Subtotal</span>
                      <span>₦{(order.subtotal / 100).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[13px] text-[#6B7280]">
                      <span>Delivery Fee</span>
                      <span>₦{(order.deliveryFee / 100).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="border-t border-[#222222]/5 pt-3 flex justify-between items-center mt-4">
                  <span className="font-bold text-[14px]">Total Paid</span>
                  <span className="font-extrabold text-[#E56717] text-[18px]">
                    ₦{(order.total / 100).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white border border-[#222222]/5 p-6 rounded-[24px] shadow-sm space-y-4">
              <h4 className="text-[15px] font-bold uppercase tracking-wider border-b border-[#222222]/5 pb-3">
                Items In Order
              </h4>
              <div className="divide-y divide-[#222222]/5">
                {order.items.map((item) => {
                  const image = item.variant.images[0]?.url || '/Logo/photo_2023-09-25_16-13-56.jpg';
                  return (
                    <div key={item.id} className="flex gap-4 items-center py-3 first:pt-0 last:pb-0">
                      <div className="w-16 h-16 rounded-[12px] overflow-hidden shrink-0 border border-[#222222]/10 bg-[#FAF7F4]">
                        <img src={image} alt="Hair Bundle" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-[14px] font-bold text-[#222222] truncate">
                          {item.variant.product.name}
                        </h5>
                        <p className="text-[12px] text-[#6B7280] font-semibold uppercase tracking-wider mt-1">
                          Length: {item.variant.attributes.length || 'Default'}" x {item.quantity}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[14px] font-extrabold text-[#E56717]">
                          ₦{((item.unitPrice * item.quantity) / 100).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
