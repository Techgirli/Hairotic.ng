'use client';

import React, { useEffect, useRef } from 'react';
import { Star, Quote } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const REVIEWS = [
  {
    name: 'Adebayo A.',
    location: 'Lagos',
    text: 'The hair is insanely soft! Holds curls for days without styling spray. Definitely buying another unit soon. The quality is unmatched.',
    rating: 5,
    tag: 'Double Drawn Raw Hair',
  },
  {
    name: 'Chioma O.',
    location: 'Abuja',
    text: "First time ordering extensions online in Nigeria and I'm blown away. Same-day delivery was actual same-day. The customer service was top tier!",
    rating: 5,
    tag: 'Body Wave Bundle',
  },
  {
    name: 'Favour E.',
    location: 'Lekki',
    text: 'Hairotic wigs are an absolute cheat code. The lace melts like butter! Literally got so many compliments at the event.',
    rating: 5,
    tag: 'Premium HD Wig',
  },
];

export default function Testimonials() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const mm = gsap.matchMedia();
    const cards = el.querySelectorAll('.testimonial-card');

    mm.add("(min-width: 768px)", () => {
      // Slide-up stagger reveal for testimonial cards on scroll
      gsap.fromTo(
        cards,
        { y: 50, opacity: 0, scale: 0.96 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          stagger: 0.15,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            once: true,
          },
        }
      );
    });

    mm.add("(max-width: 767px)", () => {
      gsap.set(cards, { y: 0, opacity: 1, scale: 1 });
    });

    return () => mm.revert();
  }, []);

  return (
    <section ref={containerRef} className="py-20 bg-white overflow-hidden select-none">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Section Header */}
        <div className="text-center mb-14">
          <span className="text-[#E56717] text-[13px] font-extrabold uppercase tracking-widest block mb-2">
            Baddie Approved
          </span>
          <h2 className="text-[32px] font-bold text-[#222222] uppercase tracking-wide inline-block">
            Baddies Love Hairotic
          </h2>
          <div className="w-14 h-1 bg-[#E56717] mx-auto mt-3 rounded-full" />
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {REVIEWS.map((review, i) => (
            <div
              key={i}
              className="testimonial-card group relative bg-[#FAF7F4] border border-[#222222]/5 p-8 rounded-[24px] shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between"
            >
              {/* Quote icon watermark decoration */}
              <div className="absolute top-6 right-6 text-[#E56717]/10 group-hover:text-[#E56717]/20 transition-colors duration-300">
                <Quote className="w-10 h-10 fill-current" />
              </div>

              <div className="space-y-4 relative z-10">
                {/* Stars */}
                <div className="flex gap-1">
                  {[...Array(review.rating)].map((_, idx) => (
                    <Star key={idx} className="w-4 h-4 fill-[#E56717] text-[#E56717]" />
                  ))}
                </div>

                {/* Review Text */}
                <p className="text-[15px] text-gray-700 leading-relaxed font-light italic">
                  &ldquo;{review.text}&rdquo;
                </p>
              </div>

              {/* Reviewer Details */}
              <div className="mt-8 pt-6 border-t border-[#222222]/5 flex items-center justify-between relative z-10">
                <div>
                  <h4 className="text-[15px] font-bold text-[#222222]">{review.name}</h4>
                  <p className="text-[12px] text-gray-500">{review.location}</p>
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#E56717] bg-[#E56717]/10 rounded-full px-3 py-1">
                  {review.tag}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
