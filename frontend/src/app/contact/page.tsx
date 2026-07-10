'use client';

import React, { useState } from 'react';
import { Mail, Phone, Clock, MessageSquare, Send, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || 'Failed to submit contact request');
      }

      setName('');
      setEmail('');
      setMessage('');
      setSubmitSuccess(true);
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 md:px-0 space-y-12 select-none font-sans">
      
      {/* Page Header */}
      <div className="text-center space-y-3">
        <h1 className="text-[32px] md:text-[40px] font-extrabold uppercase tracking-tight text-[#222222]">
          Contact Support
        </h1>
        <p className="text-[14px] text-[#6B7280] max-w-xl mx-auto leading-relaxed">
          Reach out regarding custom orders, shipment parameters, or business inquiries.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
        
        {/* Support coordinates */}
        <div className="md:col-span-2 space-y-6">
          <div className="space-y-2">
            <h3 className="text-[18px] font-extrabold uppercase tracking-tight text-[#222222]">Get in Touch</h3>
            <p className="text-[13px] text-[#6B7280] leading-relaxed font-light">
              Submit your inquiry using the adjacent form, or use our direct contact coordinates listed below.
            </p>
          </div>

          <div className="space-y-4">
            
            {/* Phone */}
            <div className="flex gap-4 items-center">
              <div className="w-10 h-10 rounded-full bg-[#FAF7F4] flex items-center justify-center text-[#E56717] shrink-0 border border-[#222222]/5">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">call/text support</span>
                <a href="tel:+2348000000000" className="font-extrabold text-[13.5px] text-[#222222] hover:text-[#E56717] transition-colors font-mono">
                  +234 800 000 0000
                </a>
              </div>
            </div>

            {/* Email */}
            <div className="flex gap-4 items-center">
              <div className="w-10 h-10 rounded-full bg-[#FAF7F4] flex items-center justify-center text-[#E56717] shrink-0 border border-[#222222]/5">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">support mail</span>
                <a href="mailto:support@hairotic.ng" className="font-extrabold text-[13.5px] text-[#222222] hover:text-[#E56717] transition-colors">
                  support@hairotic.ng
                </a>
              </div>
            </div>

            {/* Hours */}
            <div className="flex gap-4 items-center">
              <div className="w-10 h-10 rounded-full bg-[#FAF7F4] flex items-center justify-center text-[#E56717] shrink-0 border border-[#222222]/5">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">business hours</span>
                <span className="font-extrabold text-[13.5px] text-[#222222]">
                  Mon - Sat: 9:00 AM - 6:00 PM
                </span>
              </div>
            </div>

          </div>

          {/* Meta WhatsApp Direct click card */}
          <div className="bg-[#FFF8F2] border border-[#E56717]/10 p-5 rounded-[24px] space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#25D366] flex items-center justify-center text-white shrink-0">
                <MessageSquare className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-[#222222] uppercase tracking-wide text-[13px]">
                Chat on WhatsApp
              </h4>
            </div>
            <p className="text-[13px] text-[#6B7280] leading-relaxed">
              Connect immediately with a sales stylist for live consults or custom wig fitting adjustments.
            </p>
            <a
              href="https://wa.me/2348000000000?text=Hello%20Hairotic,%20I'd%20like%20to%20consult%20regarding%20custom%20hair%20orders."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block h-10 px-5 bg-[#25D366] hover:bg-[#20ba59] text-white text-[12px] font-bold uppercase tracking-wider rounded-[12px] leading-10 shadow-sm transition-colors text-center cursor-pointer"
            >
              Start Live Chat
            </a>
          </div>

        </div>

        {/* Contact Form card */}
        <div className="md:col-span-3 bg-white border border-[#222222]/5 p-6 md:p-8 rounded-[32px] shadow-sm space-y-6">
          <div className="space-y-1">
            <h3 className="text-[18px] font-extrabold uppercase tracking-tight text-[#222222]">Send a Message</h3>
            <p className="text-[13px] text-[#6B7280] font-light">We typically reply within 2 hours during business schedules.</p>
          </div>

          {submitError && (
            <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 p-4 rounded-[16px] text-[#EF4444] text-[13px] font-bold flex items-center gap-2">
              <ShieldAlert className="w-4.5 h-4.5 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {submitSuccess && (
            <div className="bg-[#22C55E]/10 border border-[#22C55E]/20 p-4 rounded-[16px] text-[#22C55E] text-[13px] font-bold flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4.5 h-4.5 shrink-0" />
              <span>Inquiry received! Our team will contact you shortly via email.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 px-4 border border-[#222222]/10 rounded-[12px] bg-[#FAF7F4] text-[14px] focus:border-[#E56717] outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 px-4 border border-[#222222]/10 rounded-[12px] bg-[#FAF7F4] text-[14px] focus:border-[#E56717] outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider">Message Content</label>
              <textarea
                rows={5}
                required
                placeholder="Write details of your inquiry..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-4 border border-[#222222]/10 rounded-[12px] bg-[#FAF7F4] text-[14px] focus:border-[#E56717] outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 bg-[#E56717] hover:bg-[#C65A12] disabled:bg-[#6B7280] text-white text-[13px] font-bold uppercase tracking-widest rounded-[12px] shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Support Request</span>
                </>
              )}
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
