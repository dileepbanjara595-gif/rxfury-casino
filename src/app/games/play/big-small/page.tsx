"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, History, BarChart2, User, HelpCircle, Volume2, Wallet, Wifi } from "lucide-react";
import Link from "next/link";
import { useCurrencyStore, CURRENCY_SYMBOLS, formatCurrency, convertFromBase } from "@/store/currencyStore";
import { useUIStore } from "@/store/uiStore";
import { useUserStore } from "@/store/userStore";
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
  const { session } = useUserStore();
  
  const { activeCurrency, baseBalance, setBaseBalance } = useCurrencyStore();
  const displayBalance = convertFromBase(baseBalance, activeCurrency);
  const sym = CURRENCY_SYMBOLS[activeCurrency];

  // Socket & Game State
  const socketRef = useRef<Socket | null>(null);
  const [periodId, setPeriodId] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);
  const [history, setHistory] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // UI State
  const [bottomTab, setBottomTab] = useState<"history" | "chart" | "my">("history");
  
  // Betting State
  const [showBetModal, setShowBetModal] = useState(false);
  const [betSelection, setBetSelection] = useState<{type: string, value: string, color: string} | null>(null);
  const [baseBet, setBaseBet] = useState(10);
  const [multiplier, setMultiplier] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [myBets, setMyBets] = useState<any[]>([]);

  // Result Popup State
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [popupResult, setPopupResult] = useState<any>(null);
  const lastHistoryRef = useRef<string>("");

  useEffect(() => {
    setMounted(true);
    let isSubscribed = true;

    // 1. Establish Authenticated WebSocket Connection
    // Removed hardcoded localhost. In production, this falls back to robust HTTP polling if ws isn't hosted
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || (typeof window !== "undefined" ? window.location.origin : "");
    const userToken = session?.user?.id || (session?.user as any)?.supabaseId || "guest_session";

    const socket = io(socketUrl, {
      auth: {
        token: userToken,
        userId: session?.user?.id,
        email: session?.user?.email
      },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      if (isSubscribed) setIsConnected(true);
      console.log(`Connected to Wingo WebSocket with Auth (Mode: ${activeMode})`);
      socket.emit("join_game", activeMode);
    });

    const handleTick = (data: any) => {
      if (isSubscribed && (data.mode === activeMode || !data.mode)) {
        setPeriodId(data.periodId);
        setTimeLeft(Math.floor(data.timeLeft));
        if (data.history && data.history.length > 0) {
          setHistory(data.history);
        }
        if (data.timeLeft <= 3) {
          setShowBetModal(false);
        }
      }
    };

    socket.on("game_tick", handleTick);
    socket.on("game:tick", handleTick);

    socket.on("game:history", (historyList: any[]) => {
      if (isSubscribed && Array.isArray(historyList) && historyList.length > 0) {
        setHistory(historyList);
      }
    });

    socket.on("game_result", (data: any) => {
      if (isSubscribed && data.mode === activeMode && data.result) {
        setHistory(prev => [{ periodId: data.periodId, ...data.result }, ...prev.slice(0, 19)]);
      }
    });

    socket.on("disconnect", () => {
      if (isSubscribed) setIsConnected(false);
    });

    // 2. High-Reliability Fallback Polling Loop
    const pollState = async () => {
      try {
        const res = await fetch('/api/games/state?game=wingo&mode=' + activeMode);
        if (res.ok && isSubscribed) {
          const data = await res.json();
          setPeriodId(data.periodId);
          setTimeLeft(Math.floor(data.timeLeft));
          
          // CRITICAL FIX: Extract history from backend polling loop
          if (data.history && Array.isArray(data.history) && data.history.length > 0) {
            setHistory(data.history);
          }
          
          if (data.timeLeft <= 3) {
            setShowBetModal(false);
          }
        }
      } catch (e) {}
    };

    pollState();
    const interval = setInterval(pollState, 1000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
      socket.disconnect();
    };
  }, [activeMode, session]);

  // Handle Round Transitions and Result Popups
  useEffect(() => {
    if (history.length > 0) {
      const latest = history[0];
      if (lastHistoryRef.current && lastHistoryRef.current !== latest.periodId) {
        // Trigger popup on new period finish
        const userBets = myBets.filter(b => String(b.period) === String(latest.periodId));
        let totalWin = 0;
        let totalLoss = 0;
        let won = false;
        
        userBets.forEach(bet => {
           const selection = bet.selection.toLowerCase();
           const sizeMatch = selection === latest.size?.toLowerCase();
           const colorMatch = selection === latest.color?.toLowerCase();
           const numMatch = bet.selection === String(latest.number);
           
           if (sizeMatch || colorMatch || numMatch) {
             won = true;
             if (["big", "small"].includes(selection)) totalWin += bet.amount * 1.96;
             else if (["red", "green"].includes(selection)) totalWin += bet.amount * 1.96; 
             else if (selection === "violet") totalWin += bet.amount * 4.5;
             else totalWin += bet.amount * 9;
           } else {
             totalLoss += bet.amount;
           }
        });
        
        setPopupResult({
          ...latest,
          winAmount: won ? totalWin : 0,
          lossAmount: !won && userBets.length > 0 ? totalLoss : 0,
          didBet: userBets.length > 0
        });
        setShowResultPopup(true);
        setTimeout(() => setShowResultPopup(false), 4000);
      }
      lastHistoryRef.current = latest.periodId;
    }
  }, [history, myBets]);

  const handleOpenBet = (type: string, value: string, color: string) => {
    if (timeLeft <= 3) return;
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
          gameName: "wingo", // Matched with backend validator expectation
          gameId: "wingo",
          gameMode: activeMode, // Sent mode (e.g. wingo_30s)
          action: "PLACE",
          amount: totalWager,
          betAmount: totalWager,
          currency: activeCurrency,
          choice: betSelection,
          selection: betSelection,
          periodId: periodId,
          sessionId: periodId
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
        alert(data.error || "Failed to place bet");
      }
    } catch (e) {
      alert("Error placing bet");
    }
    setIsProcessing(false);
  };

  if (!mounted) return <div className="min-h-screen bg-[#1a1d29] max-w-full pb-24 md:pb-8" />;

  const isFrozen = timeLeft <= 3;

  return (
    <div className="min-h-screen bg-[#F7F8FF] text-gray-900 font-sans flex flex-col overflow-x-hidden max-w-[500px] mx-auto shadow-2xl relative max-w-full pb-24 md:pb-8">
      
      {/* Wallet Area */}
      <div className="bg-white p-4 rounded-b-3xl shadow-sm z-0">
        <div className="flex items-center space-x-2 text-gray-500 font-medium mb-1">
          <Wallet className="w-4 h-4" /> <span>Available Balance</span>
        </div>
        <div className="text-2xl font-black text-gray-800">
          {sym} {formatCurrency(displayBalance, activeCurrency)}
        </div>
      </div>

      {/* Game Mode Tabs */}
      <div className="p-4">
        <div className="bg-white p-1 rounded-2xl flex justify-between shadow-sm border border-gray-100">
          {GAME_MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setActiveMode(mode.id)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeMode === mode.id
                  ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {mode.name}
            </button>
          ))}
        </div>
      </div>

      {/* Timer & Period Info */}
      <div className="px-4 mb-4">
        <div className="bg-gradient-to-br from-indigo-900 via-blue-900 to-indigo-950 rounded-3xl p-5 text-white shadow-xl relative overflow-hidden">
          <div className="flex justify-between items-center relative z-10 mb-4">
            <div>
              <p className="text-xs text-blue-200 uppercase tracking-widest font-bold">Active Period</p>
              <p className="text-xl font-mono font-black tracking-wider text-yellow-400">{periodId || "CONNECTING..."}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-blue-200 uppercase tracking-widest font-bold">Count Down</p>
              <div className="flex items-center justify-end space-x-1 font-mono text-2xl font-black">
                <span className="bg-black/40 px-2 py-0.5 rounded-lg border border-white/10">
                  {Math.floor(timeLeft / 60).toString().padStart(2, '0')}
                </span>
                <span>:</span>
                <span className={`bg-black/40 px-2 py-0.5 rounded-lg border border-white/10 ${isFrozen ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                  {(timeLeft % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Color Selection */}
          <div className="grid grid-cols-3 gap-3 relative z-10">
            <button
              disabled={isFrozen}
              onClick={() => handleOpenBet('COLOR', 'Green', 'bg-emerald-500')}
              className="py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-95 disabled:opacity-50 text-white font-black rounded-2xl shadow-lg shadow-emerald-500/30 uppercase tracking-wider text-sm transition-all cursor-pointer"
            >
              Green (2X)
            </button>
            <button
              disabled={isFrozen}
              onClick={() => handleOpenBet('COLOR', 'Violet', 'bg-purple-600')}
              className="py-3 bg-purple-600 hover:bg-purple-700 active:scale-95 disabled:opacity-50 text-white font-black rounded-2xl shadow-lg shadow-purple-600/30 uppercase tracking-wider text-sm transition-all cursor-pointer"
            >
              Violet (4.5X)
            </button>
            <button
              disabled={isFrozen}
              onClick={() => handleOpenBet('COLOR', 'Red', 'bg-rose-500')}
              className="py-3 bg-rose-500 hover:bg-rose-600 active:scale-95 disabled:opacity-50 text-white font-black rounded-2xl shadow-lg shadow-rose-500/30 uppercase tracking-wider text-sm transition-all cursor-pointer"
            >
              Red (2X)
            </button>
          </div>

        </div>
      </div>

      {/* Number Selection Matrix */}
      <div className="px-4 mb-4">
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Select Number (9X Payout)</p>
          <div className="grid grid-cols-5 gap-2">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
              const isGreen = [1, 3, 7, 9].includes(num);
              const isViolet = [0, 5].includes(num);
              const bgColor = isViolet ? 'bg-gradient-to-br from-purple-500 to-rose-500' : isGreen ? 'bg-emerald-500' : 'bg-rose-500';

              return (
                <button
                  key={num}
                  disabled={isFrozen}
                  onClick={() => handleOpenBet('NUMBER', num.toString(), bgColor)}
                  className={`h-12 rounded-2xl text-white font-black text-lg ${bgColor} shadow-md active:scale-95 disabled:opacity-40 transition-transform cursor-pointer`}
                >
                  {num}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <button
              disabled={isFrozen}
              onClick={() => handleOpenBet('SIZE', 'Big', 'bg-amber-500')}
              className="py-3 bg-amber-500 hover:bg-amber-600 active:scale-95 disabled:opacity-50 text-white font-black rounded-2xl shadow-md uppercase tracking-wider text-sm transition-all cursor-pointer"
            >
              Big (5-9) 2X
            </button>
            <button
              disabled={isFrozen}
              onClick={() => handleOpenBet('SIZE', 'Small', 'bg-blue-500')}
              className="py-3 bg-blue-500 hover:bg-blue-600 active:scale-95 disabled:opacity-50 text-white font-black rounded-2xl shadow-md uppercase tracking-wider text-sm transition-all cursor-pointer"
            >
              Small (0-4) 2X
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Tabs: History & My Bets */}
      <div className="px-4 mb-4 flex-1">
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
          <div className="flex border-b border-gray-100 pb-3 mb-3">
            <button
              onClick={() => setBottomTab('history')}
              className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                bottomTab === 'history' ? 'text-red-500 border-b-2 border-red-500 font-black' : 'text-gray-400'
              }`}
            >
              Game History
            </button>
            <button
              onClick={() => setBottomTab('my')}
              className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                bottomTab === 'my' ? 'text-red-500 border-b-2 border-red-500 font-black' : 'text-gray-400'
              }`}
            >
              My Bets
            </button>
          </div>

          {bottomTab === 'history' && (
            <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
              {history.length > 0 ? (
                history.map((h, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 rounded-xl bg-gray-50 text-xs">
                    <span className="font-mono text-gray-500 font-bold">{h.periodId?.slice(-4) || '---'}</span>
                    <span className="font-black text-base">{h.number ?? '-'}</span>
                    <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] text-white ${
                      h.color?.includes('Green') ? 'bg-emerald-500' : h.color?.includes('Violet') ? 'bg-purple-600' : 'bg-rose-500'
                    }`}>
                      {h.color || h.size || '---'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-gray-400 font-bold">Syncing live history...</div>
              )}
            </div>
          )}

          {bottomTab === 'my' && (
            <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
              {myBets.length > 0 ? (
                myBets.map((b) => (
                  <div key={b.id} className="flex justify-between items-center p-2.5 rounded-xl bg-gray-50 text-xs">
                    <span className="font-mono text-gray-500 font-bold">Period: {b.period?.slice(-4)}</span>
                    <span className="font-bold">Pick: {b.selection}</span>
                    <span className="font-black text-emerald-600">{sym} {b.amount}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-gray-400 font-bold">No active bets placed yet.</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bet Modal (Framer Motion) */}
      <AnimatePresence>
        {showBetModal && betSelection && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs p-0"
          >
            <motion.div 
              initial={{ y: 200 }} animate={{ y: 0 }} exit={{ y: 200 }}
              className="bg-white rounded-t-3xl p-6 w-full max-w-[500px] shadow-2xl"
            >
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-bold text-gray-500">Selected Pick: <strong className="text-gray-900">{betSelection.value}</strong></span>
                <button onClick={() => setShowBetModal(false)} className="text-gray-400 font-bold text-lg">✕</button>
              </div>

              {/* Base Amount Selector */}
              <div className="flex gap-2 mb-4">
                {[10, 50, 100, 500, 1000].map(amt => (
                  <button 
                    key={amt} 
                    onClick={() => setBaseBet(amt)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                      baseBet === amt ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {sym}{amt}
                  </button>
                ))}
              </div>

              {/* Multiplier Selector */}
              <div className="flex items-center justify-between bg-gray-50 p-2 rounded-2xl mb-6">
                <span className="text-xs font-bold text-gray-500 pl-2">Multiplier</span>
                <div className="flex gap-1.5">
                  {[1, 5, 10, 20, 50].map(m => (
                    <button
                      key={m}
                      onClick={() => setMultiplier(m)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                        multiplier === m ? 'bg-red-500 text-white' : 'bg-white text-gray-700 shadow-xs'
                      }`}
                    >
                      X{m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={submitBet}
                disabled={isProcessing}
                className="w-full py-4 bg-gradient-to-r from-red-500 to-rose-600 text-white font-black rounded-2xl uppercase tracking-widest text-sm shadow-lg shadow-red-500/30 transition-transform active:scale-98 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? "Placing Bet..." : `Confirm Total: ${sym} ${baseBet * multiplier}`}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
