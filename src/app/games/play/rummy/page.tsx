"use client";

import { useCurrencyStore, convertFromBase, convertToBase, CURRENCY_SYMBOLS, formatCurrency } from '@/store/currencyStore';
import { useState, useEffect } from "react";
import { ArrowLeft, User, Coins, Crown, Spade, Heart, Club, Diamond, LogOut, CheckCircle2, RefreshCw, XCircle } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type GamePhase = "lobby" | "table";
type PointValue = 1 | 10 | 50 | 100;

interface PlayingCard {
  suit: 'spade' | 'heart' | 'diamond' | 'club';
  value: string;
  color: string;
  selected?: boolean;
}

const OPPONENTS = [
  { id: "FURY-9284", cards: 13, position: "left" },
  { id: "FURY-3301", cards: 13, position: "top" },
  { id: "FURY-8812", cards: 13, position: "right" }
];

const generateMockHand = (count: number = 13): PlayingCard[] => {
  const suits: ('spade' | 'heart' | 'diamond' | 'club')[] = ['spade', 'heart', 'diamond', 'club'];
  const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const hand: PlayingCard[] = [];
  for(let i=0; i<count; i++) {
    const suit = suits[Math.floor(Math.random() * suits.length)];
    const val = values[Math.floor(Math.random() * values.length)];
    hand.push({
      suit,
      value: val,
      color: (suit === 'heart' || suit === 'diamond') ? 'text-red-500' : 'text-gray-900',
      selected: false
    });
  }
  return hand;
};

export default function RummyGamePage() {
  const [mounted, setMounted] = useState(false);
  
  const { activeCurrency, baseBalance, setBaseBalance } = useCurrencyStore();
  const walletBalance = convertFromBase(baseBalance, activeCurrency);
  
  // Shim for local state updates (ideally should be replaced by generic API calls)
  const setWalletBalance = (updater: any) => {
    const newVal = typeof updater === 'function' ? updater(walletBalance) : updater;
    setBaseBalance(convertToBase(newVal, activeCurrency));
    
    // Fire and forget generic logging
    if (newVal < walletBalance) {
       const betAmt = walletBalance - newVal;
       if (betAmt > 0) {
         fetch('/api/games/generic/bet', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ gameName: 'generic', betAmount: convertToBase(betAmt, activeCurrency) })
         }).then(res=>res.json()).then(data=>{
            if(data.historyId) window.localStorage.setItem('lastGameHistoryId', data.historyId);
         }).catch(console.error);
       }
    } else if (newVal > walletBalance) {
       const winAmt = newVal - walletBalance;
       const historyId = window.localStorage.getItem('lastGameHistoryId');
       if (winAmt > 0 && historyId) {
         fetch('/api/games/generic/result', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ historyId, winLossStatus: 'WIN', payoutAmount: convertToBase(winAmt, activeCurrency) })
         }).catch(console.error);
         window.localStorage.removeItem('lastGameHistoryId');
       }
    }
  };

  const [phase, setPhase] = useState<GamePhase>("lobby");
  const [pointValue, setPointValue] = useState<PointValue>(10);
  
  // Game Table State
  const [playerHand, setPlayerHand] = useState<PlayingCard[]>([]);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  
  // Toast & Modal State
  const [toast, setToast] = useState<{ message: string, type: 'error' | 'success' } | null>(null);
  const [showVictoryModal, setShowVictoryModal] = useState(false);

  useEffect(() => {
    setMounted(true);
    setPlayerHand(generateMockHand(13));
  }, []);

  // Toast Auto-hide
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleTakeSeat = () => {
    const entryFee = pointValue * 80; // Standard 80 points rummy match mock
    if (walletBalance < entryFee) {
      alert(`Insufficient balance! You need ₹${entryFee} to enter this table.`);
      return;
    }
    setWalletBalance((prev: any) => prev - entryFee);
    setPlayerHand(generateMockHand(13));
    setShowVictoryModal(false);
    setIsPlayerTurn(true);
    setPhase("table");
  };

  const handleLeaveTable = () => {
    setPhase("lobby");
  };

  const toggleCardSelection = (index: number) => {
    setPlayerHand(prev => {
      const newHand = [...prev];
      newHand[index].selected = !newHand[index].selected;
      return newHand;
    });
  };

  const handleSort = () => {
    setPlayerHand(prev => {
      const sorted = [...prev].sort((a, b) => {
        if (a.suit !== b.suit) return a.suit.localeCompare(b.suit);
        return a.value.localeCompare(b.value);
      });
      return sorted;
    });
  };

  const handleDrawCard = () => {
    if (!isPlayerTurn || playerHand.length >= 14) return;
    
    const suits: ('spade' | 'heart' | 'diamond' | 'club')[] = ['spade', 'heart', 'diamond', 'club'];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const suit = suits[Math.floor(Math.random() * suits.length)];
    const val = values[Math.floor(Math.random() * values.length)];
    
    setPlayerHand(prev => [...prev, {
      suit,
      value: val,
      color: (suit === 'heart' || suit === 'diamond') ? 'text-red-500' : 'text-gray-900',
      selected: false
    }]);
  };

  const handleDiscard = () => {
    if (!isPlayerTurn || playerHand.length < 14) return;
    setPlayerHand(prev => prev.filter(c => !c.selected));
  };

  const handleDeclare = () => {
    if (playerHand.length === 13) {
      setToast({ message: "Invalid Action: You must draw a card before declaring!", type: "error" });
      return;
    }

    if (playerHand.length === 14) {
      // Mock valid declaration
      const winnings = pointValue * 80 * 2.5; // Example 2.5x total pool win
      setWalletBalance((prev: any) => prev + winnings);
      setShowVictoryModal(true);
    }
  };

  if (!mounted) return <div className="min-h-screen bg-gray-950 flex items-center justify-center max-w-full pb-24 md:pb-8"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-[100dvh] bg-gray-950 text-gray-100 font-sans flex flex-col overflow-x-hidden relative selection:bg-emerald-500/30 pb-24 md:pb-8 max-w-full">
      
      {/* Universal Header (Changes based on phase) */}
      <header className={`h-[60px] px-4 flex items-center justify-between shrink-0 z-50 transition-colors ${phase === 'lobby' ? 'bg-transparent absolute top-0 w-full' : 'bg-[#0a0f16] border-b border-[#1f2937]'}`}>
        <div className="flex items-center space-x-4">
          <Link href="/games" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          {phase === "table" && (
            <div className="flex items-center space-x-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              <h1 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 uppercase tracking-widest italic hidden md:block">
                RXFURY RUMMY
              </h1>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-4 bg-gray-900/60 backdrop-blur-sm px-4 py-1.5 rounded-full border border-gray-700/50">
          <Coins className="w-4 h-4 text-emerald-400" />
          <p className="font-bold text-emerald-400 text-sm">₹{walletBalance.toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
        </div>
      </header>

      {/* Global Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 20, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            className={`absolute top-0 left-1/2 z-[100] flex items-center px-6 py-3 rounded-xl shadow-2xl border ${
              toast.type === 'error' ? 'bg-red-950/90 border-red-500 text-red-200' : 'bg-emerald-950/90 border-emerald-500 text-emerald-200'
            } backdrop-blur-md`}
          >
            {toast.type === 'error' ? <XCircle className="w-5 h-5 mr-3 text-red-500" /> : <CheckCircle2 className="w-5 h-5 mr-3 text-emerald-500" />}
            <span className="font-bold">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        
        {/* PHASE 1: VIP LOBBY */}
        {phase === "lobby" && (
          <motion.div 
            key="lobby"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-[url('https://images.unsplash.com/photo-1596838132731-3301c3fd4317?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/80 to-gray-900/40"></div>

            <div className="absolute inset-0 flex justify-between items-end px-10 pointer-events-none opacity-40 md:opacity-70">
              <div className="w-[30vw] max-w-[300px] h-[70vh] bg-[url('https://cdn-icons-png.flaticon.com/512/6188/6188562.png')] bg-contain bg-bottom bg-no-repeat hue-rotate-180 brightness-0 invert opacity-30"></div>
              <div className="w-[30vw] max-w-[300px] h-[70vh] bg-[url('https://cdn-icons-png.flaticon.com/512/6188/6188562.png')] bg-contain bg-bottom bg-no-repeat hue-rotate-180 brightness-0 invert opacity-30 transform -scale-x-100"></div>
            </div>

            <div className="relative z-10 w-full max-w-md p-8 bg-gray-900/60 backdrop-blur-2xl border border-gray-700/50 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(16,185,129,0.1)] flex flex-col items-center text-center">
              <Crown className="w-16 h-16 text-yellow-500 mb-4 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
              <h1 className="text-4xl font-black uppercase tracking-widest text-white mb-2">RXFURY VIP</h1>
              <h2 className="text-xl font-bold text-emerald-400 tracking-[0.3em] mb-8">INDIAN RUMMY</h2>

              <div className="w-full bg-gray-950/50 p-4 rounded-xl border border-gray-800 mb-8">
                <p className="text-gray-400 text-sm font-bold uppercase mb-4">Select Point Value</p>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 10, 50, 100].map(val => (
                    <button
                      key={val}
                      onClick={() => setPointValue(val as PointValue)}
                      className={`py-2 rounded-lg font-bold transition-all ${pointValue === val ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)] border-2 border-emerald-400' : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'}`}
                    >
                      ₹{val}
                    </button>
                  ))}
                </div>
                <div className="mt-4 text-xs text-gray-500 font-mono flex justify-between">
                  <span>Entry Fee (80 pts):</span>
                  <span className="text-yellow-500 font-bold">₹{pointValue * 80}</span>
                </div>
              </div>

              <button 
                onClick={handleTakeSeat}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-black text-xl uppercase tracking-widest shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:shadow-[0_0_50px_rgba(16,185,129,0.6)] hover:scale-105 transition-all duration-300"
              >
                Take a Seat
              </button>
            </div>
          </motion.div>
        )}

        {/* PHASE 2: AUTHENTIC TABLE */}
        {phase === "table" && (
          <motion.div 
            key="table"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="flex-grow relative bg-[#12182b] flex flex-col justify-between overflow-hidden"
          >
            {/* The Table Background Layer */}
            <div className="absolute inset-4 md:inset-10 top-[20%] bottom-[30%] bg-gradient-to-b from-[#0f4024] to-[#072412] rounded-[100px] md:rounded-[200px] border-[12px] border-[#2d1b11] shadow-[0_30px_50px_rgba(0,0,0,0.8),inset_0_0_50px_rgba(0,0,0,0.9)] flex items-center justify-center">
              <div className="absolute inset-4 rounded-[80px] md:rounded-[180px] border-2 border-emerald-500/20 pointer-events-none"></div>
              <Crown className="w-32 h-32 text-emerald-900/40" />
            </div>

            {/* Top Area (Opponents) */}
            <div className="relative z-10 w-full h-[25%] flex justify-between items-center px-4 md:px-20 pt-8">
              {OPPONENTS.map((opp, idx) => (
                <div key={idx} className={`flex flex-col items-center ${opp.position === 'top' ? '-mt-8 md:-mt-12' : ''}`}>
                  <div className="bg-black/60 backdrop-blur-sm border border-gray-700/50 px-2 py-0.5 rounded-full text-[10px] font-mono text-gray-400 mb-2 shadow-lg">
                    {opp.id}
                  </div>
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gray-800 border-2 border-gray-600 flex items-center justify-center mb-2 shadow-xl">
                    <User className="w-6 h-6 text-gray-400" />
                  </div>
                  <div className="bg-gray-900/80 px-3 py-1 rounded text-xs font-bold text-gray-300">{opp.cards} Cards</div>
                </div>
              ))}
            </div>

            {/* Center Area (Deck & Discard) */}
            <div className="relative z-10 flex items-center justify-center gap-8 -mt-10">
              {/* Closed Deck */}
              <div className="flex flex-col items-center cursor-pointer group" onClick={handleDrawCard}>
                <div className="relative w-[60px] h-[85px] md:w-[80px] md:h-[115px] transition-transform group-hover:-translate-y-2">
                  <div className="absolute inset-0 bg-[#071324] border border-blue-900 rounded-lg shadow-lg rotate-3 translate-x-1 translate-y-1"></div>
                  <div className="absolute inset-0 bg-[#071324] border border-blue-900 rounded-lg shadow-lg -rotate-2 -translate-x-1 -translate-y-1 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-80 flex items-center justify-center group-hover:shadow-[0_0_20px_rgba(59,130,246,0.6)]">
                    <Crown className="w-8 h-8 text-blue-500/50" />
                  </div>
                </div>
                <span className="mt-2 text-xs font-bold text-emerald-400/80 uppercase">Draw</span>
              </div>

              {/* Open Discard */}
              <div className="flex flex-col items-center">
                <div className="w-[60px] h-[85px] md:w-[80px] md:h-[115px] bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col items-center justify-between py-2 text-red-500 transform rotate-[-5deg]">
                  <span className="font-bold text-sm md:text-lg self-start pl-2">7</span>
                  <Heart className="w-6 h-6 md:w-8 md:h-8" fill="currentColor" />
                  <span className="font-bold text-sm md:text-lg self-end pr-2 rotate-180">7</span>
                </div>
                <span className="mt-2 text-xs font-bold text-emerald-400/80 uppercase">Discard</span>
              </div>
            </div>

            {/* Bottom Player Area (Cards & Controls) */}
            <div className="relative z-20 w-full h-[35%] md:h-[30%] flex flex-col justify-end pb-4 px-2">
              
              {/* Playing Cards Fan */}
              <div className="relative w-full max-w-4xl mx-auto h-[120px] md:h-[160px] flex justify-center items-end mb-4 perspective-1000">
                {playerHand.map((card, idx) => {
                  const total = playerHand.length;
                  const middle = (total - 1) / 2;
                  const offset = idx - middle;
                  const rotation = offset * (total > 13 ? 3 : 4); 
                  const translateY = Math.abs(offset) * 2;
                  const isSelected = card.selected;

                  const getSuitIcon = (suit: string) => {
                    switch(suit) {
                      case 'spade': return <Spade className="w-4 h-4 md:w-6 md:h-6" fill="currentColor" />;
                      case 'heart': return <Heart className="w-4 h-4 md:w-6 md:h-6" fill="currentColor" />;
                      case 'diamond': return <Diamond className="w-4 h-4 md:w-6 md:h-6" fill="currentColor" />;
                      case 'club': return <Club className="w-4 h-4 md:w-6 md:h-6" fill="currentColor" />;
                    }
                  }

                  return (
                    <motion.div
                      key={idx}
                      onClick={() => toggleCardSelection(idx)}
                      initial={{ y: 50, opacity: 0 }}
                      animate={{
                        y: isSelected ? -30 : translateY,
                        rotate: rotation,
                        zIndex: isSelected ? 50 : idx,
                        opacity: 1
                      }}
                      whileHover={{ y: isSelected ? -30 : translateY - 15, zIndex: 40 }}
                      className={`absolute bottom-0 w-[55px] h-[80px] md:w-[85px] md:h-[120px] bg-white rounded-lg shadow-[-2px_0_10px_rgba(0,0,0,0.5)] border ${isSelected ? 'border-blue-500 ring-2 ring-blue-400 ring-offset-2 ring-offset-gray-900' : 'border-gray-300'} flex flex-col items-center justify-between py-1 md:py-2 ${card.color} cursor-pointer origin-bottom`}
                      style={{
                        marginLeft: `${offset * (typeof window !== 'undefined' && window.innerWidth < 768 ? 20 : 35)}px`
                      }}
                    >
                      <div className="flex flex-col items-center self-start pl-1 md:pl-2">
                        <span className="font-bold text-xs md:text-lg leading-none">{card.value}</span>
                        {getSuitIcon(card.suit)}
                      </div>
                      <div className="flex flex-col items-center self-end pr-1 md:pr-2 rotate-180 opacity-60">
                        <span className="font-bold text-xs md:text-lg leading-none">{card.value}</span>
                        {getSuitIcon(card.suit)}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Action Buttons Panel */}
              <div className="w-full max-w-3xl mx-auto flex flex-wrap md:flex-nowrap justify-between gap-2 px-2 bg-gray-900/80 backdrop-blur-md p-3 rounded-2xl border border-gray-700/50 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
                
                {/* Left Controls */}
                <div className="flex gap-2 w-full md:w-auto">
                  <button onClick={handleLeaveTable} className="flex-1 md:flex-none px-4 py-2 bg-gray-800 hover:bg-red-900/50 text-gray-300 hover:text-red-400 border border-gray-700 rounded-xl text-sm font-bold flex items-center justify-center transition-colors">
                    <LogOut className="w-4 h-4 mr-1 md:mr-2" />
                    Drop
                  </button>
                  <button onClick={handleSort} className="flex-1 md:flex-none px-4 py-2 bg-gray-800 hover:bg-blue-900/50 text-gray-300 hover:text-blue-400 border border-gray-700 rounded-xl text-sm font-bold flex items-center justify-center transition-colors">
                    <RefreshCw className="w-4 h-4 mr-1 md:mr-2" />
                    Sort
                  </button>
                </div>

                {/* Turn Indicator */}
                <div className="hidden md:flex flex-col items-center justify-center flex-grow">
                  {isPlayerTurn ? (
                    <span className="text-emerald-400 font-bold uppercase tracking-widest text-xs animate-pulse">
                      {playerHand.length === 13 ? "Draw a Card" : "Discard or Declare"}
                    </span>
                  ) : (
                    <span className="text-gray-500 font-bold uppercase tracking-widest text-xs">Waiting for opponents...</span>
                  )}
                </div>

                {/* Right Controls */}
                <div className="flex gap-2 w-full md:w-auto">
                  <button 
                    onClick={handleDiscard}
                    disabled={!isPlayerTurn || playerHand.length < 14 || playerHand.filter(c => c.selected).length === 0}
                    className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-sm font-bold flex items-center justify-center transition-colors uppercase tracking-wider
                      ${!isPlayerTurn || playerHand.length < 14 || playerHand.filter(c => c.selected).length === 0 ? 'bg-gray-800 text-gray-600 border border-gray-700 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-500 text-white shadow-[0_0_15px_rgba(234,88,12,0.5)]'}
                    `}
                  >
                    Discard
                  </button>
                  <button 
                    onClick={handleDeclare}
                    className="flex-1 md:flex-none px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-black flex items-center justify-center transition-colors uppercase tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.6)] border border-emerald-400"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1 md:mr-2" />
                    Declare
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Victory Modal Overlay */}
      <AnimatePresence>
        {showVictoryModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-gradient-to-b from-gray-900 to-gray-950 border border-emerald-500/50 p-8 rounded-3xl shadow-[0_0_100px_rgba(16,185,129,0.4)] max-w-md w-full text-center"
            >
              <Crown className="w-20 h-20 text-yellow-500 mx-auto mb-4 drop-shadow-[0_0_20px_rgba(234,179,8,0.8)]" />
              <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 uppercase tracking-widest mb-2">
                Valid Declaration!
              </h2>
              <p className="text-gray-400 mb-6 font-bold">You formed 4 valid sets/sequences.</p>
              
              <div className="bg-[#0a0f16] border border-gray-800 rounded-2xl p-6 mb-8 shadow-inner">
                <p className="text-sm text-gray-500 uppercase tracking-widest font-bold mb-2">Total Winnings</p>
                <p className="text-4xl font-black text-emerald-500">+₹{((pointValue * 80) * 2.5).toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={handleLeaveTable}
                  className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-bold uppercase transition-colors border border-gray-700"
                >
                  Lobby
                </button>
                <button 
                  onClick={handleTakeSeat}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold uppercase transition-all shadow-[0_0_20px_rgba(16,185,129,0.5)] border border-emerald-400"
                >
                  Play Again
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
