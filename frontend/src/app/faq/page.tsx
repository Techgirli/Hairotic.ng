'use client';

import React, { useEffect, useState } from 'react';
import { Search, ChevronDown, HelpCircle, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FALLBACK_FAQS: FaqItem[] = [
  {
    id: 'f-1',
    question: 'How long does shipping take within Lagos?',
    answer: 'Standard shipping within Lagos takes 24 to 48 hours. Express delivery options are available for orders placed before 10:00 AM.',
    category: 'Shipping',
  },
  {
    id: 'f-2',
    question: 'Do you deliver outside of Lagos?',
    answer: 'Yes, we deliver nationwide across Nigeria (including Abuja, Port Harcourt, and Kano) via our partner courier networks. Delivery typically takes 3 to 5 business days.',
    category: 'Shipping',
  },
  {
    id: 'f-3',
    question: 'What payment methods do you accept?',
    answer: 'We accept secure debit/credit cards, USSD codes, and direct bank transfers integrated through our payment processor, Paystack.',
    category: 'Payment',
  },
  {
    id: 'f-4',
    question: 'Can I return or exchange my hair bundles?',
    answer: 'Due to hygienic constraints, we only accept returns or exchanges if the bundle has not been unravelled, combed, or dyed, and remains in its original packaging within 7 days of delivery.',
    category: 'Returns',
  },
  {
    id: 'f-5',
    question: 'How do I wash and maintain my human hair bundles?',
    answer: 'We recommend using sulfate-free shampoos and rich conditioners. Detangle gently from tips to roots while wet, and allow the hair to air dry to preserve texture and bundle bounce.',
    category: 'Hair Care',
  },
];

export default function FaqPage() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  const fetchFaqs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/faqs`);
      if (res.ok) {
        const data = await res.json();
        setFaqs(data.length > 0 ? data : FALLBACK_FAQS);
      } else {
        setFaqs(FALLBACK_FAQS);
      }
    } catch {
      setFaqs(FALLBACK_FAQS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const categories = ['All', 'Shipping', 'Payment', 'Returns', 'Hair Care'];

  // Filter logic
  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory = activeCategory === 'All' || faq.category.toLowerCase() === activeCategory.toLowerCase();
    const matchesSearch =
      faq.question.toLowerCase().includes(search.toLowerCase()) ||
      faq.answer.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFaq = (id: string) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 md:px-0 space-y-8 select-none font-sans">
      
      {/* Page Header */}
      <div className="text-center space-y-3">
        <h1 className="text-[32px] md:text-[40px] font-extrabold uppercase tracking-tight text-[#222222]">
          Help & FAQs
        </h1>
        <p className="text-[14px] text-[#6B7280] max-w-xl mx-auto leading-relaxed">
          Find fast answers regarding shipping parameters, payment gates, returns, and maintenance guidelines.
        </p>
      </div>

      {/* Toolbar controls: search & category pills */}
      <div className="space-y-6">
        
        {/* Search bar */}
        <div className="relative max-w-md mx-auto">
          <input
            type="text"
            placeholder="Search questions or terms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 pl-12 pr-4 border border-[#222222]/10 rounded-[16px] bg-white text-[14px] outline-none focus:border-[#E56717] transition-all"
          />
          <Search className="w-5 h-5 text-[#6B7280] absolute left-4 top-3.5" />
        </div>

        {/* Category selector pills */}
        <div className="flex gap-1.5 justify-center overflow-x-auto py-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`h-9 px-5 rounded-[12px] text-[12px] font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                activeCategory === cat
                  ? 'bg-[#E56717] text-white shadow-sm'
                  : 'bg-white border border-[#222222]/10 text-[#6B7280] hover:text-[#222222] hover:border-[#222222]/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Accordion List */}
      <div className="bg-white border border-[#222222]/5 rounded-[32px] shadow-sm p-4 md:p-6 space-y-4">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#E56717]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
              Retrieving guides ledger...
            </span>
          </div>
        ) : filteredFaqs.length === 0 ? (
          <div className="py-12 text-center text-[#6B7280] border border-dashed border-[#222222]/10 rounded-[20px]">
            No FAQ entries matched your search parameters. Please try a different query.
          </div>
        ) : (
          <div className="divide-y divide-[#222222]/5">
            {filteredFaqs.map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div key={faq.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full flex justify-between items-center text-left py-2 hover:text-[#E56717] transition-colors cursor-pointer group"
                  >
                    <span className="font-extrabold text-[15px] text-[#222222] group-hover:text-[#E56717] transition-colors leading-snug pr-4">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-[#6B7280] shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-[#E56717]' : ''
                      }`}
                    />
                  </button>

                  <div
                    className={`transition-all duration-300 overflow-hidden ${
                      isOpen ? 'max-h-[300px] opacity-100 pb-2' : 'max-h-0 opacity-0 pointer-events-none'
                    }`}
                  >
                    <p className="text-[14.5px] text-[#6B7280] leading-relaxed font-light pl-1 pt-1">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Stylist floating helper prompt */}
      <div className="bg-[#FAF7F4] border border-[#222222]/5 p-6 rounded-[24px] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-4 items-start">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#E56717] shrink-0">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h5 className="font-extrabold text-[#222222] uppercase tracking-wide text-[14px]">Still Have Questions?</h5>
            <p className="text-[13px] text-[#6B7280] mt-0.5 leading-relaxed">
              Our support line is open. Drop a prompt message directly to our hair experts.
            </p>
          </div>
        </div>

        <Link
          href="/contact"
          className="h-10 px-5 bg-[#E56717] hover:bg-[#C65A12] text-white text-[12px] font-bold uppercase tracking-wider rounded-[12px] flex items-center justify-center cursor-pointer transition-colors shrink-0"
        >
          Contact Support
        </Link>
      </div>

    </div>
  );
}
