"use client";

import { Gift, Zap, Coins, Ticket, ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function PromotionsPage() {
  const [promoCode, setPromoCode] = useState("fury50");
  const [isClaimed, setIsClaimed] = useState(false);

  const depositTiers = [
    { deposit: "₹500", bonus: "₹80" },
    { deposit: "₹1,000", bonus: "₹200" },
    { deposit: "₹1,500", bonus: "₹400" },
    { deposit: "₹3,000", bonus: "₹800" },
    { deposit: "₹6,000", bonus: "₹1,200" },
    { deposit: "₹10,000", bonus: "₹2,000" },
  ];

  const handleClaim = () => {
    if (promoCode.toLowerCase() === "fury50") {
      setIsClaimed(true);
      setTimeout(() => setIsClaimed(false), 3000); // Reset after 3 seconds for demo
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans pb-16">
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gray-900 border-b border-gray-800 pt-16 pb-20 px-4 shadow-2xl">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Gift className="w-16 h-16 text-blue-500 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6">
            Exclusive <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">RXFURY Promotions</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
            Maximize your gameplay with our irresistible bonuses. Claim free cash, massive deposit matches, and exclusive VIP rewards.
          </p>
        </div>
      </div>

      {/* Promotional Offers Grid */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Offer Card 1: Welcome Bonus */}
          <div className="bg-gray-900 border border-blue-500/30 rounded-2xl p-8 relative overflow-hidden shadow-[0_0_20px_rgba(59,130,246,0.15)] hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all duration-300 group">
            {/* Glowing effect inside card */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-500/30 transition-colors"></div>
            
            <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                  <Ticket className="w-6 h-6 text-blue-400" />
                </div>
                <span className="text-blue-400 font-bold uppercase tracking-wider text-sm">New User Welcome Bonus</span>
              </div>
              
              <h2 className="text-4xl font-black text-white mb-3">Claim Your Free ₹50!</h2>
              <p className="text-gray-400 text-base mb-8">
                Enter the exclusive promo code below to instantly receive ₹50 directly into your Bonus Wallet. Perfect for exploring our fast games!
              </p>
              
              {/* Interactive UI */}
              <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 space-y-4">
                <label className="block text-sm font-medium text-gray-400">Promo Code</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Enter code"
                    className="flex-grow bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-lg uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  />
                  <button 
                    onClick={handleClaim}
                    className={`px-8 py-3 rounded-lg font-bold text-white transition-all whitespace-nowrap flex items-center justify-center ${
                      isClaimed 
                        ? 'bg-green-600 shadow-[0_0_15px_rgba(34,197,94,0.4)]' 
                        : 'bg-blue-600 hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(37,99,235,0.6)]'
                    }`}
                  >
                    {isClaimed ? (
                      <><Check className="w-5 h-5 mr-2" /> Claimed!</>
                    ) : (
                      "Claim Bonus"
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 text-center sm:text-left mt-2">
                  *Bonus balance is strictly for gameplay. Winnings from bonus bets are 100% withdrawable.
                </p>
              </div>
            </div>
          </div>

          {/* Offer Card 2: Massive Deposit Match Tiers */}
          <div className="bg-gray-900 border border-purple-500/30 rounded-2xl p-8 relative overflow-hidden shadow-[0_0_20px_rgba(168,85,247,0.15)] hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all duration-300 group">
            {/* Glowing effect inside card */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl group-hover:bg-purple-500/30 transition-colors"></div>
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                  <Coins className="w-6 h-6 text-purple-400" />
                </div>
                <span className="text-purple-400 font-bold uppercase tracking-wider text-sm">Every Deposit Rewarded</span>
              </div>
              
              <h2 className="text-4xl font-black text-white mb-3">Deposit More, Play More!</h2>
              <p className="text-gray-400 text-base mb-6">
                Earn huge bonuses directly credited to your Bonus Wallet on every eligible deposit you make.
              </p>
              
              {/* Tier List UI */}
              <div className="flex-grow space-y-2 mb-8">
                {depositTiers.map((tier, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-950/80 border border-gray-800/80 rounded-lg hover:border-purple-500/30 transition-colors">
                    <div className="flex items-center">
                      <Zap className="w-4 h-4 text-gray-500 mr-3" />
                      <span className="text-gray-300">Deposit <strong className="text-white">{tier.deposit}</strong></span>
                    </div>
                    <div className="flex items-center text-purple-400 font-bold">
                      <ArrowRight className="w-4 h-4 mr-2 opacity-50" />
                      Get {tier.bonus} Bonus
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <Link 
                href="/dashboard"
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-xl shadow-[0_0_15px_rgba(147,51,234,0.4)] hover:shadow-[0_0_25px_rgba(147,51,234,0.6)] transition-all flex items-center justify-center text-lg"
              >
                Deposit Now
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
