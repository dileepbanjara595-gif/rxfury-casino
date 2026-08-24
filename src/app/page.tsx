"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useUserStore } from "@/store/userStore";
import { Gamepad2, Gift, Crown, Users, QrCode, Bitcoin, Building2, X, Lock } from "lucide-react";

import { useAuthModalStore } from "@/store/authModalStore";
import { useRouter } from "next/navigation";
import { useDepositModalStore } from "@/store/depositModalStore";

export default function Home() {
  const { session, isLoading } = useUserStore();
  const { openModal } = useAuthModalStore();
  const { openModal: openDepositModal } = useDepositModalStore();
  const router = useRouter();

    useEffect(() => {
    // Initial Visit Auth Trigger for non-authenticated users
    if (!isLoading && !session?.user && !sessionStorage.getItem("authPromptShown")) {
      const timer = setTimeout(() => {
        openModal('login');
        sessionStorage.setItem("authPromptShown", "true");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [session, isLoading, openModal]);

  useEffect(() => {
    // Only show modal if user is logged in, and hasn't seen it yet in this session
    if (session?.user && !sessionStorage.getItem("welcomeModalShown")) {
      const timer = setTimeout(() => {
        openDepositModal('deposit', 'methods');
        sessionStorage.setItem("welcomeModalShown", "true");
      }, 1500); // 1.5 second delay for dramatic effect
      return () => clearTimeout(timer);
    }
  }, [session]);
  return (
    <div className="flex flex-col w-full relative">
      
      {/* Modal removed to Providers.tsx globally */}


      
      {/* 1. HERO SECTION */}
      <section 
        id="hero" 
        className="relative w-full h-[550px] md:h-[750px] flex flex-col items-center justify-center overflow-hidden bg-cover bg-center bg-[#11141f]"
        style={{ backgroundImage: "url('/images/welcome_screen.jpg')" }}
      >
        {/* Dark Gradient Overlay for Text Visibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f16]/80 via-[#0a0f16]/60 to-[#0a0f16] z-0"></div>

        {/* Content Layer */}
        <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-4xl mx-auto">
          <div className="relative w-40 h-40 md:w-56 md:h-56 mb-6 drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
            <Image 
              src="/logo.png" 
              alt="RXFURY Logo" 
              fill 
              className="object-contain invert"
            />
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">
            Welcome to <span className="text-blue-500 drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]">RXFURY</span>
          </h1>
          <p className="text-lg md:text-2xl text-gray-200 mb-10 max-w-2xl font-medium drop-shadow-lg">
            The ultimate destination for real-money multiplayer casino, traditional card games, and provably fair fast games.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-5 justify-center w-full sm:w-auto">
            <button 
              onClick={() => {
                if (!session?.user) {
                  openModal('register');
                } else {
                  router.push('/dashboard');
                }
              }}
              className="px-10 py-4 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-500 transition-all shadow-[0_0_30px_rgba(37,99,235,0.5)] hover:shadow-[0_0_50px_rgba(37,99,235,0.8)] text-lg hover:-translate-y-1"
            >
              Start Playing
            </button>
            <Link 
              href="/games" 
              className="px-10 py-4 bg-black/50 backdrop-blur-md text-white font-bold rounded-xl hover:bg-black/80 transition-all text-lg border border-gray-600 hover:border-gray-400 shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:-translate-y-1"
            >
              Explore Games
            </Link>
          </div>
        </div>
      </section>

      {/* 1.5 LIVE WINS TICKER */}
      <div className="bg-[#1a1d29] border-y border-white/5 py-3 relative overflow-hidden flex items-center shadow-lg">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#1a1d29] to-transparent z-10 pointer-events-none flex items-center px-4">
          <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-full border border-green-500/30 backdrop-blur-md">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]"></div>
            <span className="text-gray-300 text-xs font-black uppercase tracking-widest">Live</span>
          </div>
        </div>
        
        {/* Scrolling Content */}
        <div className="flex space-x-8 animate-[scroll_30s_linear_infinite] whitespace-nowrap px-4 pl-[300px]">
          {[...Array(2)].map((_, groupIdx) => (
            <div key={groupIdx} className="flex space-x-8 shrink-0">
              {[
                { user: 'User9646', game: 'Chicken Road', amount: '₹24,500' },
                { user: 'Rahul88', game: 'Aviator', amount: '₹12,400' },
                { user: 'CryptoKing', game: 'Mines', amount: '₹8,900' },
                { user: 'LuckyStar', game: 'Teen Patti', amount: '₹45,000' },
                { user: 'VipPlayer1', game: 'Blackjack', amount: '₹1,12,000' },
                { user: 'Alex99', game: 'Aviator', amount: '₹4,500' },
                { user: 'User4421', game: 'Chicken Road', amount: '₹18,000' },
                { user: 'WinnerXYZ', game: 'Roulette', amount: '₹33,200' },
              ].map((win, idx) => (
                <div key={`${groupIdx}-${idx}`} className="flex items-center space-x-3 bg-black/40 px-4 py-2 rounded-xl border border-white/5">
                  <span className="text-gray-400 font-bold text-sm">{win.user}</span>
                  <span className="text-gray-600 text-xs">played</span>
                  <span className="text-blue-400 font-bold text-sm">{win.game}</span>
                  <span className="text-gray-600 text-xs">won</span>
                  <span className="text-green-400 font-black text-sm drop-shadow-[0_0_5px_rgba(34,197,94,0.4)]">+{win.amount}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#1a1d29] to-transparent z-10 pointer-events-none"></div>
      </div>

      {/* 2. GAMES SECTION */}
      <section 
        id="games" 
        className="min-h-screen py-24 px-4 md:px-8 bg-gray-950 flex flex-col items-center justify-center border-t border-gray-900"
      >
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center p-4 bg-blue-500/10 rounded-2xl mb-6">
              <Gamepad2 className="w-12 h-12 text-blue-500" />
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight uppercase">Popular Games</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">Experience the thrill of high-stakes gameplay with our curated selection of premium casino and skill-based games.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { id: "aviator", name: "Aviator", category: "Fast", color: "from-red-500 to-red-700", icon: "/images/games/aviator.png" },
              { id: "teen-patti", name: "Teen Patti", category: "Card", color: "from-green-500 to-green-700", icon: "/images/games/teen-patti.jpg" },
              { id: "blackjack", name: "Blackjack", category: "Card", color: "from-purple-500 to-purple-700", icon: "/images/games/blackjack.jpg" },
              { id: "solitaire", name: "Solitaire", category: "Card", color: "from-emerald-500 to-emerald-700", icon: "/images/games/solitaire.jpg" }
            ].map((game) => (
              <Link 
                href={`/games/play/${game.id}`}
                onClick={(e) => {
                  if (!session?.user) {
                    e.preventDefault();
                    openModal('login');
                  }
                }}
                key={game.id} 
                className="group relative rounded-2xl overflow-hidden border border-gray-700 hover:border-yellow-500/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_25px_rgba(234,179,8,0.25)] flex flex-col h-72 md:h-80 bg-gray-900 cursor-pointer"
              >
                {/* Full Cover Game Image */}
                <div className="absolute inset-0 pointer-events-none z-0">
                  <img 
                    src={game.icon} 
                    alt={game.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-in-out opacity-90 group-hover:opacity-100"
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                  {/* Sleek Gradient Overlay for Text Readability over the image */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f16] via-[#0a0f16]/80 to-transparent"></div>
                  {/* Subtle color tint based on game category */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-40 mix-blend-overlay`}></div>
                </div>

                {/* Content Overlay */}
                <div className="relative z-20 flex flex-col h-full p-5 justify-between">
                  <div className="flex justify-between items-start">
                    <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black tracking-widest text-yellow-400 border border-yellow-500/30 uppercase shadow-lg">
                      {game.category}
                    </div>
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <div className="bg-yellow-500/90 text-gray-900 p-4 rounded-full shadow-[0_0_30px_rgba(234,179,8,0.6)] transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                      <Gamepad2 className="w-6 h-6 fill-current" />
                    </div>
                  </div>

                  <div className="mt-auto flex items-end justify-between">
                    <h3 className="text-2xl font-black text-white tracking-tight drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] leading-none">
                      {game.name}
                    </h3>
                    <div className="flex items-center space-x-1.5 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg border border-gray-700 shadow-md">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                      <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Live</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          
          <div className="mt-12 text-center relative z-20">
            <Link 
              href="/games" 
              className="inline-flex items-center px-10 py-4 bg-gray-900 border border-gray-700 text-white font-bold rounded-xl hover:bg-gray-800 hover:border-gray-500 transition-all shadow-lg hover:shadow-2xl text-lg uppercase tracking-wider group"
            >
              View All Games
              <span className="ml-3 group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. PROMOTIONS SECTION */}
      <section 
        id="promotions" 
        className="min-h-[80vh] py-24 px-4 md:px-8 bg-[#0a0f16] flex flex-col items-center justify-center border-t border-gray-900 relative overflow-hidden"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="max-w-6xl mx-auto w-full relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center p-4 bg-purple-500/10 rounded-2xl mb-6">
              <Gift className="w-12 h-12 text-purple-500" />
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight uppercase">Exclusive Promotions</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">Boost your bankroll with our generous welcome offers and weekly reload bonuses.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-3xl p-8 md:p-12 border border-purple-500/30 shadow-2xl relative overflow-hidden group min-h-[300px] flex flex-col justify-end">
              <img src="/images/welcome-bonus.jpg" alt="Welcome Bonus" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-purple-950 via-purple-900/80 to-transparent"></div>
              <div className="absolute -right-10 -top-10 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl"></div>
              
              <div className="relative z-10">
                <h3 className="text-3xl font-black text-white mb-3 drop-shadow-md">100% Welcome Bonus</h3>
                <p className="text-purple-100 text-lg mb-8 max-w-md drop-shadow-md font-medium">Double your first deposit instantly up to ₹150,000. Start your winning journey with a massive advantage.</p>
                <button onClick={() => session?.user ? openDepositModal('deposit', 'methods') : openModal('register')} className="inline-block px-8 py-4 bg-white text-purple-900 font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-lg">Claim Now</button>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-900 to-cyan-900 rounded-3xl p-8 md:p-12 border border-blue-500/30 shadow-2xl relative overflow-hidden group min-h-[300px] flex flex-col justify-end">
              <img src="/images/cashback.jpg" alt="Weekly Cashback" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-950 via-blue-900/80 to-transparent"></div>
              <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl"></div>
              
              <div className="relative z-10">
                <h3 className="text-3xl font-black text-white mb-3 drop-shadow-md">Weekly 10% Cashback</h3>
                <p className="text-blue-100 text-lg mb-8 max-w-md drop-shadow-md font-medium">Play without fear! We credit 10% of your net losses back to your wallet every Monday.</p>
                <Link href="/promotions" className="inline-block px-8 py-4 bg-white text-blue-900 font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-lg">
                  Read Terms
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. VIP SECTION */}
      <section 
        id="vip" 
        className="min-h-screen py-24 px-4 md:px-8 bg-gray-950 flex flex-col items-center justify-center border-t border-gray-900 relative"
      >
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center p-4 bg-yellow-500/10 rounded-2xl mb-6">
              <Crown className="w-12 h-12 text-yellow-500" />
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight uppercase">Elite VIP Club</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">Ascend through 8 exclusive tiers. Unlock higher withdrawal limits, priority support, and daily rewards.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Silver', color: 'text-gray-300', rakeback: '5%', bonus: '₹5,000', host: false },
              { name: 'Sapphire', color: 'text-blue-400', rakeback: '6%', bonus: '₹10,000', host: false },
              { name: 'Emerald', color: 'text-emerald-400', rakeback: '7%', bonus: '₹25,000', host: false },
              { name: 'Bronze', color: 'text-orange-400', rakeback: '8%', bonus: '₹50,000', host: false },
              { name: 'Amethyst', color: 'text-purple-400', rakeback: '10%', bonus: '₹1,00,000', host: false },
              { name: 'Ruby', color: 'text-red-500', rakeback: '12%', bonus: '₹2,50,000', host: false },
              { name: 'Gold', color: 'text-yellow-400', rakeback: '14%', bonus: '₹5,00,000', host: true },
              { name: 'Diamond', color: 'text-cyan-300', rakeback: '15%', bonus: '₹10,00,000', host: true }
            ].map((tier, idx) => {
              const currentVipLevel = 3; // Mocking user as Emerald
              const isCurrent = idx + 1 === currentVipLevel;
              const isLocked = idx + 1 > currentVipLevel;

              return (
              <div key={tier.name} className={`group relative rounded-3xl p-6 text-left border flex flex-col justify-between overflow-hidden transition-all duration-300 h-[340px]
                ${isCurrent ? 'border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.3)]' : 'border-gray-800 hover:border-gray-600 hover:-translate-y-2 hover:shadow-2xl'}
              `}>
                {/* Background Placeholder */}
                <div className="absolute inset-0 z-0 bg-[#0a0f16]">
                  <div className={`absolute inset-0 w-full h-full opacity-5 group-hover:opacity-15 transition-all duration-500 bg-gradient-to-br ${tier.color.replace('text-', 'from-')} to-transparent`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f16] via-[#0a0f16]/90 to-transparent"></div>
                  <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f16]/60 to-transparent"></div>
                </div>

                {/* Top Headers & Badges */}
                <div className="relative z-10 flex justify-between items-start mb-4">
                  <div className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold text-white border border-white/20 shadow-lg">
                    Level {idx + 1}
                  </div>
                  {isLocked && <div className="bg-black/50 p-2 rounded-full border border-gray-700 backdrop-blur-sm"><Lock className="w-4 h-4 text-gray-400" /></div>}
                  {isCurrent && <div className="text-green-400 text-xs font-black uppercase tracking-widest animate-pulse bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/30">Current</div>}
                </div>

                {/* Bottom Content & Perks */}
                <div className="relative z-10 flex flex-col flex-1 justify-end">
                  <h4 className={`font-black text-3xl mb-4 tracking-widest uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,1)] ${tier.color}`}>{tier.name}</h4>
                  
                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-gray-400 font-medium">Level Up Bonus</span>
                      <span className="text-white font-black">{tier.bonus}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-gray-400 font-medium">Instant Rakeback</span>
                      <span className="text-white font-black">{tier.rakeback}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-gray-400 font-medium">Weekly Cashback</span>
                      <span className="text-white font-black">Included</span>
                    </div>
                    {tier.host && (
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-yellow-500/80 font-bold flex items-center gap-1.5"><Crown className="w-3.5 h-3.5"/> VIP Host</span>
                        <span className="text-yellow-400 font-black tracking-wide">Dedicated</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )})}
          </div>
          
          <div className="mt-12 text-center">
            <Link href="/vip" className="inline-block px-10 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-black rounded-xl hover:from-yellow-400 hover:to-yellow-500 transition-colors shadow-[0_0_20px_rgba(234,179,8,0.3)] uppercase tracking-widest">
              View VIP Benefits
            </Link>
          </div>
        </div>
      </section>

      {/* 5. AFFILIATE SECTION */}
      <section 
        id="affiliate" 
        className="min-h-[80vh] py-24 px-4 md:px-8 bg-[#041c13] flex flex-col items-center justify-center border-t border-gray-900 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>
        
        <div className="max-w-5xl mx-auto w-full relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center p-4 bg-emerald-500/10 rounded-2xl mb-6 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              <Users className="w-12 h-12 text-emerald-400" />
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight uppercase">Refer & Earn</h2>
            <p className="text-gray-300 text-xl max-w-3xl mx-auto font-medium">Build your own 3-Tier Affiliate Network. Earn passive lifetime commissions on every game your network plays.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 border border-emerald-900/50 text-center">
              <h4 className="text-emerald-400 font-bold uppercase tracking-widest text-sm mb-2">Tier 1</h4>
              <p className="text-4xl font-black text-white">40%</p>
              <p className="text-gray-400 mt-2 text-sm">Direct Referrals</p>
            </div>
            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 border border-emerald-900/50 text-center">
              <h4 className="text-emerald-400 font-bold uppercase tracking-widest text-sm mb-2">Tier 2</h4>
              <p className="text-4xl font-black text-white">20%</p>
              <p className="text-gray-400 mt-2 text-sm">Sub-Referrals</p>
            </div>
            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 border border-emerald-900/50 text-center">
              <h4 className="text-emerald-400 font-bold uppercase tracking-widest text-sm mb-2">Tier 3</h4>
              <p className="text-4xl font-black text-white">10%</p>
              <p className="text-gray-400 mt-2 text-sm">Network Referrals</p>
            </div>
          </div>

          <div className="text-center">
            <button onClick={() => session?.user ? router.push('/affiliate') : openModal('register')} className="inline-flex items-center px-10 py-5 bg-emerald-600 text-white font-black rounded-xl hover:bg-emerald-500 transition-all shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:shadow-[0_0_40px_rgba(16,185,129,0.6)] uppercase tracking-widest text-lg group">Start Earning Now <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span></button>
          </div>
        </div>
      </section>

    </div>
  );
}
 


