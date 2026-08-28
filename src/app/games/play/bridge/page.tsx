"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Coins, Crown, Spade, Heart, Club, Diamond, Trophy, User } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// --- TYPES & CONSTANTS ---
type Suit = "spades" | "hearts" | "diamonds" | "clubs";
type Rank = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A";
type Color = "black" | "red";

interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  value: number;
  color: Color;
}

const SUITS: Suit[] = ["spades", "hearts", "diamonds", "clubs"];
const RANKS: Rank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const CHIPS = [100, 500, 1000, 5000];

const BIDS = [
  "Pass", "1♣", "1♦", "1♥", "1♠", "1NT", 
  "2♣", "2♦", "2♥", "2♠", "2NT",
  "3♣", "3♦", "3♥", "3♠", "3NT",
  "4♥", "4♠"
];

const getCardValue = (rank: Rank): number => {
  if (rank === "A") return 14;
  if (rank === "K") return 13;
  if (rank === "Q") return 12;
  if (rank === "J") return 11;
  return parseInt(rank);
};

const getSuitColor = (suit: Suit): Color => {
  return suit === "hearts" || suit === "diamonds" ? "red" : "black";
};

const getSuitSymbol = (suit: Suit) => {
  switch (suit) {
    case "spades": return "♠";
    case "hearts": return "♥";
    case "diamonds": return "♦";
    case "clubs": return "♣";
  }
};

const generateDeck = (): Card[] => {
  const deck: Card[] = [];
  SUITS.forEach((suit) => {
    RANKS.forEach((rank) => {
      deck.push({
        id: `${rank}-${suit}`,
        suit,
        rank,
        value: getCardValue(rank),
        color: getSuitColor(suit),
      });
    });
  });
  return deck.sort(() => Math.random() - 0.5);
};

type PlayerPos = "S" | "W" | "N" | "E";

interface PlayedCard {
  pos: PlayerPos;
  card: Card;
}

export default function BridgePage() {
  const [mounted, setMounted] = useState(false);

  // Betting & Wallet State
  const [gameState, setGameState] = useState<"betting" | "bidding" | "playing" | "gameOver">("betting");
  const [walletBalance, setWalletBalance] = useState(34500);
  const [currentBet, setCurrentBet] = useState(0);

  // Bridge State
  const [southHand, setSouthHand] = useState<Card[]>([]);
  const [cardsCount, setCardsCount] = useState({ N: 13, E: 13, W: 13 });
  
  const [auctionLog, setAuctionLog] = useState<string[]>([]);
  const [contract, setContract] = useState<string | null>(null);
  
  const [centerTrick, setCenterTrick] = useState<PlayedCard[]>([]);
  const [tricksUs, setTricksUs] = useState(0);
  const [tricksThem, setTricksThem] = useState(0);
  const [turn, setTurn] = useState<PlayerPos>("S");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Trick resolution logic
  useEffect(() => {
    if (centerTrick.length === 4) {
      // Resolve trick after a short delay
      const timer = setTimeout(() => {
        // Mock resolution: Randomly assign trick to US or THEM for simplicity in this mock
        const usWon = Math.random() > 0.5;
        if (usWon) {
          setTricksUs(u => u + 1);
          setTurn("S"); // Winner leads
        } else {
          setTricksThem(t => t + 1);
          setTurn("W"); // Mock AI leads
        }
        setCenterTrick([]);
        
        // Check game over
        if (southHand.length === 0 && cardsCount.N === 0) {
          endGame();
        } else {
          // If AI leads, trigger AI play
          if (!usWon) triggerAIPlay("W");
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [centerTrick, southHand.length, cardsCount.N]);

  // AI Play Trigger
  const triggerAIPlay = (currentTurn: Exclude<PlayerPos, "S">) => {
    if (centerTrick.length === 4 || gameState !== "playing") return;
    
    setTimeout(() => {
      // AI plays a random card visually
      const mockCard = generateDeck()[0]; // just grab a random card for visual
      
      setCenterTrick(prev => [...prev, { pos: currentTurn, card: mockCard }]);
      setCardsCount(prev => ({ ...prev, [currentTurn]: prev[currentTurn] - 1 }));

      // Pass turn to next
      const nextTurn = currentTurn === "W" ? "N" : currentTurn === "N" ? "E" : "S";
      setTurn(nextTurn);
      
      if (nextTurn !== "S") {
        triggerAIPlay(nextTurn as Exclude<PlayerPos, "S">);
      }
    }, 800);
  };

  // --- ACTIONS ---
  const addChip = (amount: number) => {
    if (walletBalance >= amount) {
      setWalletBalance(prev => prev - amount);
      setCurrentBet(prev => prev + amount);
    }
  };

  const clearBet = () => {
    setWalletBalance(prev => prev + currentBet);
    setCurrentBet(0);
  };

  const startGame = () => {
    if (currentBet === 0) return;
    
    const deck = generateDeck();
    
    // Sort South Hand nicely (Spades, Hearts, Diamonds, Clubs)
    const sHand = deck.slice(0, 13).sort((a, b) => {
      const suitOrder = { spades: 1, hearts: 2, diamonds: 3, clubs: 4 };
      if (suitOrder[a.suit] !== suitOrder[b.suit]) return suitOrder[a.suit] - suitOrder[b.suit];
      return b.value - a.value;
    });

    setSouthHand(sHand);
    setCardsCount({ N: 13, E: 13, W: 13 });
    setTricksUs(0);
    setTricksThem(0);
    setAuctionLog([]);
    setContract(null);
    setCenterTrick([]);
    setTurn("S");
    
    setGameState("bidding");
  };

  const placeBid = (bid: string) => {
    setAuctionLog(prev => [...prev, `South: ${bid}`]);
    
    if (bid === "Pass") {
      // Mock AI taking contract
      setTimeout(() => setAuctionLog(prev => [...prev, "West: 3NT"]), 500);
      setTimeout(() => setAuctionLog(prev => [...prev, "North: Pass", "East: Pass", "South: Pass"]), 1500);
      setTimeout(() => {
        setContract("3NT by West");
        setGameState("playing");
        setTurn("N"); // North leads
        triggerAIPlay("N");
      }, 2500);
    } else {
      // User takes contract
      setTimeout(() => setAuctionLog(prev => [...prev, "West: Pass", "North: Pass", "East: Pass"]), 1000);
      setTimeout(() => {
        setContract(`${bid} by South`);
        setGameState("playing");
        setTurn("W"); // West leads
        triggerAIPlay("W");
      }, 2000);
    }
  };

  const playCard = (cardId: string) => {
    if (turn !== "S" || centerTrick.length === 4) return;
    
    const card = southHand.find(c => c.id === cardId)!;
    setSouthHand(southHand.filter(c => c.id !== cardId));
    setCenterTrick(prev => [...prev, { pos: "S", card }]);
    
    setTurn("W");
    triggerAIPlay("W");
  };

  const endGame = () => {
    setGameState("gameOver");
    // Mock win condition: Did we get 9 tricks?
    if (tricksUs >= Math.max(1, Math.floor(Math.random() * 5 + 4))) {
      // Win
      setWalletBalance(prev => prev + (currentBet * 2));
    }
  };

  const returnToBetting = () => {
    setCurrentBet(0);
    setGameState("betting");
  };

  if (!mounted) return <div className="min-h-screen bg-gray-950 flex items-center justify-center max-w-full pb-24 md:pb-8"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>;

  const CardView = ({ card }: { card: Card }) => (
    <div className={`w-14 h-20 md:w-20 md:h-28 rounded-lg shadow-md border border-gray-200 bg-white flex flex-col items-center justify-between py-1 md:py-1.5 cursor-pointer hover:-translate-y-4 transition-transform ${card.color === 'red' ? 'text-red-600' : 'text-gray-900'}`}>
      <div className="flex flex-col items-center self-start pl-1 md:pl-1.5">
        <span className="font-bold text-xs md:text-sm leading-none">{card.rank}</span>
        <span className="text-[10px] md:text-xs">{getSuitSymbol(card.suit)}</span>
      </div>
      <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none text-2xl md:text-4xl">
        {getSuitSymbol(card.suit)}
      </div>
      <div className="flex flex-col items-center self-end pr-1 md:pr-1.5 rotate-180">
        <span className="font-bold text-xs md:text-sm leading-none">{card.rank}</span>
        <span className="text-[10px] md:text-xs">{getSuitSymbol(card.suit)}</span>
      </div>
    </div>
  );

  const MiniCardBack = () => (
    <div className="w-8 h-12 md:w-10 md:h-14 bg-white rounded shadow-sm border border-gray-300 relative">
      <div className="absolute inset-1 bg-[url('https://www.transparenttextures.com/patterns/argyle.png')] bg-blue-900 rounded-[2px] opacity-90 border border-blue-400/20"></div>
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-[#050914] text-gray-100 font-sans flex flex-col overflow-x-hidden relative selection:bg-emerald-500/30 pb-24 md:pb-8 max-w-full">
      
      {/* --- HEADER --- */}
      <header className="h-[60px] bg-[#0a0f16] border-b border-[#1f2937] px-4 flex items-center justify-between shrink-0 z-50 shadow-md">
        <div className="flex items-center space-x-2 md:space-x-4">
          <Link href="/games" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
          </Link>
          <div className="flex items-center space-x-2">
            <Spade className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" fill="currentColor" />
            <h1 className="text-sm md:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 uppercase tracking-widest hidden sm:block">
              CONTRACT BRIDGE
            </h1>
          </div>
        </div>

        {/* Contract & Tricks Score (Visible when playing) */}
        {(gameState === "playing" || gameState === "bidding") && (
          <div className="flex items-center space-x-3 md:space-x-6 bg-[#11111a] px-4 md:px-6 py-1.5 rounded-full border border-[#1f1f2e]">
            <div className="flex flex-col items-center">
              <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Contract</span>
              <span className="font-mono font-bold text-amber-400 text-xs">{contract || "Bidding..."}</span>
            </div>
            <div className="w-px h-5 bg-gray-800"></div>
            <div className="flex flex-col items-center">
              <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Us</span>
              <span className="font-mono font-bold text-emerald-400 text-xs">{tricksUs}</span>
            </div>
            <div className="w-px h-5 bg-gray-800"></div>
            <div className="flex flex-col items-center">
              <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Them</span>
              <span className="font-mono font-bold text-red-400 text-xs">{tricksThem}</span>
            </div>
          </div>
        )}

        {/* Wallet */}
        <div className="flex items-center space-x-2 bg-gray-900/60 backdrop-blur-sm px-4 py-1.5 rounded-full border border-gray-700/50">
          <Coins className="w-4 h-4 text-emerald-400" />
          <p className="font-bold text-emerald-400 text-sm">₹{walletBalance.toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
        </div>
      </header>

      {/* --- MAIN PLAYING AREA --- */}
      <main className="flex-grow relative bg-[#041c13] flex flex-col items-center justify-center overflow-hidden">
        
        {/* Felt Texture & Vignette */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0c3c26] to-[#041c13] rounded-[100px] border-[16px] border-[#1a110a] shadow-[inset_0_0_80px_rgba(0,0,0,0.9)] scale-105"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/felt.png')] opacity-30 mix-blend-overlay pointer-events-none"></div>

        {/* --- PRE-GAME BETTING MODAL --- */}
        <AnimatePresence>
          {gameState === "betting" && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            >
              <div className="px-8 py-8 md:px-12 rounded-3xl bg-[#0a0f16] border border-[#1f2937] shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col items-center max-w-md w-full">
                <Crown className="w-12 h-12 text-emerald-500 mb-4" />
                <h2 className="text-2xl font-black uppercase tracking-widest text-white mb-2">Bridge Table Entry</h2>
                <p className="text-gray-400 text-sm mb-8 text-center">Place your stake to enter the high-roller contract bridge room.</p>
                
                <div className="flex flex-col items-center w-full space-y-6">
                  <div className="flex items-center justify-center w-full bg-[#11111a] py-6 rounded-2xl border border-[#1f1f2e] relative">
                    <button onClick={clearBet} disabled={currentBet === 0} className="absolute left-4 text-xs text-red-400 font-bold uppercase hover:text-red-300 disabled:opacity-50">Clear</button>
                    <span className="text-4xl font-mono font-black text-emerald-400">₹{currentBet.toLocaleString()}</span>
                  </div>

                  <div className="flex gap-3 justify-center w-full">
                    {CHIPS.map(chip => (
                      <button 
                        key={chip} onClick={() => addChip(chip)} disabled={walletBalance < chip}
                        className="w-12 h-12 md:w-16 md:h-16 rounded-full border-4 border-dashed border-white/50 bg-gradient-to-br from-blue-600 to-blue-800 shadow-xl flex items-center justify-center hover:-translate-y-1 hover:scale-105 hover:shadow-[0_0_20px_rgba(37,99,235,0.6)] transition-all disabled:opacity-50"
                      >
                        <span className="font-black text-white text-xs md:text-base drop-shadow-md">{chip}</span>
                      </button>
                    ))}
                  </div>

                  <button 
                    onClick={startGame} disabled={currentBet === 0}
                    className="w-full mt-4 py-4 rounded-xl font-black text-lg md:text-xl uppercase tracking-widest bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)] border border-emerald-400 disabled:opacity-50 transition-all"
                  >
                    Place Bet & Start
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- GAME TABLE (Visible when bidding or playing) --- */}
        <div className={`absolute inset-0 transition-opacity duration-500 ${gameState === 'betting' ? 'opacity-0 pointer-events-none' : 'opacity-100'} flex flex-col items-center justify-between py-10 px-4`}>
          
          {/* North Player (Partner) */}
          <div className="flex flex-col items-center z-10">
            <div className="flex items-center gap-2 mb-2 bg-black/60 px-3 py-1 rounded-full border border-gray-700/50">
              <User className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono font-bold text-emerald-400">FURY-3301 (North)</span>
            </div>
            <div className="flex -space-x-3">
              {[...Array(cardsCount.N)].map((_, i) => (
                <MiniCardBack key={i} />
              ))}
            </div>
          </div>

          {/* Center Area (Trick & Bidding) */}
          <div className="flex-grow flex items-center justify-center w-full relative">
            
            {/* East & West Players */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col items-center">
              <div className="flex items-center gap-2 mb-2 bg-black/60 px-3 py-1 rounded-full border border-gray-700/50">
                <User className="w-4 h-4 text-red-400" />
                <span className="text-xs font-mono font-bold text-red-400">FURY-1188 (West)</span>
              </div>
              <div className="flex flex-col -space-y-4">
                {[...Array(cardsCount.W)].map((_, i) => (
                  <div key={i} className="rotate-90"><MiniCardBack /></div>
                ))}
              </div>
            </div>

            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center">
              <div className="flex items-center gap-2 mb-2 bg-black/60 px-3 py-1 rounded-full border border-gray-700/50">
                <User className="w-4 h-4 text-red-400" />
                <span className="text-xs font-mono font-bold text-red-400">FURY-9921 (East)</span>
              </div>
              <div className="flex flex-col -space-y-4">
                {[...Array(cardsCount.E)].map((_, i) => (
                  <div key={i} className="rotate-90"><MiniCardBack /></div>
                ))}
              </div>
            </div>

            {/* Trick Area */}
            {gameState === "playing" && (
              <div className="relative w-40 h-40 flex items-center justify-center">
                <AnimatePresence>
                  {centerTrick.map((played, i) => (
                    <motion.div
                      key={`${played.card.id}-${i}`}
                      initial={{ opacity: 0, scale: 0.5, y: played.pos === 'N' ? -50 : played.pos === 'S' ? 50 : 0, x: played.pos === 'E' ? 50 : played.pos === 'W' ? -50 : 0 }}
                      animate={{ opacity: 1, scale: 1, y: played.pos === 'N' ? -20 : played.pos === 'S' ? 20 : 0, x: played.pos === 'E' ? 20 : played.pos === 'W' ? -20 : 0 }}
                      className="absolute shadow-2xl z-10"
                    >
                      <CardView card={played.card} />
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {/* Turn Indicator */}
                {centerTrick.length < 4 && (
                  <div className="absolute inset-0 border-4 border-dashed border-amber-500/20 rounded-full animate-pulse -z-10"></div>
                )}
              </div>
            )}

            {/* Bidding Area */}
            {gameState === "bidding" && (
              <div className="bg-black/80 backdrop-blur-md p-6 rounded-3xl border border-gray-700 max-w-sm w-full z-20 shadow-[0_0_40px_rgba(0,0,0,0.8)]">
                <h3 className="text-center font-black uppercase text-amber-500 mb-4 tracking-widest">Auction Phase</h3>
                
                <div className="h-32 bg-gray-950 rounded-xl p-3 overflow-y-auto font-mono text-sm border border-gray-800 mb-4 flex flex-col space-y-1">
                  {auctionLog.map((log, i) => (
                    <div key={i} className={`${log.includes("South") || log.includes("North") ? 'text-emerald-400' : 'text-red-400'}`}>
                      {log}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {BIDS.slice(0, 16).map(bid => (
                    <button key={bid} onClick={() => placeBid(bid)} className="py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded font-bold text-xs transition-colors border border-gray-600">
                      {bid}
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* South Player (User) - Own Hand */}
          <div className="relative z-20 w-full flex flex-col items-center mt-auto pb-4 pt-10">
            {turn === "S" && gameState === "playing" && (
               <div className="absolute -top-6 text-amber-400 font-bold uppercase tracking-[0.2em] text-xs animate-pulse">Your Turn to Play</div>
            )}
            <div className="flex justify-center -space-x-6 md:-space-x-8 px-4 w-full overflow-x-auto max-w-5xl py-4 pb-12">
              <AnimatePresence>
                {southHand.map((card, i) => (
                  <motion.div
                    key={card.id}
                    layout
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.5, y: -100 }}
                    className="relative"
                  >
                    <div onClick={() => playCard(card.id)}>
                      <CardView card={card} />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

        </div>

        {/* --- VICTORY MODAL --- */}
        <AnimatePresence>
          {gameState === "gameOver" && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: 50 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            >
              <div className="px-12 py-8 rounded-3xl bg-emerald-950/90 border-2 border-emerald-500 text-emerald-400 shadow-[0_0_80px_rgba(16,185,129,0.5)] flex flex-col items-center">
                <Trophy className="w-16 h-16 text-yellow-400 mb-4 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]" />
                <h2 className="text-4xl md:text-5xl font-black uppercase tracking-widest drop-shadow-md text-white mb-2 text-center">
                  Contract {tricksUs > tricksThem ? "Made!" : "Defeated"}
                </h2>
                <p className="text-gray-300 font-mono mb-6">{contract}</p>
                
                <div className="flex gap-6 mt-4 items-center">
                  <div className="text-center">
                    <p className="text-sm text-gray-400 uppercase tracking-widest">Us</p>
                    <p className="text-3xl font-mono font-bold text-emerald-400">{tricksUs}</p>
                  </div>
                  <div className="w-px h-12 bg-gray-700"></div>
                  {tricksUs > tricksThem ? (
                    <div className="text-center">
                      <p className="text-sm text-yellow-400 font-black uppercase tracking-widest">Payout (2x)</p>
                      <p className="text-3xl font-mono font-black text-yellow-400">+₹{(currentBet * 2).toLocaleString()}</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm text-red-400 font-black uppercase tracking-widest">Loss</p>
                      <p className="text-3xl font-mono font-black text-red-400">-₹{(currentBet).toLocaleString()}</p>
                    </div>
                  )}
                  <div className="w-px h-12 bg-gray-700"></div>
                  <div className="text-center">
                    <p className="text-sm text-gray-400 uppercase tracking-widest">Them</p>
                    <p className="text-3xl font-mono font-bold text-red-400">{tricksThem}</p>
                  </div>
                </div>

                <button 
                  onClick={returnToBetting}
                  className="mt-8 px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                >
                  Play Again
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}
