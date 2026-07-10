'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import Link from 'next/link';
import Image from 'next/image';
import { LayoutDashboard, ShoppingBag, Box, ClipboardList, Users, LogOut, Loader, BarChart3 } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, checkMe, logout } = useAuthStore();

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (!isLoginPage) {
      checkMe();
    }
  }, [pathname, isLoginPage, checkMe]);

  useEffect(() => {
    if (!isLoginPage && !loading && (!user || (user.role !== 'ADMIN' && user.role !== 'STAFF'))) {
      router.push('/admin/login');
    }
  }, [user, loading, isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading || (!user || (user.role !== 'ADMIN' && user.role !== 'STAFF'))) {
    return (
      <div className="min-h-screen bg-[#FAF7F4] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-8 h-8 text-[#E56717] animate-spin" />
          <span className="text-[13px] font-bold text-[#6B7280] uppercase tracking-widest">
            Authorizing Secure Access...
          </span>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.push('/admin/login');
  };

  const navItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Products', href: '/admin/products', icon: ShoppingBag },
    { name: 'Inventory', href: '/admin/inventory', icon: Box },
    { name: 'Orders', href: '/admin/orders', icon: ClipboardList },
    { name: 'Customers', href: '/admin/customers', icon: Users },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F4] font-sans text-[#222222] flex flex-col md:flex-row">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-[#222222]/5 p-6 shrink-0 flex flex-col justify-between">
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-2 border-b border-[#222222]/5 pb-4">
            <Image
              src="/Logo/photo_2023-09-25_16-13-56.jpg"
              alt="Hairotic Logo"
              width={40}
              height={40}
              className="h-10 w-auto object-contain"
              priority
            />
            <span className="text-[9px] font-extrabold bg-[#E56717]/10 text-[#E56717] px-2 py-0.5 rounded-[4px] uppercase tracking-wider">
              Staff
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 h-11 rounded-[12px] text-[14px] font-bold tracking-wide uppercase transition-all duration-150 ${
                    isActive
                      ? 'bg-[#E56717] text-white shadow-sm'
                      : 'text-[#6B7280] hover:text-[#222222] hover:bg-[#FAF7F4]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Admin Status & Logout */}
        <div className="mt-8 border-t border-[#222222]/5 pt-4 space-y-4">
          <div className="px-2">
            <p className="text-[12px] font-extrabold text-[#222222] truncate">{user.email}</p>
            <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-wider mt-0.5">
              Role: {user.role}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 h-11 rounded-[12px] text-[14px] font-bold tracking-wide uppercase text-[#EF4444] hover:bg-[#EF4444]/5 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Admin View Content */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8 overflow-x-hidden">
        {children}
      </main>

    </div>
  );
}
