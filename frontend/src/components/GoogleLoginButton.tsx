import { useEffect, useState } from 'react';
import Script from 'next/script';

interface GoogleLoginButtonProps {
  onSuccess: (credential: string) => void;
  onError: (error: string) => void;
  isLoading?: boolean;
}

declare global {
  interface Window {
    google?: any;
  }
}

export default function GoogleLoginButton({ onSuccess, onError, isLoading }: GoogleLoginButtonProps) {
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    const initGoogle = () => {
      if (typeof window !== 'undefined' && window.google) {
        try {
          const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
          if (!clientId) {
            console.warn('Google client ID is missing in frontend env.');
          }

          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (response: any) => {
              if (response.credential) {
                onSuccess(response.credential);
              } else {
                onError('Google login response did not contain verification credential.');
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
        } catch (err: any) {
          onError(err.message || 'Google OAuth button rendering failed.');
        }
      }
    };

    if (scriptLoaded) {
      initGoogle();
    }
  }, [scriptLoaded, onSuccess, onError]);

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[44px]">
      <Script
        src="https://accounts.google.com/gsi/client"
        onLoad={() => setScriptLoaded(true)}
        onError={() => onError('Failed to load Google identity authentication script.')}
        strategy="lazyOnload"
      />
      <div 
        id="google-btn-container" 
        className={`w-full max-w-[320px] transition-all duration-300 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
      />
    </div>
  );
}
