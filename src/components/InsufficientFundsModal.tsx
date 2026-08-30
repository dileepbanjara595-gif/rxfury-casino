'use client';

import { useUIStore } from '@/store/uiStore';
import { useDepositModalStore } from '@/store/depositModalStore';
import { useCurrencyStore, CURRENCY_SYMBOLS, LIMITS, convertFromBase, formatCurrency } from '@/store/currencyStore';
import { X, Wallet, ArrowRight } from 'lucide-react';

export default function InsufficientFundsModal() {
  const { isInsufficientFundsModalOpen, closeInsufficientFundsModal } = useUIStore();
  const { openModal } = useDepositModalStore();
  const { activeCurrency, baseBalance } = useCurrencyStore();
  
  if (!isInsufficientFundsModalOpen) return null;

  const currentBalance = convertFromBase(baseBalance, activeCurrency);
  const formattedBalance = formatCurrency(currentBalance, activeCurrency);
  const sym = CURRENCY_SYMBOLS[activeCurrency] || ',1';

  // Dynamic Crypto Withdrawal Limit Calculation
  // We use USDT as the standard crypto equivalent for display if crypto is active.
  const cryptoEquivalent = convertFromBase(LIMITS.MIN_FIAT_WITHDRAW_INR, 'USDT');
  const formattedCryptoLimit = formatCurrency(cryptoEquivalent, 'USDT');

  const handleAddFunds = () => {
    closeInsufficientFundsModal();
    openModal('deposit', 'methods');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#131824] border border-red-500/30 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 relative">
        
        {/* Header */}
        <div className="bg-red-500/10 p-6 flex flex-col items-center justify-center border-b border-red-500/20 relative">
          <button 
            onClick={closeInsufficientFundsModal}
            className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
            <Wallet className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white text-center">Insufficient Balance</h2>
          <p className="text-red-400 text-xs font-bold uppercase tracking-wider mt-1">Wallet Balance: {sym} {formattedBalance}</p>
        </div>

        {/* Body */}
        <div className="p-6 text-center">
          <p className="text-gray-300 font-medium mb-6 text-sm leading-relaxed">
            {activeCurrency === 'INR' ? (
              <>The minimum withdrawal amount for UPI is ₹{LIMITS.MIN_FIAT_WITHDRAW_INR}. Your current balance is ₹{formattedBalance}.</>
            ) : (
              <>The minimum withdrawal amount is {formattedCryptoLimit} USDT. Your current balance is {formattedBalance} {activeCurrency}.</>
            )}
          </p>
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={handleAddFunds}
              className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-black py-4 px-6 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-sm cursor-pointer"
            >
              Deposit Now <ArrowRight className="w-4 h-4" />
            </button>
            <button 
              onClick={closeInsufficientFundsModal}
              className="w-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white font-bold py-3.5 px-6 rounded-xl transition-colors text-xs uppercase tracking-wider cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}
