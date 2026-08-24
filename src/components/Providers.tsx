"use client";

import { useEffect } from 'react';
import { useUserStore } from '@/store/userStore';
import { useCurrencyStore } from '@/store/currencyStore';
import AuthModal from "@/components/AuthModal";
import DepositModal from "@/components/DepositModal";
import InsufficientFundsModal from "@/components/InsufficientFundsModal";
import { SessionProvider, useSession } from "next-auth/react";

function AuthSync() {
  const { data: session, status } = useSession();
  const { setUser, clearUser } = useUserStore();
  const { fetchBalances } = useCurrencyStore();

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      setUser(session.user as any, session as any);
      // Fetch fresh balances from Prisma backend instead of old supabase direct query
      fetchBalances(session.user.id);
    } else if (status === 'unauthenticated') {
      clearUser();
    }
  }, [session, status, setUser, clearUser, fetchBalances]);

  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthSync />
      {children}
      <AuthModal />
      <DepositModal />
      <InsufficientFundsModal />
    </SessionProvider>
  );
}
