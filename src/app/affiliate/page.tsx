"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  Link as LinkIcon, 
  DollarSign, 
  Network, 
  Copy, 
  CheckCircle2, 
  TrendingUp, 
  MessageCircle, 
  Send
} from "lucide-react";
import Link from "next/link";
import { useUserStore } from "@/store/userStore";
import { useCurrencyStore, formatCurrency, convertFromBase, CURRENCY_SYMBOLS } from "@/store/currencyStore";
import { supabase } from "@/lib/supabaseClient";

// Dummy Data for Downline Table - would be replaced by real fetch
const dummyDownline = [
  { id: 1, userId: "FURY-92B1C", tier: "L1", turnover: 25000, commission: 500 },
  { id: 2, userId: "FURY-14A9F", tier: "L2", turnover: 10000, commission: 100 },
  { id: 3, userId: "FURY-88D2E", tier: "L1", turnover: 5000, commission: 100 },
  { id: 4, userId: "FURY-33C4A", tier: "L3", turnover: 40000, commission: 200 },
  { id: 5, userId: "FURY-71E5B", tier: "L2", turnover: 8500, commission: 85 },
];

export default function AffiliatePage() {
  const [dbAffiliateBalance, setDbAffiliateBalance] = useState(0);
  const [commissions, setCommissions] = useState<any[]>([]);

  useEffect(() => {
     fetch('/api/affiliate/claim')
       .then(r => r.json())
       .then(d => {
          if (d.affiliateWalletBalance !== undefined) {
             setDbAffiliateBalance(d.affiliateWalletBalance);
             setCommissions(d.recentCommissions || []);
          }
       }).catch(console.error);
  }, []);

  const { user } = useUserStore();
  const { activeCurrency, fetchBalances } = useCurrencyStore();
  
  const [copiedLink, setCopiedLink] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimStatus, setClaimStatus] = useState<{type: 'success'|'error', message: string} | null>(null);

  // Generate dynamic referral link based on shortened UUID
  const systematicId = user ? `FURY-${user.id.substring(0, 5).toUpperCase()}` : "FURY-GUEST";
  // Assuming frontend is hosted at current origin
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://rxfurygame.com';
  const referralLink = `${baseUrl}/ref/${systematicId}`;
  
  const shareText = `Join me on RXFURY and get a 100% Welcome Bonus! Use my link: ${referralLink}`;
  const encodedShareText = encodeURIComponent(shareText);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleClaim = async () => {
    if (!user || dbAffiliateBalance <= 0) return;
    
    setIsClaiming(true);
    setClaimStatus(null);
    
    try {
      // In a real app, you would use a secure Supabase RPC for this transaction
      // For now, we simulate the backend call with direct update for demo purposes
      
      const { data: currentProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('mainWalletBalance, dbAffiliateBalance')
        .eq('id', user.id)
        .single();
        
      if (fetchError) throw fetchError;
      
      const newMain = (currentProfile.mainWalletBalance || 0) + currentProfile.dbAffiliateBalance;
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          mainWalletBalance: newMain,
          dbAffiliateBalance: 0
        })
        .eq('id', user.id);
        
      if (updateError) throw updateError;
      
      // Refresh global store
      await fetchBalances(user.id);
      
      setClaimStatus({ type: 'success', message: 'Claimed successfully!' });
      setTimeout(() => setClaimStatus(null), 3000);
      
    } catch (err: any) {
      setClaimStatus({ type: 'error', message: err.message || 'Failed to claim' });
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f16] text-gray-100 font-sans pb-16">
      
      {/* Hero Section & Referral Link Panel */}
      <div className="bg-[#131824] border-b border-gray-800 pt-16 pb-12 px-4 md:px-8 shadow-2xl relative overflow-hidden mt-16">
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <Network className="w-16 h-16 text-green-500 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
            Build Your Empire: <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">3-Tier Affiliate Program</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-10">
            Invite friends, build your network, and earn lifetime passive income from every bet placed in your downline up to 3 levels deep.
          </p>

          {/* Referral Link Panel */}
          <div className="max-w-2xl mx-auto bg-[#0a0f16] border border-gray-700 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
            <label className="block text-sm font-semibold text-gray-300 mb-3 text-left">Your Unique Referral Link</label>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-grow w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LinkIcon className="w-5 h-5 text-gray-500" />
                </div>
                <input 
                  type="text" 
                  readOnly 
                  value={referralLink}
                  className="w-full pl-10 pr-4 py-3.5 bg-[#131824] border border-gray-700 rounded-xl text-green-400 font-mono text-sm focus:outline-none"
                />
              </div>
              <div className="flex w-full sm:w-auto gap-2">
                <button 
                  onClick={handleCopy}
                  className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 text-white px-6 py-3.5 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_20px_rgba(37,99,235,0.5)] flex items-center justify-center whitespace-nowrap"
                >
                  {copiedLink ? (
                    <><CheckCircle2 className="w-5 h-5 mr-2" /> Copied</>
                  ) : (
                    <><Copy className="w-5 h-5 mr-2" /> Copy Link</>
                  )}
                </button>
                <a 
                  href={`whatsapp://send?text=${encodedShareText}`}
                  className="bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/30 p-3.5 rounded-xl transition-colors flex items-center justify-center"
                  title="Share to WhatsApp"
                >
                  <MessageCircle className="w-5 h-5" />
                </a>
                <a 
                  href={`tg://msg?text=${encodedShareText}`}
                  className="bg-[#0088cc]/20 hover:bg-[#0088cc]/30 text-[#0088cc] border border-[#0088cc]/30 p-3.5 rounded-xl transition-colors flex items-center justify-center"
                  title="Share to Telegram"
                >
                  <Send className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-12 space-y-12">
        
        {/* Quick Stats & Claim Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#131824] border border-gray-800 rounded-2xl p-6 shadow-xl flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium mb-1">Total Network Size</p>
              <h3 className="text-3xl font-black text-white">145</h3>
            </div>
            <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-[#131824] border border-gray-800 rounded-2xl p-6 shadow-xl flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium mb-1">Active Players Today</p>
              <h3 className="text-3xl font-black text-white">32</h3>
            </div>
            <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center border border-purple-500/20">
              <TrendingUp className="w-6 h-6 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-[#131824] border border-gray-800 rounded-2xl p-6 shadow-xl flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium mb-1">Total Earned</p>
              <h3 className="text-3xl font-black text-white">{CURRENCY_SYMBOLS[activeCurrency]} 12,450</h3>
            </div>
            <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20">
              <DollarSign className="w-6 h-6 text-green-500" />
            </div>
          </div>
          
          <div className="bg-[#131824] border border-green-500/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(34,197,94,0.1)] flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-2xl"></div>
            <div>
              <p className="text-green-400 text-sm font-bold uppercase tracking-wider mb-1">Available to Claim</p>
              <h3 className="text-3xl font-black text-green-500 mb-4">{CURRENCY_SYMBOLS[activeCurrency]} {formatCurrency(convertFromBase(dbAffiliateBalance, activeCurrency), activeCurrency)}</h3>
            </div>
            <button 
              onClick={handleClaim}
              disabled={isClaiming || dbAffiliateBalance <= 0}
              className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2.5 rounded-xl shadow-[0_0_15px_rgba(34,197,94,0.4)] hover:shadow-[0_0_25px_rgba(34,197,94,0.6)] transition-all disabled:opacity-50"
            >
              {isClaiming ? 'Claiming...' : 'Claim to Main Wallet'}
            </button>
            {claimStatus && (
              <p className={`text-xs mt-2 text-center font-bold ${claimStatus.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                {claimStatus.message}
              </p>
            )}
          </div>
        </div>

        {/* Commission Structure Overview */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Network className="w-6 h-6 mr-3 text-blue-500" />
            How the 3-Tier System Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#131824] border border-gray-800 rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 text-9xl font-black text-gray-800/30 group-hover:text-blue-500/10 transition-colors pointer-events-none">1</div>
              <h3 className="text-xl font-bold text-white mb-2">Level 1 <span className="text-gray-400 text-sm font-normal">(Direct)</span></h3>
              <p className="text-gray-400 text-sm mb-4">Users who register directly using your referral link.</p>
              <div className="text-3xl font-black text-blue-400">2% <span className="text-sm font-medium text-gray-500 uppercase">Commission</span></div>
            </div>
            
            <div className="bg-[#131824] border border-gray-800 rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 text-9xl font-black text-gray-800/30 group-hover:text-purple-500/10 transition-colors pointer-events-none">2</div>
              <h3 className="text-xl font-bold text-white mb-2">Level 2 <span className="text-gray-400 text-sm font-normal">(Indirect)</span></h3>
              <p className="text-gray-400 text-sm mb-4">Users who register via your Level 1 referrals' links.</p>
              <div className="text-3xl font-black text-purple-400">1% <span className="text-sm font-medium text-gray-500 uppercase">Commission</span></div>
            </div>
            
            <div className="bg-[#131824] border border-gray-800 rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 text-9xl font-black text-gray-800/30 group-hover:text-emerald-500/10 transition-colors pointer-events-none">3</div>
              <h3 className="text-xl font-bold text-white mb-2">Level 3 <span className="text-gray-400 text-sm font-normal">(Extended)</span></h3>
              <p className="text-gray-400 text-sm mb-4">Users who register via your Level 2 referrals' links.</p>
              <div className="text-3xl font-black text-emerald-400">0.5% <span className="text-sm font-medium text-gray-500 uppercase">Commission</span></div>
            </div>
          </div>
        </div>

        {/* Network Downline Table */}
        <div className="bg-[#131824] border border-gray-800 rounded-2xl p-6 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-lg text-white">Recent Downline Activity</h2>
            <Link href="/affiliate/network" className="text-sm text-blue-500 hover:text-blue-400 transition-colors">View All Network</Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-[#0a0f16] border-b border-gray-800 text-gray-500 uppercase text-xs font-semibold">
                <tr>
                  <th className="px-4 py-4 rounded-tl-lg">User ID</th>
                  <th className="px-4 py-4">Network Tier</th>
                  <th className="px-4 py-4 text-right">Turnover Amount</th>
                  <th className="px-4 py-4 text-right rounded-tr-lg">Commission Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {commissions.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-4 font-mono text-white whitespace-nowrap">{row.userId}</td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                        row.tier === 'L1' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                        row.tier === 'L2' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 
                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {row.tier}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right font-medium">{CURRENCY_SYMBOLS[activeCurrency]} {formatCurrency(convertFromBase((row.amount * 50), activeCurrency), activeCurrency)}</td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-green-400 font-bold">+ {CURRENCY_SYMBOLS[activeCurrency]} {formatCurrency(convertFromBase(row.amount, activeCurrency), activeCurrency)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

