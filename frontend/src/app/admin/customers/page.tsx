'use client';

import React, { useEffect, useState } from 'react';
import { Users, Search, RefreshCw, X, MessageSquare, AlertCircle } from 'lucide-react';

interface Address {
  id: string;
  label: string;
  state: string;
  lga: string;
  street: string;
  phone: string;
  isDefault: boolean;
}

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  variant: {
    product: { name: string };
  };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
}

interface CustomerNote {
  id: string;
  note: string;
  createdAt: string;
  admin: {
    email: string;
  };
}

interface CustomerSummary {
  id: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
  orderCount: number;
  ltv: number;
}

interface CustomerDetails extends CustomerSummary {
  addresses: Address[];
  orders: Order[];
  customerNotes: CustomerNote[];
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search filter
  const [search, setSearch] = useState('');

  // Selected Customer details
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [details, setDetails] = useState<CustomerDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Note form state
  const [newNote, setNewNote] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/customers`, {
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('Failed to load customers list');
      }
      const data = await res.json();
      setCustomers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerDetails = async (id: string) => {
    setLoadingDetails(true);
    try {
      const res = await fetch(`${API_URL}/admin/customers/${id}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('Failed to load customer profile details');
      }
      const data = await res.json();
      setDetails(data);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      fetchCustomerDetails(selectedCustomerId);
    } else {
      setDetails(null);
    }
  }, [selectedCustomerId]);

  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !newNote.trim()) return;

    setIsSubmittingNote(true);
    try {
      const res = await fetch(`${API_URL}/admin/customers/${selectedCustomerId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote }),
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to append customer note');
      }

      setNewNote('');
      fetchCustomerDetails(selectedCustomerId);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // Filter local customer list
  const filteredCustomers = customers.filter(
    (c) =>
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  return (
    <div className="space-y-8 select-none">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold uppercase tracking-tight">Customer Registry Ledger</h1>
          <p className="text-[13px] text-[#6B7280]">Browse shoppers, compute LTVs, and keep support notes.</p>
        </div>
        <button
          onClick={fetchCustomers}
          className="h-10 px-4 border border-[#222222]/5 rounded-[12px] hover:border-[#E56717]/20 hover:bg-[#FAF7F4] text-[#6B7280] hover:text-[#E56717] transition-all cursor-pointer flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 p-4 rounded-[16px] text-[#EF4444] text-[14px] font-bold">
          ⚠️ Failed to fetch customer directory: {error}
        </div>
      )}

      {/* Toolbar filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
        <div className="bg-white border border-[#222222]/5 p-6 rounded-[24px] shadow-sm flex items-center gap-3 w-full sm:max-w-xs">
          <div className="w-9 h-9 rounded-full bg-[#FAF7F4] flex items-center justify-center text-[#6B7280]">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">shopper directory</span>
            <h4 className="font-extrabold text-[15px]">{customers.length} Shoppers</h4>
          </div>
        </div>

        {/* Text Search Form */}
        <div className="flex gap-2 w-full sm:max-w-xs shrink-0 self-center">
          <input
            type="text"
            placeholder="Search email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 h-10 px-4 border border-[#222222]/10 rounded-[12px] bg-white text-[13px] outline-none focus:border-[#E56717]"
          />
          <div className="h-10 w-10 border border-[#222222]/10 rounded-[12px] flex items-center justify-center text-[#6B7280]">
            <Search className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Customer registry table */}
      <div className="bg-white border border-[#222222]/5 rounded-[24px] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF7F4] text-[10px] font-extrabold uppercase tracking-wider text-[#6B7280] border-b border-[#222222]/5">
                <th className="py-4 px-6">Customer Email</th>
                <th className="py-4 px-6">Phone Number</th>
                <th className="py-4 px-6">Registered Date</th>
                <th className="py-4 px-6 text-center">Completed Orders</th>
                <th className="py-4 px-6 text-right">Lifetime Value (LTV)</th>
                <th className="py-4 px-6 text-center">Manage notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222222]/5 text-[13px]">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#6B7280]">
                    {loading ? 'Reading customer databases...' : 'No customers matched queries.'}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-[#FAF7F4]/50 transition-colors">
                    <td className="py-4 px-6 font-bold text-[#222222]">{c.email}</td>
                    <td className="py-4 px-6 font-mono text-[#6B7280]">{c.phone}</td>
                    <td className="py-4 px-6 text-[#6B7280] font-medium">
                      {new Date(c.createdAt).toLocaleDateString('en-NG', { dateStyle: 'medium' })}
                    </td>
                    <td className="py-4 px-6 text-center font-bold text-[#6B7280]">{c.orderCount} Order(s)</td>
                    <td className="py-4 px-6 text-right font-extrabold text-[#E56717]">
                      ₦{(c.ltv / 100).toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => setSelectedCustomerId(c.id)}
                        className="px-3 h-8 border border-[#222222]/5 hover:border-[#E56717]/20 hover:bg-[#FAF7F4] text-[#6B7280] hover:text-[#E56717] text-[11px] font-bold uppercase tracking-wider rounded-[8px] transition-all cursor-pointer"
                      >
                        Manage notes
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Side-drawer */}
      {selectedCustomerId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex justify-end z-40 select-none animate-fade-in">
          <div className="bg-white border-l border-[#222222]/5 w-full max-w-xl h-full flex flex-col shadow-2xl p-6 md:p-8 animate-slide-in">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-[#222222]/5 pb-4 shrink-0">
              <div>
                <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">shoppers workspace</span>
                <h3 className="text-[18px] font-extrabold text-[#222222] mt-0.5">{details?.email || 'Loading Profile...'}</h3>
              </div>
              <button
                onClick={() => setSelectedCustomerId(null)}
                className="p-2 border border-[#222222]/5 rounded-[12px] hover:bg-[#FAF7F4] text-[#6B7280] hover:text-[#222222] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingDetails ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E56717]" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                  Loading Profile Logs...
                </span>
              </div>
            ) : (
              details && (
                <div className="flex-1 overflow-y-auto py-6 pr-1 space-y-8">
                  
                  {/* Spend info */}
                  <div className="grid grid-cols-2 gap-4 bg-[#FAF7F4] p-4 rounded-[20px] border border-[#222222]/5">
                    <div>
                      <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">lifetime value (LTV)</p>
                      <h4 className="text-[18px] font-extrabold text-[#E56717] mt-0.5">
                        ₦{(details.ltv / 100).toLocaleString()}
                      </h4>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">completed purchases</p>
                      <h4 className="text-[18px] font-extrabold text-[#222222] mt-0.5">
                        {details.orderCount} purchases
                      </h4>
                    </div>
                  </div>

                  {/* Private Staff Notes Section */}
                  <div className="space-y-4">
                    <h4 className="text-[13px] font-bold uppercase tracking-wider text-[#6B7280] border-b border-[#222222]/5 pb-1 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-[#E56717]" />
                      <span>Internal staff notes</span>
                    </h4>

                    {/* Form */}
                    <form onSubmit={handleNoteSubmit} className="space-y-3">
                      <textarea
                        rows={2}
                        required
                        placeholder="Append profile complaint records, preference logs, etc."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        className="w-full p-3 border border-[#222222]/10 rounded-[12px] bg-[#FAF7F4] text-[13px] focus:border-[#E56717] outline-none resize-none"
                      />
                      <button
                        type="submit"
                        disabled={isSubmittingNote}
                        className="w-full h-10 bg-[#E56717] hover:bg-[#C65A12] disabled:bg-[#6B7280] text-white text-[12px] font-bold uppercase tracking-widest rounded-[10px] shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isSubmittingNote ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        ) : (
                          <span>Submit Internal Note</span>
                        )}
                      </button>
                    </form>

                    {/* Notes lists */}
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {details.customerNotes.length === 0 ? (
                        <p className="text-[12px] text-center text-[#6B7280] py-2">
                          No internal notes recorded on this profile.
                        </p>
                      ) : (
                        details.customerNotes.map((note) => (
                          <div key={note.id} className="bg-white border border-[#222222]/5 p-3 rounded-[12px] space-y-1">
                            <p className="text-[12.5px] text-[#222222] leading-relaxed">{note.note}</p>
                            <div className="flex justify-between items-center text-[10px] text-[#6B7280] font-semibold pt-1 border-t border-[#222222]/5">
                              <span>By: {note.admin.email}</span>
                              <span>
                                {new Date(note.createdAt).toLocaleDateString('en-NG', {
                                  dateStyle: 'medium',
                                })}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Shipping Addresses details */}
                  <div className="space-y-3">
                    <h4 className="text-[13px] font-bold uppercase tracking-wider text-[#6B7280] border-b border-[#222222]/5 pb-1">
                      Saved Addresses ({details.addresses.length})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {details.addresses.length === 0 ? (
                        <p className="text-[12px] text-[#6B7280] col-span-2 text-center py-2">
                          No shipping addresses stored.
                        </p>
                      ) : (
                        details.addresses.map((addr) => (
                          <div key={addr.id} className="bg-white border border-[#222222]/5 p-4 rounded-[16px] text-[13px] space-y-1 relative">
                            <div className="flex justify-between items-center">
                              <span className="font-bold uppercase text-[10px] text-[#6B7280]">{addr.label}</span>
                              {addr.isDefault && (
                                <span className="bg-[#22C55E]/10 text-[#22C55E] text-[9px] font-extrabold px-2 py-0.5 rounded-[4px] uppercase tracking-wider">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="font-semibold text-[#222222] mt-1">{addr.street}</p>
                            <p className="text-[#6B7280] text-[12px]">
                              {addr.lga}, {addr.state} State
                            </p>
                            <p className="font-bold text-[#6B7280] text-[12px] pt-1">{addr.phone}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Customer Purchase log history */}
                  <div className="space-y-3">
                    <h4 className="text-[13px] font-bold uppercase tracking-wider text-[#6B7280] border-b border-[#222222]/5 pb-1">
                      Purchase History Logs ({details.orders.length})
                    </h4>
                    <div className="divide-y divide-[#222222]/5">
                      {details.orders.length === 0 ? (
                        <p className="text-[12px] text-center text-[#6B7280] py-2">
                          No order history matching customer.
                        </p>
                      ) : (
                        details.orders.map((ord) => (
                          <div key={ord.id} className="flex justify-between items-center py-2.5 first:pt-0 last:pb-0 text-[13px]">
                            <div>
                              <p className="font-bold text-[#E56717]">{ord.orderNumber}</p>
                              <p className="text-[11px] text-[#6B7280] mt-0.5">
                                {new Date(ord.createdAt).toLocaleDateString('en-NG', {
                                  dateStyle: 'medium',
                                })}{' '}
                                •{' '}
                                <span className="font-extrabold uppercase text-[10px] text-[#6B7280]">
                                  {ord.status.replace('_', ' ')}
                                </span>
                              </p>
                            </div>
                            <span className="font-extrabold text-[#E56717]">
                              ₦{(ord.total / 100).toLocaleString()}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              )
            )}
          </div>
        </div>
      )}

    </div>
  );
}
