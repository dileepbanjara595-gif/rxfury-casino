'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Wallet, LogOut, Settings } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { supabase } from '@/lib/supabaseClient';
import { useDepositModalStore } from '@/store/depositModalStore';

export default function ProfileDropdown() {
  const { user, profileData, clearUser } = useUserStore();
  const { openModal } = useDepositModalStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      // 1. Clear Supabase Session
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error.message);
        // We still continue to clear local session even if Supabase fails
      }
      
      // 2. Clear global state & local storage
      clearUser();
      if (typeof window !== 'undefined') {
        localStorage.clear();
      }
      
      setIsOpen(false);
      
      // 3. Clear NextAuth session (this redirects to / automatically)
      const { signOut: nextAuthSignOut } = await import('next-auth/react');
      await nextAuthSignOut({ callbackUrl: '/' });
    } catch (err) {
      console.error('Unexpected error during logout:', err);
    }
  };

  const navigateTo = (path: string) => {
    setIsOpen(false);
    router.push(path);
  };

  if (!user) return null;

  const displayName = profileData?.firstName 
    ? `${profileData.firstName} ${profileData.lastName || ''}`.trim()
    : user.email;

  const avatarSrc = profileData?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`;

  return (
    <div className="relative hidden sm:block" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 p-0.5 shadow-[0_0_10px_rgba(16,185,129,0.4)] hover:scale-105 transition-transform cursor-pointer border-none outline-none focus:ring-2 focus:ring-emerald-500 overflow-hidden"
      >
         <img src={avatarSrc} alt="Profile" className="w-full h-full rounded-full bg-[#1a1d29] object-cover" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-56 bg-[#1a1d29] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
          <div className="p-4 border-b border-white/5 bg-white/5">
            <p className="text-sm font-bold text-white truncate">{displayName}</p>
            <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-bold">Player Account</p>
          </div>
          
          <div className="p-2 space-y-1">
            <Link 
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-3 text-sm font-bold text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              <User className="w-4 h-4 mr-3 text-emerald-400" />
              My Profile
            </Link>

            <Link 
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-3 text-sm font-bold text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              <Settings className="w-4 h-4 mr-3 text-emerald-400" />
              Settings
            </Link>
            
                          <button 
                onClick={() => {
                  setIsOpen(false);
                  useDepositModalStore.getState().openModal('deposit', 'methods');
                }}
              className="flex items-center px-4 py-3 text-sm font-bold text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors text-left"
            >
              <Wallet className="w-4 h-4 mr-3 text-emerald-400" />
              Wallet
              </button>
            
            <div className="my-1 border-t border-white/5"></div>
            
            <button 
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 text-sm font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors text-left"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

