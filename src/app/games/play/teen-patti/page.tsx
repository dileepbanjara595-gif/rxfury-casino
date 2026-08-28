"use client";

import { useCurrencyStore, convertFromBase, convertToBase, CURRENCY_SYMBOLS, formatCurrency } from '@/store/currencyStore';
import { useState, useEffect } from "react";
import { ArrowLeft, User, Coins, Crown, Spade, Heart, Club, Diamond, Eye, Plus, Minus, Info, XCircle } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface PlayingCard {
  suit: 'spade' | 'heart' | 'diamond' | 'club';
  value: string;
  color: string;
}

const OPPONENTS = [
  { id: "FURY-4012", position: "left", status: "Seen", bet: "₹400", active: true },
  { id: "FURY-8911", position: "top-left", status: "Playing Blind", bet: "₹200", active: true },
  { id: "FURY-2201", position: "top-right", status: "Packed", bet: "₹100", active: false },
  { id: "FURY-5563", position: "right", status: "Playing Blind", bet: "₹200", active: true }
];

const generateMockHand = (): PlayingCard[] => {
  const suits: ('spade' | 'heart' | 'diamond' | 'club')[] = ['spade', 'heart', 'diamond', 'club'];
  const values = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
  const hand: PlayingCard[] = [];
  
  // High card sequence mock (e.g. A, K, J)
  for(let i=0; i<3; i++) {
    const suit = suits[Math.floor(Math.random() * suits.length)];
    const val = values[Math.floor(Math.random() * values.length)];
    hand.push({
      suit,
      value: val,
      color: (suit === 'heart' || suit === 'diamond') ? 'text-red-600' : 'text-gray-900',
    });
  }
  return hand;
};

export default function TeenPattiPage() {
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

  const [potSize, setPotSize] = useState(15400);
  const [cardsSeen, setCardsSeen] = useState(false);
  const [playerHand, setPlayerHand] = useState<PlayingCard[]>([]);
  
  // Betting Logic
  const [baseBet, setBaseBet] = useState(100);
  const [isPacked, setIsPacked] = useState(false);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  
  // Side Show / Show Logic States
  const [incomingSideShow, setIncomingSideShow] = useState<{playerId: string, playerName: string} | null>(null);

  // Derived Values for Show/SideShow Conditions
  const activeOpponents = OPPONENTS.filter(o => o.active);
  const totalActivePlayers = activeOpponents.length + (isPacked ? 0 : 1);
  const previousPlayer = activeOpponents[activeOpponents.length - 1]; // Mock previous player
  
  const isShowEnabled = totalActivePlayers === 2 && !isPacked && isPlayerTurn;
  const isPreviousPlayerSeen = previousPlayer?.status === 'Seen';
  const isSideShowEnabled = totalActivePlayers > 2 && cardsSeen && isPreviousPlayerSeen && !isPacked && isPlayerTurn;

  useEffect(() => {
    setMounted(true);
    setPlayerHand(generateMockHand());
    
    // MOCK: Automatically trigger an incoming side show after 10 seconds for testing UI
    const timer = setTimeout(() => {
       if(totalActivePlayers > 2 && cardsSeen) {
         setIncomingSideShow({ playerId: "FURY-8911", playerName: "FURY-8911" });
       }
    }, 10000);
    return () => clearTimeout(timer);
  }, [totalActivePlayers, cardsSeen]);

  const handleSeeCards = () => {
    setCardsSeen(true);
  };

  const handlePack = () => {
    setIsPacked(true);
    setIsPlayerTurn(false);
  };

  const handleAction = () => {
    const amount = cardsSeen ? baseBet * 2 : baseBet;
    if (walletBalance < amount) return;
    setWalletBalance((prev: any) => prev - amount);
    setPotSize(prev => prev + amount);
    setIsPlayerTurn(false);
    setTimeout(() => {
      setIsPlayerTurn(true);
      setPotSize(prev => prev + (amount * 2)); // Mock opponent bets
    }, 3000);
  };

  // --- Socket.io Emit Logic (Outlined for Backend Integration) ---
  const requestShow = () => {
    console.log("socket.emit('teenPatti:requestShow')");
    // Action: Wait for backend to broadcast 'teenPatti:showResult'
  };

  const requestSideShow = () => {
    console.log("socket.emit('teenPatti:requestSideShow', { targetPlayerId: previousPlayer.id })", previousPlayer.id);
    // Action: Wait for backend to notify if accepted or denied
  };

  const acceptSideShow = () => {
    console.log("socket.emit('teenPatti:acceptSideShow', { requesterId: incomingSideShow.playerId })");
    setIncomingSideShow(null);
  };

  const denySideShow = () => {
    console.log("socket.emit('teenPatti:denySideShow', { requesterId: incomingSideShow.playerId })");
    setIncomingSideShow(null);
  };

  const increaseBet = () => setBaseBet(prev => prev + 100);
  const decreaseBet = () => setBaseBet(prev => Math.max(100, prev - 100));

  if (!mounted) return <div className="min-h-screen bg-gray-950 flex items-center justify-center max-w-full pb-24 md:pb-8"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div></div>;

  const getSuitIcon = (suit: string, sizeClass: string) => {
    switch(suit) {
      case 'spade': return <Spade className={sizeClass} fill="currentColor" />;
      case 'heart': return <Heart className={sizeClass} fill="currentColor" />;
      case 'diamond': return <Diamond className={sizeClass} fill="currentColor" />;
      case 'club': return <Club className={sizeClass} fill="currentColor" />;
    }
  }

  // Mini Card Back component for opponents
  const MiniCardBack = ({ index }: { index: number }) => (
    <div className={`w-6 h-9 md:w-8 md:h-12 bg-white rounded shadow-sm border border-gray-300 absolute ${index === 0 ? '-rotate-12 -translate-x-2' : index === 2 ? 'rotate-12 translate-x-2' : 'z-10'}`}>
      <div className="absolute inset-1 bg-[url('https://www.transparenttextures.com/patterns/argyle.png')] bg-blue-900 rounded-[2px] opacity-90 border border-blue-400/20"></div>
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-gray-950 text-gray-100 font-sans flex flex-col overflow-x-hidden relative selection:bg-amber-500/30 pb-24 md:pb-8 max-w-full">
      
      {/* Header */}
      <header className="h-[60px] bg-[#0a0f16] border-b border-[#1f2937] px-4 flex items-center justify-between shrink-0 z-50">
        <div className="flex items-center space-x-4">
          <Link href="/games" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center space-x-2">
            <Crown className="w-5 h-5 text-amber-500" />
            <h1 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 uppercase tracking-widest italic hidden md:block">
              TEEN PATTI
            </h1>
          </div>
        </div>
        <div className="flex items-center space-x-4 bg-gray-900/60 backdrop-blur-sm px-4 py-1.5 rounded-full border border-gray-700/50">
          <Coins className="w-4 h-4 text-emerald-400" />
          <p className="font-bold text-emerald-400 text-sm">₹{walletBalance.toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
        </div>
      </header>

      {/* Main Table Area */}
      <main className="flex-grow relative bg-[#070b12] flex flex-col items-center justify-center overflow-hidden py-4">
        
        {/* Background Lights */}
        <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-amber-900/20 to-transparent"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none"></div>

        {/* The Felt Table */}
        <div className="relative w-[95%] h-[70vh] md:w-[85%] md:h-[75vh] bg-gradient-to-br from-[#4a0d15] to-[#250308] rounded-[200px] border-[12px] border-[#1a0e0b] shadow-[0_40px_60px_rgba(0,0,0,0.8),inset_0_0_80px_rgba(0,0,0,0.9)] flex items-center justify-center">
          
          {/* Table Inner Line */}
          <div className="absolute inset-8 rounded-[160px] border-2 border-amber-500/20 border-dashed pointer-events-none"></div>
          
          {/* Center Logo watermark */}
          <Crown className="absolute w-40 h-40 text-black/20" />

          {/* Center Pot Area */}
          <div className="relative z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-md px-8 py-6 rounded-[100px] border border-amber-500/30 shadow-[0_0_40px_rgba(245,158,11,0.2)]">
            {/* Mock Chips Stack */}
            <div className="flex -space-x-4 mb-3 relative group">
              <div className="w-12 h-12 bg-blue-600 rounded-full border-4 border-dashed border-white shadow-xl flex items-center justify-center transform -rotate-12 translate-y-2 relative z-10">
                <div className="w-6 h-6 rounded-full border-2 border-white/50"></div>
              </div>
              <div className="w-12 h-12 bg-red-600 rounded-full border-4 border-dashed border-white shadow-xl flex items-center justify-center transform rotate-12 -translate-y-1 relative z-20">
                <div className="w-6 h-6 rounded-full border-2 border-white/50"></div>
              </div>
              <div className="w-12 h-12 bg-black rounded-full border-4 border-dashed border-white shadow-xl flex items-center justify-center transform translate-y-1 relative z-30">
                <div className="w-6 h-6 rounded-full border-2 border-white/50"></div>
              </div>
            </div>
            <span className="text-[10px] text-amber-500 font-bold uppercase tracking-[0.3em] mb-1">Total Pot</span>
            <span className="text-2xl md:text-3xl font-black text-white drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]">
              ₹{potSize.toLocaleString()}
            </span>
          </div>

          {/* OPPONENTS */}
          {OPPONENTS.map((opp, idx) => (
            <div 
              key={opp.id} 
              className={`absolute flex flex-col items-center ${
                opp.position === 'left' ? 'left-[-10%] md:left-[-5%] top-1/2 -translate-y-1/2' :
                opp.position === 'right' ? 'right-[-10%] md:right-[-5%] top-1/2 -translate-y-1/2' :
                opp.position === 'top-left' ? 'top-[-5%] md:top-[-10%] left-[20%]' :
                'top-[-5%] md:top-[-10%] right-[20%]'
              } ${opp.active ? '' : 'opacity-40 grayscale'}`}
            >
              {/* Status Badge & Bet */}
              <div className="flex flex-col items-center mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider mb-1 ${opp.status === 'Packed' ? 'bg-red-500/20 text-red-400' : opp.status === 'Seen' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                  {opp.status}
                </span>
                {opp.active && <span className="bg-black/60 px-2 py-0.5 rounded-full text-xs font-mono text-emerald-400 border border-emerald-500/30">{opp.bet}</span>}
              </div>

              {/* Avatar Profile */}
              <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full bg-gray-800 border-2 ${opp.active ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'border-gray-600'} flex items-center justify-center relative z-20`}>
                <User className="w-6 h-6 text-gray-400" />
                <div className="absolute -bottom-3 bg-black/80 border border-gray-700 px-2 py-0.5 rounded text-[9px] font-mono text-white whitespace-nowrap">
                  {opp.id}
                </div>
              </div>

              {/* 3 Face Down Cards */}
              <div className="relative w-16 h-12 flex justify-center mt-4">
                <MiniCardBack index={0} />
                <MiniCardBack index={1} />
                <MiniCardBack index={2} />
              </div>
            </div>
          ))}

        </div>

      </main>

      {/* Bottom Area: Player Cards & Controls */}
      <div className={`relative shrink-0 w-full bg-[#0a0f16] border-t border-[#1f2937] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] z-40 transition-all ${isPlayerTurn ? 'shadow-[0_-20px_50px_rgba(245,158,11,0.15)] ring-t-2 ring-amber-500/30' : ''}`}>
        
        {/* Player Cards (Overlapping table) */}
        <div className="absolute -top-[80px] md:-top-[110px] left-1/2 -translate-x-1/2 flex items-end justify-center w-full max-w-sm">
          {!cardsSeen ? (
            // Face Down State
            <div className="relative w-[180px] h-[100px] md:w-[240px] md:h-[140px] flex justify-center cursor-pointer group" onClick={handleSeeCards}>
              <div className="absolute bottom-0 text-center w-full transform -translate-y-2 opacity-0 group-hover:opacity-100 group-hover:-translate-y-8 transition-all duration-300 z-50">
                <span className="bg-amber-500 text-black px-4 py-2 rounded-full font-black text-sm uppercase tracking-widest shadow-lg flex items-center justify-center mx-auto w-fit">
                  <Eye className="w-4 h-4 mr-2" /> See Cards
                </span>
              </div>
              
              {[0, 1, 2].map((i) => (
                <div key={i} className={`w-[60px] h-[90px] md:w-[80px] md:h-[120px] bg-white rounded-lg shadow-xl border border-gray-300 absolute bottom-0 transition-transform duration-300 group-hover:scale-110 ${i === 0 ? '-rotate-[15deg] -translate-x-8' : i === 2 ? 'rotate-[15deg] translate-x-8' : 'z-10 -translate-y-2'}`}>
                  <div className="absolute inset-1.5 bg-[url('https://www.transparenttextures.com/patterns/argyle.png')] bg-blue-900 rounded-sm opacity-90 border border-blue-400/20"></div>
                </div>
              ))}
            </div>
          ) : (
            // Face Up State (Framer Motion Flips)
            <div className="relative w-[180px] h-[100px] md:w-[240px] md:h-[140px] flex justify-center perspective-1000">
              <AnimatePresence>
                {playerHand.map((card, i) => (
                  <motion.div
                    key={i}
                    initial={{ rotateY: -180, opacity: 0, y: 50 }}
                    animate={{ rotateY: 0, opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.15 }}
                    className={`w-[65px] h-[95px] md:w-[85px] md:h-[125px] bg-white rounded-lg shadow-[-5px_0_15px_rgba(0,0,0,0.5)] border border-gray-200 absolute bottom-0 flex flex-col items-center justify-between py-1 md:py-2 ${card.color} ${
                      i === 0 ? '-rotate-[15deg] -translate-x-10' : i === 2 ? 'rotate-[15deg] translate-x-10' : 'z-10 -translate-y-4 shadow-[0_0_20px_rgba(0,0,0,0.5)]'
                    }`}
                  >
                    <div className="flex flex-col items-center self-start pl-1 md:pl-2">
                      <span className="font-bold text-sm md:text-xl leading-none">{card.value}</span>
                      {getSuitIcon(card.suit, "w-3 h-3 md:w-5 md:h-5")}
                    </div>
                    {/* Big Center Icon */}
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
            </div>
          )}
        </div>

        {/* Turn Indicator */}
        <div className="h-8 pt-2 flex justify-center items-center">
          {isPacked ? (
            <span className="text-red-500 font-bold uppercase tracking-[0.2em] text-xs">You Packed</span>
          ) : isPlayerTurn ? (
            <span className="text-amber-400 font-bold uppercase tracking-[0.2em] text-xs animate-pulse">Your Turn</span>
          ) : (
            <span className="text-gray-500 font-bold uppercase tracking-[0.2em] text-xs">Waiting for opponents...</span>
          )}
        </div>

        {/* Controls Panel */}
        <div className="px-4 pb-4 md:px-8 flex flex-wrap md:flex-nowrap items-center justify-between gap-3 max-w-5xl mx-auto mt-2">
          
          {/* Left: Pack & Info */}
          <div className="flex w-full md:w-auto gap-2">
            <button 
              onClick={handlePack}
              disabled={isPacked || !isPlayerTurn}
              className="flex-1 md:flex-none px-6 py-3 rounded-xl border border-red-500/50 bg-red-950/20 text-red-400 font-bold uppercase text-sm hover:bg-red-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Pack
            </button>
            <button className="px-4 py-3 bg-[#11111a] border border-[#1f1f2e] rounded-xl text-gray-400 hover:text-white transition-colors">
              <Info className="w-5 h-5" />
            </button>
          </div>

          {/* Center: Main Action (Chaal/Blind) & Sizer */}
          <div className="flex w-full md:w-auto items-stretch gap-2">
            
            {/* Bet Sizer */}
            <div className="flex bg-[#11111a] border border-[#1f1f2e] rounded-xl overflow-hidden shadow-inner">
              <button 
                onClick={decreaseBet}
                disabled={isPacked || !isPlayerTurn || baseBet <= 100}
                className="px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 disabled:opacity-50 transition-colors border-r border-[#1f1f2e]"
              >
                <Minus className="w-4 h-4" />
              </button>
              <div className="px-4 flex items-center justify-center text-amber-500 font-bold font-mono text-lg min-w-[80px]">
                ₹{cardsSeen ? baseBet * 2 : baseBet}
              </div>
              <button 
                onClick={increaseBet}
                disabled={isPacked || !isPlayerTurn}
                className="px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 disabled:opacity-50 transition-colors border-l border-[#1f1f2e]"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Main Action Button */}
            <button 
              onClick={handleAction}
              disabled={isPacked || !isPlayerTurn}
              className={`flex-grow md:flex-grow-0 px-8 py-3 rounded-xl font-black text-lg uppercase tracking-widest transition-all
                ${isPacked || !isPlayerTurn 
                  ? 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed' 
                  : cardsSeen 
                    ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_20px_rgba(217,119,6,0.6)] border border-amber-400' 
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.6)] border border-blue-400'
                }
              `}
            >
              {cardsSeen ? 'Chaal' : 'Blind'}
            </button>
          </div>

          {/* Right: Show / Sideshow */}
          <div className="flex w-full md:w-auto gap-2">
            <button 
              onClick={requestSideShow}
              disabled={!isSideShowEnabled} 
              className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold uppercase text-sm transition-all duration-300 ${
                isSideShowEnabled 
                  ? 'bg-[#11111a] border border-blue-500 text-blue-400 hover:bg-blue-900/30 shadow-[0_0_15px_rgba(59,130,246,0.3)] cursor-pointer' 
                  : 'bg-[#11111a] border-[#1f1f2e] text-gray-600 cursor-not-allowed opacity-50'
              }`}
            >
              Side Show
            </button>
            <button 
              onClick={requestShow}
              disabled={!isShowEnabled} 
              className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold uppercase text-sm transition-all duration-300 ${
                isShowEnabled 
                  ? 'bg-[#11111a] border border-emerald-500 text-emerald-400 hover:bg-emerald-900/30 shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer' 
                  : 'bg-[#11111a] border-[#1f1f2e] text-gray-600 cursor-not-allowed opacity-50'
              }`}
            >
              Show
            </button>
          </div>

        </div>
      </div>

      {/* Incoming Side Show Request Modal */}
      <AnimatePresence>
        {incomingSideShow && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-32 left-1/2 -translate-x-1/2 z-50 bg-gray-900 border border-blue-500/50 p-4 rounded-2xl shadow-[0_0_30px_rgba(59,130,246,0.4)] flex flex-col items-center min-w-[280px]"
          >
            <p className="text-white text-sm font-bold mb-4 text-center">
              <span className="text-blue-400">{incomingSideShow.playerName}</span> has requested a Side Show.
            </p>
            <div className="flex space-x-3 w-full">
              <button 
                onClick={denySideShow}
                className="flex-1 py-2 rounded-lg bg-gray-800 text-gray-300 font-bold text-xs uppercase hover:bg-gray-700 transition-colors"
              >
                Deny
              </button>
              <button 
                onClick={acceptSideShow}
                className="flex-1 py-2 rounded-lg bg-blue-600 text-white font-bold text-xs uppercase hover:bg-blue-500 transition-colors shadow-lg"
              >
                Accept
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
