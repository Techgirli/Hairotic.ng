'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { User, MapPin, ShoppingBag, Eye, Plus, Trash2, ShieldAlert, LogOut, KeyRound, Heart } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '../../components/header';
import GoogleLoginButton from '../../components/GoogleLoginButton';
import { useCartStore } from '../../store/cartStore';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';

interface UserData {
  id: string;
  email: string;
  phone: string;
  name?: string;
}

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
  shippingEmail: string;
  items: OrderItem[];
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'orders' | 'wishlist'>('orders');
  
  const { addItem, toggleDrawer } = useCartStore();

  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loadingWishlist, setLoadingWishlist] = useState(false);

  // Google OAuth modal states
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('');
  const [showCustomGoogleEmail, setShowCustomGoogleEmail] = useState(false);

  // Auth Fallback Form States
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  // Profile Edit Form States
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Address Form States
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressLabel, setAddressLabel] = useState('Home');
  const [addressStreet, setAddressStreet] = useState('');
  const [addressState, setAddressState] = useState('Lagos');
  const [addressLga, setAddressLga] = useState('');
  const [addressPhone, setAddressPhone] = useState('');
  const [addressDefault, setAddressDefault] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);

  // Order history state
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const [, startTransition] = useTransition();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  const checkAuth = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/users/me`, { credentials: 'include' });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        setEmail(userData.email || '');
        setPhone(userData.phone || '');
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      const res = await fetch(`${API_URL}/users/me/addresses`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setAddresses(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch(`${API_URL}/orders`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user) {
      fetchAddresses();
      fetchOrders();
      fetchWishlist();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSubmittingAuth(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword }),
        credentials: 'include',
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || 'Login failed');
      }

      setAuthPassword('');
      checkAuth();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      setAuthError(message);
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSubmittingAuth(true);

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword, phone: authPhone }),
        credentials: 'include',
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || 'Registration failed');
      }

      // Log in automatically
      const loginRes = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword }),
        credentials: 'include',
      });

      if (!loginRes.ok) {
        throw new Error('Registration succeeded, but auto-login failed. Please sign in manually.');
      }

      setAuthPassword('');
      checkAuth();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      setAuthError(message);
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleGoogleLoginSuccess = async (idToken: string) => {
    setAuthError(null);
    setIsSubmittingAuth(true);

    let deviceId = typeof window !== 'undefined' ? localStorage.getItem('hairotic_device_id') : null;
    if (!deviceId) {
      deviceId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      if (typeof window !== 'undefined') {
        localStorage.setItem('hairotic_device_id', deviceId);
      }
    }

    try {
      const result = await useAuthStore.getState().loginWithGoogleAction(idToken, deviceId);
      if (result.mfaRequired) {
        router.push(`/verify-otp?email=${encodeURIComponent(result.email || '')}`);
      } else {
        checkAuth();
      }
    } catch (err: any) {
      setAuthError(err.message || 'Google Login failed');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleGoogleLoginError = (errMsg: string) => {
    setAuthError(errMsg);
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
      setUser(null);
      setOrders([]);
      setAddresses([]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);

    try {
      const res = await fetch(`${API_URL}/users/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone }),
        credentials: 'include',
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || 'Failed to update profile settings');
      }

      useToastStore.getState().showToast('Profile updated successfully!', 'success');
      checkAuth();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      useToastStore.getState().showToast(message, 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingAddress(true);

    try {
      const res = await fetch(`${API_URL}/users/me/addresses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: addressLabel,
          street: addressStreet,
          state: addressState,
          lga: addressLga,
          phone: addressPhone,
          isDefault: addressDefault,
        }),
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to save address details');
      }

      setAddressStreet('');
      setAddressLga('');
      setAddressPhone('');
      setAddressDefault(false);
      setShowAddressForm(false);
      fetchAddresses();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      useToastStore.getState().showToast(message, 'error');
    } finally {
      setIsAddingAddress(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    try {
      const res = await fetch(`${API_URL}/users/me/addresses/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to delete address');
      }

      fetchAddresses();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      useToastStore.getState().showToast(message, 'error');
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/users/me/addresses/${id}/default`, {
        method: 'PATCH',
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to update default address');
      }

      fetchAddresses();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      useToastStore.getState().showToast(message, 'error');
    }
  };

  const fetchWishlist = async () => {
    setLoadingWishlist(true);
    try {
      const res = await fetch(`${API_URL}/wishlist`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setWishlist(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingWishlist(false);
    }
  };

  const handleRemoveWishlist = async (variantId: string) => {
    try {
      const res = await fetch(`${API_URL}/wishlist/${variantId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to delete');
      setWishlist((prev) => prev.filter((item) => item.productVariantId !== variantId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMoveToBag = async (variantId: string) => {
    try {
      await addItem(variantId, 1);
      await handleRemoveWishlist(variantId);
      toggleDrawer(true);
    } catch (err) {
      useToastStore.getState().showToast('Failed to move item to bag', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center gap-2 select-none">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E56717]" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
            Reading account credentials...
          </span>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-[#FAF7F4]/30">
        <Header />
        <main className="flex-1 w-full max-w-md mx-auto my-12 bg-white border border-[#222222]/5 p-6 md:p-8 rounded-[32px] shadow-sm select-none">
        
        {/* Auth Tab switcher */}
        <div className="flex gap-1 bg-[#FAF7F4] border border-[#222222]/5 p-1 rounded-[16px] mb-8">
          <button
            onClick={() => setAuthTab('login')}
            className={`flex-1 h-10 rounded-[12px] text-[12px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              authTab === 'login' ? 'bg-white text-[#E56717] shadow-sm' : 'text-[#6B7280] hover:text-[#222222]'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setAuthTab('register')}
            className={`flex-1 h-10 rounded-[12px] text-[12px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              authTab === 'register' ? 'bg-white text-[#E56717] shadow-sm' : 'text-[#6B7280] hover:text-[#222222]'
            }`}
          >
            Create Account
          </button>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-[22px] font-extrabold uppercase tracking-tight text-[#222222]">
            {authTab === 'login' ? 'Welcome Back' : 'Join Hairotic.ng'}
          </h2>
          <p className="text-[13px] text-[#6B7280] mt-1">
            {authTab === 'login'
              ? 'Access your orders ledger, saved addresses, and profile settings.'
              : 'Sign up to track purchases, save default shipping locations, and add reviews.'}
          </p>
        </div>

        {authError && (
          <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 p-4 rounded-[16px] text-[#EF4444] text-[13px] font-bold mb-4 flex items-center gap-2">
            <ShieldAlert className="w-4.5 h-4.5 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        <form onSubmit={authTab === 'login' ? handleLogin : handleRegister} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider">Email Address</label>
            <input
              type="email"
              required
              placeholder="name@example.com"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              className="w-full h-11 px-4 border border-[#222222]/10 rounded-[12px] bg-[#FAF7F4] text-[14px] focus:border-[#E56717] outline-none"
            />
          </div>

          {authTab === 'register' && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider">Phone Number</label>
              <input
                type="tel"
                required
                placeholder="E.g., +2348012345678"
                value={authPhone}
                onChange={(e) => setAuthPhone(e.target.value)}
                className="w-full h-11 px-4 border border-[#222222]/10 rounded-[12px] bg-[#FAF7F4] text-[14px] focus:border-[#E56717] outline-none font-mono"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              className="w-full h-11 px-4 border border-[#222222]/10 rounded-[12px] bg-[#FAF7F4] text-[14px] focus:border-[#E56717] outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmittingAuth}
            className="w-full h-11 bg-[#E56717] hover:bg-[#C65A12] disabled:bg-[#6B7280] text-white text-[13px] font-bold uppercase tracking-widest rounded-[12px] shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            {isSubmittingAuth ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <span>{authTab === 'login' ? 'Sign In Account' : 'Register Account'}</span>
            )}
          </button>
        </form>

        {/* Or Google Auth Divider */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="border-t border-[#222222]/10 w-full"></div>
          <span className="absolute bg-white px-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Or continue with</span>
        </div>

        {/* Google Authentication Button */}
        <GoogleLoginButton
          onSuccess={handleGoogleLoginSuccess}
          onError={handleGoogleLoginError}
          isLoading={isSubmittingAuth}
        />
      </main>
    </div>
  );
}

  // Logged-in Customer Dashboard View
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#FAF7F4]/30">
      <Header />
      <main className="flex-1 w-full max-w-6xl mx-auto py-8 px-4 md:px-0 space-y-8 select-none">
      
      {/* Welcome Banner */}
      <div className="bg-white border border-[#222222]/5 p-6 rounded-[24px] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[#FAF7F4] border border-[#E56717]/20 rounded-full flex items-center justify-center text-[#E56717]">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-[22px] font-extrabold uppercase tracking-tight text-[#222222]">
              Customer Account
            </h1>
            <p className="text-[13px] text-[#6B7280] mt-0.5">
              Logged in as <strong className="text-[#222222] font-semibold">{user.email}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="h-10 px-4 border border-[#EF4444]/10 hover:border-[#EF4444]/20 hover:bg-[#EF4444]/5 text-[#EF4444] rounded-[12px] transition-all cursor-pointer flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Main dashboard navigation layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Navigation Sidebar */}
        <div className="bg-white border border-[#222222]/5 p-4 rounded-[24px] shadow-sm self-start flex flex-row md:flex-col gap-1 overflow-x-auto">
          {([
            { key: 'orders', label: 'Order History', icon: ShoppingBag },
            { key: 'addresses', label: 'Saved Addresses', icon: MapPin },
            { key: 'wishlist', label: 'My Favorites', icon: Heart },
            { key: 'profile', label: 'Security Profile', icon: KeyRound },
          ] as const).map((tab) => {
            const IconComp = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => startTransition(() => setActiveTab(tab.key))}
                className={`w-full h-11 px-4 rounded-[12px] flex items-center gap-3 text-[12px] font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === tab.key
                    ? 'bg-[#FAF7F4] text-[#E56717]'
                    : 'text-[#6B7280] hover:text-[#222222] hover:bg-[#FAF7F4]/50'
                }`}
              >
                <IconComp className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic content cards */}
        <div className="md:col-span-3">
          
          {/* 1. Orders history panel */}
          {activeTab === 'orders' && (
            <div className="bg-white border border-[#222222]/5 p-6 rounded-[24px] shadow-sm space-y-6">
              <div>
                <h3 className="text-[18px] font-extrabold uppercase tracking-tight text-[#222222]">Order History</h3>
                <p className="text-[13px] text-[#6B7280] mt-0.5">Track your packages or browse historic receipts.</p>
              </div>

              {loadingOrders ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#E56717]" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                    Reading purchases log...
                  </span>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-[#222222]/10 rounded-[20px] space-y-3">
                  <p className="text-[13px] text-[#6B7280]">You have not completed any purchases yet.</p>
                  <Link
                    href="/shop"
                    className="inline-block h-9 px-5 bg-[#E56717] hover:bg-[#C65A12] text-white text-[12px] font-bold uppercase tracking-wider rounded-[10px] leading-9 cursor-pointer transition-colors"
                  >
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-[#222222]/5">
                  {orders.map((order) => (
                    <div key={order.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-[#E56717]">{order.orderNumber}</span>
                          <span className={`px-2 py-0.5 rounded-[8px] text-[9px] font-extrabold uppercase tracking-wider ${
                            order.status === 'PAID'
                              ? 'bg-[#22C55E]/10 text-[#22C55E]'
                              : order.status === 'PENDING_PAYMENT'
                              ? 'bg-[#E56717]/10 text-[#E56717]'
                              : 'bg-[#6B7280]/10 text-[#6B7280]'
                          }`}>
                            {order.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#6B7280] mt-1 font-medium">
                          Placed on: {new Date(order.createdAt).toLocaleDateString('en-NG', { dateStyle: 'medium' })}
                        </p>
                        <p className="text-[12.5px] text-[#222222] font-semibold mt-1.5">
                          {order.items.map((i) => `${i.variant.product.name} (x${i.quantity})`).join(', ')}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        <span className="font-extrabold text-[15px] text-[#222222]">
                          ₦{(order.total / 100).toLocaleString()}
                        </span>
                        
                        <Link
                          href={`/orders/track?orderNumber=${order.orderNumber}&email=${encodeURIComponent(order.shippingEmail)}`}
                          className="h-9 px-4 border border-[#222222]/5 hover:border-[#E56717]/20 hover:bg-[#FAF7F4] text-[#6B7280] hover:text-[#E56717] text-[11px] font-bold uppercase tracking-wider rounded-[10px] flex items-center gap-1.5 transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Track Timelines</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 2. Address management panel */}
          {activeTab === 'addresses' && (
            <div className="bg-white border border-[#222222]/5 p-6 rounded-[24px] shadow-sm space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-[18px] font-extrabold uppercase tracking-tight text-[#222222]">Saved Addresses</h3>
                  <p className="text-[13px] text-[#6B7280] mt-0.5">Manage default delivery destination points.</p>
                </div>
                <button
                  onClick={() => setShowAddressForm(!showAddressForm)}
                  className="h-9 px-4 bg-[#E56717] hover:bg-[#C65A12] text-white text-[12px] font-bold uppercase tracking-wider rounded-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>{showAddressForm ? 'Cancel' : 'Add New'}</span>
                </button>
              </div>

              {showAddressForm && (
                <form onSubmit={handleAddAddress} className="bg-[#FAF7F4] p-5 rounded-[20px] border border-[#222222]/5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider">Address Label</label>
                      <input
                        type="text"
                        required
                        placeholder="E.g., Home, Work, Salon"
                        value={addressLabel}
                        onChange={(e) => setAddressLabel(e.target.value)}
                        className="w-full h-10 px-3 border border-[#222222]/10 rounded-[10px] bg-white text-[13px] focus:border-[#E56717] outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider">Phone number at destination</label>
                      <input
                        type="tel"
                        required
                        placeholder="E.g., +2348012345678"
                        value={addressPhone}
                        onChange={(e) => setAddressPhone(e.target.value)}
                        className="w-full h-10 px-3 border border-[#222222]/10 rounded-[10px] bg-white text-[13px] focus:border-[#E56717] outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider">Street Address</label>
                    <input
                      type="text"
                      required
                      placeholder="Street name, flat number..."
                      value={addressStreet}
                      onChange={(e) => setAddressStreet(e.target.value)}
                      className="w-full h-10 px-3 border border-[#222222]/10 rounded-[10px] bg-white text-[13px] focus:border-[#E56717] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider">State</label>
                      <select
                        value={addressState}
                        onChange={(e) => setAddressState(e.target.value)}
                        className="w-full h-10 px-3 border border-[#222222]/10 rounded-[10px] bg-white text-[13px] focus:border-[#E56717] outline-none"
                      >
                        {['Lagos', 'Abuja', 'Rivers', 'Oyo', 'Kano', 'Anambra', 'Edo', 'Delta', 'Kaduna'].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider">Local Government Area (LGA)</label>
                      <input
                        type="text"
                        required
                        placeholder="E.g. Ikeja, Lekki Phase 1"
                        value={addressLga}
                        onChange={(e) => setAddressLga(e.target.value)}
                        className="w-full h-10 px-3 border border-[#222222]/10 rounded-[10px] bg-white text-[13px] focus:border-[#E56717] outline-none"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-[12.5px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addressDefault}
                      onChange={(e) => setAddressDefault(e.target.checked)}
                      className="w-4 h-4 rounded accent-[#E56717]"
                    />
                    <span>Set as default delivery address</span>
                  </label>

                  <button
                    type="submit"
                    disabled={isAddingAddress}
                    className="w-full h-10 bg-[#E56717] hover:bg-[#C65A12] disabled:bg-[#6B7280] text-white text-[12px] font-bold uppercase tracking-widest rounded-[10px] shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    {isAddingAddress ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <span>Save Address</span>
                    )}
                  </button>
                </form>
              )}

              {addresses.length === 0 ? (
                <p className="text-[13px] text-center text-[#6B7280] py-8">
                  No saved addresses found. Add one to speed up checkout.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div key={addr.id} className="border border-[#222222]/5 p-4 rounded-[16px] space-y-2 relative group hover:border-[#E56717]/20 transition-all">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-[10px] text-[#6B7280] uppercase tracking-wider">{addr.label}</span>
                        {addr.isDefault && (
                          <span className="bg-[#22C55E]/10 text-[#22C55E] text-[9px] font-extrabold px-2 py-0.5 rounded-[4px] uppercase tracking-wider">
                            Default
                          </span>
                        )}
                      </div>

                      <p className="font-semibold text-[#222222] text-[13.5px]">{addr.street}</p>
                      <p className="text-[#6B7280] text-[12.5px] font-medium">
                        LGA: {addr.lga}, {addr.state} State
                      </p>
                      <p className="text-[#6B7280] text-[12.5px] font-mono">{addr.phone}</p>

                      <div className="pt-3 border-t border-[#222222]/5 flex justify-between items-center gap-2">
                        {!addr.isDefault && (
                          <button
                            onClick={() => handleSetDefaultAddress(addr.id)}
                            className="text-[10px] font-bold text-[#E56717] hover:underline cursor-pointer"
                          >
                            Set Default
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="p-1.5 text-[#6B7280] hover:text-[#EF4444] hover:bg-[#EF4444]/5 rounded-[6px] transition-colors ml-auto cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. Security Settings/Profile tab */}
          {activeTab === 'profile' && (
            <div className="bg-white border border-[#222222]/5 p-6 rounded-[24px] shadow-sm space-y-6">
              <div>
                <h3 className="text-[18px] font-extrabold uppercase tracking-tight text-[#222222]">Security Profile</h3>
                <p className="text-[13px] text-[#6B7280] mt-0.5">Manage contact parameters and login secrets.</p>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 px-4 border border-[#222222]/10 rounded-[12px] bg-[#FAF7F4] text-[14px] focus:border-[#E56717] outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-11 px-4 border border-[#222222]/10 rounded-[12px] bg-[#FAF7F4] text-[14px] focus:border-[#E56717] outline-none font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="w-full h-11 bg-[#E56717] hover:bg-[#C65A12] disabled:bg-[#6B7280] text-white text-[13px] font-bold uppercase tracking-widest rounded-[12px] shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  {isUpdatingProfile ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <span>Save Contact Changes</span>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* 4. Wishlist / Favorites Panel */}
          {activeTab === 'wishlist' && (
            <div className="bg-white border border-[#222222]/5 p-6 rounded-[24px] shadow-sm space-y-6">
              <div>
                <h3 className="text-[18px] font-extrabold uppercase tracking-tight text-[#222222]">My Favorites</h3>
                <p className="text-[13px] text-[#6B7280] mt-0.5">Manage your saved human hair extensions and wigs.</p>
              </div>

              {loadingWishlist ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#E56717]" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                    Loading your wishlist...
                  </span>
                </div>
              ) : wishlist.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-[#222222]/10 rounded-[20px] space-y-3">
                  <p className="text-[13px] text-[#6B7280]">You have not saved any items yet.</p>
                  <Link
                    href="/shop"
                    className="inline-block h-9 px-5 bg-[#E56717] hover:bg-[#C65A12] text-white text-[12px] font-bold uppercase tracking-wider rounded-[10px] leading-9 cursor-pointer transition-colors"
                  >
                    Browse Catalog
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {wishlist.map((item) => {
                    const variant = item.variant;
                    if (!variant) return null;
                    const priceInNgn = variant.price / 100;
                    const image = variant.images?.[0]?.url || '/Logo/photo_2023-09-25_16-13-56.jpg';

                    return (
                      <div
                        key={item.id}
                        className="group bg-white rounded-[20px] border border-[#222222]/5 p-4 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                      >
                        <div className="space-y-4">
                          <div className="relative h-[180px] rounded-[16px] overflow-hidden bg-[#FAF7F4] border border-[#222222]/5">
                            <img src={image} alt="wishlist unit" className="w-full h-full object-cover" />
                            <button
                              onClick={() => handleRemoveWishlist(item.productVariantId)}
                              className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 hover:bg-[#EF4444] hover:text-white flex items-center justify-center text-gray-500 transition-colors shadow-sm cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-[14px] font-bold text-[#222222] line-clamp-1">{variant.product?.name}</h4>
                            <p className="text-[11px] text-[#6B7280] font-semibold uppercase tracking-wider">
                              {variant.attributes?.length || 'Default'}&quot; Inches | {variant.attributes?.texture || 'Straight'}
                            </p>
                            <span className="text-[14px] font-extrabold text-[#E56717] block">
                              ₦{priceInNgn.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="pt-3 border-t border-[#222222]/5 mt-4">
                          <button
                            onClick={() => handleMoveToBag(item.productVariantId)}
                            className="w-full h-10 bg-[#FAF7F4] hover:bg-[#E56717] text-[#222222] hover:text-white text-[12px] font-bold uppercase tracking-widest rounded-[10px] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Move to Bag</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </main>
  </div>
);
}
