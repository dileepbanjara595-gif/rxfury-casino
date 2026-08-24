"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Gem, Bomb, Coins, Settings } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function MinesGamePage() {
  const [mounted, setMounted] = useState(false);
  const [walletBalance, setWalletBalance] = useState(10000);
  const [betAmount, setBetAmount] = useState<number | "">(100);
  const [minesCount, setMinesCount] = useState(3);
  const [gameState, setGameState] = useState<"idle" | "playing" | "crashed" | "cashed_out">("idle");
  const [grid, setGrid] = useState<Array<{isMine: boolean, revealed: boolean}>>([]);
  const [safeRevealedCount, setSafeRevealedCount] = useState(0);
  
  useEffect(() => {
    setMounted(true);
    initializeGrid();
  }, []);

  const initializeGrid = () => {
    const newGrid = Array(25).fill({ isMine: false, revealed: false });
    setGrid(newGrid);
  };

  const calculateMultiplier = (mines: number, safeHits: number) => {
    if (safeHits === 0) return 1.00;
    let m = 1.0;
    for(let i = 0; i < safeHits; i++) {
        m = m * (25 - i) / (25 - mines - i);
    }
    return m * 0.99; // slight house edge
  };

  const currentMultiplier = calculateMultiplier(minesCount, safeRevealedCount);
  const currentWinnings = (Number(betAmount) || 0) * currentMultiplier;

  const handleAction = () => {
    if (gameState === "idle" || gameState === "crashed" || gameState === "cashed_out") {
      if (Number(betAmount) < 10 || walletBalance < Number(betAmount)) {
        alert("Invalid bet amount or insufficient balance! Minimum bet is ₹10.");
        return;
      }
      
      setWalletBalance(prev => prev - Number(betAmount));
      
      const newGrid = Array(25).fill({ isMine: false, revealed: false });
      let minesPlaced = 0;
      while (minesPlaced < minesCount) {
        const rand = Math.floor(Math.random() * 25);
        if (!newGrid[rand].isMine) {
          newGrid[rand] = { isMine: true, revealed: false };
          minesPlaced++;
        }
      }
      setGrid(newGrid);
      setSafeRevealedCount(0);
      setGameState("playing");
    } else if (gameState === "playing") {
      if (safeRevealedCount > 0) {
        setWalletBalance(prev => prev + currentWinnings);
        setGameState("cashed_out");
        setGrid(prev => prev.map(cell => ({ ...cell, revealed: true })));
      }
    }
  };

  const handleTileClick = (index: number) => {
    if (gameState !== "playing" || grid[index].revealed) return;

    const cell = grid[index];
    const newGrid = [...grid];
    newGrid[index] = { ...cell, revealed: true };
    
    if (cell.isMine) {
      setGameState("crashed");
      setGrid(newGrid.map(c => ({ ...c, revealed: true })));
    } else {
      setGrid(newGrid);
      setSafeRevealedCount(prev => prev + 1);
      
      if (safeRevealedCount + 1 === 25 - minesCount) {
        const winAmount = Number(betAmount) * calculateMultiplier(minesCount, safeRevealedCount + 1);
        setWalletBalance(prev => prev + winAmount);
        setGameState("cashed_out");
        setGrid(newGrid.map(c => ({ ...c, revealed: true })));
      }
    }
  };

  if (!mounted) {
    return <div className="h-screen bg-gray-950 flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="h-screen bg-[#0F1923] text-gray-100 font-sans flex flex-col overflow-hidden selection:bg-blue-500/30">
      
      {/* Header */}
      <header className="h-[72px] bg-[#1C2A36] border-b border-[#2A3B4C] p-4 flex items-center justify-between shadow-lg shrink-0">
        <div className="flex items-center space-x-4">
          <Link href="/games" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="flex items-center space-x-2">
            <Gem className="w-6 h-6 text-emerald-400" />
            <h1 className="text-xl font-black text-emerald-500 uppercase tracking-widest">Mines</h1>
          </div>
        </div>
        <div className="flex items-center space-x-6">
          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase">Wallet</p>
            <p className="font-bold text-emerald-400">₹{walletBalance.toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
          </div>
        </div>
      </header>

      {/* Main Split Layout */}
      <div className="flex-grow flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left: Betting Controls */}
        <aside className="w-full lg:w-[30%] bg-[#14212C] border-r border-[#2A3B4C] p-4 md:p-6 flex flex-col shrink-0 overflow-y-auto no-scrollbar shadow-[10px_0_20px_rgba(0,0,0,0.2)] z-10">
          
          <div className="space-y-6 max-w-sm mx-auto w-full">
            {/* Bet Amount */}
            <div className="bg-[#1C2A36] p-4 rounded-2xl border border-[#2A3B4C]">
              <div className="flex justify-between items-center mb-3">
                <label className="text-xs text-gray-400 font-bold uppercase">Bet Amount</label>
                <span className="text-xs font-mono text-gray-500">₹10 Min</span>
              </div>
              <div className="flex bg-[#0A1016] border border-[#2A3B4C] rounded-xl overflow-hidden focus-within:border-emerald-500/50 transition-colors">
                <div className="pl-4 flex items-center justify-center text-gray-500">₹</div>
                <input 
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(Number(e.target.value))}
                  disabled={gameState === "playing"}
                  className="w-full bg-transparent px-2 py-3 text-white font-bold text-lg outline-none"
                />
                <div className="flex border-l border-[#2A3B4C]">
                  <button className="px-3 hover:bg-gray-800 text-gray-400 text-xs font-bold border-r border-[#2A3B4C]" onClick={() => setBetAmount(prev => Math.max(10, Number(prev)/2))}>1/2</button>
                  <button className="px-3 hover:bg-gray-800 text-gray-400 text-xs font-bold" onClick={() => setBetAmount(prev => Number(prev)*2)}>2x</button>
                </div>
              </div>
            </div>

            {/* Mines Selector */}
            <div className="bg-[#1C2A36] p-4 rounded-2xl border border-[#2A3B4C]">
              <div className="flex justify-between items-center mb-3">
                <label className="text-xs text-gray-400 font-bold uppercase">Mines</label>
                <span className="text-xs font-mono text-red-400">{minesCount} Bombs</span>
              </div>
              <input 
                type="range"
                min="1"
                max="24"
                value={minesCount}
                onChange={(e) => setMinesCount(Number(e.target.value))}
                disabled={gameState === "playing"}
                className="w-full accent-red-500"
              />
              <div className="flex justify-between mt-2 text-xs text-gray-500 font-mono">
                <span>1</span>
                <span>24</span>
              </div>
            </div>

            {/* Multiplier / Next Win Info */}
            <div className="bg-[#0A1016] p-4 rounded-2xl border border-[#2A3B4C] flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold">Current Mult.</p>
                <p className="text-lg font-mono font-bold text-gray-300">{currentMultiplier.toFixed(2)}x</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase font-bold">Next Safe Hit</p>
                <p className="text-lg font-mono font-bold text-emerald-400">
                  {gameState === "playing" ? `${calculateMultiplier(minesCount, safeRevealedCount + 1).toFixed(2)}x` : '-'}
                </p>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={handleAction}
              disabled={gameState === "playing" && safeRevealedCount === 0}
              className={`w-full py-4 rounded-2xl font-black text-xl transition-all shadow-xl uppercase tracking-wider
                ${gameState === "playing" && safeRevealedCount > 0
                  ? 'bg-orange-500 hover:bg-orange-400 text-orange-950 shadow-[0_0_20px_rgba(249,115,22,0.4)]'
                  : gameState === "playing" && safeRevealedCount === 0
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-emerald-950 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]'
                }
              `}
            >
              {gameState === "playing" && safeRevealedCount > 0 ? (
                `Cash Out ₹${currentWinnings.toFixed(2)}`
              ) : gameState === "playing" && safeRevealedCount === 0 ? (
                "Pick a Tile"
              ) : (
                "Bet"
              )}
            </button>
            
          </div>
        </aside>

        {/* Right: Game Grid */}
        <main className="flex-grow bg-[#0A1016] relative flex flex-col items-center justify-center p-4 md:p-8">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>
          
          <div className="relative z-10 w-full max-w-lg aspect-square">
            <div className="grid grid-cols-5 gap-2 md:gap-3 w-full h-full">
              {grid.map((cell, index) => {
                
                // Determine visuals based on state
                const isRevealed = cell.revealed;
                let bgColor = "bg-[#1C2A36]";
                let shadow = "shadow-[0_4px_0_rgba(15,25,35,1)]";
                
                if (isRevealed) {
                  shadow = "shadow-none translate-y-1";
                  if (cell.isMine) {
                    bgColor = gameState === "crashed" ? "bg-red-950 border border-red-500/50" : "bg-[#1C2A36]";
                  } else {
                    bgColor = "bg-emerald-950 border border-emerald-500/30";
                  }
                }

                // If game ended, unrevealed tiles are dimmed
                const opacity = (gameState === "crashed" || gameState === "cashed_out") && !cell.revealed ? "opacity-40" : "opacity-100";

                return (
                  <button
                    key={index}
                    onClick={() => handleTileClick(index)}
                    disabled={gameState !== "playing" || isRevealed}
                    className={`relative w-full h-full rounded-xl flex items-center justify-center transition-all duration-200 ease-out
                      ${bgColor} ${shadow} ${opacity}
                      ${gameState === "playing" && !isRevealed ? "hover:bg-[#233544] hover:shadow-[0_4px_0_rgba(15,25,35,1),0_0_15px_rgba(255,255,255,0.05)] cursor-pointer" : "cursor-default"}
                    `}
                  >
                    <AnimatePresence>
                      {isRevealed && (
                        <motion.div
                          initial={{ rotateY: 180, scale: 0.5, opacity: 0 }}
                          animate={{ rotateY: 0, scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 260, damping: 20 }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          {cell.isMine ? (
                            <Bomb className={`w-8 h-8 md:w-12 md:h-12 ${gameState === "crashed" ? 'text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]' : 'text-gray-600'}`} />
                          ) : (
                            <Gem className="w-8 h-8 md:w-12 md:h-12 text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.8)]" />
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                );
              })}
            </div>
          </div>
          
        </main>
      </div>
    </div>
  );
}
