'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { ShoppingBag, User, Heart, Menu, X } from 'lucide-react';

export default function Header() {
  const { items, toggleDrawer } = useCartStore();
  const { user, checkMe } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync user authentication state on mount
  useEffect(() => {
    checkMe().catch(() => {});
  }, [checkMe]);

  // Calculate total quantity of items in cart
  const cartItemCount = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <header className="sticky top-0 bg-[#FFFFFF]/90 backdrop-blur-md border-b border-[#222222]/5 z-50 h-56 transition-all duration-300">
      <div className="w-full px-8 h-full flex items-center justify-between">
        
        {/* Brand identity logo */}
        <Link href="/" className="flex items-center gap-0 select-none -ml-6">
          <Image
            src="/Logo/logo.svg"
            alt="Hairotic Logo"
            width={220}
            height={220}
            className="h-52 w-auto object-contain -mr-10"
            priority
          />
          <span className="font-display text-[36px] tracking-wider text-[#222222] font-black uppercase">
            Hairotic
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-[15px] font-semibold text-[#222222] uppercase tracking-wider">
          <Link href="/shop" className="hover:text-[#E56717] transition-colors duration-200">Shop All</Link>
          <Link href="/collections/best-sellers" className="hover:text-[#E56717] transition-colors duration-200">Bestsellers</Link>
          <Link href="/collections/new-drops" className="hover:text-[#E56717] transition-colors duration-200">New Drops</Link>
          <Link href="/styling" className="hover:text-[#E56717] transition-colors duration-200">Styling</Link>
          <Link href="/admin/login" className="hover:text-[#E56717] transition-colors duration-200">Admin</Link>
        </nav>

        {/* Action Controls & Icons */}
        <div className="flex items-center gap-5">
          
          {/* Wishlist Link */}
          <Link 
            href="/wishlist" 
            className="text-[#222222] hover:text-[#E56717] transition-colors p-1"
            title="Wishlist"
          >
            <Heart className="w-5.5 h-5.5" />
          </Link>

          {/* Account/User Auth Link */}
          <Link 
            href="/account" 
            className="text-[#222222] hover:text-[#E56717] transition-colors p-1 relative"
            title={user ? `Signed in as ${user.email}` : "Sign In / Register"}
          >
            <User className="w-5.5 h-5.5" />
            {user && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-white" />
            )}
          </Link>

          {/* Shopping Bag / Cart Toggle */}
          <button
            onClick={() => toggleDrawer(true)}
            className="text-[#222222] hover:text-[#E56717] transition-colors p-1 relative cursor-pointer"
            title="Shopping Bag"
          >
            <ShoppingBag className="w-5.5 h-5.5" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#E56717] text-white text-[9.5px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border border-white">
                {cartItemCount}
              </span>
            )}
          </button>

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-[#222222] hover:text-[#E56717] p-1 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

        </div>
      </div>

      {/* Mobile Navigation Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-[#222222]/5 py-6 px-6 space-y-4 shadow-lg animate-fadeIn z-40 select-none">
          <Link 
            href="/shop" 
            onClick={() => setMobileMenuOpen(false)}
            className="block text-[15px] font-bold uppercase tracking-wider text-[#222222] hover:text-[#E56717]"
          >
            Shop All
          </Link>
          <Link 
            href="/collections/best-sellers" 
            onClick={() => setMobileMenuOpen(false)}
            className="block text-[15px] font-bold uppercase tracking-wider text-[#222222] hover:text-[#E56717]"
          >
            Bestsellers
          </Link>
          <Link 
            href="/collections/new-drops" 
            onClick={() => setMobileMenuOpen(false)}
            className="block text-[15px] font-bold uppercase tracking-wider text-[#222222] hover:text-[#E56717]"
          >
            New Drops
          </Link>
          <Link 
            href="/styling" 
            onClick={() => setMobileMenuOpen(false)}
            className="block text-[15px] font-bold uppercase tracking-wider text-[#222222] hover:text-[#E56717]"
          >
            Styling
          </Link>
          <Link 
            href="/admin/login" 
            onClick={() => setMobileMenuOpen(false)}
            className="block text-[15px] font-bold uppercase tracking-wider text-[#222222] hover:text-[#E56717]"
          >
            Admin Panel
          </Link>
        </div>
      )}
    </header>
  );
}
