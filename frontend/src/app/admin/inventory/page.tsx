'use client';

import React, { useEffect, useState } from 'react';
import { Box, AlertTriangle, ArrowRightLeft, CheckCircle2 } from 'lucide-react';

interface Variant {
  id: string;
  sku: string;
  price: number;
  attributes: { length?: string; texture?: string };
  product: {
    name: string;
  };
  inventory: {
    quantity: number;
    lowStockThreshold: number;
    updatedAt: string;
  } | null;
}

export default function AdminInventoryPage() {
  const [inventoryList, setInventoryList] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stock update modal states
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [newQuantity, setNewQuantity] = useState('');
  const [reasonCode, setReasonCode] = useState('RESTOCK');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/inventory`, {
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('Failed to load inventory counts');
      }
      const data = await res.json();
      setInventoryList(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdjustClick = (v: Variant) => {
    setSelectedVariant(v);
    setNewQuantity(v.inventory ? v.inventory.quantity.toString() : '0');
    setReasonCode('RESTOCK');
    setShowAdjustModal(true);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariant) return;

    if (newQuantity === '') {
      alert('Please specify a stock count quantity.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/admin/inventory/${selectedVariant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity: parseInt(newQuantity),
          reason: reasonCode,
        }),
        credentials: 'include',
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || 'Failed to adjust inventory level.');
      }

      setShowAdjustModal(false);
      setSelectedVariant(null);
      fetchInventory();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 select-none">
      
      {/* Title */}
      <div>
        <h1 className="text-[28px] font-extrabold uppercase tracking-tight">Stock Inventory Ledger</h1>
        <p className="text-[13px] text-[#6B7280]">Review physical variant levels and adjust counts.</p>
      </div>

      {error && (
        <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 p-4 rounded-[16px] text-[#EF4444] text-[14px] font-bold">
          ⚠️ Failed to load inventory database: {error}
        </div>
      )}

      {/* Stats rolls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border border-[#222222]/5 p-6 rounded-[24px] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Total SKUs</span>
            <h3 className="text-[22px] font-extrabold text-[#222222]">{inventoryList.length}</h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#FAF7F4] flex items-center justify-center text-[#6B7280]">
            <Box className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-[#222222]/5 p-6 rounded-[24px] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Low Stock SKUs</span>
            <h3 className="text-[22px] font-extrabold text-[#EF4444]">
              {inventoryList.filter((v) => v.inventory && v.inventory.quantity <= v.inventory.lowStockThreshold).length}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#EF4444]/10 flex items-center justify-center text-[#EF4444]">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-[#222222]/5 p-6 rounded-[24px] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Total Stock Count</span>
            <h3 className="text-[22px] font-extrabold text-[#22C55E]">
              {inventoryList.reduce((sum, v) => sum + (v.inventory ? v.inventory.quantity : 0), 0)}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#22C55E]/10 flex items-center justify-center text-[#22C55E]">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Grid inventory list */}
      <div className="bg-white border border-[#222222]/5 rounded-[24px] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF7F4] text-[10px] font-extrabold uppercase tracking-wider text-[#6B7280] border-b border-[#222222]/5">
                <th className="py-4 px-6">Product Variant SKU</th>
                <th className="py-4 px-6">Attributes</th>
                <th className="py-4 px-6">Stock Level</th>
                <th className="py-4 px-6">Threshold</th>
                <th className="py-4 px-6">Last Updated</th>
                <th className="py-4 px-6 text-center">Adjust Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222222]/5 text-[13px]">
              {inventoryList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#6B7280]">
                    {loading ? 'Reading stock ledgers...' : 'No inventory data found.'}
                  </td>
                </tr>
              ) : (
                inventoryList.map((v) => {
                  const qty = v.inventory ? v.inventory.quantity : 0;
                  const threshold = v.inventory ? v.inventory.lowStockThreshold : 5;
                  const isLow = qty <= threshold;

                  return (
                    <tr key={v.id} className="hover:bg-[#FAF7F4]/50 transition-colors">
                      <td className="py-4 px-6">
                        <p className="font-extrabold text-[#222222]">{v.product.name}</p>
                        <p className="text-[11px] text-[#6B7280] font-mono mt-0.5">{v.sku}</p>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-semibold text-[#6B7280] text-[12px] uppercase">
                          Length: {String(v.attributes.length || 'Default')}&quot;
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className={`font-extrabold text-[15px] ${isLow ? 'text-[#EF4444]' : 'text-[#222222]'}`}>
                            {qty} units
                          </span>
                          {isLow && (
                            <span className="bg-[#EF4444]/10 text-[#EF4444] text-[9px] font-extrabold px-2 py-0.5 rounded-[4px] uppercase tracking-wider">
                              Low
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-[#6B7280] font-semibold">{threshold} units</td>
                      <td className="py-4 px-6 text-[#6B7280] font-medium">
                        {v.inventory
                          ? new Date(v.inventory.updatedAt).toLocaleDateString('en-NG', {
                              dateStyle: 'medium',
                            })
                          : '—'}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => handleAdjustClick(v)}
                          className="px-3 h-9 border border-[#222222]/5 rounded-[10px] text-[#6B7280] hover:text-[#E56717] hover:border-[#E56717]/20 hover:bg-[#FAF7F4] text-[12px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          <span>Count Adjust</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Inventory Modal */}
      {showAdjustModal && selectedVariant && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in select-none">
          <div className="bg-white rounded-[24px] border border-[#222222]/5 w-full max-w-md shadow-2xl p-6 md:p-8 space-y-6">
            <div className="flex justify-between items-center border-b border-[#222222]/5 pb-4">
              <h2 className="text-[20px] font-extrabold uppercase tracking-wide">Adjust Stock Level</h2>
              <button
                onClick={() => setShowAdjustModal(false)}
                className="p-1 hover:bg-[#FAF7F4] rounded-[8px] cursor-pointer"
              >
                <span className="text-[22px] font-light leading-none text-[#6B7280]">&times;</span>
              </button>
            </div>

            <div className="space-y-1 bg-[#FAF7F4] p-4 rounded-[16px] border border-[#222222]/5">
              <p className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Product Variant</p>
              <h4 className="font-extrabold text-[15px] text-[#222222]">{selectedVariant.product.name}</h4>
              <p className="text-[12px] font-mono text-[#E56717] mt-0.5">{selectedVariant.sku}</p>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider">New Stock Quantity</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(e.target.value)}
                  className="w-full h-11 px-4 border border-[#222222]/10 rounded-[12px] bg-[#FAF7F4] text-[14px] focus:border-[#E56717] outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider">Reason Code</label>
                <select
                  value={reasonCode}
                  onChange={(e) => setReasonCode(e.target.value)}
                  className="w-full h-11 px-3 border border-[#222222]/10 rounded-[12px] bg-[#FAF7F4] text-[14px] focus:border-[#E56717] outline-none"
                >
                  <option value="RESTOCK">Restock (New Shipment)</option>
                  <option value="DAMAGED_GOODS">Damaged Goods (Writedown)</option>
                  <option value="PHYSICAL_COUNT_RECONCILIATION">Physical Audit (Adjustment)</option>
                  <option value="SALES_RETURN">Customer Return (Restock)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-[#222222]/5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="h-11 px-5 border border-[#222222]/10 hover:bg-[#FAF7F4] text-[13px] font-bold uppercase tracking-wider rounded-[12px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-11 px-6 bg-[#E56717] hover:bg-[#C65A12] disabled:bg-[#6B7280] text-white text-[13px] font-bold uppercase tracking-wider rounded-[12px] shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <span>Adjust Stock</span>
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
