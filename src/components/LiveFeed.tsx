'use client';

import { useState, useEffect } from 'react';
import { useCurrencyStore, CURRENCY_SYMBOLS, convertFromBase, formatCurrency } from '@/store/currencyStore';

interface LiveWin {
  id: string;
  user: string;
  game: string;
  baseAmount: number; // in INR base
  multiplier: string;
}

const GAMES = [
  'Aviator',
  'Chicken Road',
  'Mines',
  'Teen Patti',
  'Blackjack',
  'Big & Small',
  'Poker',
  'K3 Lottery',
  'Moto Racing',
  'Rummy'
];

const USER_PREFIXES = [
  'CryptoKing', 'Rahul', 'Alex', 'VipPlayer', 'LuckyStar', 'Winner',
  'Aarav', 'Neha', 'Sanjay', 'Priya', 'Tiger', 'Shadow', 'Ace',
  'FuryMaster', 'Rohan', 'Elena', 'Vikram', 'MoonShot', 'BullRider'
];

function generateRandomWin(): LiveWin {
  const prefix = USER_PREFIXES[Math.floor(Math.random() * USER_PREFIXES.length)];
  const suffix = Math.floor(100 + Math.random() * 900);
  const user = `${prefix}***${suffix}`;
  const game = GAMES[Math.floor(Math.random() * GAMES.length)];
  
  // Random payout between 500 and 150000 INR
  const isBigWin = Math.random() < 0.15;
  const baseAmount = isBigWin
    ? Math.floor(30000 + Math.random() * 120000)
    : Math.floor(500 + Math.random() * 15000);

  const mult = (1.2 + Math.random() * 18).toFixed(2) + 'x';

  return {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    user,
    game,
    baseAmount,
    multiplier: mult
  };
}

export default function LiveFeed() {
  const { activeCurrency } = useCurrencyStore();
  const sym = CURRENCY_SYMBOLS[activeCurrency] || '₹';

  const [wins, setWins] = useState<LiveWin[]>([]);

  useEffect(() => {
    // Generate initial set of 12 wins
    const initial = Array.from({ length: 12 }, () => generateRandomWin());
    setWins(initial);

    // Periodically add new real-time simulated wins
    const interval = setInterval(() => {
      setWins((prev) => {
        const next = [generateRandomWin(), ...prev.slice(0, 19)];
        return next;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#1a1d29] border-y border-white/5 py-3 relative overflow-hidden flex items-center shadow-lg w-full">
      {/* Left Live Badge */}
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#1a1d29] via-[#1a1d29]/90 to-transparent z-20 pointer-events-none flex items-center px-4">
        <div className="flex items-center gap-2 bg-black/70 px-3 py-1.5 rounded-full border border-green-500/30 backdrop-blur-md shadow-[0_0_15px_rgba(34,197,94,0.2)]">
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]"></div>
          <span className="text-gray-200 text-xs font-black uppercase tracking-widest">Live</span>
        </div>
      </div>

      {/* Scrolling Content */}
      <div className="flex space-x-6 animate-[scroll_35s_linear_infinite] whitespace-nowrap px-4 pl-[140px] will-change-transform">
        {[...wins, ...wins].map((win, idx) => {
          const displayAmount = convertFromBase(win.baseAmount, activeCurrency);
          const formatted = formatCurrency(displayAmount, activeCurrency);

          return (
            <div
              key={`${win.id}-${idx}`}
              className="flex items-center space-x-3 bg-black/50 px-4 py-2 rounded-xl border border-white/5 shrink-0 hover:border-white/20 transition-colors shadow-sm"
            >
              <span className="text-gray-300 font-bold text-xs md:text-sm">{win.user}</span>
              <span className="text-gray-600 text-xs">played</span>
              <span className="text-blue-400 font-bold text-xs md:text-sm">{win.game}</span>
              <span className="text-gray-600 text-xs">won</span>
              <span className="text-green-400 font-black text-xs md:text-sm drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]">
                +{sym} {formatted}
              </span>
            </div>
          );
        })}
      </div>

      {/* Right Gradient Fade */}
      <div className="absolute right-0 top-0 bottom-0 w-28 bg-gradient-to-l from-[#1a1d29] to-transparent z-20 pointer-events-none"></div>
    </div>
  );
}
