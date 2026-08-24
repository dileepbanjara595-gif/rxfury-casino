'use client';

import { useUIStore } from '@/store/uiStore';
import { useDepositModalStore } from '@/store/depositModalStore';
import { X, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function InsufficientFundsModal() {
  const { isInsufficientFundsModalOpen, closeInsufficientFundsModal } = useUIStore();
  const { openModal } = useDepositModalStore();
  const router = useRouter();

  if (!isInsufficientFundsModalOpen) return null;

  const handleAddFunds = () => {
    closeInsufficientFundsModal();
    // Use the equivalent deposit route/modal in our architecture
    openModal('deposit', 'methods');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#131824] border border-gray-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-red-500/10 p-6 flex flex-col items-center justify-center border-b border-red-500/20 relative">
          <button 
            onClick={closeInsufficientFundsModal}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-white text-center">Insufficient Funds</h2>
        </div>

        {/* Body */}
        <div className="p-6 text-center">
          <p className="text-gray-300 font-medium mb-6 leading-relaxed">
            Please add money to your wallet to continue playing and placing bets.
          </p>
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={handleAddFunds}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-transform active:scale-95"
            >
              Add Funds Now
            </button>
            <button 
              onClick={closeInsufficientFundsModal}
              className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-4 px-6 rounded-xl transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}
