import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Currency = 'INR' | 'USDT' | 'USDC' | 'BTC' | 'ETH' | 'BNB' | 'SOL' | 'LTC' | 'TRX' | 'DOGE' | 'BCH';

interface CurrencyState {
  activeCurrency: Currency;
  hideZeroBalances: boolean;
  baseBalance: number;
  affiliateBalance: number;
  setCurrency: (currency: Currency) => void;
  toggleHideZero: () => void;
  setBaseBalance: (balance: number) => void;
  fetchBalances: (userId: string) => Promise<void>;
}

export const EXCHANGE_RATES: Record<Currency, number> = {
  INR: 1,
  USDT: 88.5,
  USDC: 88.5,
  BTC: 5500000,
  ETH: 250000,
  BNB: 45000,
  SOL: 12000,
  LTC: 6000,
  TRX: 10,
  DOGE: 15,
  BCH: 35000,
};

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  INR: '₹',
  USDT: '₮',
  USDC: 'c',
  BTC: '₿',
  ETH: 'Λ',
  BNB: 'B',
  SOL: 'S',
  LTC: 'Ł',
  TRX: 'T',
  DOGE: 'Ò',
  BCH: 'B'
};

export const formatCurrency = (amount: number, currency: Currency): string => {
  if (['BTC', 'ETH', 'BNB', 'SOL', 'LTC', 'BCH'].includes(currency)) {
    return amount.toFixed(8); // High value crypto needs 8 decimals
  }
  if (['USDT', 'USDC', 'TRX', 'DOGE'].includes(currency)) {
    return amount.toFixed(4); // Medium value crypto needs 4 decimals
  }
  return amount.toFixed(2); // INR needs 2 decimals
};

export const convertToBase = (amount: number, fromCurrency: Currency): number => {
  return amount * EXCHANGE_RATES[fromCurrency];
};

export const convertFromBase = (inrAmount: number, targetCurrency: Currency): number => {
  return inrAmount / EXCHANGE_RATES[targetCurrency];
};

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set) => ({
      activeCurrency: 'INR',
      hideZeroBalances: false,
      baseBalance: 0,
      affiliateBalance: 0,
      setCurrency: (currency) => set({ activeCurrency: currency }),
      toggleHideZero: () => set((state) => ({ hideZeroBalances: !state.hideZeroBalances })),
      setBaseBalance: (balance) => set({ baseBalance: balance }),
      fetchBalances: async (userId: string) => {
        try {
          const res = await fetch('/api/wallet/balance');
          if (res.ok) {
            const data = await res.json();
            set({ 
              baseBalance: data.mainWalletBalance || 0,
              affiliateBalance: data.affiliateBalance || 0
            });
          }
        } catch (e) {
          console.error('Failed to fetch balances', e);
        }
      }
    }),
    {
      name: 'wallet-currency-storage',
      partialize: (state) => ({ 
        activeCurrency: state.activeCurrency, 
        hideZeroBalances: state.hideZeroBalances 
      }),
    }
  )
);

