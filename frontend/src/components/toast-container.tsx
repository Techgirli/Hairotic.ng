'use client';

import { useToastStore, Toast } from '../store/toastStore';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ToastContainer() {
  const { toasts, dismissToast } = useToastStore();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch in Next.js SSR
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed bottom-24 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => dismissToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const iconMap = {
    success: <CheckCircle2 className="w-5 h-5 text-[#25D366] shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-[#EF4444] shrink-0" />,
    info: <Info className="w-5 h-5 text-[#E56717] shrink-0" />,
  };

  const borderMap = {
    success: 'border-[#25D366]/20',
    error: 'border-[#EF4444]/20',
    info: 'border-[#E56717]/20',
  };

  return (
    <div
      className={`pointer-events-auto flex items-center justify-between gap-3 bg-[#FFFFFF] border ${borderMap[toast.type]} shadow-xl rounded-[16px] p-4 animate-in slide-in-from-bottom-5 fade-in duration-300`}
      role="alert"
    >
      <div className="flex items-center gap-3">
        {iconMap[toast.type]}
        <span className="text-[13px] font-medium text-[#222222]">{toast.message}</span>
      </div>
      <button
        onClick={onClose}
        className="text-[#6B7280] hover:text-[#222222] transition-colors p-1 rounded-full hover:bg-[#FAF7F4] cursor-pointer"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
