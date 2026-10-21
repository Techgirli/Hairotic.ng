import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import type {
  CredentialResponse,
  GsiButtonConfiguration,
  IdConfiguration,
} from '@react-oauth/google';

interface GoogleLoginButtonProps {
  onSuccess: (credential: string) => void;
  onError: (error: string) => void;
  isLoading?: boolean;
}

interface GoogleIdentityServices {
  accounts: {
    id: {
      initialize: (config: IdConfiguration) => void;
      renderButton: (
        element: HTMLElement | null,
        config: GsiButtonConfiguration,
      ) => void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentityServices;
  }
}

export default function GoogleLoginButton({ onSuccess, onError, isLoading }: GoogleLoginButtonProps) {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  }, [onSuccess, onError]);

  useEffect(() => {
    const initGoogle = () => {
      if (typeof window !== 'undefined' && window.google) {
        try {
          const clientId = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '').replace(/^["']|["']$/g, '');
          if (!clientId) {
            onErrorRef.current('Google sign-in is not configured. Please contact an administrator.');
            return;
          }

          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (response: CredentialResponse) => {
              if (response.credential) {
                onSuccessRef.current(response.credential);
              } else {
                onErrorRef.current('Google login response did not contain verification credential.');
              }
            },
            cancel_on_tap_outside: true,
          });

          window.google.accounts.id.renderButton(
            document.getElementById('google-btn-container'),
            {
              theme: 'filled_black',
              size: 'large',
              text: 'continue_with',
              shape: 'pill',
              width: '320',
            }
          );
        } catch (err: unknown) {
          onErrorRef.current(
            err instanceof Error
              ? err.message
              : 'Google OAuth button rendering failed.',
          );
        }
      }
    };

    if (scriptLoaded) {
      initGoogle();
    }
  }, [scriptLoaded]);

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[44px]">
      <Script
        src="https://accounts.google.com/gsi/client"
        onLoad={() => setScriptLoaded(true)}
        onError={() => onErrorRef.current('Failed to load Google identity authentication script.')}
        strategy="lazyOnload"
      />
      <div 
        id="google-btn-container" 
        className={`w-full max-w-[320px] transition-all duration-300 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
      />
    </div>
  );
}
