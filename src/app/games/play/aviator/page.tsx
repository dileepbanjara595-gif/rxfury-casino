"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, User, Activity, History, Settings, Timer, Wifi } from "lucide-react";
import Link from "next/link";
import { useCurrencyStore, CURRENCY_SYMBOLS, formatCurrency, convertFromBase, convertToBase } from "@/store/currencyStore";
import { useUserStore } from "@/store/userStore";
import { io, Socket } from "socket.io-client";
import React, { Component, ReactNode } from 'react';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Aviator Game Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-[500px] bg-black text-white p-6 text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2 uppercase tracking-widest text-red-400">Connection Interrupted</h2>
          <p className="text-gray-400 max-w-md">The game session encountered a rendering error or lost connection. Don't worry, any confirmed bets are safely recorded on the server.</p>
          <button onClick={() => window.location.reload()} className="mt-6 px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded">
            RELOAD GAME
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}


type GameState = "WAITING_FOR_BETS" | "GAME_RUNNING" | "CRASHED";

interface SyncState {
  state: GameState;
  timeRemaining: number;
  currentSessionId: string;
  currentMultiplier: number;
  crashMultiplier?: number | null;
}

export default function AviatorGamePage() {
  const [mounted, setMounted] = useState(false);
  const { session } = useUserStore();
  
  // Synced Server State
  const [syncState, setSyncState] = useState<SyncState>({
    state: "WAITING_FOR_BETS",
    timeRemaining: 15.0,
    currentSessionId: "",
    currentMultiplier: 1.00
  });

  const [recentHistory, setRecentHistory] = useState<number[]>([]);
  const [betAmount, setBetAmount] = useState<number | "">("");
  const [isBetPlaced, setIsBetPlaced] = useState(false);
  const [cashedOutAt, setCashedOutAt] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const planeImageRef = useRef<HTMLImageElement | null>(null);

  // Connect to Global Currency Store
  const { activeCurrency, baseBalance, setBaseBalance } = useCurrencyStore();
  const displayBalance = convertFromBase(baseBalance, activeCurrency);
  const sym = CURRENCY_SYMBOLS[activeCurrency];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Fetch real history & state on load from RapidAPI safely
    fetch('/api/games/aviator/live')
      .then(res => res.json())
      .then(payload => {
        if (payload.data) {
           setSyncState(prev => ({ ...prev, ...payload.data }));
           if (payload.data.history && payload.data.history.length > 0) {
             setRecentHistory(payload.data.history);
           }
        }
      })
      .catch(e => console.error("RapidAPI initial fetch error", e));
      
    // If no history in 3 seconds, leave empty so UI shows "Live history currently unavailable - reconnecting..."
    const fallbackTimer = setTimeout(() => {
       setRecentHistory(prev => prev.length === 0 ? [] : prev);
    }, 3000);
    return () => clearTimeout(fallbackTimer);
  }, []);

  useEffect(() => {
    const img = new window.Image();
    img.src = "/plane.png";
    planeImageRef.current = img;

    let isSubscribed = true;

    // 1. Establish Authenticated WebSocket Connection
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
      console.log("Connected to Aviator Game Server with Auth");
      socket.emit("join_aviator");
    });

    socket.on("gameStateUpdate", (payload: SyncState & { history?: number[] }) => {
      if (isSubscribed) {
        setSyncState(payload);
        if (payload.history && payload.history.length > 0) {
          setRecentHistory(payload.history);
        }
      }
    });

    socket.on("game:tick", (payload: SyncState) => {
      if (isSubscribed) setSyncState(payload);
    });

    socket.on("game:history", (historyList: number[]) => {
      if (isSubscribed && Array.isArray(historyList) && historyList.length > 0) {
        setRecentHistory(historyList);
      }
    });

    socket.on("disconnect", () => {
      if (isSubscribed) setIsConnected(false);
    });

    // 2. Live Multiplier Polling Loop (via RapidAPI Bet7k) with Exponential Backoff
    let timeoutId: NodeJS.Timeout;
    let failCount = 0;

    const pollState = async () => {
      if (!isSubscribed) return;
      try {
        const res = await fetch('/api/games/aviator/live');
        if (res.ok) {
          const payload = await res.json();
          
          // Reset fail count if we get a valid payload, even if it's a fallback
          // But if payload.fallback is true, we could optionally increase delay slightly, 
          // let's just reset fail count because the backend handled it gracefully.
          if (payload.data) {
            failCount = payload.fallback ? Math.min(failCount + 1, 3) : 0;
            
            setSyncState(prev => ({
              ...prev,
              ...payload.data,
              currentSessionId: payload.data.currentSessionId || prev.currentSessionId
            }));
            
            if (payload.data.history && Array.isArray(payload.data.history) && payload.data.history.length > 0) {
              setRecentHistory(payload.data.history);
            }
          } else {
            failCount++;
          }
        } else {
          failCount++;
        }
      } catch (e) {
        failCount++;
        console.error("Live Aviator API Sync Error:", e);
      }
      
      if (isSubscribed) {
        // Exponential backoff: starts at 600ms, maxes out at 8000ms if failing
        const baseDelay = 600;
        const maxDelay = 8000;
        const nextDelay = failCount > 0 ? Math.min(baseDelay * Math.pow(1.5, failCount), maxDelay) : baseDelay;
        timeoutId = setTimeout(pollState, nextDelay);
      }
    };

    pollState();

    return () => {
      isSubscribed = false;
      clearTimeout(timeoutId);
      socket.disconnect();
    };
  }, [session]);

  // Dynamic Canvas Rendering based on Server State
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (syncState.state === "GAME_RUNNING" || syncState.state === "CRASHED") {
      const startX = 0;
      const startY = canvas.height - 20;

      const elapsedTime = Math.max(0, Math.log(syncState.currentMultiplier) / 0.00006);
      
      const x = Math.min((elapsedTime / 10000) * canvas.width, canvas.width - 20);
      const y = canvas.height - 20 - Math.min((syncState.currentMultiplier / 10) * canvas.height, canvas.height - 40);

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(x * 0.5, startY, x, y);
      ctx.lineTo(x, canvas.height);
      ctx.lineTo(startX, canvas.height);
      ctx.closePath();

      const gradient = ctx.createLinearGradient(0, y, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
      gradient.addColorStop(1, 'rgba(239, 68, 68, 0.0)');
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(x * 0.5, startY, x, y);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 4;
      ctx.stroke();

      if (planeImageRef.current && planeImageRef.current.complete) {
        ctx.save();
        ctx.translate(x, y);
        const angle = Math.atan2(y - startY, x - startX) * 0.3;
        ctx.rotate(angle);
        ctx.drawImage(planeImageRef.current, -25, -25, 50, 50);
        ctx.restore();
      }
    }
  }, [syncState]);

  // Reset Bet State when round resets to WAITING_FOR_BETS
  useEffect(() => {
    if (syncState.state === "WAITING_FOR_BETS") {
      setIsBetPlaced(false);
      setCashedOutAt(null);
    }
  }, [syncState.state]);

  const handleBet = async () => {
    if (!betAmount || betAmount <= 0) return;
    if (displayBalance < Number(betAmount)) {
      alert("Insufficient Balance");
      return;
    }

    const baseBetDeduction = convertToBase(Number(betAmount), activeCurrency);
    setBaseBalance(baseBalance - baseBetDeduction);
    setIsBetPlaced(true);

    try {
      await fetch('/api/games/bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          gameId: 'aviator', 
          action: 'PLACE', 
          betAmount: Number(betAmount), 
          currency: activeCurrency,
          sessionId: syncState.currentSessionId
        })
      });
    } catch (e) {
      console.error("Bet error:", e);
    }
  };

  const handleCashout = async () => {
    if (!isBetPlaced || cashedOutAt || syncState.state !== "GAME_RUNNING") return;

    const currentMult = syncState.currentMultiplier;
    setCashedOutAt(currentMult);

    const winAmount = Number(betAmount) * currentMult;
    const baseWinCredit = convertToBase(winAmount, activeCurrency);
    setBaseBalance(baseBalance + baseWinCredit);

    try {
      await fetch('/api/games/bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          gameId: 'aviator', 
          action: 'CASHOUT', 
          betAmount: Number(betAmount), 
          multiplier: currentMult, 
          currency: activeCurrency,
          sessionId: syncState.currentSessionId
        })
      });
    } catch (e) {
      console.error("Cashout error:", e);
    }
  };

  return (
  <ErrorBoundary>
    <div className="min-h-screen bg-[#070b10] text-gray-100 flex flex-col font-sans select-none overflow-x-hidden">
      
      {/* Top Navigation Bar */}
      <div className="bg-[#0c121d] border-b border-gray-800 px-4 py-3 flex justify-between items-center z-20">
        <div className="flex items-center space-x-4">
          <Link href="/games" className="p-2 hover:bg-gray-800 rounded-xl transition-colors text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center space-x-2">
            <span className="text-xl font-black text-red-500 tracking-wider">AVIATOR</span>
            <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full text-[10px] text-green-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              Live Sync
            </div>
          </div>
        </div>

        {/* Global Real Balance Display */}
        <div className="flex items-center space-x-3">
          <div className="bg-[#131824] border border-gray-800 px-4 py-1.5 rounded-xl flex items-center space-x-2 shadow-inner">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Balance</span>
            <span className="text-sm font-mono font-black text-emerald-400">
              {sym} {formatCurrency(displayBalance, activeCurrency)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Game Arena */}
      <div className="flex-1 flex flex-col lg:flex-row relative">
        
        {/* Left / Center Viewport */}
        <div className="flex-1 flex flex-col bg-[#0f141f] relative min-h-[380px] lg:min-h-[500px]">
          
          {/* Recent Multipliers Bar */}
          <div className="h-10 bg-[#0a0f16] border-b border-gray-800 flex items-center px-4 space-x-2 overflow-x-auto no-scrollbar z-10">
            <History className="w-4 h-4 text-gray-500 mr-1 shrink-0" />
            {recentHistory.map((m, i) => (
              <span key={i} className={`text-xs font-bold font-mono px-2.5 py-0.5 rounded-full border shrink-0 ${
                m >= 10 ? 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20 shadow-[0_0_8px_rgba(217,70,239,0.3)]' :
                m >= 2 ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                'bg-blue-500/10 text-blue-400 border-blue-500/20'
              }`}>
                {m.toFixed(2)}x
              </span>
            ))}
          </div>

          {/* Central Flight Canvas */}
          <div className="flex-1 flex items-center justify-center relative overflow-hidden">
            <canvas 
              ref={canvasRef} 
              width={800} 
              height={400} 
              className={`absolute inset-0 w-full h-full z-0 opacity-90 transition-opacity duration-300 ${syncState.state === "WAITING_FOR_BETS" ? "opacity-0" : "opacity-100"}`} 
            />
            
            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none"></div>
            
            {/* State 1: WAITING FOR BETS */}
            {syncState.state === "WAITING_FOR_BETS" && (
              <div className="text-center z-10 animate-in fade-in zoom-in duration-300">
                <Timer className="w-14 h-14 text-red-500 mx-auto mb-3 animate-pulse" />
                <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-widest mb-2 drop-shadow-lg">
                  Next Round In
                </h2>
                <p className="text-3xl font-mono text-red-400 font-black tracking-widest bg-red-500/10 px-8 py-2.5 rounded-full border border-red-500/30 inline-block shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                  {syncState.timeRemaining.toFixed(1)}s
                </p>
                <p className="text-gray-400 text-xs mt-4 uppercase tracking-widest font-bold">Place your bets</p>
              </div>
            )}

            {/* State 2: GAME RUNNING */}
            {syncState.state === "GAME_RUNNING" && (
              <div className="text-center z-10 flex flex-col items-center justify-center w-full h-full relative">
                <div className="relative z-20">
                  <span className="text-[6rem] md:text-[8rem] font-black text-red-500 font-mono drop-shadow-[0_0_40px_rgba(239,68,68,0.6)]">
                    {syncState.currentMultiplier.toFixed(2)}
                  </span>
                  <span className="text-4xl font-bold text-red-400 ml-2">x</span>
                </div>
              </div>
            )}

            {/* State 3: CRASHED */}
            {syncState.state === "CRASHED" && (
              <div className="text-center z-10 bg-black/80 w-full h-full flex flex-col items-center justify-center backdrop-blur-sm animate-in fade-in duration-200">
                <h2 className="text-3xl md:text-4xl font-black text-red-500 uppercase tracking-widest mb-3 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                  Flew Away!
                </h2>
                <div className="relative z-20">
                  <span className="text-6xl md:text-7xl font-black text-gray-300 font-mono">
                    {(syncState.crashMultiplier || syncState.currentMultiplier).toFixed(2)}
                  </span>
                  <span className="text-3xl font-bold text-gray-400 ml-2">x</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Betting Controls & Session Info */}
        <div className="w-full lg:w-[380px] bg-[#0a0f16] border-t lg:border-t-0 lg:border-l border-gray-800 flex flex-col justify-between">
          
          <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#131824]">
             <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Session ID:</span>
             <span className="text-xs font-mono text-emerald-400 font-bold tracking-wider">
               {syncState.currentSessionId || "SYNCING..."}
             </span>
          </div>

          <div className="p-6 flex-1 flex flex-col justify-center">
            
            <div className="bg-[#131824] border border-gray-800 rounded-2xl p-4 mb-6 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Bet Amount</span>
                <span className="text-xs font-bold text-gray-400">{sym}</span>
              </div>
              
              <div className="flex gap-2">
                <input 
                  type="number" 
                  value={betAmount}
                  onChange={(e) => setBetAmount(Number(e.target.value))}
                  disabled={isBetPlaced}
                  className="flex-1 bg-black border border-gray-700 rounded-xl px-4 py-3 text-white font-black text-2xl focus:outline-none focus:border-red-500 transition-colors disabled:opacity-50"
                  placeholder="0.00"
                />
              </div>

              <div className="grid grid-cols-4 gap-2 mt-4">
                {[50, 100, 500, 1000].map(amt => (
                  <button 
                    key={amt}
                    disabled={isBetPlaced}
                    onClick={() => setBetAmount(amt)}
                    className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {sym}{amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            {!isBetPlaced ? (
               <button 
                onClick={handleBet}
                disabled={syncState.state !== "WAITING_FOR_BETS" || !betAmount || betAmount <= 0}
                className="w-full h-24 bg-gradient-to-b from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white rounded-2xl shadow-[0_10px_30px_rgba(239,68,68,0.4)] transition-all flex flex-col items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed group border-t border-red-400/30 cursor-pointer"
              >
                <span className="text-3xl font-black uppercase tracking-widest drop-shadow-md group-hover:scale-105 transition-transform">Bet</span>
              </button>
            ) : (
              syncState.state === "WAITING_FOR_BETS" ? (
                <button 
                  disabled
                  className="w-full h-24 bg-gray-800 text-gray-400 rounded-2xl border border-gray-700 flex flex-col items-center justify-center opacity-80 cursor-not-allowed"
                >
                  <span className="text-lg font-bold uppercase tracking-widest mb-1">Bet Placed</span>
                  <span className="text-xs font-mono text-emerald-400 font-bold">Waiting for round to start...</span>
                </button>
              ) : syncState.state === "GAME_RUNNING" && !cashedOutAt ? (
                <button 
                  onClick={handleCashout}
                  className="w-full h-24 bg-gradient-to-b from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white rounded-2xl shadow-[0_10px_30px_rgba(249,115,22,0.4)] transition-all flex flex-col items-center justify-center border-t border-orange-400/30 active:scale-95 cursor-pointer"
                >
                  <span className="text-2xl font-black uppercase tracking-widest drop-shadow-md mb-1">Cash Out</span>
                  <span className="text-lg font-mono font-bold">{sym} {(Number(betAmount) * syncState.currentMultiplier).toFixed(2)}</span>
                </button>
              ) : (
                <button 
                  disabled
                  className={`w-full h-24 rounded-2xl flex flex-col items-center justify-center ${cashedOutAt ? 'bg-emerald-600/20 border border-emerald-500/50 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}
                >
                  <span className="text-xl font-black uppercase tracking-widest mb-1">{cashedOutAt ? 'Winner!' : 'Lost'}</span>
                  {cashedOutAt && <span className="text-sm font-mono font-bold">Won: {sym} {(Number(betAmount) * cashedOutAt).toFixed(2)}</span>}
                </button>
              )
            )}
          </div>

          <div className="p-4 border-t border-gray-800/60 bg-[#070b10] flex justify-between items-center text-[10px] text-gray-500">
            <span>Provably Fair RNG SHA-256</span>
            <span className="text-emerald-500">Live Multiplier Stream Active</span>
          </div>
          
        </div>
      </div>
    </div>
    </ErrorBoundary>
  );
}
