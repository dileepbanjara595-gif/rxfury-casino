"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, User, Coins, Crown, Spade, Heart, Club, Diamond, XCircle, ChevronUp, CircleDollarSign } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface PlayingCard {
  suit: 'spade' | 'heart' | 'diamond' | 'club';
  value: string;
  color: string;
}

const OPPONENTS = [
  { id: "FURY-9921", position: "bottom-left", chips: 50000, status: "Thinking...", active: true, isDealer: false },
  { id: "FURY-3102", position: "top-left", chips: 24500, status: "Call ₹1000", active: true, isDealer: true },
  { id: "FURY-7764", position: "top", chips: 89000, status: "Fold", active: false, isDealer: false },
  { id: "FURY-1099", position: "top-right", chips: 12000, status: "Raise ₹5000", active: true, isDealer: false },
  { id: "FURY-4432", position: "bottom-right", chips: 34000, status: "Call ₹1000", active: true, isDealer: false }
];

const COMMUNITY_CARDS_MOCK: PlayingCard[] = [
  { suit: 'heart', value: 'A', color: 'text-red-600' },
  { suit: 'spade', value: 'K', color: 'text-gray-900' },
  { suit: 'diamond', value: '10', color: 'text-red-600' },
  { suit: 'club', value: '7', color: 'text-gray-900' },
  { suit: 'spade', value: '2', color: 'text-gray-900' },
];

const PLAYER_HOLE_CARDS: PlayingCard[] = [
  { suit: 'spade', value: 'A', color: 'text-gray-900' },
  { suit: 'spade', value: 'Q', color: 'text-gray-900' }
];

export default function PokerGamePage() {
  const [mounted, setMounted] = useState(false);
  const [walletBalance, setWalletBalance] = useState(24500);
  const [potSize, setPotSize] = useState(45500);
  
  // Game State
  const [phase, setPhase] = useState<"preflop" | "flop" | "turn" | "river">("preflop");
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [isFolded, setIsFolded] = useState(false);
  const [currentCallAmount, setCurrentCallAmount] = useState(1000);
  
  // Betting Controls
  const [raiseAmount, setRaiseAmount] = useState(2000);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getVisibleCommunityCards = () => {
    switch(phase) {
      case "preflop": return [];
      case "flop": return COMMUNITY_CARDS_MOCK.slice(0, 3);
      case "turn": return COMMUNITY_CARDS_MOCK.slice(0, 4);
      case "river": return COMMUNITY_CARDS_MOCK;
    }
  };

  const handleFold = () => {
    setIsFolded(true);
    setIsPlayerTurn(false);
  };

  const handleAction = (type: "call" | "raise") => {
    const amount = type === "call" ? currentCallAmount : raiseAmount;
    if (walletBalance < amount) return;
    
    setWalletBalance(prev => prev - amount);
    setPotSize(prev => prev + amount);
    setIsPlayerTurn(false);
    
    // Mock game progression
    setTimeout(() => {
      progressPhase();
      setIsPlayerTurn(true);
      setPotSize(prev => prev + 15000); // Mock opponents betting
    }, 3000);
  };

  const progressPhase = () => {
    setPhase(prev => {
      if (prev === "preflop") return "flop";
      if (prev === "flop") return "turn";
      if (prev === "turn") return "river";
      return "preflop"; // reset mock
    });
  };

  const setQuickBet = (type: "min" | "half" | "pot" | "allin") => {
    switch(type) {
      case "min": setRaiseAmount(currentCallAmount * 2); break;
      case "half": setRaiseAmount(Math.floor(potSize / 2)); break;
      case "pot": setRaiseAmount(potSize); break;
      case "allin": setRaiseAmount(walletBalance); break;
    }
  };

  if (!mounted) return <div className="h-screen bg-gray-950 flex items-center justify-center"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>;

  const getSuitIcon = (suit: string, sizeClass: string) => {
    switch(suit) {
      case 'spade': return <Spade className={sizeClass} fill="currentColor" />;
      case 'heart': return <Heart className={sizeClass} fill="currentColor" />;
      case 'diamond': return <Diamond className={sizeClass} fill="currentColor" />;
      case 'club': return <Club className={sizeClass} fill="currentColor" />;
    }
  }

  // Mini Card Back component for opponents & community cards
  const MiniCardBack = () => (
    <div className="w-8 h-12 md:w-10 md:h-14 bg-white rounded shadow-sm border border-gray-300 relative">
      <div className="absolute inset-1 bg-[url('https://www.transparenttextures.com/patterns/argyle.png')] bg-blue-900 rounded-[2px] opacity-90 border border-blue-400/20"></div>
    </div>
  );

  return (
    <div className="h-[100dvh] bg-[#050914] text-gray-100 font-sans flex flex-col overflow-hidden relative selection:bg-emerald-500/30">
      
      {/* Header */}
      <header className="h-[60px] bg-[#0a0f16] border-b border-[#1f2937] px-4 flex items-center justify-between shrink-0 z-50">
        <div className="flex items-center space-x-4">
          <Link href="/games" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center space-x-2">
            <Crown className="w-5 h-5 text-emerald-500" />
            <h1 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 uppercase tracking-widest italic hidden md:block">
              TEXAS HOLD'EM
            </h1>
          </div>
        </div>
        <div className="flex items-center space-x-4 bg-gray-900/60 backdrop-blur-sm px-4 py-1.5 rounded-full border border-gray-700/50">
          <Coins className="w-4 h-4 text-emerald-400" />
          <p className="font-bold text-emerald-400 text-sm">₹{walletBalance.toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
        </div>
      </header>

      {/* Main Table Area */}
      <main className="flex-grow relative bg-[#0a1128] flex flex-col items-center justify-center overflow-hidden py-4">
        
        {/* Background Atmosphere */}
        <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-blue-900/10 to-transparent"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vh] bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none"></div>

        {/* The Felt Table */}
        <div className="relative w-[95%] h-[75vh] md:w-[90%] md:h-[80vh] bg-gradient-to-br from-[#0c3c26] to-[#051c11] rounded-[200px] border-[16px] border-[#1a110a] shadow-[0_40px_60px_rgba(0,0,0,0.8),inset_0_0_80px_rgba(0,0,0,0.9)] flex flex-col items-center justify-center">
          
          {/* Table Inner Line */}
          <div className="absolute inset-8 rounded-[160px] border-2 border-emerald-500/20 pointer-events-none"></div>
          
          {/* Center Logo watermark */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center opacity-10 pointer-events-none">
            <Spade className="w-32 h-32 text-black" fill="currentColor" />
            <h2 className="text-4xl font-black uppercase tracking-[0.5em] mt-4 text-black">RXFURY</h2>
          </div>

          {/* Center Pot Area */}
          <div className="relative z-10 flex flex-col items-center justify-center mb-8">
            <div className="flex -space-x-2 mb-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`w-10 h-10 rounded-full border-4 border-dashed border-white/50 shadow-xl flex items-center justify-center ${i%2===0 ? 'bg-blue-600' : 'bg-red-600'} ${i > 2 ? 'bg-black' : ''} transform ${i%2===0 ? 'rotate-12 translate-y-1' : '-rotate-6'}`}>
                  <div className="w-5 h-5 rounded-full border-2 border-white/30"></div>
                </div>
              ))}
            </div>
            <div className="bg-black/60 backdrop-blur-md px-6 py-2 rounded-full border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)] flex flex-col items-center">
              <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-[0.3em] mb-1">Main Pot</span>
              <span className="text-xl md:text-2xl font-black text-white drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]">
                ₹{potSize.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Community Cards */}
          <div className="relative z-10 flex gap-2 md:gap-4 perspective-1000">
            {[0, 1, 2, 3, 4].map((index) => {
              const isVisible = index < getVisibleCommunityCards().length;
              const card = COMMUNITY_CARDS_MOCK[index];

              return (
                <div key={index} className="w-[60px] h-[90px] md:w-[85px] md:h-[125px] relative">
                  <AnimatePresence mode="wait">
                    {!isVisible ? (
                      <motion.div 
                        key="back"
                        initial={{ rotateY: 0 }}
                        exit={{ rotateY: 90 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0"
                      >
                        <div className="w-full h-full bg-white rounded-lg shadow-xl border border-gray-300 relative">
                          <div className="absolute inset-1.5 bg-[url('https://www.transparenttextures.com/patterns/argyle.png')] bg-blue-900 rounded-sm opacity-90 border border-blue-400/20"></div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="front"
                        initial={{ rotateY: -90 }}
                        animate={{ rotateY: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`absolute inset-0 bg-white rounded-lg shadow-[0_0_20px_rgba(0,0,0,0.5)] border border-gray-200 flex flex-col items-center justify-between py-1 md:py-2 ${card.color}`}
                      >
                        <div className="flex flex-col items-center self-start pl-1 md:pl-2">
                          <span className="font-bold text-sm md:text-lg leading-none">{card.value}</span>
                          {getSuitIcon(card.suit, "w-3 h-3 md:w-5 md:h-5")}
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-30">
                          {getSuitIcon(card.suit, "w-8 h-8 md:w-12 md:h-12")}
                        </div>
                        <div className="flex flex-col items-center self-end pr-1 md:pr-2 rotate-180">
                          <span className="font-bold text-sm md:text-lg leading-none">{card.value}</span>
                          {getSuitIcon(card.suit, "w-3 h-3 md:w-5 md:h-5")}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* OPPONENTS */}
          {OPPONENTS.map((opp, idx) => (
            <div 
              key={opp.id} 
              className={`absolute flex flex-col items-center ${
                opp.position === 'bottom-left' ? 'left-[-5%] md:left-[5%] bottom-[15%]' :
                opp.position === 'top-left' ? 'left-[-5%] md:left-[5%] top-[15%]' :
                opp.position === 'top' ? 'top-[-10%] md:top-[-5%] left-1/2 -translate-x-1/2' :
                opp.position === 'top-right' ? 'right-[-5%] md:right-[5%] top-[15%]' :
                'right-[-5%] md:right-[5%] bottom-[15%]'
              } ${opp.active ? '' : 'opacity-40 grayscale'}`}
            >
              {/* Action Bubble */}
              <div className="absolute -top-10 bg-white text-gray-900 px-3 py-1 rounded-xl text-xs font-black shadow-lg whitespace-nowrap z-30">
                {opp.status}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45"></div>
              </div>

              {/* Avatar & Info */}
              <div className="relative">
                {opp.isDealer && (
                  <div className="absolute -left-4 -top-2 w-6 h-6 bg-white rounded-full border-2 border-gray-300 flex items-center justify-center shadow-lg z-30">
                    <span className="text-black font-black text-[10px]">D</span>
                  </div>
                )}
                <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full bg-gray-800 border-2 ${opp.active && opp.id === 'FURY-9921' ? 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]' : 'border-gray-600'} flex items-center justify-center relative z-20`}>
                  <User className="w-6 h-6 text-gray-400" />
                  <div className="absolute -bottom-3 bg-black/90 border border-gray-700 px-2 py-0.5 rounded text-[9px] font-mono text-white whitespace-nowrap flex flex-col items-center">
                    <span>{opp.id}</span>
                  </div>
                </div>
              </div>

              {/* Stack */}
              <div className="mt-5 bg-black/60 px-2 py-0.5 rounded-full text-xs font-mono text-emerald-400 border border-emerald-500/30 z-20">
                ₹{opp.chips.toLocaleString()}
              </div>

              {/* 2 Face Down Hole Cards */}
              <div className="absolute top-8 md:top-10 -right-8 md:-right-10 flex -space-x-4 rotate-12 z-10">
                <MiniCardBack />
                <MiniCardBack />
              </div>
            </div>
          ))}

        </div>

      </main>

      {/* Bottom Area: Player Cards & Controls */}
      <div className={`relative shrink-0 w-full bg-[#0a0f16] border-t border-[#1f2937] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] z-40 transition-all ${isPlayerTurn ? 'shadow-[0_-20px_50px_rgba(16,185,129,0.15)] ring-t-2 ring-emerald-500/30' : ''}`}>
        
        {/* Player Hole Cards (Overlapping table) */}
        <div className="absolute -top-[90px] md:-top-[120px] left-[10%] md:left-[20%] flex items-end">
          <AnimatePresence>
            {!isFolded && PLAYER_HOLE_CARDS.map((card, i) => (
              <motion.div
                key={i}
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className={`w-[70px] h-[100px] md:w-[90px] md:h-[130px] bg-white rounded-lg shadow-[-5px_0_15px_rgba(0,0,0,0.5)] border border-gray-200 flex flex-col items-center justify-between py-1 md:py-2 ${card.color} ${
                  i === 0 ? '-rotate-[10deg] z-10' : 'rotate-[10deg] -ml-6 md:-ml-8 z-20 shadow-[0_0_20px_rgba(0,0,0,0.3)]'
                }`}
              >
                <div className="flex flex-col items-center self-start pl-1 md:pl-2">
                  <span className="font-bold text-sm md:text-xl leading-none">{card.value}</span>
                  {getSuitIcon(card.suit, "w-3 h-3 md:w-5 md:h-5")}
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-30">
                  {getSuitIcon(card.suit, "w-8 h-8 md:w-12 md:h-12")}
                </div>
                <div className="flex flex-col items-center self-end pr-1 md:pr-2 rotate-180">
                  <span className="font-bold text-sm md:text-xl leading-none">{card.value}</span>
                  {getSuitIcon(card.suit, "w-3 h-3 md:w-5 md:h-5")}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isFolded && (
             <div className="flex -space-x-4 rotate-12 opacity-50 grayscale">
               <MiniCardBack />
               <MiniCardBack />
             </div>
          )}
        </div>

        {/* Controls Panel (Hidden when not turn) */}
        <div className="px-4 py-4 md:px-8 max-w-7xl mx-auto h-[120px] md:h-[140px] flex items-center justify-end md:justify-end ml-auto w-full md:w-3/4">
          
          {isPlayerTurn && !isFolded ? (
            <div className="flex flex-col w-full">
              
              {/* Top Row: Bet Sizer */}
              <div className="flex items-center justify-end gap-2 mb-3 w-full">
                <span className="text-xs text-gray-400 font-bold uppercase mr-2">Raise Size:</span>
                {['min', 'half', 'pot', 'allin'].map((type) => (
                  <button 
                    key={type}
                    onClick={() => setQuickBet(type as any)}
                    className="px-3 py-1 bg-[#11111a] hover:bg-[#1a1a2e] border border-[#1f2937] text-gray-400 hover:text-white rounded text-xs font-bold uppercase transition-colors"
                  >
                    {type === 'min' ? 'Min' : type === 'half' ? '1/2 Pot' : type === 'pot' ? 'Pot' : 'All-In'}
                  </button>
                ))}
                <div className="flex-grow max-w-[200px] ml-4">
                   <input type="range" min={currentCallAmount * 2} max={walletBalance} value={raiseAmount} onChange={(e) => setRaiseAmount(Number(e.target.value))} className="w-full accent-emerald-500" />
                </div>
              </div>

              {/* Bottom Row: Actions */}
              <div className="flex items-stretch justify-end gap-3 w-full">
                <button 
                  onClick={handleFold}
                  className="px-6 py-3 rounded-xl border border-red-500/50 bg-red-950/20 text-red-400 font-bold uppercase text-sm md:text-lg hover:bg-red-900/40 transition-colors flex items-center justify-center flex-1 md:flex-none max-w-[150px]"
                >
                  <XCircle className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                  Fold
                </button>
                
                <button 
                  onClick={() => handleAction("call")}
                  className="px-6 py-3 rounded-xl border border-blue-500/50 bg-blue-950/20 text-blue-400 font-bold uppercase text-sm md:text-lg hover:bg-blue-900/40 transition-colors flex flex-col items-center justify-center flex-1 md:flex-none md:min-w-[150px]"
                >
                  <span>Call</span>
                  <span className="text-xs md:text-sm font-mono mt-1 text-blue-300">₹{currentCallAmount.toLocaleString()}</span>
                </button>

                <button 
                  onClick={() => handleAction("raise")}
                  className="flex-grow md:flex-grow-0 md:min-w-[250px] px-8 py-3 rounded-xl font-black text-lg md:text-xl uppercase tracking-widest transition-all bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)] border border-emerald-400 flex flex-col items-center justify-center"
                >
                  <div className="flex items-center">
                    <ChevronUp className="w-5 h-5 md:w-6 md:h-6 mr-1" /> Raise To
                  </div>
                  <span className="text-sm md:text-base font-mono mt-1 text-emerald-100">₹{raiseAmount.toLocaleString()}</span>
                </button>
              </div>

            </div>
          ) : (
            <div className="flex items-center justify-center w-full h-full">
              {isFolded ? (
                <span className="text-red-500 font-bold uppercase tracking-[0.3em]">You Folded</span>
              ) : (
                <span className="text-gray-500 font-bold uppercase tracking-[0.3em] flex items-center animate-pulse">
                  Waiting for opponents...
                </span>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
