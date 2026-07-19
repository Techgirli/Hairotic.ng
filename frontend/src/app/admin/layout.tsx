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
  const { user, checkMe, logout } = useAuthStore();
  const [isChecking, setIsChecking] = React.useState(true);

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    const initAuth = async () => {
      if (!isLoginPage) {
        await checkMe();
      }
      setIsChecking(false);
    };
    initAuth();
  }, [pathname, isLoginPage, checkMe]);

  useEffect(() => {
    if (!isLoginPage && !isChecking && (!user || (user.role !== 'ADMIN' && user.role !== 'STAFF'))) {
      router.push('/admin/login');
    }
  }, [user, isChecking, isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isChecking || (!user || (user.role !== 'ADMIN' && user.role !== 'STAFF'))) {
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
      
      {/* Sidebar / Topbar Navigation */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-[#222222]/5 p-4 md:p-6 shrink-0 flex flex-col md:justify-between justify-start gap-4 md:gap-0">
        <div className="space-y-4 md:space-y-8 flex md:flex-col justify-between items-center md:items-stretch w-full">
          {/* Logo */}
          <div className="flex flex-row md:flex-col items-center md:items-start gap-2 md:gap-3">
            <div className="flex items-center gap-0 -ml-2">
              <Image
                src="/Logo/logo.svg"
                alt="Hairotic Logo"
                width={80}
                height={80}
                className="h-16 md:h-30 w-auto object-contain -mr-3 md:-mr-5"
                priority
              />
              <span className="font-display text-[18px] md:text-[22px] tracking-wider uppercase font-black text-[#222222]">
                Hairotic
              </span>
            </div>
            <span className="text-[8px] md:text-[9px] font-extrabold bg-[#E56717]/10 text-[#E56717] px-2 py-0.5 rounded-[4px] uppercase tracking-wider w-max ml-1 hidden md:inline-block">
              Staff Portal
            </span>
          </div>
 
          {/* Navigation Links */}
          <nav className="flex md:flex-col overflow-x-auto md:overflow-visible gap-1 md:gap-1 pb-1 md:pb-0 scrollbar-hide max-w-full">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 h-9 md:h-11 rounded-[10px] md:rounded-[12px] text-[12px] md:text-[14px] font-bold tracking-wide uppercase transition-all duration-150 shrink-0 ${
                    isActive
                      ? 'bg-[#E56717] text-white shadow-sm'
                      : 'text-[#6B7280] hover:text-[#222222] hover:bg-[#FAF7F4]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
 
        {/* Footer Admin Status & Logout */}
        <div className="mt-0 md:mt-8 border-t-0 md:border-t border-[#222222]/5 pt-0 md:pt-4 flex md:flex-col items-center md:items-stretch gap-4 md:gap-4 justify-between w-full md:w-auto">
          <div className="px-2 hidden md:block">
            <p className="text-[12px] font-extrabold text-[#222222] truncate">{user.email}</p>
            <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-wider mt-0.5">
              Role: {user.role}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 md:gap-3 px-3 md:px-4 h-9 md:h-11 rounded-[10px] md:rounded-[12px] text-[12px] md:text-[14px] font-bold tracking-wide uppercase text-[#EF4444] hover:bg-[#EF4444]/5 transition-colors cursor-pointer shrink-0"
          >
            <LogOut className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />
            <span className="hidden md:inline">Sign Out</span>
            <span className="md:hidden">Logout</span>
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
