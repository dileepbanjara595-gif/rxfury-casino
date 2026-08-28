"use client";

import { useCurrencyStore, convertFromBase, convertToBase, CURRENCY_SYMBOLS, formatCurrency } from '@/store/currencyStore';
import { useState, useEffect } from "react";
import { ArrowLeft, Clock, History, BarChart2, Dices, ChevronUp } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type BetSelection = "BIG" | "SMALL" | "ODD" | "EVEN" | number | null;

interface GameHistory {
  sessionId: string;
  dice: [number, number, number];
  sum: number;
  size: "BIG" | "SMALL";
}

export default function K3GamePage() {
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
  const [selection, setSelection] = useState<BetSelection>(null);
  
  // Game Engine
  const [gameState, setGameState] = useState<"betting" | "rolling" | "result">("betting");
  const [countdown, setCountdown] = useState(30);
  const [diceValues, setDiceValues] = useState<[number, number, number]>([1, 1, 1]);
  const [currentSessionId, setCurrentSessionId] = useState("K3-00045");
  
  // Tabs
  const [activeTab, setActiveTab] = useState<"history" | "chart">("history");

  // Mock History Data
  const [history, setHistory] = useState<GameHistory[]>([]);

  useEffect(() => {
    setMounted(true);
    // Generate initial history
    const initialHistory: GameHistory[] = [];
    for (let i = 25; i <= 44; i++) {
      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      const d3 = Math.floor(Math.random() * 6) + 1;
      const sum = d1 + d2 + d3;
      initialHistory.push({
        sessionId: `K3-000${i}`,
        dice: [d1, d2, d3],
        sum,
        size: sum <= 10 ? "SMALL" : "BIG"
      });
    }
    setHistory(initialHistory);
  }, []);

  // Game Loop
  useEffect(() => {
    let timerId: NodeJS.Timeout;

    if (gameState === "betting") {
      timerId = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setGameState("rolling");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } 
    
    else if (gameState === "rolling") {
      const rollInterval = setInterval(() => {
        setDiceValues([
          Math.floor(Math.random() * 6) + 1,
          Math.floor(Math.random() * 6) + 1,
          Math.floor(Math.random() * 6) + 1,
        ]);
      }, 80);

      timerId = setTimeout(() => {
        clearInterval(rollInterval);
        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;
        const d3 = Math.floor(Math.random() * 6) + 1;
        const finalSum = d1 + d2 + d3;
        setDiceValues([d1, d2, d3]);
        
        const newResult: GameHistory = {
          sessionId: currentSessionId,
          dice: [d1, d2, d3],
          sum: finalSum,
          size: finalSum <= 10 ? "SMALL" : "BIG"
        };
        
        setHistory(prev => [...prev.slice(1), newResult]);
        
        // Payout evaluation dummy
        if (selection) {
          const isWin = 
            (selection === "BIG" && newResult.size === "BIG") ||
            (selection === "SMALL" && newResult.size === "SMALL") ||
            (selection === "ODD" && finalSum % 2 !== 0) ||
            (selection === "EVEN" && finalSum % 2 === 0) ||
            (selection === finalSum);
            
          if (isWin) {
            const mult = typeof selection === 'number' ? 15 : 1.98; // dummy multipliers
            setWalletBalance((prev: any) => prev + (Number(betAmount) * mult));
            alert(`You Won! +₹${(Number(betAmount) * mult).toFixed(2)}`);
          }
        }

        setGameState("result");
      }, 3000);
    } 
    
    else if (gameState === "result") {
      timerId = setTimeout(() => {
        setSelection(null);
        setCountdown(30);
        setCurrentSessionId(prev => `K3-000${parseInt(prev.split('-')[1]) + 1}`);
        setGameState("betting");
      }, 5000);
    }

    return () => {
      clearInterval(timerId);
      clearTimeout(timerId);
    };
  }, [gameState, selection, betAmount, currentSessionId]);

  const handlePlaceBet = () => {
    if (gameState !== "betting" || !selection) return;
    if (Number(betAmount) < 10 || walletBalance < Number(betAmount)) {
      alert("Invalid bet amount or insufficient balance!");
      return;
    }
    setWalletBalance((prev: any) => prev - Number(betAmount));
  };

  if (!mounted) {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center max-w-full pb-24 md:pb-8"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const diceSum = diceValues.reduce((a, b) => a + b, 0);

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 p-3 rounded-lg shadow-xl">
          <p className="text-gray-400 text-xs mb-1">Session: {payload[0].payload.sessionId}</p>
          <p className="text-blue-400 font-bold">Sum: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#090b14] text-gray-100 font-sans flex flex-col pb-32 md:pb-0 selection:bg-blue-500/30 max-w-full">
      
      {/* Header */}
      <header className="sticky top-0 bg-[#0f1423]/90 backdrop-blur-md border-b border-[#1f2937] p-4 flex items-center justify-between shadow-2xl z-50">
        <div className="flex items-center space-x-4">
          <Link href="/games" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="flex items-center space-x-2">
            <Dices className="w-6 h-6 text-indigo-400" />
            <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400 uppercase tracking-widest italic">
              K3 LOTTERY
            </h1>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 uppercase">Wallet</p>
          <p className="font-bold text-emerald-400">₹{walletBalance.toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
        </div>
      </header>

      {/* Main Scrollable Content */}
      <main className="flex-grow flex flex-col md:flex-row max-w-7xl mx-auto w-full">
        
        {/* Left/Top: Game Area & Betting */}
        <div className="w-full md:w-1/2 lg:w-7/12 flex flex-col border-r border-[#1f2937]">
          
          {/* Live Draw Stage */}
          <div className="bg-[#12182b] p-6 border-b border-[#1f2937] flex flex-col items-center justify-center relative overflow-hidden min-h-[250px]">
            <div className="absolute top-0 right-1/2 translate-x-1/2 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none z-0"></div>
            
            <div className="z-10 flex flex-col items-center w-full">
              <div className="flex justify-between w-full mb-6">
                <span className="text-gray-400 font-mono text-sm">{currentSessionId}</span>
                {gameState === "betting" ? (
                  <motion.div
                    animate={countdown <= 10 ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 1, repeat: countdown <= 10 ? Infinity : 0 }}
                    className={`flex items-center font-mono font-bold text-lg ${countdown <= 10 ? 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'text-blue-400'}`}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    00:{countdown.toString().padStart(2, '0')}
                  </motion.div>
                ) : (
                  <span className="text-yellow-400 font-bold uppercase animate-pulse">Drawing...</span>
                )}
              </div>

              {/* 3-Dice Display */}
              <div className="flex space-x-4 mb-4 relative">
                {[0, 1, 2].map((idx) => (
                  <motion.div
                    key={idx}
                    animate={gameState === "rolling" ? { 
                      rotateX: [0, 180, 360], rotateY: [0, 90, 180, 270, 360], scale: [1, 1.1, 1]
                    } : { rotateX: 0, rotateY: 0, scale: 1 }}
                    transition={gameState === "rolling" ? { duration: 0.4, repeat: Infinity } : { type: "spring" }}
                    className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-gray-100 to-gray-300 rounded-2xl flex items-center justify-center shadow-[0_10px_20px_rgba(0,0,0,0.5),inset_0_-4px_0_rgba(0,0,0,0.2)] text-gray-900"
                  >
                    {/* Render dots for dice faces */}
                    <div className="grid grid-cols-3 grid-rows-3 gap-1 w-10 h-10 md:w-12 md:h-12">
                      {[...Array(9)].map((_, i) => {
                        const val = diceValues[idx];
                        const showDot = 
                          (val === 1 && i === 4) ||
                          (val === 2 && (i === 0 || i === 8)) ||
                          (val === 3 && (i === 0 || i === 4 || i === 8)) ||
                          (val === 4 && (i === 0 || i === 2 || i === 6 || i === 8)) ||
                          (val === 5 && (i === 0 || i === 2 || i === 4 || i === 6 || i === 8)) ||
                          (val === 6 && (i === 0 || i === 2 || i === 3 || i === 5 || i === 6 || i === 8));
                        return (
                          <div key={i} className={`rounded-full ${showDot ? 'bg-red-600 shadow-inner' : 'bg-transparent'}`}></div>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {/* Total Sum Display */}
              <div className="h-10">
                <AnimatePresence>
                  {gameState === "result" && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-indigo-600/20 border border-indigo-500/50 text-indigo-300 font-black px-6 py-1.5 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                    >
                      TOTAL: {diceSum}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </div>

          {/* Betting Grid */}
          <div className="p-4 md:p-6 space-y-6">
            
            {/* Main Options (Big/Small/Odd/Even) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button onClick={() => setSelection("BIG")} disabled={gameState !== "betting"} className={`relative p-4 rounded-xl flex flex-col items-center justify-center transition-all ${selection === "BIG" ? 'bg-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.6)] border-2 border-white' : 'bg-[#1a2235] border border-[#2a3754] text-orange-400 hover:bg-[#1e273c]'}`}>
                <span className="text-2xl font-black mb-1">BIG</span>
                <span className="text-[10px] text-white/70">1.98x</span>
              </button>
              <button onClick={() => setSelection("SMALL")} disabled={gameState !== "betting"} className={`relative p-4 rounded-xl flex flex-col items-center justify-center transition-all ${selection === "SMALL" ? 'bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.6)] border-2 border-white' : 'bg-[#1a2235] border border-[#2a3754] text-blue-400 hover:bg-[#1e273c]'}`}>
                <span className="text-2xl font-black mb-1">SMALL</span>
                <span className="text-[10px] text-white/70">1.98x</span>
              </button>
              <button onClick={() => setSelection("ODD")} disabled={gameState !== "betting"} className={`relative p-4 rounded-xl flex flex-col items-center justify-center transition-all ${selection === "ODD" ? 'bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.6)] border-2 border-white' : 'bg-[#1a2235] border border-[#2a3754] text-purple-400 hover:bg-[#1e273c]'}`}>
                <span className="text-2xl font-black mb-1">ODD</span>
                <span className="text-[10px] text-white/70">1.98x</span>
              </button>
              <button onClick={() => setSelection("EVEN")} disabled={gameState !== "betting"} className={`relative p-4 rounded-xl flex flex-col items-center justify-center transition-all ${selection === "EVEN" ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.6)] border-2 border-white' : 'bg-[#1a2235] border border-[#2a3754] text-emerald-400 hover:bg-[#1e273c]'}`}>
                <span className="text-2xl font-black mb-1">EVEN</span>
                <span className="text-[10px] text-white/70">1.98x</span>
              </button>
            </div>

            {/* Specific Sum Bets */}
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold mb-3">Specific Sum</p>
              <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                {[3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18].map(num => {
                  const isSelected = selection === num;
                  // Dummy mult mapping
                  const mult = num === 3 || num === 18 ? 200 : num === 4 || num === 17 ? 60 : 15;
                  return (
                    <button 
                      key={num}
                      onClick={() => setSelection(num)}
                      disabled={gameState !== "betting"}
                      className={`flex flex-col items-center justify-center py-2 rounded-lg border transition-all
                        ${isSelected ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_15px_rgba(79,70,229,0.6)]' : 'bg-[#12182b] border-[#2a3754] text-gray-300 hover:bg-[#1a2235] hover:border-indigo-500/50'}
                      `}
                    >
                      <span className="font-bold text-lg">{num}</span>
                      <span className="text-[9px] opacity-70">{mult}x</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* Right/Bottom: Advanced History & Trend Chart Panel */}
        <div className="w-full md:w-1/2 lg:w-5/12 flex flex-col bg-[#0b0f1a]">
          
          {/* Tab Headers */}
          <div className="flex border-b border-[#1f2937]">
            <button 
              onClick={() => setActiveTab("history")}
              className={`flex-1 py-4 text-sm font-bold uppercase transition-all flex items-center justify-center ${activeTab === 'history' ? 'bg-[#12182b] text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-500 hover:bg-[#12182b]/50 hover:text-gray-300'}`}
            >
              <History className="w-4 h-4 mr-2" /> Game History
            </button>
            <button 
              onClick={() => setActiveTab("chart")}
              className={`flex-1 py-4 text-sm font-bold uppercase transition-all flex items-center justify-center ${activeTab === 'chart' ? 'bg-[#12182b] text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-500 hover:bg-[#12182b]/50 hover:text-gray-300'}`}
            >
              <BarChart2 className="w-4 h-4 mr-2" /> Trend Chart
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-grow p-4 min-h-[400px] overflow-y-auto custom-scrollbar bg-[#12182b]/30">
            
            {activeTab === "history" && (
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="text-xs text-gray-500 uppercase border-b border-[#1f2937]">
                  <tr>
                    <th className="pb-3 font-medium">Session</th>
                    <th className="pb-3 font-medium text-center">Result</th>
                    <th className="pb-3 font-medium text-center">Sum</th>
                    <th className="pb-3 font-medium text-right">Size</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f2937]/50">
                  {[...history].reverse().map((h) => (
                    <tr key={h.sessionId} className="hover:bg-[#1a2235]/50 transition-colors">
                      <td className="py-3 font-mono text-gray-400 text-xs">{h.sessionId.split('-')[1]}</td>
                      <td className="py-3 text-center">
                        <div className="flex space-x-1 justify-center">
                          {h.dice.map((d, i) => (
                            <span key={i} className="w-5 h-5 bg-gray-200 text-gray-900 rounded font-black text-xs flex items-center justify-center">{d}</span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 text-center font-bold">{h.sum}</td>
                      <td className="py-3 text-right">
                        <span className={`px-2 py-1 rounded text-xs font-bold border ${h.size === 'BIG' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                          {h.size}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === "chart" && (
              <div className="h-[350px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history.slice(-20)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
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
                      domain={[3, 18]} 
                      ticks={[3, 6, 9, 12, 15, 18]}
                      stroke="#4b5563" 
                      tick={{ fill: '#6b7280', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#374151', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    <Line 
                      type="monotone" 
                      dataKey="sum" 
                      stroke="#6366f1" 
                      strokeWidth={3}
                      dot={{ fill: '#090b14', stroke: '#818cf8', strokeWidth: 2, r: 4 }}
                      activeDot={{ fill: '#fff', stroke: '#6366f1', strokeWidth: 2, r: 6 }}
                      filter="url(#neonGlow)"
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div className="text-center mt-4 text-xs text-gray-500">Showing last 20 rounds trajectory</div>
              </div>
            )}
          </div>
        </div>

      </main>

      {/* Floating/Sticky Action Bar for Mobile & Desktop */}
      <div className="fixed md:sticky bottom-0 left-0 w-full bg-[#111827]/95 backdrop-blur-xl border-t border-[#1f2937] p-4 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex bg-[#0a0a0f] border border-[#1f2937] rounded-xl overflow-hidden w-full sm:w-64 focus-within:border-indigo-500 transition-colors">
            <div className="pl-4 flex items-center justify-center text-gray-500">₹</div>
            <input 
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(Number(e.target.value))}
              placeholder="Bet Amount"
              className="w-full bg-transparent px-2 py-3 text-white font-bold outline-none"
            />
          </div>
          <button 
            onClick={handlePlaceBet}
            disabled={gameState !== "betting" || !selection}
            className={`w-full sm:w-auto flex-grow max-w-sm py-3.5 rounded-xl font-black text-lg shadow-xl uppercase tracking-wider transition-all
              ${gameState !== "betting" 
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                : selection 
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.5)]' 
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {gameState === "betting" && !selection ? "SELECT BET" : gameState === "betting" ? "PLACE BET" : "WAITING FOR RESULT"}
          </button>
        </div>
      </div>
    </div>
  );
}
