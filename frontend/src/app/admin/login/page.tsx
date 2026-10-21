'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import {
  KeyRound,
  Mail,
  Lock,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  QrCode,
  Smartphone,
  Send,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const {
    login,
    verifyMfa,
    setupMfa,
    sendAdminOtpAction,
    verifyAdminOtpAction,
    sendAdminLoginOtpAction,
    verifyAdminLoginOtpAction,
    mfaRequired,
    mfaSetup,
    mfaQrCode,
    mfaSecret,
    loading,
    error,
    user,
    clearError,
  } = useAuthStore();

  const [email, setEmail] = useState('favecollections1@gmail.com');
  const [password, setPassword] = useState('');
  const [loginMode, setLoginMode] = useState<'password' | 'email_otp'>('password');
  const [mfaMethod, setMfaMethod] = useState<'totp' | 'email_otp'>('totp');
  const [mfaCode, setMfaCode] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loginOtpCode, setLoginOtpCode] = useState('');
  const [loginOtpSent, setLoginOtpSent] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Password reset request states
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [resetError, setResetError] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  // Redirect if already logged in as Admin or Staff
  useEffect(() => {
    if (user && (user.role === 'ADMIN' || user.role === 'STAFF') && !mfaRequired) {
      router.push('/admin/dashboard');
    }
  }, [user, mfaRequired, router]);

  // Clear errors on load
  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (mfaRequired && mfaSetup && !mfaQrCode && mfaMethod === 'totp') {
      setupMfa().catch((setupError: unknown) => {
        console.error('MFA setup failed', setupError);
      });
    }
  }, [mfaRequired, mfaSetup, mfaQrCode, mfaMethod, setupMfa]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    try {
      const result = await login(email, password);
      if (result.mfaRequired) {
        setMfaMethod('totp');
        setMfaCode('');
        setOtpCode('');
        setOtpSent(false);
      } else {
        setSuccessMsg('Login successful! Redirecting...');
        setTimeout(() => router.push('/admin/dashboard'), 500);
      }
    } catch {
      // Handled by store error state
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaCode) return;
    try {
      await verifyMfa(mfaCode, mfaSetup);
      setSuccessMsg('Authentication verified successfully! Redirecting...');
      setTimeout(() => router.push('/admin/dashboard'), 500);
    } catch {
      // Handled by store error state
    }
  };

  const handleSendEmailOtp = async () => {
    try {
      await sendAdminOtpAction();
      setOtpSent(true);
      setSuccessMsg('A verification code was sent to your admin email. Check your inbox and spam folder.');
    } catch {
      // Handled by store error state
    }
  };

  const handleVerifyEmailOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = (user?.email || email).trim();
    if (!targetEmail || !otpCode) return;
    try {
      await verifyAdminOtpAction(otpCode);
      setSuccessMsg('Email authentication verified! Redirecting...');
      setTimeout(() => router.push('/admin/dashboard'), 500);
    } catch {
      // Handled by store error state
    }
  };

  const handleSendLoginOtp = async () => {
    if (!email) return;
    try {
      await sendAdminLoginOtpAction(email);
      setLoginOtpSent(true);
      setSuccessMsg('A verification code was sent to your admin email. Check your inbox and spam folder.');
    } catch {
      // Handled by store error state
    }
  };

  const handleVerifyLoginOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !loginOtpCode) return;
    try {
      await verifyAdminLoginOtpAction(email, loginOtpCode);
      setSuccessMsg('Email authentication verified! Redirecting...');
      setTimeout(() => router.push('/admin/dashboard'), 500);
    } catch {
      // Handled by store error state
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    setResetStatus('loading');
    setResetError('');
    try {
      const res = await fetch(`${API_URL}/auth/password-reset/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });
      if (res.ok) {
        setResetStatus('success');
      } else {
        const d = await res.json();
        throw new Error(d.message || 'Failed to request password reset');
      }
    } catch (err: unknown) {
      setResetStatus('error');
      setResetError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#FAF7F4] p-4 font-sans select-none relative overflow-hidden">
      {/* Background visual graphics */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#E56717]/5 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#222222]/5 blur-[120px]" />

      <div className="w-full max-w-[480px] z-10">
        {/* Editorial Brand Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-[54px] leading-tight tracking-wider text-[#222222] uppercase drop-shadow-sm select-none">
            Hairotic
          </h1>
          <p className="text-[14px] uppercase tracking-[0.25em] text-[#6B7280] font-medium mt-1">
            Secure Admin Portal
          </p>
        </div>

        {/* Glassmorphism Card */}
        <div className="bg-[#FFFFFF] border border-[#222222]/5 rounded-[20px] shadow-[0_10px_30px_rgba(34,34,34,0.03)] hover:shadow-[0_15px_35px_rgba(34,34,34,0.05)] hover:-translate-y-[2px] transition-all duration-300 p-8 md:p-10 relative">
          
          {/* Error alert banner */}
          {error && (
            <div className="mb-6 flex items-start gap-3 bg-[#EF4444]/5 border border-[#EF4444]/20 rounded-[12px] p-4 text-[14px] text-[#EF4444] animate-fadeIn">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success message banner */}
          {successMsg && (
            <div className="mb-6 flex items-start gap-3 bg-[#22C55E]/5 border border-[#22C55E]/20 rounded-[12px] p-4 text-[14px] text-[#22C55E] animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Password Reset Screen */}
          {showReset ? (
            <form onSubmit={handleResetSubmit} className="space-y-6">
              <div className="text-center mb-6">
                <KeyRound className="w-12 h-12 text-[#E56717] mx-auto mb-2" />
                <h3 className="text-[18px] font-bold text-[#222222]">
                  Reset Security Password
                </h3>
                <p className="text-[14px] text-[#6B7280] mt-1">
                  Enter your email address and we will send you a password reset link.
                </p>
              </div>

              {resetStatus === 'success' ? (
                <div className="bg-[#22C55E]/5 border border-[#22C55E]/20 rounded-[12px] p-4 text-[14px] text-[#22C55E] text-center space-y-3">
                  <p>A password reset link has been dispatched to your email address.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowReset(false);
                      setResetStatus('idle');
                      setResetEmail('');
                    }}
                    className="text-[14px] font-bold text-[#E56717] hover:underline"
                  >
                    Back to Login
                  </button>
                </div>
              ) : (
                <>
                  {resetStatus === 'error' && (
                    <div className="flex items-start gap-3 bg-[#EF4444]/5 border border-[#EF4444]/20 rounded-[12px] p-4 text-[14px] text-[#EF4444]">
                      <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                      <span>{resetError}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[14px] font-semibold text-[#222222] tracking-wide block">
                      Admin Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                      <input
                        type="email"
                        required
                        placeholder="Enter your registered email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="w-full h-[52px] pl-12 pr-4 bg-[#F8F8F8] border border-[#222222]/10 rounded-[12px] text-[16px] text-[#222222] placeholder-[#6B7280] focus:outline-none focus:border-[#E56717] focus:ring-1 focus:ring-[#E56717] transition-all duration-200"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={resetStatus === 'loading'}
                    className="w-full h-[52px] bg-[#E56717] hover:bg-[#C65A12] text-[#FFFFFF] text-[16px] font-semibold rounded-[12px] shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {resetStatus === 'loading' ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span>Send Reset Link</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowReset(false)}
                    className="w-full text-center text-[14px] text-[#6B7280] hover:text-[#222222] font-semibold transition-colors mt-2 block"
                  >
                    Back to Login
                  </button>
                </>
              )}
            </form>
          ) : !mfaRequired ? (
            <>
            <div className="flex bg-[#F8F8F8] p-1 rounded-[12px] border border-[#222222]/5 mb-6">
              <button
                type="button"
                onClick={() => {
                  setLoginMode('password');
                  clearError();
                }}
                className={`flex-1 py-2 text-[12px] font-semibold rounded-[8px] flex items-center justify-center gap-1 transition-all ${
                  loginMode === 'password'
                    ? 'bg-white text-[#222222] shadow-sm'
                    : 'text-[#6B7280] hover:text-[#222222]'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Password</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMode('email_otp');
                  clearError();
                }}
                className={`flex-1 py-2 text-[12px] font-semibold rounded-[8px] flex items-center justify-center gap-1 transition-all ${
                  loginMode === 'email_otp'
                    ? 'bg-white text-[#222222] shadow-sm'
                    : 'text-[#6B7280] hover:text-[#222222]'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email Verification Code</span>
              </button>
            </div>

            {loginMode === 'password' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[14px] font-semibold text-[#222222] tracking-wide block">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                  <input
                    type="email"
                    required
                    placeholder="Enter your admin email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-[52px] pl-12 pr-4 bg-[#F8F8F8] border border-[#222222]/10 rounded-[12px] text-[16px] text-[#222222] placeholder-[#6B7280] focus:outline-none focus:border-[#E56717] focus:ring-1 focus:ring-[#E56717] transition-all duration-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[14px] font-semibold text-[#222222] tracking-wide block">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowReset(true)}
                    className="text-[12px] font-semibold text-[#E56717] hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                  <input
                    type="password"
                    required
                    placeholder="Enter your security password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-[52px] pl-12 pr-4 bg-[#F8F8F8] border border-[#222222]/10 rounded-[12px] text-[16px] text-[#222222] placeholder-[#6B7280] focus:outline-none focus:border-[#E56717] focus:ring-1 focus:ring-[#E56717] transition-all duration-200"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-[52px] bg-[#E56717] hover:bg-[#C65A12] text-[#FFFFFF] text-[16px] font-semibold rounded-[12px] shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <KeyRound className="w-5 h-5" />
                    <span>Verify Identity</span>
                  </>
                )}
              </button>
            </form>
            ) : (
            <form onSubmit={handleVerifyLoginOtpSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[14px] font-semibold text-[#222222] tracking-wide block">
                  Admin Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                  <input
                    type="email"
                    required
                    placeholder="Enter your admin email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setLoginOtpSent(false);
                      setLoginOtpCode('');
                    }}
                    className="w-full h-[52px] pl-12 pr-4 bg-[#F8F8F8] border border-[#222222]/10 rounded-[12px] text-[16px] text-[#222222] placeholder-[#6B7280] focus:outline-none focus:border-[#E56717] focus:ring-1 focus:ring-[#E56717] transition-all duration-200"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[13px] text-[#6B7280] text-center">
                  Send a 6-digit verification code to <strong>{email}</strong>
                </p>
                <button
                  type="button"
                  onClick={handleSendLoginOtp}
                  disabled={loading}
                  className="w-full h-[44px] bg-[#FAF7F4] border border-[#222222]/10 hover:bg-[#F0ECE7] text-[#222222] text-[14px] font-semibold rounded-[12px] flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <Send className="w-4 h-4 text-[#E56717]" />
                  <span>{loginOtpSent ? 'Resend Code to Email' : 'Send Code to Email'}</span>
                </button>
              </div>

              {loginOtpSent && (
                <div className="space-y-2">
                  <label className="text-[14px] font-semibold text-[#222222] tracking-wide block">
                    6-Digit Email Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    maxLength={6}
                    placeholder="000 000"
                    value={loginOtpCode}
                    onChange={(e) => setLoginOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full h-[52px] px-4 bg-[#F8F8F8] border border-[#222222]/10 rounded-[12px] text-[18px] tracking-[0.25em] text-center font-mono text-[#222222] focus:outline-none focus:border-[#E56717] focus:ring-1 focus:ring-[#E56717] transition-all duration-200"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !loginOtpSent || loginOtpCode.length < 6}
                className="w-full h-[52px] bg-[#E56717] hover:bg-[#C65A12] text-[#FFFFFF] text-[16px] font-semibold rounded-[12px] shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>Verify Code and Login</span>
                  </>
                )}
              </button>
            </form>
            )}
            </>
          ) : (
            /* Admin multi-factor verification */
            <div className="space-y-6">
              <div className="text-center mb-4">
                <ShieldAlert className="w-12 h-12 text-[#E56717] mx-auto mb-2" />
                <h3 className="text-[18px] font-bold text-[#222222]">
                  Two-Factor Verification
                </h3>
                <p className="text-[14px] text-[#6B7280] mt-1">
                  Choose your preferred authentication method to continue.
                </p>
              </div>

              <div className="flex bg-[#F8F8F8] p-1 rounded-[12px] border border-[#222222]/5">
                <button
                  type="button"
                  onClick={() => {
                    setMfaMethod('totp');
                    clearError();
                  }}
                  className={`flex-1 py-2 text-[12px] font-semibold rounded-[8px] flex items-center justify-center gap-1 transition-all ${
                    mfaMethod === 'totp'
                      ? 'bg-white text-[#222222] shadow-sm'
                      : 'text-[#6B7280] hover:text-[#222222]'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Authenticator App</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMfaMethod('email_otp');
                    clearError();
                  }}
                  className={`flex-1 py-2 text-[12px] font-semibold rounded-[8px] flex items-center justify-center gap-1 transition-all ${
                    mfaMethod === 'email_otp'
                      ? 'bg-white text-[#222222] shadow-sm'
                      : 'text-[#6B7280] hover:text-[#222222]'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email Verification Code</span>
                </button>
              </div>

              {mfaMethod === 'totp' ? (
                <form onSubmit={handleMfaSubmit} className="space-y-6">
                  {mfaSetup && mfaQrCode && (
                    <div className="bg-[#FAF7F4] border border-[#222222]/5 rounded-[16px] p-4 text-center space-y-4">
                      <div className="bg-white p-2 w-[180px] h-[180px] rounded-[12px] shadow-sm mx-auto flex items-center justify-center border border-[#222222]/10">
                        <img src={mfaQrCode} alt="TOTP QR Code" className="w-[164px] h-[164px]" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider block">
                          Manual Secret Key
                        </span>
                        <code className="text-[14px] font-mono font-bold text-[#222222] bg-[#222222]/5 px-2 py-1 rounded">
                          {mfaSecret}
                        </code>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[14px] font-semibold text-[#222222] tracking-wide block">
                      6-Digit App Security Code
                    </label>
                    <div className="relative">
                      <QrCode className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                      <input
                        type="text"
                        inputMode="numeric"
                        required
                        maxLength={6}
                        placeholder="000 000"
                        value={mfaCode}
                        onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                        className="w-full h-[52px] pl-12 pr-4 bg-[#F8F8F8] border border-[#222222]/10 rounded-[12px] text-[18px] tracking-[0.25em] text-center font-mono text-[#222222] focus:outline-none focus:border-[#E56717] focus:ring-1 focus:ring-[#E56717] transition-all duration-200"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || mfaCode.length < 6}
                    className="w-full h-[52px] bg-[#222222] hover:bg-[#111111] text-[#FFFFFF] text-[16px] font-semibold rounded-[12px] shadow-sm active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span>Verify and Login</span>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyEmailOtpSubmit} className="space-y-6">
                  <div className="space-y-3">
                    <p className="text-[13px] text-[#6B7280] text-center">
                      Send a 6-digit verification code to <strong>{user?.email || email}</strong>
                    </p>
                    <button
                      type="button"
                      onClick={handleSendEmailOtp}
                      disabled={loading}
                      className="w-full h-[44px] bg-[#FAF7F4] border border-[#222222]/10 hover:bg-[#F0ECE7] text-[#222222] text-[14px] font-semibold rounded-[12px] flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      <Send className="w-4 h-4 text-[#E56717]" />
                      <span>{otpSent ? 'Resend Code to Email' : 'Send Code to Email'}</span>
                    </button>
                  </div>

                  {otpSent && (
                    <div className="space-y-2">
                      <label className="text-[14px] font-semibold text-[#222222] tracking-wide block">
                        6-Digit Email Code
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        required
                        maxLength={6}
                        placeholder="000 000"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        className="w-full h-[52px] px-4 bg-[#F8F8F8] border border-[#222222]/10 rounded-[12px] text-[18px] tracking-[0.25em] text-center font-mono text-[#222222] focus:outline-none focus:border-[#E56717] focus:ring-1 focus:ring-[#E56717] transition-all duration-200"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !otpSent || otpCode.length < 6}
                    className="w-full h-[52px] bg-[#222222] hover:bg-[#111111] text-[#FFFFFF] text-[16px] font-semibold rounded-[12px] shadow-sm active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span>Verify Email Code</span>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
