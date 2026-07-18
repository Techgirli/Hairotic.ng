import { useEffect, useState } from 'react';

interface ResendOTPProps {
  onResend: () => Promise<void>;
  cooldownSeconds?: number;
  maxResends?: number;
}

export default function ResendOTP({ onResend, cooldownSeconds = 60, maxResends = 5 }: ResendOTPProps) {
  const [cooldown, setCooldown] = useState(cooldownSeconds);
  const [resendCount, setResendCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || resendCount >= maxResends || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onResend();
      setResendCount((prev) => prev + 1);
      setCooldown(cooldownSeconds);
    } catch (err: any) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (resendCount >= maxResends) {
    return (
      <span className="text-[14px] text-red-500 font-semibold">
        Maximum resend attempts reached. Please start over.
      </span>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {cooldown > 0 ? (
        <span className="text-[14px] text-[#6B7280]">
          Resend code in <strong className="font-mono text-[#222222]">{cooldown}s</strong>
        </span>
      ) : (
        <button
          onClick={handleResend}
          disabled={isSubmitting}
          className="text-[14px] text-[#E56717] hover:text-[#C55710] font-semibold underline active:scale-95 transition-all duration-300 disabled:opacity-50"
        >
          {isSubmitting ? 'Sending...' : 'Resend Code'}
        </button>
      )}
      {error && <span className="text-[12px] text-red-500 font-medium">{error}</span>}
    </div>
  );
}
