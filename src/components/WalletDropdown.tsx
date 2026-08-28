"use client";
import React from "react";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, User, LogOut, Wallet } from "lucide-react";
import Link from "next/link";
import { useUserStore } from "@/store/userStore";
import { supabase } from "@/lib/supabaseClient";
import { useCurrencyStore, Currency, formatCurrency, convertFromBase } from "@/store/currencyStore";
import { useDepositModalStore } from "@/store/depositModalStore";

import { 
  SiTether, 
  SiBinance, 
  SiDogecoin, 
  SiLitecoin,
  SiBitcoin
} from "react-icons/si";
import { FaEthereum, FaRupeeSign } from "react-icons/fa";

// Fallback/Custom SVG for missing cryptos (USDC, SOL, TRX, BCH)
const USDCIcon = () => (
  <svg viewBox="0 0 24 24" fill="#2775CA" className="w-5 h-5">
    <path d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12zM12 4.2c4.301 0 7.8 3.499 7.8 7.8s-3.499 7.8-7.8 7.8-7.8-3.499-7.8-7.8 3.499-7.8 7.8-7.8zm0 2c-3.197 0-5.8 2.603-5.8 5.8s2.603 5.8 5.8 5.8 5.8-2.603 5.8-5.8-2.603-5.8-5.8-5.8z"/>
  </svg>
);
const SolIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
    <path fill="#00FFA3" d="M4.2 17.6h14.6l3.2-4H7.4l-3.2 4z"/>
    <path fill="#00FFA3" d="M7.4 6.4h14.6l-3.2 4H4.2l3.2-4z"/>
    <path fill="#DC1FFF" d="M4.2 12h14.6l3.2-4H7.4l-3.2 4z"/>
  </svg>
);
const TrxIcon = () => (
  <svg viewBox="0 0 24 24" fill="#FF060A" className="w-5 h-5">
    <path d="M2.93 11.23L12 1.35l9.07 9.88L12 22.65 2.93 11.23z"/>
  </svg>
);
const BchIcon = () => (
  <svg viewBox="0 0 24 24" fill="#0AC18E" className="w-5 h-5">
    <path d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12zm2.083-16.71l-1.028-.888-.707.82 1.027.887c-1.344.204-2.525.845-3.376 1.825L8.973 8.766l-.707.82 1.026.887c-.863.992-1.378 2.302-1.378 3.738 0 3.094 2.508 5.602 5.602 5.602 1.455 0 2.784-.555 3.784-1.474l1.033.893.707-.82-1.033-.894c1.173-1.127 1.9-2.736 1.9-4.507 0-1.48-.52-2.836-1.38-3.856l1.018-.88-.706-.82-1.018.88c-.854-.954-2.025-1.583-3.35-1.78zm-3.097 9.256c-1.925 0-3.486-1.56-3.486-3.486 0-1.925 1.56-3.486 3.486-3.486 1.925 0 3.486 1.56 3.486 3.486 0 1.925-1.56 3.486-3.486 3.486z"/>
  </svg>
);

const CURRENCY_INFO: Record<Currency, { name: string, icon: React.ReactNode, iconColor?: string }> = {
  INR:  { name: "Indian Rupee", icon: <FaRupeeSign className="w-4 h-4 text-white" />, iconColor: "bg-blue-500" },
  USDT: { name: "Tether", icon: <SiTether className="w-5 h-5 text-white" />, iconColor: "bg-[#26A17B]" },
  USDC: { name: "USD Coin", icon: <USDCIcon /> },
  BTC:  { name: "Bitcoin", icon: <SiBitcoin className="w-5 h-5 text-white" />, iconColor: "bg-[#F7931A]" },
  ETH:  { name: "Ethereum", icon: <FaEthereum className="w-5 h-5 text-white" />, iconColor: "bg-[#627EEA]" },
  BNB:  { name: "Binance Coin", icon: <SiBinance className="w-5 h-5 text-white" />, iconColor: "bg-[#F3BA2F]" },
  SOL:  { name: "Solana", icon: <SolIcon /> },
  LTC:  { name: "Litecoin", icon: <SiLitecoin className="w-5 h-5 text-white" />, iconColor: "bg-[#345D9D]" },
  TRX:  { name: "Tron", icon: <TrxIcon /> },
  DOGE: { name: "Dogecoin", icon: <SiDogecoin className="w-5 h-5 text-white" />, iconColor: "bg-[#C2A633]" },
  BCH:  { name: "Bitcoin Cash", icon: <BchIcon /> }
};

export default function WalletDropdown() {
  const { user } = useUserStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { activeCurrency, hideZeroBalances, setCurrency, toggleHideZero, baseBalance, setBaseBalance } = useCurrencyStore();

  useEffect(() => {
    // Example: fetchBalance().then(bal => setBaseBalance(bal))
  }, [user, setBaseBalance]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  const currentDisplayBalance = convertFromBase(baseBalance, activeCurrency);
  const ActiveIcon = CURRENCY_INFO[activeCurrency].icon;
  const ActiveColor = CURRENCY_INFO[activeCurrency].iconColor || "bg-transparent";

  const currencyList = Object.keys(CURRENCY_INFO) as Currency[];

  const handleLogout = async () => {
    try {
      setIsOpen(false);
      // 1. Clear Supabase Session
      await supabase.auth.signOut();
      
      // 2. Clear global state & local storage
      const { useUserStore } = await import('@/store/userStore');
      useUserStore.getState().clearUser();
      
      if (typeof window !== 'undefined') {
        localStorage.clear();
      }
      
      // 3. Clear NextAuth session and redirect
      const { signOut: nextAuthSignOut } = await import('next-auth/react');
      await nextAuthSignOut({ callbackUrl: '/' });
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <div className="relative z-50" ref={dropdownRef}>
      {/* Top Navbar Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2.5 bg-black/40 hover:bg-black/60 border border-white/10 px-3 py-1.5 md:px-4 md:py-2 rounded-xl transition-all"
      >
        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${ActiveColor}`}>
          {ActiveIcon}
        </div>
        <span className="font-bold text-white tracking-tight">
          {formatCurrency(currentDisplayBalance, activeCurrency)}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-[#1a1d29] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
          
          <div className="max-h-[350px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
            {currencyList.map((code) => {
              const bal = convertFromBase(baseBalance, code);
              
              if (hideZeroBalances && bal === 0 && code !== activeCurrency) return null;

              const info = CURRENCY_INFO[code];

              return (
                <div 
                  key={code}
                  onClick={() => {
                    setCurrency(code);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between p-4 cursor-pointer border-b border-white/5 transition-colors ${
                    activeCurrency === code ? 'bg-white/5 border-l-2 border-l-yellow-500' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${info.iconColor || 'bg-black/20'} shadow-md`}>
                      {info.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-white leading-tight">{code}</h4>
                      <p className="text-[11px] text-gray-500 font-medium">{info.name}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-[10px] text-gray-500 font-medium mb-0.5">
                      ≈ {formatCurrency(baseBalance, 'INR')}
                    </div>
                    <div className="font-bold text-white font-mono text-sm">
                      {formatCurrency(bal, code)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-black/40 border-t border-white/10">
            {/* Hide Zero Toggle */}
            <div className="flex justify-between items-center mb-4 px-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Hide zero balances</span>
              <label className="flex items-center cursor-pointer">
                <div 
                  className={`w-10 h-5 rounded-full transition-colors relative shadow-inner ${hideZeroBalances ? 'bg-yellow-500' : 'bg-gray-700'}`}
                  onClick={toggleHideZero}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${hideZeroBalances ? 'left-5.5 translate-x-5' : 'left-0.5'}`}></div>
                </div>
              </label>
            </div>

            <div className="space-y-2">
              <button 
                onClick={() => {
                  setIsOpen(false);
                  useDepositModalStore.getState().openModal('deposit', 'methods');
                }}
                className="flex items-center justify-center w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-black font-black uppercase tracking-widest rounded-xl hover:from-emerald-400 hover:to-emerald-500 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.2)]"
              >
                <Wallet className="w-4 h-4 mr-2" /> Wallet Dashboard
              </button>
              <button 
                onClick={handleLogout}
                className="flex items-center justify-center w-full py-3 bg-gray-800 text-gray-300 font-bold uppercase tracking-widest rounded-xl hover:bg-gray-700 hover:text-white transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}





