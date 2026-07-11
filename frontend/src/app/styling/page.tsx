'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { Scissors, Sparkles, RefreshCw, Layers, Calendar, ChevronRight, Phone } from 'lucide-react';

export default function StylingPage() {
  const services = [
    {
      title: 'Premium Lace Wig Installation',
      price: '₦25,000',
      description: 'Flawless glueless or waterproof adhesive application. Includes braiding, scalp protection, lace customization, and basic styling.',
      icon: Scissors,
      image: '/styling/wig_install.jpg',
      features: ['Bleaching Knots & Hairline Plucking', 'Skin Tone Lace Tinting', 'Secure Flat Braiding', 'Waterproof Adhesive or Glueless']
    },
    {
      title: 'Luxury Wig Revamp & Style',
      price: '₦15,000',
      description: 'Restore your tired wig to its original glory. Includes deep detangling, premium wash, hydration mask, and signature hot styling.',
      icon: RefreshCw,
      image: '/styling/wig_revamp.jpg',
      features: ['Deep Detangling Treatment', 'Sulfate-Free Wash & Condition', 'Intense Hydration Mask', 'Silk Press or Bouncy Wand Curls']
    },
    {
      title: 'Custom Coloring & Balayage',
      price: '₦30,000',
      description: 'Transform your wig with custom hair coloring. From subtle warm-toned highlights to bold balayage or complete color changes.',
      icon: Sparkles,
      image: '/styling/wig_coloring.jpg',
      features: ['Highlighting / Lowlighting', 'Seamless Balayage Gradients', 'Premium Hair-Safe Dyes', 'Deep Moisture After-Care']
    },
    {
      title: 'Professional Wig Construction',
      price: '₦20,000',
      description: 'Wig sewing and custom cap tailoring. Machine or hand sewn using your own bundles and closure/frontal for the perfect custom fit.',
      icon: Layers,
      image: '/wigs/02ab823d3a0c332042b5a6c3b3f99282.jpg',
      features: ['Custom Head Measurement Cap', 'Elastic Band & Combs Integration', 'Bleached Knots & Custom Styling', 'Flat Machine Stitching']
    }
  ];

  const steps = [
    {
      number: '01',
      title: 'Book & Drop Off',
      description: 'Schedule your appointment online or via WhatsApp. Drop off your wig at our Lagos salon at least 48 hours prior to your installation for customization.'
    },
    {
      number: '02',
      title: 'Lace Customization',
      description: 'Our expert stylists pluck the hairline, bleach the knots, and pre-tint the lace matching your exact scalp tone for a natural, seamless melt.'
    },
    {
      number: '03',
      title: 'Flat Braid & Scalp Prep',
      description: 'We braid your natural hair completely flat, apply a scalp protection barrier, and adjust the customized wig cap to fit perfectly.'
    },
    {
      number: '04',
      title: 'Installation & Styling',
      description: 'We install the wig securely using professional, skin-safe adhesives. Finally, we cut, style (straight, wavy, or curly), and define baby hairs.'
    }
  ];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#FDFBF7] text-[#222222] font-sans">
        
        {/* Hero Section */}
        <section className="relative h-[60vh] flex items-center justify-center bg-[#222222] text-[#FFFFFF] overflow-hidden select-none">
          <div className="absolute inset-0 bg-cover bg-center opacity-40 bg-[url('/styling/wig_install.jpg')]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#222222] via-[#222222]/40 to-transparent" />
          <div className="relative max-w-4xl mx-auto px-6 text-center z-10 space-y-6">
            <span className="text-[#E56717] text-[14px] uppercase tracking-[0.3em] font-bold block">
              Hairotic Salon Services
            </span>
            <h1 className="font-display text-[44px] md:text-[60px] font-black uppercase tracking-tight leading-none text-[#FFFFFF]">
              Wig Styling & <br />
              <span className="text-[#E56717]">Lace Installation</span>
            </h1>
            <p className="text-[17px] text-[#E5E7EB] max-w-2xl mx-auto font-medium leading-relaxed">
              Experience the perfect melt. Professional wig customization, installation, coloring, and restoration services at our Lagos salon.
            </p>
            <div className="pt-4">
              <a 
                href="https://wa.me/2348087794441" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-2 bg-[#E56717] hover:bg-[#D4560F] text-[#FFFFFF] px-8 py-4 rounded-full font-bold uppercase tracking-wider text-[14px] shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-xl cursor-pointer"
              >
                <Calendar className="w-5 h-5" />
                Book Styling Session
              </a>
            </div>
          </div>
        </section>

        {/* Pricing List */}
        <section className="py-20 px-8 max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <span className="text-[#E56717] text-[13px] uppercase tracking-[0.2em] font-bold block">Menu & Pricing</span>
            <h2 className="font-display text-[32px] md:text-[40px] font-black uppercase text-[#222222]">Our Styling Services</h2>
            <div className="h-1 w-20 bg-[#E56717] mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {services.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <div 
                  key={index}
                  className="bg-[#FFFFFF] border border-[#222222]/5 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-[#E56717]/20 transition-all duration-300 flex flex-col md:flex-row group"
                >
                  <div className="relative w-full md:w-2/5 h-64 md:h-auto overflow-hidden">
                    <Image
                      src={service.image}
                      alt={service.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4 bg-[#E56717] text-white font-bold px-4 py-1.5 rounded-full text-[14px] shadow-md">
                      {service.price}
                    </div>
                  </div>
                  <div className="p-8 w-full md:w-3/5 flex flex-col justify-between space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-[#E56717]">
                        <IconComponent className="w-5 h-5" />
                        <span className="text-[12px] uppercase font-bold tracking-widest">Premium Service</span>
                      </div>
                      <h3 className="text-[20px] font-black uppercase text-[#222222] tracking-wide leading-tight">
                        {service.title}
                      </h3>
                      <p className="text-[14px] text-[#6B7280] leading-relaxed">
                        {service.description}
                      </p>
                    </div>
                    
                    <ul className="space-y-1.5 border-t border-[#222222]/5 pt-4">
                      {service.features.map((feat, i) => (
                        <li key={i} className="flex items-center gap-2 text-[13px] text-[#4B5563]">
                          <ChevronRight className="w-4 h-4 text-[#E56717] shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Process Explanation */}
        <section className="bg-[#222222] text-[#FFFFFF] py-20 px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center space-y-4 mb-16">
              <span className="text-[#E56717] text-[13px] uppercase tracking-[0.2em] font-bold block">How It Works</span>
              <h2 className="font-display text-[32px] md:text-[40px] font-black uppercase text-[#FFFFFF]">The Styling Process</h2>
              <div className="h-1 w-20 bg-[#E56717] mx-auto" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((step, index) => (
                <div 
                  key={index}
                  className="bg-[#2D2D2D] border border-[#FFFFFF]/5 p-8 rounded-2xl relative overflow-hidden group hover:border-[#E56717]/30 transition-all duration-300"
                >
                  <span className="absolute -top-4 -right-2 font-display text-[96px] font-black text-[#FFFFFF]/5 select-none transition-colors group-hover:text-[#E56717]/10 duration-300">
                    {step.number}
                  </span>
                  <div className="h-12 w-12 bg-[#E56717]/10 text-[#E56717] font-bold text-[18px] rounded-full flex items-center justify-center mb-6">
                    {step.number}
                  </div>
                  <h3 className="text-[18px] font-black uppercase tracking-wider text-[#FFFFFF] mb-3">
                    {step.title}
                  </h3>
                  <p className="text-[14px] text-[#9CA3AF] leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Consultation Call to Action */}
        <section className="py-20 px-8 text-center max-w-4xl mx-auto space-y-8">
          <Sparkles className="w-12 h-12 text-[#E56717] mx-auto animate-pulse" />
          <h2 className="font-display text-[32px] md:text-[40px] font-black uppercase text-[#222222]">Have Questions About the Process?</h2>
          <p className="text-[16px] text-[#6B7280] leading-relaxed max-w-2xl mx-auto">
            Not sure which lace type matches your skin, or what length you need? Chat with our lead stylist on WhatsApp for a free consultation.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a 
              href="https://wa.me/2348087794441" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#E56717] hover:bg-[#D4560F] text-[#FFFFFF] px-8 py-4 rounded-full font-bold uppercase tracking-wider text-[14px] shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer"
            >
              <Phone className="w-4 h-4" />
              Chat with a Stylist
            </a>
            <Link 
              href="/shop" 
              className="w-full sm:w-auto inline-flex items-center justify-center bg-transparent border border-[#222222] hover:border-[#E56717] hover:text-[#E56717] text-[#222222] px-8 py-4 rounded-full font-bold uppercase tracking-wider text-[14px] transition-all duration-300"
            >
              Browse Shop Catalog
            </Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
