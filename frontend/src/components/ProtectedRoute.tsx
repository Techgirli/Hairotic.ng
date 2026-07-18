import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, checkMe } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const verifyAuth = async () => {
      await checkMe();
    };
    verifyAuth();
  }, [checkMe]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/account');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white/85 backdrop-blur-md z-50 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-[#222222]/10 border-t-[#E56717] animate-spin" />
        <span className="text-[14px] text-[#222222]/60 font-semibold tracking-wide uppercase">
          Verifying Session...
        </span>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
