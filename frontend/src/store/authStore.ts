import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  role: string;
  phone: string;
  mfaEnabled: boolean;
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
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  verifyMfa: async (code, isSetupFlow) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/auth/mfa/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, isSetupFlow }),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Invalid verification code');
      }

      // MFA successfully verified. Now re-fetch profile to set final state
      await get().checkMe();
      set({ mfaRequired: false, mfaSetup: false, mfaQrCode: null, mfaSecret: null, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
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
    } catch (err: any) {
      set({ error: err.message, loading: false });
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
      const res = await fetch(`${API_URL}/auth/me`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        set({ user: data.user });
      } else {
        set({ user: null });
      }
    } catch (err) {
      set({ user: null });
    }
  },
}));
