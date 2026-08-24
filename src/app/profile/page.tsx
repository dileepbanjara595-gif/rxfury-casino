'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUserStore } from '@/store/userStore';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useCurrencyStore, CURRENCY_SYMBOLS, formatCurrency, convertFromBase } from '@/store/currencyStore';
import { 
  User, Mail, Lock, Shield, 
  Gamepad2, Trophy, Target, 
  Clock, ArrowUpRight, ArrowDownLeft, 
  Wallet, Settings, CheckCircle2 
} from 'lucide-react';

export default function ProfilePage() {
  const { user, profileData, isLoading } = useUserStore();
  const { baseBalance, activeCurrency } = useCurrencyStore();
  const router = useRouter();

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  // Dummy Stats Data
  const stats = [
    { label: 'Total Games', value: '1,248', icon: Gamepad2, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Total Won', value: '₹4,85,000', icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { label: 'Win Rate', value: '64.2%', icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  ];

  // Dummy Activity History
  const activityHistory = [
    { id: 1, type: 'DEPOSIT', amount: '+500 USDT', date: 'Today, 14:30', status: 'Completed', icon: ArrowDownLeft, color: 'text-emerald-400' },
    { id: 2, type: 'BET', amount: '-50 USDT', date: 'Yesterday, 21:15', status: 'Lost', icon: Gamepad2, color: 'text-gray-400' },
    { id: 3, type: 'WIN', amount: '+120 USDT', date: 'Yesterday, 21:10', status: 'Completed', icon: Trophy, color: 'text-yellow-400' },
    { id: 4, type: 'WITHDRAWAL', amount: '-1000 USDT', date: 'Oct 12, 09:00', status: 'Processing', icon: ArrowUpRight, color: 'text-orange-400' },
  ];

  if (isLoading || !user) {
    return <div className="min-h-screen bg-[#1a1d29] flex items-center justify-center"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const shortUserId = user.id.substring(0, 8);
  const anyUser = user as any;
  
    const displayName = anyUser?.firstName ? (anyUser.firstName + ' ' + (anyUser.lastName || '')).trim() : 'Player' + user.id.substring(0, 4);

    const avatarSrc = anyUser?.profilePhoto 
    ? anyUser.profilePhoto 
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${anyUser?.id || "default"}`;

  return (
    <div className="min-h-screen bg-[#1a1d29] text-white font-sans selection:bg-emerald-500/30 pb-20 pt-24">
      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors mr-4 bg-white/5 p-2 rounded-xl hover:bg-white/10 border border-white/5">
            <ArrowDownLeft className="w-5 h-5 rotate-45" />
          </Link>
          <h1 className="text-3xl font-black tracking-widest uppercase flex items-center">
            My <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600 ml-2">Profile</span>
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Player Card */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-[#131824] border border-gray-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
              
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 p-1 mb-4 shadow-[0_0_20px_rgba(16,185,129,0.3)] overflow-hidden">
                    <img src={avatarSrc} alt="Avatar" className="w-full h-full rounded-full bg-[#1a1d29] object-cover" />
                  </div>
                  <span className="absolute bottom-4 right-0 w-4 h-4 bg-green-500 border-2 border-[#131824] rounded-full"></span>
                </div>
                
                <h2 className="text-2xl font-black tracking-wide">{displayName}</h2>
                <p className="text-sm font-bold text-emerald-400 mt-1 uppercase tracking-widest">{shortUserId}</p>
                <div className="flex items-center text-gray-400 text-sm mt-1">
                  <Mail className="w-3.5 h-3.5 mr-1.5" />
                  {user.email}
                </div>
                
                <div className="mt-6 w-full bg-black/40 rounded-2xl p-4 border border-gray-800/50">
                  <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-1">Available Balance</p>
                  <div className="flex items-center justify-center text-2xl font-black text-emerald-400">
                    <Wallet className="w-5 h-5 mr-2 opacity-70" />
                    {formatCurrency(convertFromBase(baseBalance, activeCurrency), activeCurrency)} {activeCurrency}
                  </div>
                </div>

                <p className="text-xs text-gray-500 mt-6 flex items-center justify-center uppercase tracking-widest">
                  <Clock className="w-3 h-3 mr-1" /> Member since Oct 2026
                </p>
              </div>
            </div>

            {/* Account Settings */}
            <div className="bg-[#131824] border border-gray-800 rounded-3xl p-6 shadow-2xl">
              <h3 className="text-lg font-black uppercase tracking-widest mb-6 flex items-center border-b border-gray-800 pb-4">
                <Settings className="w-5 h-5 mr-3 text-blue-400" />
                Account Settings
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Full Name</label>
                  <div className="flex space-x-2">
                    <input 
                      type="text" 
                      value={displayName}
                      disabled
                      className="flex-1 bg-black/40 border border-gray-800 rounded-xl px-4 py-2.5 text-white font-medium focus:outline-none focus:border-emerald-500 disabled:opacity-70 transition-colors"
                    />
                      <Link 
                        href="/settings"
                        className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl transition-colors flex items-center"
                      >
                        Edit
                      </Link>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Email Address</label>
                  <input 
                    type="email" 
                    value={user.email || ''}
                    disabled
                    className="w-full bg-black/40 border border-gray-800 rounded-xl px-4 py-2.5 text-gray-500 font-medium cursor-not-allowed"
                  />
                  <p className="text-xs text-emerald-500 mt-2 flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Email Verified
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Stats & History */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Gaming Statistics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {stats.map((stat, idx) => (
                <div key={idx} className="bg-[#131824] border border-gray-800 rounded-3xl p-6 relative overflow-hidden group hover:border-gray-600 transition-colors">
                  <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} rounded-bl-full blur-2xl group-hover:scale-110 transition-transform`}></div>
                  <stat.icon className={`w-8 h-8 ${stat.color} mb-4 relative z-10`} />
                  <p className="text-gray-400 text-sm font-bold uppercase tracking-wider relative z-10">{stat.label}</p>
                  <p className="text-3xl font-black mt-1 relative z-10">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Recent Activity Table */}
            <div className="bg-[#131824] border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-black/20">
                <h3 className="text-lg font-black uppercase tracking-widest flex items-center">
                  <Shield className="w-5 h-5 mr-3 text-purple-400" />
                  Recent Activity
                </h3>
                <button className="text-sm text-gray-400 hover:text-white font-bold transition-colors">
                  View All
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-black/40 text-gray-500 text-xs uppercase tracking-wider">
                      <th className="p-4 font-bold">Transaction / Event</th>
                      <th className="p-4 font-bold">Amount</th>
                      <th className="p-4 font-bold">Date</th>
                      <th className="p-4 font-bold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    {activityHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg bg-black/40 border border-gray-800 group-hover:border-gray-600 transition-colors`}>
                              <item.icon className={`w-4 h-4 ${item.color}`} />
                            </div>
                            <span className="font-bold">{item.type}</span>
                          </div>
                        </td>
                        <td className={`p-4 font-black ${item.amount.startsWith('+') ? 'text-emerald-400' : 'text-gray-300'}`}>
                          {item.amount}
                        </td>
                        <td className="p-4 text-gray-400 text-sm">
                          {item.date}
                        </td>
                        <td className="p-4 text-right">
                          <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            item.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                            item.status === 'Processing' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 
                            'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}





