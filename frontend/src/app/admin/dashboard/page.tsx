'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { DollarSign, AlertTriangle, Clock, TrendingUp, ArrowRight, ClipboardList, Box, Users } from 'lucide-react';

interface RecentOrder {
  id: string;
  orderNumber: string;
  shippingName: string;
  shippingEmail: string;
  status: string;
  total: number;
  createdAt: string;
}

interface Stats {
  salesToday: number;
  totalRevenue: number;
  pendingOrdersCount: number;
  lowStockVariantsCount: number;
  recentOrders: RecentOrder[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
        const res = await fetch(`${API_URL}/admin/dashboard`, {
          credentials: 'include',
        });

        if (!res.ok) {
          throw new Error('Failed to load dashboard metrics');
        }

        const data = await res.json();
        setStats(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-white/50 rounded-[8px]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-white border border-[#222222]/5 rounded-[24px]" />
          ))}
        </div>
        <div className="h-64 bg-white border border-[#222222]/5 rounded-[24px]" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 p-6 rounded-[24px] text-[#EF4444] text-[14px] font-bold">
        ⚠️ Failed to compile admin statistics. Reason: {error || 'Unknown Error'}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-[28px] font-extrabold uppercase tracking-tight">Overview Dashboard</h1>
        <p className="text-[13px] text-[#6B7280]">Operational summaries and business metrics.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Revenue */}
        <div className="bg-white border border-[#222222]/5 p-6 rounded-[24px] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Total Revenue</span>
            <h3 className="text-[22px] font-extrabold text-[#E56717]">
              ₦{(stats.totalRevenue / 100).toLocaleString()}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#E56717]/10 flex items-center justify-center text-[#E56717]">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Sales Today */}
        <div className="bg-white border border-[#222222]/5 p-6 rounded-[24px] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Sales Today</span>
            <h3 className="text-[22px] font-extrabold text-[#222222]">
              ₦{(stats.salesToday / 100).toLocaleString()}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#22C55E]/10 flex items-center justify-center text-[#22C55E]">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white border border-[#222222]/5 p-6 rounded-[24px] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Unpaid Cart Checkouts</span>
            <h3 className="text-[22px] font-extrabold text-[#222222]">
              {stats.pendingOrdersCount}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#EF4444]/10 flex items-center justify-center text-[#EF4444]">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Low Stock Alerts */}
        <Link
          href="/admin/inventory"
          className="bg-white border border-[#222222]/5 p-6 rounded-[24px] shadow-sm flex items-center justify-between hover:border-[#E56717]/20 transition-all group"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Low Stock Items</span>
            <h3 className={`text-[22px] font-extrabold ${stats.lowStockVariantsCount > 0 ? 'text-[#EF4444]' : 'text-[#222222]'}`}>
              {stats.lowStockVariantsCount}
            </h3>
          </div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            stats.lowStockVariantsCount > 0
              ? 'bg-[#EF4444]/10 text-[#EF4444] group-hover:scale-105'
              : 'bg-[#FAF7F4] text-[#6B7280]'
          }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
        </Link>
      </div>

      {/* Main Grid: Recent Orders & Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Recent Orders Queue */}
        <div className="lg:col-span-8 bg-white border border-[#222222]/5 rounded-[24px] p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-[#222222]/5 pb-4">
            <h3 className="text-[15px] font-bold uppercase tracking-wider">Incoming Orders Activity</h3>
            <Link href="/admin/orders" className="flex items-center gap-1 text-[11px] font-extrabold text-[#E56717] hover:underline uppercase tracking-widest">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-extrabold uppercase tracking-wider text-[#6B7280] border-b border-[#222222]/5">
                  <th className="pb-3">Reference</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222]/5 text-[13px]">
                {stats.recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-[#6B7280]">
                      No orders placed on store catalog yet.
                    </td>
                  </tr>
                ) : (
                  stats.recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-[#FAF7F4]/50 transition-colors">
                      <td className="py-3.5 font-bold text-[#E56717]">
                        <Link href={`/admin/orders?search=${order.orderNumber}`}>{order.orderNumber}</Link>
                      </td>
                      <td className="py-3.5">
                        <p className="font-semibold">{order.shippingName}</p>
                        <p className="text-[11px] text-[#6B7280]">{order.shippingEmail}</p>
                      </td>
                      <td className="py-3.5">
                        <span className={`inline-block px-2.5 py-0.5 rounded-[12px] text-[10px] font-extrabold uppercase tracking-wider ${
                          order.status === 'PAID'
                            ? 'bg-[#22C55E]/10 text-[#22C55E]'
                            : order.status === 'PENDING_PAYMENT'
                            ? 'bg-[#E56717]/10 text-[#E56717]'
                            : 'bg-[#6B7280]/10 text-[#6B7280]'
                        }`}>
                          {order.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 text-right font-extrabold text-[#E56717]">
                        ₦{(order.total / 100).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Merchandising shortcuts */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-[#222222]/5 rounded-[24px] p-6 shadow-sm space-y-4">
            <h3 className="text-[15px] font-bold uppercase tracking-wider border-b border-[#222222]/5 pb-4">
              Quick Shortcuts
            </h3>
            
            <div className="space-y-3">
              <Link
                href="/admin/products"
                className="flex items-center gap-4 p-3 rounded-[16px] border border-[#222222]/5 hover:border-[#E56717]/20 hover:bg-[#FAF7F4]/50 transition-all group"
              >
                <div className="w-10 h-10 rounded-[12px] bg-[#E56717]/10 flex items-center justify-center text-[#E56717] group-hover:scale-105 transition-transform">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[13px] font-bold uppercase tracking-wider">Catalog Panel</h4>
                  <p className="text-[11px] text-[#6B7280]">Add new drop bundles & manage details.</p>
                </div>
              </Link>

              <Link
                href="/admin/inventory"
                className="flex items-center gap-4 p-3 rounded-[16px] border border-[#222222]/5 hover:border-[#E56717]/20 hover:bg-[#FAF7F4]/50 transition-all group"
              >
                <div className="w-10 h-10 rounded-[12px] bg-[#E56717]/10 flex items-center justify-center text-[#E56717] group-hover:scale-105 transition-transform">
                  <Box className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[13px] font-bold uppercase tracking-wider">Stock Ledger</h4>
                  <p className="text-[11px] text-[#6B7280]">Adjust counts and check thresholds.</p>
                </div>
              </Link>

              <Link
                href="/admin/customers"
                className="flex items-center gap-4 p-3 rounded-[16px] border border-[#222222]/5 hover:border-[#E56717]/20 hover:bg-[#FAF7F4]/50 transition-all group"
              >
                <div className="w-10 h-10 rounded-[12px] bg-[#E56717]/10 flex items-center justify-center text-[#E56717] group-hover:scale-105 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[13px] font-bold uppercase tracking-wider">Customers Registry</h4>
                  <p className="text-[11px] text-[#6B7280]">Write internal notes and calculate LTVs.</p>
                </div>
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
