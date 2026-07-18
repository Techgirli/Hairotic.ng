'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { ShoppingBag, User, Heart, Menu, X, ChevronDown } from 'lucide-react';

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
    <header className="sticky top-0 bg-[#FFFFFF]/90 backdrop-blur-md border-b border-[#222222]/5 z-50 h-16 transition-all duration-300">
      <div className="w-full px-8 h-full flex items-center justify-between">
        
        {/* Brand identity logo */}
        <Link href="/" className="flex items-center gap-2 select-none relative">
          <Image
            src="/Logo/logo.svg"
            alt="Hairotic Logo"
            width={96}
            height={96}
            className="h-20 md:h-24 w-auto object-contain relative -bottom-2 z-20 hover:scale-105 transition-transform duration-200"
            priority
          />
          <span className="font-display text-[22px] tracking-wider text-[#222222] font-black uppercase">
            Hairotic
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-[15px] font-semibold text-[#222222] uppercase tracking-wider">
          <Link href="/" className="hover:text-[#E56717] transition-colors duration-200">Home</Link>
          <Link href="/shop?categorySlug=wigs" className="hover:text-[#E56717] transition-colors duration-200">Wigs</Link>
          
          {/* Interactive Collections Dropdown */}
          <div className="relative group py-2">
            <button className="hover:text-[#E56717] transition-colors duration-200 flex items-center gap-1 uppercase tracking-wider font-semibold text-[15px] cursor-pointer">
              <span>Collections</span>
              <ChevronDown className="w-4 h-4 transition-transform duration-200 group-hover:rotate-180" />
            </button>
            {/* Hover bridge container — eliminates the gap so the dropdown doesn't disappear */}
            <div className="absolute top-[80%] left-0 pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="bg-white border border-[#222222]/5 shadow-2xl rounded-[16px] py-3 px-5 min-w-[200px] flex flex-col gap-2">
                <Link href="/shop?categorySlug=wigs" className="hover:text-[#E56717] text-[14px] text-gray-700 font-semibold py-1 transition-colors block">Wigs</Link>
                <Link href="/shop?categorySlug=bundle" className="hover:text-[#E56717] text-[14px] text-gray-700 font-semibold py-1 transition-colors block">Bundles</Link>
                <Link href="/shop?categorySlug=extensions" className="hover:text-[#E56717] text-[14px] text-gray-700 font-semibold py-1 transition-colors block">Extensions</Link>
                <Link href="/styling" className="hover:text-[#E56717] text-[14px] text-gray-700 font-semibold py-1 transition-colors block">Styling</Link>
              </div>
            </div>
          </div>

          <Link href="/styling" className="hover:text-[#E56717] transition-colors duration-200">Styling</Link>
          <Link href="/contact" className="hover:text-[#E56717] transition-colors duration-200">Contact</Link>
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
        <div className="md:hidden absolute top-16 left-0 w-full bg-white border-b border-[#222222]/5 py-6 px-6 space-y-4 shadow-lg animate-fadeIn z-40 select-none">
          <Link 
            href="/" 
            onClick={() => setMobileMenuOpen(false)}
            className="block text-[15px] font-bold uppercase tracking-wider text-[#222222] hover:text-[#E56717]"
          >
            Home
          </Link>
          <Link 
            href="/shop?categorySlug=wigs" 
            onClick={() => setMobileMenuOpen(false)}
            className="block text-[15px] font-bold uppercase tracking-wider text-[#222222] hover:text-[#E56717]"
          >
            Wigs
          </Link>
          {/* Expandable Mobile Collections Submenu */}
          <div className="space-y-2">
            <span className="block text-[13px] font-bold uppercase tracking-wider text-[#6B7280]">
              Collections
            </span>
            <div className="pl-4 flex flex-col gap-2.5">
              <Link 
                href="/shop?categorySlug=wigs" 
                onClick={() => setMobileMenuOpen(false)}
                className="block text-[14px] font-bold uppercase tracking-wider text-[#222222] hover:text-[#E56717]"
              >
                Wigs
              </Link>
              <Link 
                href="/shop?categorySlug=bundle" 
                onClick={() => setMobileMenuOpen(false)}
                className="block text-[14px] font-bold uppercase tracking-wider text-[#222222] hover:text-[#E56717]"
              >
                Bundles
              </Link>
              <Link 
                href="/shop?categorySlug=extensions" 
                onClick={() => setMobileMenuOpen(false)}
                className="block text-[14px] font-bold uppercase tracking-wider text-[#222222] hover:text-[#E56717]"
              >
                Extensions
              </Link>
              <Link 
                href="/styling" 
                onClick={() => setMobileMenuOpen(false)}
                className="block text-[14px] font-bold uppercase tracking-wider text-[#222222] hover:text-[#E56717]"
              >
                Styling
              </Link>
            </div>
          </div>
          <Link 
            href="/styling" 
            onClick={() => setMobileMenuOpen(false)}
            className="block text-[15px] font-bold uppercase tracking-wider text-[#222222] hover:text-[#E56717]"
          >
            Styling
          </Link>
          <Link 
            href="/contact" 
            onClick={() => setMobileMenuOpen(false)}
            className="block text-[15px] font-bold uppercase tracking-wider text-[#222222] hover:text-[#E56717]"
          >
            Contact
          </Link>

          {/* Mobile Login / Account CTA */}
          <div className="pt-4 border-t border-[#222222]/5">
            <Link
              href="/account"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full h-11 bg-[#222222] text-white hover:bg-[#E56717] rounded-[10px] text-[13px] font-bold uppercase tracking-wider transition-all"
            >
              <User className="w-4.5 h-4.5" />
              <span>{user ? 'My Account' : 'Log In / Sign Up'}</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
