"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, User, Activity, History, Settings, Timer } from "lucide-react";
import Link from "next/link";
import { useCurrencyStore, CURRENCY_SYMBOLS, formatCurrency, convertFromBase, convertToBase } from "@/store/currencyStore";
import { useUIStore } from "@/store/uiStore";
import { io, Socket } from "socket.io-client";

type GameState = "WAITING_FOR_BETS" | "GAME_RUNNING" | "CRASHED";

interface SyncState {
  state: GameState;
  timeRemaining: number;
  currentSessionId: string;
  currentMultiplier: number;
}

export default function AviatorGamePage() {
  const [mounted, setMounted] = useState(false);
  
  // Synced Server State
  const [syncState, setSyncState] = useState<SyncState>({
    state: "WAITING_FOR_BETS",
    timeRemaining: 15.0,
    currentSessionId: "",
    currentMultiplier: 1.00
  });

  const [betAmount, setBetAmount] = useState<number | "">("");
  const [isBetPlaced, setIsBetPlaced] = useState(false);
  const [cashedOutAt, setCashedOutAt] = useState<number | null>(null);
  
  const socketRef = useRef<Socket | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const planeImageRef = useRef<HTMLImageElement | null>(null);

  // Connect to Global Currency Store
  const { activeCurrency, baseBalance, setBaseBalance } = useCurrencyStore();
  const displayBalance = convertFromBase(baseBalance, activeCurrency);
  const sym = CURRENCY_SYMBOLS[activeCurrency];

  // Dummy recent history
  const recentHistory = [1.24, 2.50, 1.05, 5.40, 1.12, 18.90, 1.01, 3.20];

  useEffect(() => {
    setMounted(true);
    const img = new window.Image();
    img.src = "/plane.png";
    planeImageRef.current = img;
    
    // Connect to Server-Authoritative Socket Engine
    const socket = io("http://localhost:4000");
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to Game Server");
      socket.emit("join_aviator");
    });

    socket.on("gameStateUpdate", (payload: SyncState) => {
      setSyncState(payload);

      // Handle round transitions purely based on server state changes
      if (payload.state === "WAITING_FOR_BETS" && syncState.state === "CRASHED") {
        // Reset local round variables when server resets
        setIsBetPlaced(false);
        setCashedOutAt(null);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Dynamic Canvas Rendering based on Server State
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (syncState.state === "GAME_RUNNING" || syncState.state === "CRASHED") {
      const startX = 0;
      const startY = canvas.height - 20;

      // Reverse engineer elapsed time from current multiplier to match User's curve math
      const elapsedTime = Math.max(0, Math.log(syncState.currentMultiplier) / 0.00006);
      
      const x = Math.min((elapsedTime / 10000) * canvas.width, canvas.width - 20);
      const y = canvas.height - 20 - Math.min((syncState.currentMultiplier / 10) * canvas.height, canvas.height - 40);

      // ==========================================
      // 1. DRAW BLUE RAY / GLOW BACKGROUND (Under the curve)
      // ==========================================
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(x * 0.5, startY, x, y); // Curve follow
      ctx.lineTo(x, canvas.height); // Down to bottom
      ctx.lineTo(startX, canvas.height); // Back to start bottom
      ctx.closePath();

      // Gradient color (Top to Bottom glow)
      const gradient = ctx.createLinearGradient(0, y, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(233, 30, 99, 0.5)'); // Using pinkish/red to match RXFURY instead of blue, but user requested blue. I'll use blue as requested: 'rgba(0, 150, 255, 0.5)'
      gradient.addColorStop(0, 'rgba(0, 150, 255, 0.5)');
      gradient.addColorStop(1, 'rgba(0, 150, 255, 0.0)');
      
      ctx.fillStyle = gradient;
      ctx.fill();

      // ==========================================
      // 2. DRAW MAIN CURVE LINE
      // ==========================================
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(x * 0.5, startY, x, y);
      ctx.strokeStyle = '#e91e63'; // Curve Color (Pinkish/Red)
      ctx.lineWidth = 4;
      ctx.stroke();

      // ==========================================
      // 3. DRAW THE PLANE IMAGE
      // ==========================================
      const planeImg = planeImageRef.current;
      if (planeImg && planeImg.complete && planeImg.naturalWidth > 0) {
        ctx.drawImage(planeImg, x - 25, y - 25, 50, 50);
      } else {
        // Fallback dot
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (syncState.state === "CRASHED") {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, [syncState.currentMultiplier, syncState.state]);

  const handleBet = () => {
    if (syncState.state !== "WAITING_FOR_BETS") return;
    if (!betAmount || betAmount <= 0) return;
    if (betAmount > displayBalance) {
      useUIStore.getState().openInsufficientFundsModal();
      return;
    }
    
    // Optimistic UI update (Real app: send POST to /api/games/bet with currentSessionId)
          // Calling actual backend API
      fetch('/api/games/bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: 'aviator', action: 'PLACE', betAmount: Number(betAmount), currency: activeCurrency })
      }).then(res => res.json()).then(data => {
        if (data.success) setBaseBalance(data.newBalanceBase);
      });
    setIsBetPlaced(true);
  };

  const handleCashout = () => {
    if (syncState.state !== "GAME_RUNNING" || !isBetPlaced || cashedOutAt) return;
    
    setCashedOutAt(syncState.currentMultiplier);
    const winAmount = Number(betAmount) * syncState.currentMultiplier;
    
    // Optimistic UI update
          fetch('/api/games/bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: 'aviator', action: 'CASHOUT', betAmount: Number(betAmount), multiplier: syncState.currentMultiplier, currency: activeCurrency })
      }).then(res => res.json()).then(data => {
        if (data.success) setBaseBalance(data.newBalanceBase);
      });
    setIsBetPlaced(false);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#0a0f16] text-white flex flex-col font-sans max-w-full pb-24 md:pb-8">


      {/* Main Game Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto w-full max-w-full relative">
        
        {/* Left Panel: Game Canvas */}
        <div className="flex-1 flex flex-col relative bg-black shadow-[inset_0_0_100px_rgba(220,38,38,0.05)]">
          
          {/* History Bar */}
          <div className="h-10 bg-[#131824]/80 border-b border-gray-800 flex items-center px-4 overflow-hidden gap-2">
            <History className="w-4 h-4 text-gray-500 shrink-0 mr-2" />
            {recentHistory.map((m, i) => (
              <span key={i} className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full border ${
                m >= 10 ? 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20' :
                m >= 2 ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                'bg-blue-500/10 text-blue-400 border-blue-500/20'
              }`}>
                {m.toFixed(2)}x
              </span>
            ))}
          </div>

          {/* Central Action Area */}
          <div className="flex-1 flex items-center justify-center relative overflow-hidden">
                        {/* Dynamic Server-Synced Canvas Curve */}
            <canvas ref={canvasRef} width={800} height={400} className={`absolute inset-0 w-full h-full z-0 opacity-80 transition-opacity duration-300 ${syncState.state === "WAITING_FOR_BETS" ? "opacity-0" : "opacity-100"}`} />
            {/* The Grid Background */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
            
            {syncState.state === "WAITING_FOR_BETS" && (
              <div className="text-center z-10 animate-in fade-in zoom-in duration-300">
                <Timer className="w-16 h-16 text-red-500 mx-auto mb-4 animate-pulse" />
                <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-widest mb-2 drop-shadow-lg">
                  Waiting
                </h2>
                <p className="text-2xl font-mono text-red-400 font-bold tracking-widest bg-red-500/10 px-6 py-2 rounded-full border border-red-500/20 inline-block">
                  {syncState.timeRemaining.toFixed(1)}s
                </p>
                <p className="text-gray-500 text-xs mt-4 uppercase tracking-widest font-bold">Place your bets</p>
              </div>
            )}

            {syncState.state === "GAME_RUNNING" && (
              <div className="text-center z-10 flex flex-col items-center justify-center w-full h-full relative">
                

                <div className="relative z-20">
                  <span className="text-[6rem] md:text-[8rem] font-black text-red-500 font-mono drop-shadow-[0_0_30px_rgba(239,68,68,0.5)]">
                    {syncState.currentMultiplier.toFixed(2)}
                  </span>
                  <span className="text-4xl font-bold text-red-400 ml-2">x</span>
                </div>
              </div>
            )}

            {syncState.state === "CRASHED" && (
              <div className="text-center z-10 bg-black/80 w-full h-full flex flex-col items-center justify-center backdrop-blur-sm animate-in fade-in duration-200">
                <h2 className="text-3xl font-black text-gray-500 uppercase tracking-widest mb-4">Flew Away!</h2>
                <div className="relative z-20">
                  <span className="text-6xl md:text-7xl font-black text-gray-400 font-mono">
                    {syncState.currentMultiplier.toFixed(2)}
                  </span>
                  <span className="text-3xl font-bold text-gray-500 ml-2">x</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Controls */}
        <div className="w-full lg:w-[380px] bg-[#0a0f16] border-t lg:border-t-0 lg:border-l border-gray-800 flex flex-col">
          
          <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#131824]">
             <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Session ID:</span>
             <span className="text-xs font-mono text-gray-400">{syncState.currentSessionId || "Connecting..."}</span>
          </div>

          <div className="p-6 flex-1 flex flex-col justify-center">
            
            <div className="bg-[#131824] border border-gray-800 rounded-2xl p-4 mb-6 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Bet Amount</span>
                <span className="text-sm font-bold text-gray-400">{sym}</span>
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
                    className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {sym}{amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Button */}
            {!isBetPlaced ? (
               <button 
                onClick={handleBet}
                disabled={syncState.state !== "WAITING_FOR_BETS" || !betAmount || betAmount <= 0}
                className="w-full h-24 bg-gradient-to-b from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white rounded-2xl shadow-[0_10px_30px_rgba(239,68,68,0.3)] transition-all flex flex-col items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed group border-t border-red-400/30"
              >
                <span className="text-3xl font-black uppercase tracking-widest drop-shadow-md group-hover:scale-105 transition-transform">Bet</span>
              </button>
            ) : (
              syncState.state === "WAITING_FOR_BETS" ? (
                <button 
                  disabled
                  className="w-full h-24 bg-gray-800 text-gray-400 rounded-2xl border border-gray-700 flex flex-col items-center justify-center opacity-80 cursor-not-allowed"
                >
                  <span className="text-xl font-bold uppercase tracking-widest mb-1">Waiting for next round</span>
                  <span className="text-sm font-mono text-gray-500">Bet: {sym} {betAmount}</span>
                </button>
              ) : syncState.state === "GAME_RUNNING" && !cashedOutAt ? (
                <button 
                  onClick={handleCashout}
                  className="w-full h-24 bg-gradient-to-b from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white rounded-2xl shadow-[0_10px_30px_rgba(249,115,22,0.3)] transition-all flex flex-col items-center justify-center border-t border-orange-400/30 active:scale-95"
                >
                  <span className="text-2xl font-black uppercase tracking-widest drop-shadow-md mb-1">Cash Out</span>
                  <span className="text-lg font-mono font-bold">{sym} {(Number(betAmount) * syncState.currentMultiplier).toFixed(2)}</span>
                </button>
              ) : (
                <button 
                  disabled
                  className={`w-full h-24 rounded-2xl flex flex-col items-center justify-center ${cashedOutAt ? 'bg-emerald-600/20 border border-emerald-500/50 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}
                >
                  <span className="text-xl font-black uppercase tracking-widest mb-1">{cashedOutAt ? 'Winner' : 'Lost'}</span>
                  {cashedOutAt && <span className="text-sm font-mono font-bold">Won: {sym} {(Number(betAmount) * cashedOutAt).toFixed(2)}</span>}
                </button>
              )
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}








