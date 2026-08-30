'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import WalletDropdown from './WalletDropdown';
import ProfileDropdown from './ProfileDropdown';
import { useAuthModalStore } from '@/store/authModalStore';
import { useCurrencyStore, CURRENCY_SYMBOLS, Currency } from '@/store/currencyStore';
import { ChevronDown, Coins, Sparkles } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const POPULAR_CURRENCIES: { code: Currency; label: string; symbol: string }[] = [
  { code: 'INR', label: 'INR (₹)', symbol: '₹' },
  { code: 'USDT', label: 'USDT (₮)', symbol: '₮' },
  { code: 'BTC', label: 'Bitcoin (₿)', symbol: '₿' },
  { code: 'ETH', label: 'Ethereum (Ξ)', symbol: 'Ξ' },
  { code: 'USDC', label: 'USDC (C)', symbol: 'C' },
  { code: 'SOL', label: 'Solana (S)', symbol: 'S' }
];

export default function Header() {
  const pathname = usePathname();
  const { user, isLoading } = useUserStore();
  const { openModal } = useAuthModalStore();
  const { activeCurrency, setCurrency } = useCurrencyStore();

  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setCurrencyDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  let gameTitle = null;
  if (pathname?.includes('/games/play/aviator')) gameTitle = 'AVIATOR';
  else if (pathname?.includes('/games/play/big-small')) gameTitle = 'WINGO';
  else if (pathname?.includes('/games/play/mines')) gameTitle = 'MINES';

  const isGamePage = pathname?.includes('/games/play/');

  if (pathname?.startsWith('/admin') || pathname?.startsWith('/dashboard') || pathname?.startsWith('/profile')) {
    return null;
  }

  return (
    <header className={`w-full z-50 transition-all ${isGamePage ? "sticky top-0 bg-[#111622]/95 backdrop-blur-md border-b border-gray-800 shadow-xl" : "absolute top-0 bg-transparent"}`}>
      <div className="container mx-auto px-4 py-3.5 flex items-center justify-between">
        
        {/* LOGO */}
        <Link href="/" className="flex flex-col items-start justify-center group">
          <div className="flex items-center gap-2.5">
            <div className="relative w-9 h-9 transition-transform group-hover:scale-105">
              <Image 
                src="/logo.png" 
                alt="RXFURY Logo" 
                fill 
                className="object-contain invert drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]"
              />
            </div>
            <span className="text-2xl font-black text-white tracking-wider bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent">
              RXFURY
            </span>
          </div>
          {gameTitle && (
            <span className="text-red-500 font-black text-[10px] tracking-widest uppercase mt-0.5">
              {gameTitle}
            </span>
          )}
        </Link>
        
        {/* NAVIGATION LINKS */}
        <nav className="hidden lg:flex items-center space-x-7">
          <Link href="/#games" className="text-gray-300 hover:text-yellow-400 font-semibold text-sm transition-colors">Games</Link>
          <Link href="/#promotions" className="text-gray-300 hover:text-yellow-400 font-semibold text-sm transition-colors">Promotions</Link>
          <Link href="/vip" className="text-gray-300 hover:text-yellow-400 font-semibold text-sm transition-colors flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" /> VIP Club
          </Link>
          <Link href="/#affiliate" className="text-gray-300 hover:text-yellow-400 font-semibold text-sm transition-colors">Affiliate</Link>
        </nav>
        
        {/* RIGHT ACTIONS: CURRENCY TOGGLE & AUTH / WALLET */}
        <div className="flex items-center gap-3">
          
          {/* CURRENCY TOGGLE (INR <-> USDT / CRYPTO) */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/90 border border-white/10 hover:border-yellow-500/40 text-xs font-black text-white transition-all shadow-md cursor-pointer"
              title="Change platform display currency"
            >
              <Coins className="w-3.5 h-3.5 text-yellow-400" />
              <span>{activeCurrency}</span>
              <span className="text-yellow-400 font-mono text-xs">({CURRENCY_SYMBOLS[activeCurrency] || '₹'})</span>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${currencyDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Currency Dropdown Menu */}
            {currencyDropdownOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-[#131824] border border-white/15 rounded-2xl shadow-2xl p-1.5 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 border-b border-white/5 mb-1">
                  Select Currency
                </div>
                <div className="space-y-0.5">
                  {POPULAR_CURRENCIES.map((curr) => (
                    <button
                      key={curr.code}
                      onClick={() => {
                        setCurrency(curr.code);
                        setCurrencyDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left ${
                        activeCurrency === curr.code
                          ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span>{curr.label}</span>
                      {activeCurrency === curr.code && (
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-[0_0_6px_#facc15]"></span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* AUTHENTICATION & PROFILE CONTROLS */}
          {isLoading ? (
            <div className="w-24 h-9 bg-white/5 animate-pulse rounded-xl"></div>
          ) : user ? (
            // LOGGED IN STATE
            <div className="flex items-center space-x-2.5">
              <WalletDropdown />
              <ProfileDropdown />
            </div>
          ) : (
            // LOGGED OUT STATE: HIGH VISIBILITY CTA BUTTONS
            <div className="flex items-center gap-2.5">
              <button 
                onClick={() => openModal('login')}
                className="px-4 py-2 text-xs md:text-sm font-bold text-gray-200 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all uppercase tracking-wider cursor-pointer"
              >
                Log In
              </button>
              <button 
                onClick={() => openModal('register')}
                className="px-4 md:px-5 py-2 text-xs md:text-sm font-black bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.5)] hover:shadow-[0_0_30px_rgba(37,99,235,0.8)] hover:scale-105 uppercase tracking-wider cursor-pointer border-t border-blue-400/40"
              >
                Sign Up
              </button>
            </div>
          )}

        </div>
      </div>
    </header>
  );
}
