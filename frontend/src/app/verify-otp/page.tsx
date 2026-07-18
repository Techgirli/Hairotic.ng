'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, AlertCircle } from 'lucide-react';
import Header from '../../components/header';
import OTPInput from '../../components/OTPInput';
import CountdownTimer from '../../components/CountdownTimer';
import ResendOTP from '../../components/ResendOTP';
import { useAuthStore } from '../../store/authStore';

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const { verifyOtpAction, resendOtpAction, loading, error, clearError } = useAuthStore();
  const [success, setSuccess] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  useEffect(() => {
    if (!email) {
      router.push('/account');
    }
    return () => clearError();
  }, [email, router, clearError]);

  const handleOtpComplete = async (otpCode: string) => {
    setOtpError(null);
    clearError();

    let deviceId = typeof window !== 'undefined' ? localStorage.getItem('hairotic_device_id') : null;
    if (!deviceId) {
      deviceId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      if (typeof window !== 'undefined') {
        localStorage.setItem('hairotic_device_id', deviceId);
      }
    }

    try {
      await verifyOtpAction(email, otpCode, deviceId);
      setSuccess(true);
      setTimeout(() => {
        router.push('/account');
      }, 1500);
    } catch (err: any) {
      setOtpError(err.message || 'OTP verification failed. Please try again.');
    }
  };

  const handleResend = async () => {
    setOtpError(null);
    clearError();
    await resendOtpAction(email);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F4] flex flex-col font-sans">
      <Header />
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[460px] bg-white rounded-[32px] p-8 sm:p-10 shadow-xl border border-[#222222]/5 text-center relative overflow-hidden">
          
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-[#E56717] to-[#E56717]/50" />

          {success && (
            <div className="absolute inset-0 bg-white z-20 flex flex-col items-center justify-center p-6 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center text-green-500 mb-4">
                <ShieldCheck className="w-9 h-9" />
              </div>
              <h2 className="text-2xl font-extrabold text-[#222222] uppercase tracking-wide">
                Access Verified
              </h2>
              <p className="text-[#6B7280] text-[14px] mt-2">
                Signing you into your dashboard...
              </p>
            </div>
          )}

          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-[#E56717]/10 flex items-center justify-center text-[#E56717] mb-6">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <h1 className="text-[24px] sm:text-[28px] font-extrabold text-[#222222] uppercase tracking-wide leading-tight">
              Verify your login
            </h1>
            <p className="text-[#6B7280] text-[14px] sm:text-[15px] mt-3 max-w-[320px]">
              We have sent a 6-digit confirmation code to: <br />
              <strong className="text-[#222222]">{email}</strong>
            </p>

            <div className="my-8">
              <OTPInput onComplete={handleOtpComplete} isLoading={loading} />
            </div>

            <div className="text-[14px] text-[#6B7280] mb-8">
              Code expires in:{' '}
              <CountdownTimer initialSeconds={600} onExpire={() => setOtpError('OTP has expired. Please request a new one.')} />
            </div>

            <div className="mb-6">
              <ResendOTP onResend={handleResend} />
            </div>

            {(otpError || error) && (
              <div className="flex items-center gap-2 text-red-500 bg-red-50 px-4 py-3 rounded-2xl text-[13px] sm:text-[14px] font-medium text-left w-full mb-6">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{otpError || error}</span>
              </div>
            )}

            <Link
              href="/account"
              className="flex items-center gap-2 text-[14px] text-[#6B7280] hover:text-[#E56717] font-semibold transition-colors duration-300"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAF7F4] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-[#222222]/10 border-t-[#E56717] animate-spin" />
      </div>
    }>
      <VerifyOtpContent />
    </Suspense>
  );
}
