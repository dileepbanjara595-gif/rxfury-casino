"use client";

import { useCurrencyStore, convertFromBase, convertToBase, CURRENCY_SYMBOLS, formatCurrency } from '@/store/currencyStore';
import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Clock, History, BarChart2, TrendingUp, Flag, Bike, Trophy } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type GameState = "betting" | "racing" | "result";

interface RaceHistory {
  sessionId: string;
  winner: number;
  betPlaced: number | null;
  winAmount: number;
}

export default function MotoRacingGamePage() {
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

  const [betAmount, setBetAmount] = useState<number | "">(100);
  const [selectedBike, setSelectedBike] = useState<number | null>(null);
  const [placedBet, setPlacedBet] = useState<{ bike: number, amount: number } | null>(null);
  
  // Game Engine
  const [gameState, setGameState] = useState<GameState>("betting");
  const [countdown, setCountdown] = useState(15);
  const [currentSessionId, setCurrentSessionId] = useState("MOTO-0084");
  const [raceDurations, setRaceDurations] = useState<number[]>(Array(10).fill(0));
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null);
  
  // Tabs for Right Panel
  const [activeTab, setActiveTab] = useState<"history" | "chart">("chart");
  const [history, setHistory] = useState<RaceHistory[]>([]);

  useEffect(() => {
    setMounted(true);
    // Generate initial history
    const initialHistory: RaceHistory[] = [];
    for (let i = 64; i < 84; i++) {
      initialHistory.push({
        sessionId: `MOTO-00${i}`,
        winner: Math.floor(Math.random() * 10) + 1,
        betPlaced: null,
        winAmount: 0
      });
    }
    setHistory(initialHistory);
  }, []);

  // Game Loop
  useEffect(() => {
    let timerId: NodeJS.Timeout;
    let raceTimeoutId: NodeJS.Timeout;
    let resultTimeoutId: NodeJS.Timeout;

    if (gameState === "betting") {
      timerId = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            startRace();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    const startRace = () => {
      // Generate randomized race durations for 10 bikes (between 3s and 6s)
      const durations = Array.from({ length: 10 }, () => 3 + Math.random() * 3);
      setRaceDurations(durations);
      
      // Winner is the one with the shortest duration
      const minDuration = Math.min(...durations);
      const winner = durations.indexOf(minDuration);
      setWinnerIndex(winner);
      setGameState("racing");

      // Wait for the race to finish
      raceTimeoutId = setTimeout(() => {
        handleRaceEnd(winner + 1); // +1 because bikes are 1-10
      }, minDuration * 1000);
    };

    const handleRaceEnd = (winningBike: number) => {
      setGameState("result");
      
      // Calculate Winnings
      let winAmount = 0;
      if (placedBet && placedBet.bike === winningBike) {
        winAmount = placedBet.amount * 9.5; // 9.5x payout for 10 bikes
        setWalletBalance((prev: any) => prev + winAmount);
        alert(`Unbelievable Race! Bike #${winningBike} Won! +₹${winAmount.toFixed(2)}`);
      }

      const newHistory: RaceHistory = {
        sessionId: currentSessionId,
        winner: winningBike,
        betPlaced: placedBet ? placedBet.bike : null,
        winAmount: winAmount
      };

      setHistory(prev => [...prev.slice(1), newHistory]);

      // Reset for next round
      resultTimeoutId = setTimeout(() => {
        setGameState("betting");
        setCountdown(15);
        setPlacedBet(null);
        setSelectedBike(null);
        setWinnerIndex(null);
        setRaceDurations(Array(10).fill(0));
        setCurrentSessionId(prev => `MOTO-00${parseInt(prev.split('-')[1]) + 1}`);
      }, 5000);
    };

    return () => {
      clearInterval(timerId);
      clearTimeout(raceTimeoutId);
      clearTimeout(resultTimeoutId);
    };
  }, [gameState, placedBet, currentSessionId]);

  const handlePlaceBet = () => {
    if (gameState !== "betting" || countdown <= 5) return;
    if (!selectedBike) {
      alert("Please select a bike to bet on!");
      return;
    }
    if (Number(betAmount) < 10 || walletBalance < Number(betAmount)) {
      alert("Invalid bet amount or insufficient balance!");
      return;
    }
    
    setWalletBalance((prev: any) => prev - Number(betAmount));
    setPlacedBet({ bike: selectedBike, amount: Number(betAmount) });
  };

  if (!mounted) {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center max-w-full pb-24 md:pb-8"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1a2235] border border-[#2a3754] p-3 rounded-lg shadow-xl">
          <p className="text-gray-400 text-xs mb-1">Session: {payload[0].payload.sessionId}</p>
          <p className="text-emerald-400 font-bold flex items-center">
            <Trophy className="w-4 h-4 mr-1 text-yellow-500" />
            Bike #{payload[0].value} Won
          </p>
        </div>
      );
    }
    return null;
  };

  const isBettingDisabled = gameState !== "betting" || countdown <= 5;

  return (
    <div className="min-h-[100dvh] bg-[#090b14] text-gray-100 font-sans flex flex-col overflow-x-hidden selection:bg-emerald-500/30 pb-24 md:pb-8 max-w-full">
      
      {/* Header (60px) */}
      <header className="h-[60px] bg-[#0f1423] border-b border-[#1f2937] px-4 flex items-center justify-between shrink-0 z-50">
        <div className="flex items-center space-x-4">
          <Link href="/games" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center space-x-2">
            <Flag className="w-5 h-5 text-emerald-500" />
            <h1 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 uppercase tracking-widest italic">
              MOTO RACING
            </h1>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-[10px] text-gray-400 uppercase leading-tight">Wallet Balance</p>
            <p className="font-bold text-emerald-400 text-sm leading-tight">₹{walletBalance.toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col xl:flex-row gap-4 p-4 min-h-0">
        
        {/* Left Container: Track & Betting */}
        <div className="flex flex-col flex-grow xl:w-2/3 gap-4 min-h-0">
          
          {/* Top: Racing Track */}
          <div className="flex-grow bg-[#12182b] border border-[#1f2937] rounded-2xl flex flex-col overflow-hidden relative shadow-2xl min-h-[250px]">
            {/* Countdown Overlay */}
            <AnimatePresence>
              {gameState === "betting" && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 2 }}
                  className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-[2px]"
                >
                  <div className="text-center">
                    <p className="text-emerald-400 font-bold uppercase tracking-[0.3em] mb-2 text-sm">Next Race In</p>
                    <motion.h2 
                      animate={countdown <= 5 ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 0.5, repeat: countdown <= 5 ? Infinity : 0 }}
                      className={`text-6xl md:text-8xl font-black tabular-nums drop-shadow-2xl ${countdown <= 5 ? 'text-red-500' : 'text-white'}`}
                    >
                      00:{countdown.toString().padStart(2, '0')}
                    </motion.h2>
                    {countdown <= 5 && <p className="text-red-400 font-bold uppercase mt-2 animate-pulse">Betting Closed</p>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Finish Line */}
            <div className="absolute top-0 bottom-0 right-[20px] w-4 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] border-l-4 border-white/20 z-10 flex flex-col">
               {/* Checkerboard pattern simulation */}
               {Array.from({length: 20}).map((_, i) => (
                 <div key={i} className={`flex-1 w-full ${i % 2 === 0 ? 'bg-white' : 'bg-black'}`}></div>
               ))}
            </div>

            {/* 10 Lanes */}
            <div className="flex flex-col h-full w-full py-2">
              {Array.from({ length: 10 }).map((_, index) => {
                const isWinner = gameState === "result" && winnerIndex === index;
                const bikeNumber = index + 1;
                
                return (
                  <div key={index} className="flex-1 border-b border-white/5 relative flex items-center px-4 w-[calc(100%-20px)]">
                    {/* Lane Number */}
                    <div className="absolute left-2 text-white/10 font-black text-xl italic z-0">{bikeNumber}</div>
                    
                    {/* The Bike */}
                    <motion.div
                      className={`relative z-10 flex items-center ${isWinner ? 'drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]' : ''}`}
                      initial={{ left: 0 }}
                      animate={{ 
                        left: gameState === 'racing' || gameState === 'result' ? '100%' : '0%' 
                      }}
                      transition={{ 
                        duration: raceDurations[index], 
                        ease: [0.25, 0.1, 0.25, 1] // Custom ease for organic feel
                      }}
                      style={{ x: '-100%' }} // Keep it anchored to the left of its moving coordinate
                    >
                      {/* Bike Icon with specific lane colors */}
                      <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 
                        ${isWinner ? 'bg-emerald-500 border-white text-white' : 'bg-gray-800 border-gray-600 text-gray-400'}
                        ${placedBet?.bike === bikeNumber ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-[#12182b]' : ''}
                      `}>
                        <Bike className="w-5 h-5 md:w-6 md:h-6" />
                      </div>
                      
                      {/* Winner Tag */}
                      <AnimatePresence>
                        {isWinner && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute -top-6 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider shadow-[0_0_10px_rgba(16,185,129,1)]"
                          >
                            WINNER
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Left: Betting Panel */}
          <div className="shrink-0 bg-[#12182b] border border-[#1f2937] rounded-2xl p-4 shadow-xl">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest flex items-center">
                <Flag className="w-4 h-4 mr-2 text-emerald-500" />
                Select Winning Bike
              </h3>
              <span className="text-xs font-mono text-emerald-400">Payout: 9.5x</span>
            </div>
            
            {/* 10 Bike Buttons */}
            <div className="grid grid-cols-5 md:grid-cols-10 gap-2 mb-4">
              {Array.from({ length: 10 }).map((_, index) => {
                const bikeNumber = index + 1;
                const isSelected = selectedBike === bikeNumber;
                return (
                  <button
                    key={index}
                    onClick={() => !isBettingDisabled && setSelectedBike(bikeNumber)}
                    disabled={isBettingDisabled}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center font-black text-xl transition-all
                      ${isSelected 
                        ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)] border-2 border-emerald-300' 
                        : 'bg-[#1a2235] text-gray-400 border border-[#2a3754] hover:bg-[#1f2937] hover:border-emerald-500/50'
                      }
                      ${isBettingDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    {bikeNumber}
                  </button>
                );
              })}
            </div>

            {/* Amount & CTA */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex bg-[#0a0a0f] border border-[#1f2937] rounded-xl overflow-hidden sm:w-1/2 focus-within:border-emerald-500/50 transition-colors">
                <div className="pl-4 flex items-center justify-center text-gray-500">₹</div>
                <input 
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(Number(e.target.value))}
                  disabled={isBettingDisabled}
                  className="w-full bg-transparent px-2 py-3 text-white font-bold text-lg outline-none"
                  placeholder="Amount"
                />
                <div className="flex border-l border-[#1f2937]">
                  <button disabled={isBettingDisabled} className="px-3 hover:bg-gray-800 text-gray-400 text-xs font-bold border-r border-[#1f2937]" onClick={() => setBetAmount(prev => Math.max(10, Number(prev)/2))}>1/2</button>
                  <button disabled={isBettingDisabled} className="px-3 hover:bg-gray-800 text-gray-400 text-xs font-bold" onClick={() => setBetAmount(prev => Number(prev)*2)}>2x</button>
                </div>
              </div>
              <button
                onClick={handlePlaceBet}
                disabled={isBettingDisabled || !selectedBike || placedBet !== null}
                className={`flex-grow py-3 rounded-xl font-black text-lg uppercase tracking-widest transition-all shadow-xl
                  ${placedBet 
                    ? 'bg-emerald-800 text-emerald-200 cursor-not-allowed'
                    : isBettingDisabled || !selectedBike
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-emerald-950 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]'
                  }
                `}
              >
                {placedBet ? `BET PLACED ON #${placedBet.bike}` : "PLACE BET"}
              </button>
            </div>
          </div>
        </div>

        {/* Right Container: Analytics Panel */}
        <div className="shrink-0 xl:w-[30%] flex flex-col bg-[#12182b] border border-[#1f2937] rounded-2xl overflow-hidden shadow-xl min-h-[300px] xl:min-h-0 xl:h-full">
          {/* Tabs */}
          <div className="flex border-b border-[#1f2937] shrink-0">
            <button 
              onClick={() => setActiveTab("chart")}
              className={`flex-1 py-3 text-xs font-bold uppercase transition-all flex items-center justify-center ${activeTab === 'chart' ? 'bg-[#1a2235] text-emerald-400 border-b-2 border-emerald-500' : 'text-gray-500 hover:bg-[#1a2235]/50 hover:text-gray-300'}`}
            >
              <TrendingUp className="w-4 h-4 mr-2" /> Trend Chart
            </button>
            <button 
              onClick={() => setActiveTab("history")}
              className={`flex-1 py-3 text-xs font-bold uppercase transition-all flex items-center justify-center ${activeTab === 'history' ? 'bg-[#1a2235] text-emerald-400 border-b-2 border-emerald-500' : 'text-gray-500 hover:bg-[#1a2235]/50 hover:text-gray-300'}`}
            >
              <History className="w-4 h-4 mr-2" /> History
            </button>
          </div>

          {/* Content */}
          <div className="flex-grow p-4 overflow-y-auto custom-scrollbar flex flex-col">
            
            {activeTab === "chart" && (
              <div className="flex-grow w-full flex flex-col">
                <p className="text-xs text-gray-500 uppercase font-bold mb-4 text-center">Winning Bike Trajectory (Last 20)</p>
                <div className="flex-grow min-h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history.slice(-20)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <filter id="neonGreenGlow" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="3" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                      <XAxis 
                        dataKey="sessionId" 
                        tickFormatter={(val) => val.split('-')[1]} 
                        stroke="#4b5563" 
                        tick={{ fill: '#6b7280', fontSize: 10 }} 
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                      />
                      <YAxis 
                        domain={[1, 10]} 
                        ticks={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
                        stroke="#4b5563" 
                        tick={{ fill: '#6b7280', fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#374151', strokeWidth: 1, strokeDasharray: '4 4' }} />
                      <Line 
                        type="stepAfter" 
                        dataKey="winner" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        dot={{ fill: '#090b14', stroke: '#34d399', strokeWidth: 2, r: 4 }}
                        activeDot={{ fill: '#fff', stroke: '#10b981', strokeWidth: 2, r: 6 }}
                        filter="url(#neonGreenGlow)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {activeTab === "history" && (
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="text-xs text-gray-500 uppercase border-b border-[#1f2937] sticky top-0 bg-[#12182b]">
                  <tr>
                    <th className="pb-3 font-medium">Session</th>
                    <th className="pb-3 font-medium text-center">Winner</th>
                    <th className="pb-3 font-medium text-right">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f2937]/50">
                  {[...history].reverse().map((h, i) => (
                    <tr key={i} className="hover:bg-[#1a2235]/50 transition-colors">
                      <td className="py-3 font-mono text-gray-400 text-xs">{h.sessionId.split('-')[1]}</td>
                      <td className="py-3 text-center">
                        <span className="inline-flex w-6 h-6 items-center justify-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded font-black text-xs">
                          {h.winner}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {h.betPlaced === null ? (
                          <span className="text-gray-500 text-xs">-</span>
                        ) : h.winAmount > 0 ? (
                          <span className="text-emerald-400 font-bold text-xs">+₹{h.winAmount}</span>
                        ) : (
                          <span className="text-red-400 font-bold text-xs">Loss</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

          </div>
        </div>

      </main>
    </div>
  );
}
