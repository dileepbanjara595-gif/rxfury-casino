"use client";

import { useState, useEffect } from "react";
import { Crown, Star, Shield, Zap, Info, CheckCircle2, Wallet, ArrowRight, Award } from "lucide-react";
import Link from "next/link";
import { useUserStore } from "@/store/userStore";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useCurrencyStore, CURRENCY_SYMBOLS, convertFromBase, formatCurrency } from "@/store/currencyStore";

const vipTiers = [
  { level: "L1", basePrice: 0, name: "Bronze", color: "from-amber-600 to-amber-800", text: "text-amber-100", shadow: "shadow-amber-500/20", rakeback: "5%" },
  { level: "L2", basePrice: 1500, name: "Silver", color: "from-slate-400 to-slate-600", text: "text-slate-100", shadow: "shadow-slate-500/20", rakeback: "7%" },
  { level: "L3", basePrice: 4000, name: "Gold", color: "from-yellow-400 to-yellow-600", text: "text-yellow-100", shadow: "shadow-yellow-500/40", rakeback: "9%" },
  { level: "L4", basePrice: 8500, name: "Platinum", color: "from-blue-500 to-blue-700", text: "text-blue-100", shadow: "shadow-blue-500/20", rakeback: "11%" },
  { level: "L5", basePrice: 15000, name: "Emerald", color: "from-emerald-400 to-emerald-700", text: "text-emerald-100", shadow: "shadow-emerald-500/20", rakeback: "13%" },
  { level: "L6", basePrice: 25000, name: "Ruby", color: "from-rose-500 to-rose-700", text: "text-rose-100", shadow: "shadow-rose-500/20", rakeback: "15%" },
  { level: "L7", basePrice: 50000, name: "Diamond", color: "from-cyan-300 via-white to-cyan-500", text: "text-cyan-900", shadow: "shadow-cyan-500/50", rakeback: "18%" },
  { level: "L8", basePrice: 100000, name: "Crown", color: "from-amber-300 via-yellow-400 to-yellow-600", text: "text-amber-900", shadow: "shadow-amber-500/60", rakeback: "20%" },
];

export default function VIPClubPage() {
  const router = useRouter();
  const { session } = useUserStore();
  const { activeCurrency, baseBalance } = useCurrencyStore();
  const sym = CURRENCY_SYMBOLS[activeCurrency] || '₹';
  
  const [currentVipLevel, setCurrentVipLevel] = useState(1);
  const [walletBalance, setWalletBalance] = useState(0);
  
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [targetUpgrade, setTargetUpgrade] = useState<any>(null);

  useEffect(() => {
    if (session?.user) {
      setCurrentVipLevel((session.user as any)?.vipLevelId || 1);
    }
    setWalletBalance(baseBalance || 0);
  }, [session, baseBalance]);

  const handleUpgrade = async (tier: any) => {
    if (walletBalance < tier.basePrice) {
      setTargetUpgrade(tier);
      setShowDepositModal(true);
      return;
    }

    setIsProcessing(tier.level);
    try {
      const res = await fetch("/api/vip/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level: tier.level, price: tier.basePrice })
      });
      const data = await res.json();

      if (res.ok) {
        setWalletBalance(data.newBalance);
        setCurrentVipLevel(data.newLevel);
        setShowSuccessModal(true);
      } else {
        if (data.code === "INSUFFICIENT_FUNDS") {
          setTargetUpgrade(tier);
          setShowDepositModal(true);
        } else {
          alert(data.error || "Upgrade failed");
        }
      }
    } catch (err) {
      alert("Something went wrong");
    } finally {
      setIsProcessing(null);
    }
  };

  const currentTurnover = walletBalance * 2.5; 
  const targetTurnover = currentVipLevel < 8 ? vipTiers[currentVipLevel].basePrice * 10 : currentTurnover;
  const progressPercent = Math.min((currentTurnover / (targetTurnover || 1)) * 100, 100);
  const currentTierObj = vipTiers[Math.max(0, currentVipLevel - 1)] || vipTiers[0];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans pb-16 selection:bg-yellow-500/30">
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gray-900 border-b border-gray-800 pt-28 pb-20 px-4 shadow-2xl">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-yellow-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Crown className="w-16 h-16 text-yellow-500 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6">
            RXFURY <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600">Elite VIP Club</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
            Ascend through standard competitive tiers from Bronze to Crown. Unlock higher withdrawal limits, instant rakeback up to 20%, and dedicated VIP hosting.
          </p>
        </div>
      </div>

      {/* Current Status Banner */}
      <div className="max-w-5xl mx-auto px-4 -mt-10 relative z-20">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <p className="text-gray-400 text-sm uppercase tracking-widest font-semibold mb-1">Your Status</p>
              <div className="flex items-center justify-center md:justify-start space-x-3">
                <h2 className="text-3xl font-black text-white">VIP Level {currentVipLevel}</h2>
                <span className={`bg-gray-800 ${currentTierObj.text} text-xs font-bold px-2.5 py-1 rounded border border-gray-700 uppercase tracking-wider`}>
                  {currentTierObj.name} Member
                </span>
              </div>
              <p className="text-xs text-gray-400 font-mono mt-2">
                Wallet: {sym} {formatCurrency(convertFromBase(walletBalance, activeCurrency), activeCurrency)}
              </p>
            </div>

            <div className="w-full md:w-1/2">
              <div className="flex justify-between text-sm text-gray-400 mb-2 font-medium">
                <span>Turnover: {sym} {formatCurrency(convertFromBase(currentTurnover, activeCurrency), activeCurrency)}</span>
                {currentVipLevel < 8 && (
                  <span>Next: L{currentVipLevel + 1} ({sym} {formatCurrency(convertFromBase(targetTurnover, activeCurrency), activeCurrency)})</span>
                )}
              </div>
              <div className="h-3 w-full bg-gray-950 rounded-full overflow-hidden border border-gray-800">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full relative transition-all duration-1000"
                  style={{ width: `${progressPercent}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-right">
                <Zap className="inline w-3 h-3 mr-1 text-yellow-500" />
                Play more games to level up naturally!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Section */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-16">
        
        {/* Disclaimer */}
        <div className="flex items-center justify-center mb-8 p-3.5 bg-blue-900/20 border border-blue-500/30 rounded-xl text-blue-300 text-sm max-w-2xl mx-auto text-center">
          <Info className="w-5 h-5 mr-3 flex-shrink-0 text-blue-400" />
          <p>
            Prices are shown in <strong>{activeCurrency} ({sym})</strong>. Amounts automatically update with your active platform currency toggle.
          </p>
        </div>

        {/* Tiers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {vipTiers.map((tier, index) => {
            const levelNum = parseInt(tier.level.replace("L", ""));
            const isCurrent = levelNum === currentVipLevel;
            const isPassed = levelNum < currentVipLevel;
            const convertedPrice = convertFromBase(tier.basePrice, activeCurrency);
            const formattedPrice = tier.basePrice === 0 ? "Free" : `${sym} ${formatCurrency(convertedPrice, activeCurrency)}`;

            return (
              <div 
                key={tier.level}
                className={`relative bg-gray-900 border ${isCurrent ? 'border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.3)]' : 'border-gray-800 hover:-translate-y-2 hover:shadow-lg'} rounded-2xl overflow-hidden flex flex-col transition-all duration-300 ${tier.shadow}`}
              >
                {/* Card Header Gradient */}
                <div className={`p-6 bg-gradient-to-br ${tier.color} relative ${isPassed ? 'grayscale opacity-70' : ''}`}>
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="relative z-10 flex justify-between items-start">
                    <div>
                      <p className={`text-sm font-black tracking-widest uppercase ${tier.text} opacity-90`}>{tier.name}</p>
                      <h3 className={`text-4xl font-black ${tier.level === 'L7' || tier.level === 'L8' ? 'text-gray-950' : 'text-white'} mt-1`}>{tier.level}</h3>
                    </div>
                    {index > 5 ? (
                      <Crown className={`w-8 h-8 ${tier.level === 'L7' || tier.level === 'L8' ? 'text-gray-950' : 'text-white'} opacity-90`} />
                    ) : index > 3 ? (
                      <Star className={`w-8 h-8 ${tier.level === 'L7' || tier.level === 'L8' ? 'text-gray-950' : 'text-white'} opacity-90`} />
                    ) : (
                      <Shield className={`w-8 h-8 ${tier.level === 'L7' || tier.level === 'L8' ? 'text-gray-950' : 'text-white'} opacity-90`} />
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6 flex-grow flex flex-col justify-between">
                  <div className="mb-6 text-center">
                    <p className="text-gray-400 text-xs uppercase tracking-wider font-bold mb-1">Direct Upgrade Price</p>
                    <p className="text-2xl md:text-3xl font-black text-white tracking-tight">
                      {formattedPrice}
                    </p>
                  </div>
                  
                  <ul className="space-y-3 mb-8 text-xs md:text-sm text-gray-400">
                    <li className="flex items-center">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 shrink-0" />
                      Instant Rakeback: <strong className="text-white ml-1">{tier.rakeback}</strong>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 shrink-0" />
                      Increased Withdrawal Limits
                    </li>
                    <li className="flex items-center">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 shrink-0" />
                      Priority 24/7 VIP Support
                    </li>
                    {index > 5 && (
                      <li className="flex items-center text-yellow-300 font-bold">
                        <Crown className="w-4 h-4 text-yellow-400 mr-2 shrink-0" />
                        Dedicated VIP Host
                      </li>
                    )}
                  </ul>

                  <button 
                    onClick={() => handleUpgrade(tier)}
                    disabled={isCurrent || isPassed || isProcessing === tier.level}
                    className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center cursor-pointer
                      ${isCurrent || isPassed 
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700' 
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_20px_rgba(37,99,235,0.5)]'
                      }
                    `}
                  >
                    {isProcessing === tier.level ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : isCurrent ? (
                      'Current Tier'
                    ) : isPassed ? (
                      'Unlocked'
                    ) : (
                      'Unlock Tier'
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- SUCCESS MODAL --- */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, y: 50 }}
              className="bg-gray-900 border border-yellow-500/50 rounded-3xl p-8 md:p-12 max-w-md w-full text-center shadow-[0_0_50px_rgba(234,179,8,0.2)] relative overflow-hidden"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-yellow-500/20 blur-[50px]"></div>
              <Crown className="w-20 h-20 text-yellow-500 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(234,179,8,0.8)]" />
              <h3 className="text-3xl font-black text-white mb-2">VIP Upgraded!</h3>
              <p className="text-gray-400 mb-8">You are now an Elite Level {currentVipLevel} member. Enjoy your enhanced perks.</p>
              
              <button 
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-4 rounded-xl font-black text-gray-950 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 uppercase tracking-widest shadow-[0_0_20px_rgba(234,179,8,0.4)] cursor-pointer"
              >
                Continue
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- INSUFFICIENT BALANCE MODAL --- */}
      <AnimatePresence>
        {showDepositModal && targetUpgrade && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-gray-900 border border-red-500/30 rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
            >
              <div className="flex items-center justify-center w-16 h-16 bg-red-500/10 rounded-full mx-auto mb-6 border border-red-500/20">
                <Wallet className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-2xl font-black text-white text-center mb-2">Insufficient Balance</h3>
              <p className="text-gray-400 text-center mb-6 text-sm">
                You need {sym} {formatCurrency(convertFromBase(targetUpgrade.basePrice, activeCurrency), activeCurrency)} to upgrade to {targetUpgrade.name} ({targetUpgrade.level}).
              </p>
              
              <div className="space-y-3">
                <Link 
                  href="/wallet"
                  className="w-full flex items-center justify-center py-4 rounded-xl font-black text-white bg-blue-600 hover:bg-blue-500 uppercase tracking-widest shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all group"
                >
                  Deposit Funds Now
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button 
                  onClick={() => setShowDepositModal(false)}
                  className="w-full py-3.5 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-gray-800 uppercase tracking-widest transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
