'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { Search, RefreshCw, X, ChevronRight } from 'lucide-react';

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  variant: {
    sku: string;
    attributes: { length?: string; texture?: string };
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
  changedBy: string;
  createdAt: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customerId: string | null;
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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtering states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Selected Order for Detail Slide-out Drawer
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Status transition notes / states
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Refund popup state
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [isRefunding, setIsRefunding] = useState(false);

  const [, startTransition] = useTransition();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const statusParam = statusFilter ? `?status=${statusFilter}` : '';
      const searchParam = search ? `${statusFilter ? '&' : '?'}search=${encodeURIComponent(search)}` : '';
      
      const res = await fetch(`${API_URL}/admin/orders${statusParam}${searchParam}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('Failed to load orders list');
      }
      const data = await res.json();
      setOrders(data);

      // Keep detail drawer updated with fresh details
      if (selectedOrder) {
        const fresh = data.find((o: Order) => o.id === selectedOrder.id);
        if (fresh) setSelectedOrder(fresh);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleStatusChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !newStatus) return;

    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`${API_URL}/admin/orders/${selectedOrder.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          note: statusNote || undefined,
        }),
        credentials: 'include',
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || 'Failed to update order status');
      }

      setStatusNote('');
      setNewStatus('');
      fetchOrders();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      alert(message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !refundReason) return;

    setIsRefunding(true);
    try {
      const res = await fetch(`${API_URL}/admin/orders/${selectedOrder.id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: refundReason,
        }),
        credentials: 'include',
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || 'Failed to process refund transaction');
      }

      setShowRefundModal(false);
      setRefundReason('');
      fetchOrders();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      alert(message);
    } finally {
      setIsRefunding(false);
    }
  };

  return (
    <div className="space-y-8 select-none">
      
      {/* Header block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold uppercase tracking-tight">Orders Ledger Workspace</h1>
          <p className="text-[13px] text-[#6B7280]">Process shipping timelines, verify webhooks, and issue refunds.</p>
        </div>
        <button
          onClick={fetchOrders}
          className="h-10 px-4 border border-[#222222]/5 rounded-[12px] hover:border-[#E56717]/20 hover:bg-[#FAF7F4] text-[#6B7280] hover:text-[#E56717] transition-all cursor-pointer flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 p-4 rounded-[16px] text-[#EF4444] text-[14px] font-bold">
          ⚠️ Failed to fetch orders log: {error}
        </div>
      )}

      {/* Workspace search & filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
        
        {/* Filters tabs */}
        <div className="flex gap-1 bg-[#FAF7F4] border border-[#222222]/5 p-1 rounded-[16px] overflow-x-auto self-start">
          {[
            { key: '', label: 'All Orders' },
            { key: 'PENDING_PAYMENT', label: 'Unpaid' },
            { key: 'PAID', label: 'Paid' },
            { key: 'PROCESSING', label: 'Processing' },
            { key: 'SHIPPED', label: 'Shipped' },
            { key: 'DELIVERED', label: 'Delivered' },
            { key: 'REFUNDED', label: 'Refunded' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => startTransition(() => setStatusFilter(tab.key))}
              className={`h-9 px-4 rounded-[12px] text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === tab.key
                  ? 'bg-white text-[#E56717] shadow-sm'
                  : 'text-[#6B7280] hover:text-[#222222]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Text Search Form */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full sm:max-w-xs shrink-0">
          <input
            type="text"
            placeholder="Search Reference or Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 h-10 px-4 border border-[#222222]/10 rounded-[12px] bg-white text-[13px] outline-none focus:border-[#E56717]"
          />
          <button
            type="submit"
            className="h-10 px-4 bg-white border border-[#222222]/10 hover:border-[#E56717]/20 rounded-[12px] text-[#6B7280] hover:text-[#E56717] transition-all cursor-pointer"
          >
            <Search className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Orders Grid/Table */}
      <div className="bg-white border border-[#222222]/5 rounded-[24px] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF7F4] text-[10px] font-extrabold uppercase tracking-wider text-[#6B7280] border-b border-[#222222]/5">
                <th className="py-4 px-6">Order Reference</th>
                <th className="py-4 px-6">Customer Details</th>
                <th className="py-4 px-6">Created Date</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Total Price</th>
                <th className="py-4 px-6 text-center">Detail view</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222222]/5 text-[13px]">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#6B7280]">
                    {loading ? 'Fetching orders registry...' : 'No orders matched criteria.'}
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-[#FAF7F4]/50 transition-colors">
                    <td className="py-4 px-6 font-extrabold text-[#E56717]">{o.orderNumber}</td>
                    <td className="py-4 px-6">
                      <p className="font-semibold">{o.shippingName}</p>
                      <p className="text-[11px] text-[#6B7280]">{o.shippingPhone}</p>
                    </td>
                    <td className="py-4 px-6 text-[#6B7280] font-medium">
                      {new Date(o.createdAt).toLocaleDateString('en-NG', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-block px-2.5 py-0.5 rounded-[12px] text-[10px] font-extrabold uppercase tracking-wider ${
                        o.status === 'PAID'
                          ? 'bg-[#22C55E]/10 text-[#22C55E]'
                          : o.status === 'PENDING_PAYMENT'
                          ? 'bg-[#E56717]/10 text-[#E56717]'
                          : o.status === 'REFUNDED'
                          ? 'bg-[#EF4444]/10 text-[#EF4444]'
                          : 'bg-[#6B7280]/10 text-[#6B7280]'
                      }`}>
                        {o.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right font-extrabold text-[#E56717]">
                      ₦{(o.total / 100).toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="p-1.5 border border-[#222222]/5 rounded-[8px] hover:border-[#E56717]/20 text-[#6B7280] hover:text-[#E56717] hover:bg-[#FAF7F4] transition-all cursor-pointer inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider"
                      >
                        <span>Manage</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Order Detail Side-drawer */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex justify-end z-40 select-none">
          <div className="bg-white border-l border-[#222222]/5 w-full max-w-xl h-full flex flex-col shadow-2xl p-6 md:p-8 animate-slide-in">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-[#222222]/5 pb-4 shrink-0">
              <div>
                <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Order Management</span>
                <h3 className="text-[20px] font-extrabold text-[#E56717] mt-0.5">{selectedOrder.orderNumber}</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 border border-[#222222]/5 rounded-[12px] hover:bg-[#FAF7F4] text-[#6B7280] hover:text-[#222222] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable details */}
            <div className="flex-1 overflow-y-auto py-6 pr-1 space-y-8">
              
              {/* Status Action Block */}
              <div className="bg-[#FAF7F4] p-5 rounded-[24px] border border-[#222222]/5 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[13px] font-bold uppercase tracking-wider">Update Order Status</span>
                  {['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(selectedOrder.status) && (
                    <button
                      onClick={() => setShowRefundModal(true)}
                      className="px-3 h-8 border border-[#EF4444]/20 hover:bg-[#EF4444]/5 text-[#EF4444] text-[11px] font-bold uppercase tracking-widest rounded-[8px] transition-colors cursor-pointer"
                    >
                      Process Refund
                    </button>
                  )}
                </div>

                <form onSubmit={handleStatusChangeSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <select
                      value={newStatus}
                      required
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="h-10 px-3 border border-[#222222]/10 rounded-[10px] bg-white text-[13px] focus:border-[#E56717] outline-none"
                    >
                      <option value="">Choose Transition Status</option>
                      <option value="PROCESSING">Processing (Inventory Soft-holds Confirmed)</option>
                      <option value="SHIPPED">Shipped (Dispatched to courier)</option>
                      <option value="DELIVERED">Delivered (Handover complete)</option>
                      <option value="CANCELLED">Cancelled (Void payment/no stock)</option>
                    </select>
                    
                    <input
                      type="text"
                      placeholder="Status change comments/notes..."
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      className="h-10 px-4 border border-[#222222]/10 rounded-[10px] bg-white text-[13px] focus:border-[#E56717] outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isUpdatingStatus}
                    className="w-full h-10 bg-[#E56717] hover:bg-[#C65A12] disabled:bg-[#6B7280] text-white text-[12px] font-bold uppercase tracking-widest rounded-[10px] shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isUpdatingStatus ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <span>Apply Transition</span>
                    )}
                  </button>
                </form>
              </div>

              {/* Shipping Information */}
              <div className="space-y-3">
                <h4 className="text-[13px] font-bold uppercase tracking-wider text-[#6B7280] border-b border-[#222222]/5 pb-1">
                  Customer & Shipping Address
                </h4>
                <div className="text-[13.5px] leading-relaxed grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Receiver</p>
                    <p className="font-bold text-[#222222] mt-0.5">{selectedOrder.shippingName}</p>
                    <p className="font-semibold text-[#6B7280] mt-1">{selectedOrder.shippingPhone}</p>
                    <p className="text-[#6B7280] text-[12px] mt-0.5">{selectedOrder.shippingEmail}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Destination</p>
                    <p className="text-[#6B7280] mt-0.5">{selectedOrder.shippingStreet}</p>
                    <p className="text-[#6B7280] font-semibold">
                      LGA: {selectedOrder.shippingLga}, {selectedOrder.shippingState} State
                    </p>
                  </div>
                </div>
              </div>

              {/* Items Summary list */}
              <div className="space-y-3">
                <h4 className="text-[13px] font-bold uppercase tracking-wider text-[#6B7280] border-b border-[#222222]/5 pb-1">
                  Line Items ({selectedOrder.items.length})
                </h4>
                <div className="divide-y divide-[#222222]/5">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex gap-4 items-center py-2.5 first:pt-0 last:pb-0">
                      <div className="w-12 h-12 rounded-[8px] overflow-hidden shrink-0 border border-[#222222]/10 bg-[#FAF7F4]">
                        <img
                          src={item.variant.images[0]?.url || '/Logo/photo_2023-09-25_16-13-56.jpg'}
                          alt="product"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-[13px] font-bold text-[#222222] truncate">
                          {item.variant.product.name}
                        </h5>
                        <p className="text-[11px] text-[#6B7280] font-semibold uppercase tracking-wider mt-0.5">
                          Length: {item.variant.attributes.length || 'Default'}&quot; x {item.quantity}
                        </p>
                      </div>
                      <span className="text-[13px] font-extrabold text-[#E56717] shrink-0">
                        ₦{((item.unitPrice * item.quantity) / 100).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t border-[#222222]/5 pt-4 space-y-2 text-[13.5px]">
                <div className="flex justify-between text-[#6B7280]">
                  <span>Subtotal</span>
                  <span>₦{(selectedOrder.subtotal / 100).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[#6B7280]">
                  <span>Delivery Fee</span>
                  <span>₦{(selectedOrder.deliveryFee / 100).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center border-t border-[#222222]/5 pt-3">
                  <span className="font-bold">Total Grand</span>
                  <span className="font-extrabold text-[#E56717] text-[16px]">
                    ₦{(selectedOrder.total / 100).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Stepper Status history timeline */}
              <div className="space-y-4">
                <h4 className="text-[13px] font-bold uppercase tracking-wider text-[#6B7280] border-b border-[#222222]/5 pb-1">
                  History Logs Timeline
                </h4>
                <div className="space-y-4 pl-3">
                  {selectedOrder.statusHistory.map((h, index) => (
                    <div key={h.id} className="relative flex gap-4 text-[12.5px]">
                      {/* Timeline dot */}
                      <div className="relative flex flex-col items-center">
                        <div className="w-2.5 h-2.5 bg-[#E56717] rounded-full mt-1.5" />
                        {index < selectedOrder.statusHistory.length - 1 && (
                          <div className="w-0.5 h-full bg-[#222222]/10 absolute top-4 bottom-0" />
                        )}
                      </div>
                      <div className="space-y-0.5 pb-2">
                        <h5 className="font-bold uppercase tracking-wide text-[#222222]">
                          {h.status.replace('_', ' ')}
                        </h5>
                        <p className="text-[#6B7280] font-light leading-relaxed">{h.note}</p>
                        <p className="text-[10px] text-[#6B7280] font-semibold mt-1">
                          By: {h.changedBy} •{' '}
                          {new Date(h.createdAt).toLocaleDateString('en-NG', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Paystack Refund Confirmation Modal */}
      {showRefundModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in select-none">
          <div className="bg-white rounded-[24px] border border-[#222222]/5 w-full max-w-md shadow-2xl p-6 md:p-8 space-y-6">
            <div className="flex justify-between items-center border-b border-[#222222]/5 pb-4">
              <h2 className="text-[20px] font-extrabold uppercase tracking-wide text-[#EF4444]">Confirm Order Refund</h2>
              <button
                onClick={() => setShowRefundModal(false)}
                className="p-1 hover:bg-[#FAF7F4] rounded-[8px] cursor-pointer"
              >
                <X className="w-5 h-5 text-[#6B7280]" />
              </button>
            </div>

            <p className="text-[13.5px] text-[#6B7280] leading-relaxed">
              You are about to initiate a full transaction refund of{' '}
              <strong className="text-[#222222]">₦{(selectedOrder.total / 100).toLocaleString()}</strong> through
              Paystack. This will update the order status to REFUNDED and release inventory holds.
            </p>

            <form onSubmit={handleRefundSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider">Refund Reason</label>
                <input
                  type="text"
                  required
                  placeholder="E.g., Stock discrepancy, customer cancellation..."
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full h-11 px-4 border border-[#222222]/10 rounded-[12px] bg-[#FAF7F4] text-[14px] focus:border-[#E56717] outline-none"
                />
              </div>

              <div className="pt-4 border-t border-[#222222]/5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRefundModal(false)}
                  className="h-11 px-5 border border-[#222222]/10 hover:bg-[#FAF7F4] text-[13px] font-bold uppercase tracking-wider rounded-[12px] cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isRefunding}
                  className="h-11 px-6 bg-[#EF4444] hover:bg-[#D32F2F] disabled:bg-[#6B7280] text-white text-[13px] font-bold uppercase tracking-wider rounded-[12px] shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isRefunding ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <span>Confirm Full Refund</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
