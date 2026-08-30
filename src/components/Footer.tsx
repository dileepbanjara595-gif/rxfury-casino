'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ShieldCheck, Lock, Award, HeartHandshake, CheckCircle2 } from 'lucide-react';

const CRYPTO_PAYMENTS = [
  { name: 'Bitcoin', symbol: 'BTC', icon: '₿', color: 'text-amber-500 border-amber-500/20 bg-amber-500/10' },
  { name: 'Tether', symbol: 'USDT', icon: '₮', color: 'text-emerald-400 border-emerald-400/20 bg-emerald-400/10' },
  { name: 'Ethereum', symbol: 'ETH', icon: 'Ξ', color: 'text-purple-400 border-purple-400/20 bg-purple-400/10' },
  { name: 'USD Coin', symbol: 'USDC', icon: 'C', color: 'text-blue-400 border-blue-400/20 bg-blue-400/10' },
  { name: 'Solana', symbol: 'SOL', icon: 'S', color: 'text-fuchsia-400 border-fuchsia-400/20 bg-fuchsia-400/10' },
  { name: 'Litecoin', symbol: 'LTC', icon: 'Ł', color: 'text-slate-300 border-slate-300/20 bg-slate-300/10' },
  { name: 'UPI / INR', symbol: '₹', icon: '₹', color: 'text-green-400 border-green-400/20 bg-green-400/10' }
];

export default function Footer() {
  const pathname = usePathname();

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="bg-[#0c1017] text-gray-400 pt-16 pb-12 mt-auto border-t border-gray-800/80 relative z-20">
      <div className="container mx-auto px-4 md:px-8">
        
        {/* TOP SECTION: 4 COLUMNS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          
          {/* Column 1: Brand & License Seal */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative w-9 h-9">
                <Image src="/logo.png" alt="RXFURY Logo" fill className="object-contain invert" />
              </div>
              <span className="text-2xl font-black text-white tracking-wider">RXFURY</span>
            </div>
            <p className="text-xs md:text-sm text-gray-400 leading-relaxed">
              The premier real-money crypto casino and multiplayer gaming platform. 100% provably fair algorithms with instant blockchain payouts.
            </p>

            {/* Curacao eGaming License Badge */}
            <div className="p-3.5 bg-gray-900/90 border border-yellow-500/30 rounded-2xl flex items-center gap-3 shadow-lg group hover:border-yellow-500/50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/20 to-amber-600/30 border border-yellow-500/40 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-black tracking-wider uppercase text-yellow-400">Curaçao eGaming</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-yellow-500" />
                </div>
                <p className="text-[10px] text-gray-400 font-mono">License No. 8048/JAZ</p>
                <p className="text-[9px] text-gray-500">Verified & Authenticated Operator</p>
              </div>
            </div>
          </div>

          {/* Column 2: Platform Links */}
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest text-white mb-4 border-l-2 border-blue-500 pl-2">
              Explore Games
            </h4>
            <ul className="space-y-2.5 text-xs md:text-sm">
              <li><Link href="/games/play/aviator" className="hover:text-yellow-400 transition-colors">Aviator Crash</Link></li>
              <li><Link href="/games/play/big-small" className="hover:text-yellow-400 transition-colors">Win Go / Big & Small</Link></li>
              <li><Link href="/games/play/mines" className="hover:text-yellow-400 transition-colors">Mines</Link></li>
              <li><Link href="/games/play/teen-patti" className="hover:text-yellow-400 transition-colors">Teen Patti</Link></li>
              <li><Link href="/games/play/blackjack" className="hover:text-yellow-400 transition-colors">Blackjack</Link></li>
              <li><Link href="/games" className="text-blue-400 font-bold hover:underline">All 12+ Games →</Link></li>
            </ul>
          </div>

          {/* Column 3: Rewards & Community */}
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest text-white mb-4 border-l-2 border-yellow-500 pl-2">
              Rewards & Club
            </h4>
            <ul className="space-y-2.5 text-xs md:text-sm">
              <li><Link href="/vip" className="hover:text-yellow-400 transition-colors flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-yellow-500" /> Elite VIP Club</Link></li>
              <li><Link href="/promotions" className="hover:text-yellow-400 transition-colors">Welcome Promotions</Link></li>
              <li><Link href="/affiliate" className="hover:text-yellow-400 transition-colors">3-Tier Affiliate Program</Link></li>
              <li><Link href="/dashboard" className="hover:text-yellow-400 transition-colors">User Dashboard</Link></li>
              <li>
                <span className="text-gray-500">Support: </span>
                <a href="mailto:team@rxfurygame.com" className="text-blue-400 hover:underline">team@rxfurygame.com</a>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal & Compliance */}
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest text-white mb-4 border-l-2 border-emerald-500 pl-2">
              Legal & Safety
            </h4>
            <ul className="space-y-2.5 text-xs md:text-sm">
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/kyc-aml" className="hover:text-white transition-colors flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-emerald-400" /> KYC & AML Policy</Link></li>
              <li><Link href="/responsible-gaming" className="hover:text-white transition-colors flex items-center gap-1.5"><HeartHandshake className="w-3.5 h-3.5 text-rose-400" /> Responsible Gaming</Link></li>
              <li className="pt-2">
                <span className="inline-block bg-red-500/10 border border-red-500/30 text-red-400 px-2.5 py-1 rounded-lg text-xs font-black">
                  18+ ONLY
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* MIDDLE SECTION: ACCEPTED PAYMENT METHODS & CRYPTO BANNER */}
        <div className="border-t border-gray-800/80 pt-8 pb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Accepted Cryptocurrencies & Instant Gateways
            </span>
            <span className="text-xs text-gray-500">
              Instant Confirmations • Zero Processing Fees
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {CRYPTO_PAYMENTS.map((crypto) => (
              <div
                key={crypto.symbol}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold ${crypto.color} backdrop-blur-sm transition-transform hover:-translate-y-0.5`}
              >
                <span className="text-sm font-black">{crypto.icon}</span>
                <span>{crypto.symbol}</span>
                <span className="text-[10px] opacity-70 hidden xl:inline">({crypto.name})</span>
              </div>
            ))}
          </div>
        </div>

        {/* BOTTOM SECTION: COPYRIGHT & DISCLAIMER */}
        <div className="border-t border-gray-800/80 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500 text-center md:text-left">
          <p>
            &copy; {new Date().getFullYear()} RXFURY. All rights reserved. Registered & Licensed by Curacao eGaming (No. 8048/JAZ).
          </p>
          <p className="max-w-md">
            Gambling can be addictive. Please play responsibly. Only gamble with funds you can comfortably afford to risk.
          </p>
        </div>

      </div>
    </footer>
  );
}
