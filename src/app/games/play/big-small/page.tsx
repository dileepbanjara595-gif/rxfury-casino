"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, History, BarChart2, User, HelpCircle, Volume2, Wallet } from "lucide-react";
import Link from "next/link";
import { useCurrencyStore, CURRENCY_SYMBOLS, formatCurrency, convertFromBase } from "@/store/currencyStore";
import { useUIStore } from "@/store/uiStore";
import { io, Socket } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";

const GAME_MODES = [
  { id: 'wingo_10s', name: '10 Sec' },
  { id: 'wingo_30s', name: '30 Sec' },
  { id: 'wingo_1m', name: '1 Min' },
  { id: 'wingo_5m', name: '5 Min' },
  { id: 'wingo_10m', name: '10 Min' },
];

export default function WingoGamePage() {
  const [mounted, setMounted] = useState(false);
  const [activeMode, setActiveMode] = useState('wingo_30s');
  
  const { activeCurrency, baseBalance, setBaseBalance } = useCurrencyStore();
  const displayBalance = convertFromBase(baseBalance, activeCurrency);
  const sym = CURRENCY_SYMBOLS[activeCurrency];

  // Socket State
  const [socket, setSocket] = useState<Socket | null>(null);
  const [periodId, setPeriodId] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);
  const [history, setHistory] = useState<any[]>([]);

  // UI State
  const [bottomTab, setBottomTab] = useState<"history" | "chart" | "my">("history");
  
  // Betting State
  const [showBetModal, setShowBetModal] = useState(false);
  const [betSelection, setBetSelection] = useState<{type: string, value: string, color: string} | null>(null);
  const [baseBet, setBaseBet] = useState(10);
  const [multiplier, setMultiplier] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [myBets, setMyBets] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
    
    // Connect to Universal Game Engine
    const newSocket = io("http://localhost:4000");
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket) {
      socket.emit("join_game", activeMode);

      const handleTick = (data: any) => {
        if (data.mode === activeMode) {
          setPeriodId(data.periodId);
          setTimeLeft(data.timeLeft);
          setHistory(data.history || []);
          
          if (data.timeLeft <= 3) {
            setShowBetModal(false); // Force close bet modal during countdown freeze
          }
        }
      };
      socket.on("game_tick", handleTick);

      socket.on("game_result", (data: any) => {
        // We could show a winning popup here if the user won
      });

      return () => {
        socket.off("game_tick", handleTick);
        socket.off("game_result");
      };
    }
  }, [socket, activeMode]);

  const handleOpenBet = (type: string, value: string, color: string) => {
    if (timeLeft <= 3) return; // Prevent betting in last 3 seconds
    setBetSelection({ type, value, color });
    setBaseBet(10);
    setMultiplier(1);
    setShowBetModal(true);
  };

  const submitBet = async () => {
    if (!betSelection || isProcessing) return;
    const totalWager = baseBet * multiplier;
    
    if (displayBalance < totalWager) {
      useUIStore.getState().openInsufficientFundsModal();
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch("/api/games/bet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: "wingo",
          action: "PLACE",
          betAmount: totalWager,
          currency: activeCurrency,
          selection: betSelection
        })
      });
      const data = await res.json();
      if (data.success) {
        setBaseBalance(data.newBalanceBase);
        setMyBets(prev => [{
          id: Date.now(),
          period: periodId,
          selection: betSelection.value,
          amount: totalWager,
          status: 'PENDING'
        }, ...prev]);
        setShowBetModal(false);
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert("Error placing bet");
    }
    setIsProcessing(false);
  };

  if (!mounted) return <div className="h-screen bg-[#1a1d29]" />;

  const isFrozen = timeLeft <= 3;

  return (
    <div className="h-screen bg-[#F7F8FF] text-gray-900 font-sans flex flex-col overflow-hidden max-w-[500px] mx-auto shadow-2xl relative">
      


      {/* Wallet Area */}
      <div className="bg-white p-4 rounded-b-3xl shadow-sm z-0">
        <div className="flex items-center space-x-2 text-gray-500 font-medium mb-1">
          <Wallet className="w-4 h-4" /> <span>Available Balance</span>
        </div>
        <div className="text-2xl font-black text-gray-800">
          {sym} {formatCurrency(displayBalance, activeCurrency)}
        </div>
      </div>

      <div className="flex-grow overflow-y-auto no-scrollbar pb-20">
        
        {/* Game Mode Tabs */}
        <div className="flex overflow-x-auto no-scrollbar bg-white mt-2 py-2 px-2 gap-2 shadow-sm">
          {GAME_MODES.map(mode => (
            <button
              key={mode.id}
              onClick={() => setActiveMode(mode.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                activeMode === mode.id 
                  ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {mode.name}
            </button>
          ))}
        </div>

        {/* Timer & Period Section */}
        <div className="bg-white m-3 p-4 rounded-2xl shadow-sm flex justify-between items-center">
          <div>
            <p className="text-gray-500 text-sm font-medium">Period</p>
            <p className="font-bold text-gray-800 text-lg font-mono">{periodId || "Loading..."}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-500 text-sm font-medium">Count Down</p>
            <div className="flex space-x-1 mt-1">
              {String(timeLeft).padStart(2, '0').split('').map((digit, i) => (
                <div key={i} className={`w-8 h-10 flex items-center justify-center text-2xl font-black text-white rounded bg-gray-800 ${isFrozen ? 'animate-pulse bg-red-600' : ''}`}>
                  {digit}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Betting Grid Zone */}
        <div className={`bg-white m-3 p-4 rounded-2xl shadow-sm transition-opacity duration-300 ${isFrozen ? 'opacity-50 pointer-events-none' : ''}`}>
          
          {/* Colors */}
          <div className="flex justify-between gap-3 mb-4">
            <button onClick={() => handleOpenBet('COLOR', 'Green', 'bg-green-500')} className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl shadow-[0_4px_0_#166534] active:translate-y-1 active:shadow-none transition-all">Green</button>
            <button onClick={() => handleOpenBet('COLOR', 'Violet', 'bg-purple-500')} className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 rounded-xl shadow-[0_4px_0_#581c87] active:translate-y-1 active:shadow-none transition-all">Violet</button>
            <button onClick={() => handleOpenBet('COLOR', 'Red', 'bg-red-500')} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl shadow-[0_4px_0_#991b1b] active:translate-y-1 active:shadow-none transition-all">Red</button>
          </div>

          {/* Numbers Grid */}
          <div className="bg-gray-50 rounded-2xl p-4 grid grid-cols-5 gap-y-4 gap-x-2 justify-items-center mb-4">
            {[0,1,2,3,4,5,6,7,8,9].map(num => {
              let colorClass = "bg-blue-500";
              if ([1,3,7,9].includes(num)) colorClass = "bg-green-500";
              if ([2,4,6,8].includes(num)) colorClass = "bg-red-500";
              if (num === 0) colorClass = "bg-gradient-to-br from-red-500 to-purple-500";
              if (num === 5) colorClass = "bg-gradient-to-br from-green-500 to-purple-500";

              return (
                <button 
                  key={num}
                  onClick={() => handleOpenBet('NUMBER', String(num), colorClass)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-black text-white shadow-md hover:scale-110 active:scale-95 transition-transform ${colorClass}`}
                >
                  {num}
                </button>
              );
            })}
          </div>

          {/* Size */}
          <div className="flex justify-between gap-3">
            <button onClick={() => handleOpenBet('SIZE', 'Big', 'bg-yellow-500')} className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-xl shadow-[0_4px_0_#a16207] active:translate-y-1 active:shadow-none transition-all border border-yellow-600 text-lg">Big</button>
            <button onClick={() => handleOpenBet('SIZE', 'Small', 'bg-blue-500')} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl shadow-[0_4px_0_#1e3a8a] active:translate-y-1 active:shadow-none transition-all border border-blue-600 text-lg">Small</button>
          </div>
        </div>

        {/* Data Tabs */}
        <div className="bg-white m-3 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-100">
            <button onClick={() => setBottomTab("history")} className={`flex-1 py-3 text-sm font-bold transition-colors ${bottomTab === 'history' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-500 hover:bg-gray-50'}`}><History className="w-4 h-4 inline mr-1" /> Game History</button>
            <button onClick={() => setBottomTab("chart")} className={`flex-1 py-3 text-sm font-bold transition-colors ${bottomTab === 'chart' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-500 hover:bg-gray-50'}`}><BarChart2 className="w-4 h-4 inline mr-1" /> Chart</button>
            <button onClick={() => setBottomTab("my")} className={`flex-1 py-3 text-sm font-bold transition-colors ${bottomTab === 'my' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-500 hover:bg-gray-50'}`}><User className="w-4 h-4 inline mr-1" /> My History</button>
          </div>
          
          <div className="p-0">
            {bottomTab === "history" && (
              <table className="w-full text-center text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                    <th className="py-3 font-medium">Period</th>
                    <th className="py-3 font-medium">Number</th>
                    <th className="py-3 font-medium">Size</th>
                    <th className="py-3 font-medium">Color</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 text-gray-700 font-mono text-xs">{h.periodId}</td>
                      <td className={`py-3 font-black text-lg ${h.colors[0] === 'Green' ? 'text-green-500' : h.colors[0] === 'Red' ? 'text-red-500' : 'text-purple-500'}`}>{h.number}</td>
                      <td className="py-3 text-gray-700 font-bold">{h.size}</td>
                      <td className="py-3 flex justify-center space-x-1 mt-2">
                        {h.colors.map((c: string, j: number) => (
                          <div key={j} className={`w-3 h-3 rounded-full ${c === 'Green' ? 'bg-green-500' : c === 'Red' ? 'bg-red-500' : 'bg-purple-500'}`} />
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {bottomTab === "chart" && <div className="p-8 text-center text-gray-400 font-medium">Chart Visualization Coming Soon</div>}
            {bottomTab === "my" && (
              myBets.length === 0 
                ? <div className="p-8 text-center text-gray-400 font-medium">No Data Available</div>
                : <table className="w-full text-center text-sm">
                    <thead><tr className="bg-gray-50 text-gray-500 border-b border-gray-100"><th className="py-2">Period</th><th className="py-2">Select</th><th className="py-2">Amount</th><th className="py-2">Status</th></tr></thead>
                    <tbody>
                      {myBets.map((b, i) => (
                        <tr key={i} className="border-b border-gray-50"><td className="py-2 text-xs font-mono">{b.period}</td><td className="py-2 font-bold">{b.selection}</td><td className="py-2">{sym}{b.amount}</td><td className="py-2 text-yellow-500 font-bold">{b.status}</td></tr>
                      ))}
                    </tbody>
                  </table>
            )}
          </div>
        </div>
      </div>

      {/* Betting Popup Modal */}
      <AnimatePresence>
        {showBetModal && betSelection && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={() => setShowBetModal(false)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 overflow-hidden shadow-[0_-10px_40px_rgba(0,0,0,0.2)] flex flex-col max-h-[85vh]">
              
              <div className={`${betSelection.color.includes('bg-') ? betSelection.color : 'bg-gray-800'} text-white text-center py-4 font-black text-xl shadow-inner relative`}>
                RX Wingo {activeMode.split('_')[1].toUpperCase()}
                <button onClick={() => setShowBetModal(false)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white font-bold">✕</button>
              </div>

              <div className="p-5 overflow-y-auto">
                <div className="text-center mb-6">
                  <p className="text-gray-500 font-medium mb-1">Select {betSelection.type}</p>
                  <p className={`text-2xl font-black ${betSelection.color.includes('green') ? 'text-green-500' : betSelection.color.includes('red') ? 'text-red-500' : betSelection.color.includes('purple') ? 'text-purple-500' : betSelection.color.includes('yellow') ? 'text-yellow-600' : 'text-blue-600'}`}>
                    {betSelection.value}
                  </p>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between text-gray-500 text-sm font-bold mb-2"><span>Balance</span><span>{sym} {formatCurrency(displayBalance, activeCurrency)}</span></div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-gray-700">Amount</span>
                    <div className="flex gap-2 flex-wrap">
                      {[10, 100, 1000, 10000].map(amt => (
                        <button key={amt} onClick={() => setBaseBet(amt)} className={`px-3 py-1.5 rounded text-sm font-bold border transition-colors ${baseBet === amt ? betSelection.color.replace('bg-', 'bg-').replace('500', '100') + ' ' + betSelection.color.replace('bg-', 'text-').replace('500', '600') + ' ' + betSelection.color.replace('bg-', 'border-').replace('500', '500') : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                          {amt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mb-6 flex items-center justify-between bg-gray-50 p-2 rounded-xl border border-gray-100">
                  <span className="font-bold text-gray-700 px-2">Quantity</span>
                  <div className="flex items-center space-x-4">
                    <button onClick={() => setMultiplier(Math.max(1, multiplier - 1))} className={`w-8 h-8 rounded flex items-center justify-center font-black text-white ${betSelection.color}`}>-</button>
                    <span className="font-bold text-xl w-8 text-center">{multiplier}</span>
                    <button onClick={() => setMultiplier(multiplier + 1)} className={`w-8 h-8 rounded flex items-center justify-center font-black text-white ${betSelection.color}`}>+</button>
                  </div>
                </div>

                <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-2">
                  {[1, 5, 10, 20, 50, 100].map(x => (
                    <button key={x} onClick={() => setMultiplier(x)} className={`px-4 py-2 rounded font-bold whitespace-nowrap transition-colors ${multiplier === x ? betSelection.color + ' text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      X{x}
                    </button>
                  ))}
                </div>

                <button 
                  onClick={submitBet}
                  disabled={isProcessing}
                  className={`w-full py-4 rounded-xl font-black text-lg text-white shadow-lg active:scale-95 transition-all flex items-center justify-center space-x-2 ${betSelection.color} ${isProcessing ? 'opacity-70' : ''}`}
                >
                  {isProcessing ? <span className="animate-spin text-xl">↻</span> : null}
                  <span>TOTAL WAGER: {sym} {formatCurrency(baseBet * multiplier, activeCurrency)}</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}




