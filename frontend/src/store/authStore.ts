import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  role: string;
  phone?: string;
  mfaEnabled: boolean;
  name?: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  mfaRequired: boolean;
  mfaSetup: boolean;
  mfaQrCode: string | null;
  mfaSecret: string | null;
  error: string | null;
  
  login: (email: string, password: string) => Promise<{ mfaRequired: boolean; mfaSetup: boolean }>;
  loginWithGoogleAction: (idToken: string, deviceId?: string) => Promise<{ mfaRequired: boolean; email?: string }>;
  verifyOtpAction: (email: string, otp: string, deviceId?: string) => Promise<void>;
  resendOtpAction: (email: string) => Promise<void>;
  verifyMfa: (code: string, isSetupFlow: boolean) => Promise<void>;
  setupMfa: () => Promise<void>;
  logout: () => Promise<void>;
  checkMe: () => Promise<void>;
  clearError: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  mfaRequired: false,
  mfaSetup: false,
  mfaQrCode: null,
  mfaSecret: null,
  error: null,

  clearError: () => set({ error: null }),

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Invalid email or password');
      }

      if (data.mfaRequired) {
        set({
          mfaRequired: true,
          mfaSetup: data.mfaSetup,
          loading: false,
          user: data.user,
        });
        return { mfaRequired: true, mfaSetup: data.mfaSetup };
      }

      set({ user: data.user, mfaRequired: false, loading: false });
      return { mfaRequired: false, mfaSetup: false };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      set({ error: message, loading: false });
      throw err;
    }
  },

  loginWithGoogleAction: async (idToken, deviceId) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, deviceId }),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Google authentication failed');
      }

      if (data.mfaRequired) {
        set({ loading: false });
        return { mfaRequired: true, email: data.email };
      }

      set({ user: data.user, loading: false });
      return { mfaRequired: false };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      set({ error: message, loading: false });
      throw err;
    }
  },

  verifyOtpAction: async (email, otp, deviceId) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/auth/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, deviceId }),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Invalid or expired OTP');
      }

      set({ user: data.user, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      set({ error: message, loading: false });
      throw err;
    }
  },

  resendOtpAction: async (email) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/auth/otp/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to resend OTP');
      }

      set({ loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      set({ error: message, loading: false });
      throw err;
    }
  },

  verifyMfa: async (code, isSetupFlow) => {
    set({ loading: true, error: null });
    try {
      console.log('[Zustand verifyMfa] Verifying code:', code, 'isSetupFlow:', isSetupFlow);
      const res = await fetch(`${API_URL}/auth/mfa/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, isSetupFlow }),
        credentials: 'include',
      });

      const data = await res.json();
      console.log('[Zustand verifyMfa] Response:', data);
      if (!res.ok) {
        throw new Error(data.message || 'Invalid verification code');
      }

      await get().checkMe();
      console.log('[Zustand verifyMfa] checkMe completed. Current state user:', get().user);
      set({ mfaRequired: false, mfaSetup: false, mfaQrCode: null, mfaSecret: null, loading: false });
    } catch (err) {
      console.error('[Zustand verifyMfa] Error:', err);
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      set({ error: message, loading: false });
      throw err;
    }
  },

  setupMfa: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/auth/mfa/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to initialize MFA setup');
      }

      set({
        mfaQrCode: data.qrCodeDataUrl,
        mfaSecret: data.secret,
        loading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      set({ error: message, loading: false });
      throw err;
    }
  },

  logout: async () => {
    set({ loading: true });
    try {
      await fetch(`${API_URL}/auth/logout`, { 
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Logout request failed', err);
    } finally {
      set({ user: null, mfaRequired: false, mfaSetup: false, loading: false });
    }
  },

  checkMe: async () => {
    try {
      console.log('[Zustand checkMe] Fetching /auth/me...');
      const res = await fetch(`${API_URL}/auth/me`, {
        credentials: 'include',
      });
      console.log('[Zustand checkMe] Response status:', res.status);
      if (res.ok) {
        const data = await res.json();
        console.log('[Zustand checkMe] User data loaded:', data.user);
        set({ user: data.user });
      } else {
        console.warn('[Zustand checkMe] Not authenticated (non-200 response)');
        set({ user: null });
      }
    } catch (e) {
      console.error('[Zustand checkMe] Fetch error:', e);
      set({ user: null });
    }
  },
}));
