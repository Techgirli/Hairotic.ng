'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { TrendingUp, Download, RefreshCw, Layers } from 'lucide-react';

interface AnalyticsEvent {
  id: string;
  name: string;
  sessionId?: string;
  userId?: string;
  properties: Record<string, unknown>;
  createdAt: string;
}

interface SummaryStats {
  totalRevenue: number;
  totalOrders: number;
  aov: number;
  totalSessions: number;
  cartAddRatio: number;
  popularProducts: {
    id: string;
    name: string;
    views: number;
    unitsSold: number;
  }[];
}

interface FunnelStep {
  name: string;
  count: number;
  percentage: number;
}

interface FunnelData {
  steps: FunnelStep[];
}

export default function AdminAnalyticsPage() {
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [funnel, setFunnel] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const [, startTransition] = useTransition();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, funRes] = await Promise.all([
        fetch(`${API_URL}/analytics/summary`, { credentials: 'include' }),
        fetch(`${API_URL}/analytics/funnel`, { credentials: 'include' }),
      ]);

      if (!sumRes.ok || !funRes.ok) {
        throw new Error('Failed to load metrics registry');
      }

      const sumData = await sumRes.json();
      const funData = await funRes.json();

      setSummary(sumData);
      setFunnel(funData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const res = await fetch(`${API_URL}/analytics/export`, { credentials: 'include' });
      if (!res.ok) throw new Error('Export failed');
      const events: AnalyticsEvent[] = await res.json();

      // Formulate simple CSV
      const headers = ['Event ID', 'Event Name', 'Session ID', 'User ID', 'Properties', 'Created At'];
      const rows = events.map((e) => [
        e.id,
        e.name,
        e.sessionId || '',
        e.userId || '',
        JSON.stringify(e.properties).replace(/"/g, '""'),
        e.createdAt,
      ]);

      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map((r) => r.map((val) => `"${val}"`).join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `hairotic_analytics_dump_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      alert('Failed to export raw events: ' + message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 select-none">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold uppercase tracking-tight">Business Intelligence Analytics</h1>
          <p className="text-[13px] text-[#6B7280]">Review checkout drop-offs, conversion metrics, and popular bundle drops.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => startTransition(() => fetchAnalytics())}
            className="h-10 px-4 border border-[#222222]/5 rounded-[12px] hover:border-[#E56717]/20 hover:bg-[#FAF7F4] text-[#6B7280] hover:text-[#E56717] transition-all cursor-pointer flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          
          <button
            onClick={handleExportCSV}
            disabled={isExporting}
            className="h-10 px-4 bg-[#E56717] hover:bg-[#C65A12] disabled:bg-[#6B7280] text-white rounded-[12px] transition-all cursor-pointer flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 p-4 rounded-[16px] text-[#EF4444] text-[14px] font-bold">
          ⚠️ Failed to fetch operational logs: {error}
        </div>
      )}

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E56717]" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
            Compiling funnel records...
          </span>
        </div>
      ) : (
        summary && funnel && (
          <div className="space-y-8">
            
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Total Revenue */}
              <div className="bg-white border border-[#222222]/5 p-6 rounded-[24px] shadow-sm space-y-2">
                <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">Operational Revenue</span>
                <h3 className="text-[24px] font-extrabold text-[#E56717]">
                  ₦{(summary.totalRevenue / 100).toLocaleString()}
                </h3>
                <p className="text-[11px] text-[#6B7280] font-medium">From {summary.totalOrders} paid sales</p>
              </div>

              {/* AOV */}
              <div className="bg-white border border-[#222222]/5 p-6 rounded-[24px] shadow-sm space-y-2">
                <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">Average Order Value (AOV)</span>
                <h3 className="text-[24px] font-extrabold text-[#222222]">
                  ₦{(summary.aov / 100).toLocaleString()}
                </h3>
                <p className="text-[11px] text-[#6B7280] font-medium">Average basket checkout spend</p>
              </div>

              {/* Cart Add Ratio */}
              <div className="bg-white border border-[#222222]/5 p-6 rounded-[24px] shadow-sm space-y-2">
                <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">Add-to-Bag conversion</span>
                <h3 className="text-[24px] font-extrabold text-[#222222]">
                  {summary.cartAddRatio}%
                </h3>
                <p className="text-[11px] text-[#6B7280] font-medium">Percentage of sessions adding items</p>
              </div>

              {/* Total Sessions */}
              <div className="bg-white border border-[#222222]/5 p-6 rounded-[24px] shadow-sm space-y-2">
                <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">Unique Sessions</span>
                <h3 className="text-[24px] font-extrabold text-[#222222]">
                  {summary.totalSessions}
                </h3>
                <p className="text-[11px] text-[#6B7280] font-medium">Session identifiers logged</p>
              </div>

            </div>

            {/* Funnel Visual Progress Bars & Popular Products */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Checkout Funnel Progress */}
              <div className="bg-white border border-[#222222]/5 p-6 rounded-[24px] shadow-sm space-y-6 lg:col-span-7">
                <div>
                  <h3 className="text-[18px] font-extrabold uppercase tracking-tight text-[#222222] flex items-center gap-2">
                    <Layers className="w-5 h-5 text-[#E56717]" />
                    <span>Shopping Funnel Conversion</span>
                  </h3>
                  <p className="text-[12.5px] text-[#6B7280] mt-0.5">Understand step-by-step buyer drop ratios.</p>
                </div>

                <div className="space-y-6">
                  {funnel.steps.map((step, idx) => {
                    const progressStyle = { width: `${step.percentage}%` };
                    return (
                      <div key={step.name} className="space-y-2">
                        <div className="flex justify-between items-center text-[12.5px]">
                          <span className="font-bold text-[#222222]">
                            {idx + 1}. {step.name}
                          </span>
                          <span className="font-extrabold text-[#E56717]">
                            {step.count} ({step.percentage}%)
                          </span>
                        </div>
                        {/* Progress Bar background wrapper */}
                        <div className="h-3 w-full bg-[#FAF7F4] rounded-full overflow-hidden border border-[#222222]/5">
                          <div
                            style={progressStyle}
                            className="h-full bg-gradient-to-r from-[#E56717] to-[#C65A12] rounded-full transition-all duration-500"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Popular Products views vs sales */}
              <div className="bg-white border border-[#222222]/5 p-6 rounded-[24px] shadow-sm space-y-6 lg:col-span-5">
                <div>
                  <h3 className="text-[18px] font-extrabold uppercase tracking-tight text-[#222222] flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#E56717]" />
                    <span>Popular Catalog Items</span>
                  </h3>
                  <p className="text-[12.5px] text-[#6B7280] mt-0.5">Top products sorted by client engagement.</p>
                </div>

                <div className="divide-y divide-[#222222]/5">
                  {summary.popularProducts.length === 0 ? (
                    <p className="text-[13px] text-center text-[#6B7280] py-8">
                      No interactions recorded in log registries yet.
                    </p>
                  ) : (
                    summary.popularProducts.map((prod) => (
                      <div key={prod.id} className="py-3 first:pt-0 last:pb-0 flex justify-between items-center text-[13px]">
                        <div>
                          <h4 className="font-bold text-[#222222] truncate max-w-xs">{prod.name}</h4>
                          <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-wider block mt-0.5">
                            Views: {prod.views}
                          </span>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-extrabold text-[#E56717]">{prod.unitsSold} sold</span>
                          <span className="text-[10px] text-[#6B7280] block font-medium">completed units</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>
        )
      )}

    </div>
  );
}
