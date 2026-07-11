import React from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';

export default function PoliciesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Sticky Premium Header */}
      <Header />
      
      {/* Policy Page Content Wrapper */}
      <main className="flex-1 bg-[#FAF7F4] py-16">
        {children}
      </main>
      
      {/* Reusable Premium Footer */}
      <Footer />
    </div>
  );
}
