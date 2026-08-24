'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import WalletDropdown from './WalletDropdown';
import ProfileDropdown from './ProfileDropdown';

import { useAuthModalStore } from '@/store/authModalStore';

export default function Header() {
  const pathname = usePathname();
  const { user, isLoading } = useUserStore();
  const { openModal } = useAuthModalStore();

  
  let gameTitle = null;
  if (pathname?.includes('/games/play/aviator')) gameTitle = 'AVIATOR';
  else if (pathname?.includes('/games/play/big-small')) gameTitle = 'WINGO';
  else if (pathname?.includes('/games/play/mines')) gameTitle = 'MINES';

  const isGamePage = pathname?.includes('/games/play/');

  
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <header className={`w-full z-50 ${isGamePage ? "sticky top-0 bg-[#131824] border-b border-gray-800" : "absolute top-0 bg-transparent"}`}>
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                <Link href="/" className="flex flex-col items-start justify-center">
          <div className="flex items-center gap-2">
            <div className="relative w-10 h-10">
              <Image 
                src="/logo.png" 
                alt="RXFURY Logo" 
                fill 
                className="object-contain invert"
              />
            </div>
            <span className="text-2xl font-black text-white tracking-wider">RXFURY</span>
          </div>
          {gameTitle && (
            <span className="text-red-500 font-bold text-xs uppercase tracking-widest mt-1">
              {gameTitle}
            </span>
          )}
        </Link>
        
        <nav className="hidden md:flex space-x-8">
          <Link href="/#games" className="text-gray-300 hover:text-yellow-500 font-medium transition-colors">Games</Link>
          <Link href="/#promotions" className="text-gray-300 hover:text-yellow-500 font-medium transition-colors">Promotions</Link>
          <Link href="/#vip" className="text-gray-300 hover:text-yellow-500 font-medium transition-colors">VIP</Link>
          <Link href="/#affiliate" className="text-gray-300 hover:text-yellow-500 font-medium transition-colors">Affiliate</Link>
        </nav>
        
        <div className="flex items-center gap-6">
          {isLoading ? (
            <div className="w-20 h-10 bg-white/5 animate-pulse rounded-lg"></div>
          ) : user ? (
            // LOGGED IN STATE
            <div className="flex items-center space-x-3">
              <WalletDropdown />
              <ProfileDropdown />
            </div>
          ) : (
            // LOGGED OUT STATE
            <div className="flex space-x-3">
              <button 
                onClick={() => openModal('login')}
                className="px-4 py-2 text-sm font-bold text-gray-300 hover:text-yellow-500 transition-colors uppercase tracking-widest cursor-pointer"
              >
                Log In
              </button>
              <button 
                onClick={() => openModal('register')}
                className="px-4 py-2 text-sm font-black bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-500 hover:to-blue-400 transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)] uppercase tracking-widest cursor-pointer"
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



