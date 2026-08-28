"use client";

import { useCurrencyStore, convertFromBase, convertToBase, CURRENCY_SYMBOLS, formatCurrency } from '@/store/currencyStore';
import { useState, useEffect } from "react";
import { ArrowLeft, RotateCcw, Trophy, Clock, Play, Pause, Coins } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// --- TYPES & CONSTANTS ---
type Suit = "spades" | "hearts" | "diamonds" | "clubs";
type Rank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";
type Color = "black" | "red";

interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  value: number;
  color: Color;
  isFaceUp: boolean;
}

const SUITS: Suit[] = ["spades", "hearts", "diamonds", "clubs"];
const RANKS: Rank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const CHIPS = [50, 100, 500, 1000, 5000];

const getCardValue = (rank: Rank): number => {
  if (rank === "A") return 1;
  if (rank === "J") return 11;
  if (rank === "Q") return 12;
  if (rank === "K") return 13;
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

// --- GAME LOGIC HELPERS ---
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
        isFaceUp: false,
      });
    });
  });
  return deck.sort(() => Math.random() - 0.5);
};

interface Selection {
  type: "waste" | "tableau" | "foundation";
  colIndex: number;
  cardIndex: number;
}

export default function SolitairePage() {
  const [mounted, setMounted] = useState(false);

  // Betting & Wallet State
  const [gameState, setGameState] = useState<"betting" | "playing" | "victory">("betting");
  
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

  const [currentBet, setCurrentBet] = useState(0);

  // Solitaire State
  const [stock, setStock] = useState<Card[]>([]);
  const [waste, setWaste] = useState<Card[]>([]);
  const [foundations, setFoundations] = useState<Card[][]>([[], [], [], []]);
  const [tableaus, setTableaus] = useState<Card[][]>([[], [], [], [], [], [], []]);
  const [selection, setSelection] = useState<Selection | null>(null);
  
  // Stats State
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Timer Effect
  useEffect(() => {
    let interval: any;
    if (gameState === "playing") {
      interval = setInterval(() => setTime((t) => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [gameState]);

  // Check Victory
  useEffect(() => {
    if (mounted && gameState === "playing") {
      const isWon = foundations.every(f => f.length === 13);
      // Fallback cheat check for rapid testing (if score hits 5000 arbitrarily, but we rely on foundations)
      if (isWon) {
        setGameState("victory");
        setWalletBalance((prev: any) => prev + (currentBet * 2));
      }
    }
  }, [foundations, mounted, gameState, currentBet]);

  // --- ACTIONS ---
  
  const addChip = (amount: number) => {
    if (walletBalance >= amount) {
      setWalletBalance((prev: any) => prev - amount);
      setCurrentBet(prev => prev + amount);
    }
  };

  const clearBet = () => {
    setWalletBalance((prev: any) => prev + currentBet);
    setCurrentBet(0);
  };

  const startNewGame = () => {
    if (currentBet === 0) return;
    
    const deck = generateDeck();
    const newTableaus: Card[][] = [[], [], [], [], [], [], []];
    
    let deckIndex = 0;
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j <= i; j++) {
        const card = deck[deckIndex++];
        if (j === i) card.isFaceUp = true;
        newTableaus[i].push(card);
      }
    }

    setTableaus(newTableaus);
    setStock(deck.slice(deckIndex));
    setWaste([]);
    setFoundations([[], [], [], []]);
    setSelection(null);
    setMoves(0);
    setScore(0);
    setTime(0);
    setGameState("playing");
  };

  const returnToBetting = () => {
    setCurrentBet(0);
    setGameState("betting");
  };

  const handleStockClick = () => {
    if (gameState !== "playing") return;
    setSelection(null);

    if (stock.length === 0) {
      // Recycle waste to stock
      if (waste.length > 0) {
        const recycled = [...waste].reverse().map(c => ({ ...c, isFaceUp: false }));
        setStock(recycled);
        setWaste([]);
        setMoves(m => m + 1);
        setScore(s => Math.max(0, s - 100));
      }
    } else {
      // Draw 1 card
      const newStock = [...stock];
      const drawn = newStock.pop()!;
      drawn.isFaceUp = true;
      setWaste([...waste, drawn]);
      setStock(newStock);
      setMoves(m => m + 1);
    }
  };

  const autoFlipTableau = (tabs: Card[][]) => {
    tabs.forEach(col => {
      if (col.length > 0 && !col[col.length - 1].isFaceUp) {
        col[col.length - 1].isFaceUp = true;
        setScore(s => s + 5);
      }
    });
    return tabs;
  };

  // Click Handlers
  const handleWasteClick = () => {
    if (gameState !== "playing" || waste.length === 0) return;
    if (selection?.type === "waste") {
      setSelection(null);
    } else {
      setSelection({ type: "waste", colIndex: 0, cardIndex: waste.length - 1 });
    }
  };

  const handleFoundationClick = (colIndex: number) => {
    if (gameState !== "playing" || !selection) return;

    let movingCard: Card;
    let newWaste = [...waste];
    let newTableaus = [...tableaus];

    if (selection.type === "waste") {
      movingCard = newWaste[newWaste.length - 1];
    } else if (selection.type === "tableau") {
      const col = newTableaus[selection.colIndex];
      if (selection.cardIndex !== col.length - 1) {
        setSelection(null);
        return;
      }
      movingCard = col[col.length - 1];
    } else {
      setSelection(null);
      return;
    }

    const foundation = foundations[colIndex];
    const topCard = foundation.length > 0 ? foundation[foundation.length - 1] : null;

    const isValid = topCard
      ? (movingCard.suit === topCard.suit && movingCard.value === topCard.value + 1)
      : (movingCard.value === 1); 

    if (isValid) {
      const newFoundations = [...foundations];
      newFoundations[colIndex] = [...foundation, movingCard];
      
      if (selection.type === "waste") {
        newWaste.pop();
        setWaste(newWaste);
      } else if (selection.type === "tableau") {
        newTableaus[selection.colIndex].pop();
        newTableaus = autoFlipTableau(newTableaus);
        setTableaus(newTableaus);
      }
      
      setFoundations(newFoundations);
      setScore(s => s + 10);
      setMoves(m => m + 1);
    }
    setSelection(null);
  };

  const handleTableauClick = (colIndex: number, cardIndex: number) => {
    if (gameState !== "playing") return;
    
    const col = tableaus[colIndex];
    const clickedCard = col[cardIndex];

    if (!selection) {
      if (clickedCard && clickedCard.isFaceUp) {
        setSelection({ type: "tableau", colIndex, cardIndex });
      }
      return;
    }

    if (selection.type === "tableau" && selection.colIndex === colIndex && selection.cardIndex === cardIndex) {
      setSelection(null);
      return;
    }

    let movingCards: Card[] = [];
    let newWaste = [...waste];
    let newTableaus = [...tableaus];
    let newFoundations = [...foundations];

    if (selection.type === "waste") {
      movingCards = [newWaste[newWaste.length - 1]];
    } else if (selection.type === "foundation") {
      const fCol = newFoundations[selection.colIndex];
      movingCards = [fCol[fCol.length - 1]];
    } else if (selection.type === "tableau") {
      movingCards = newTableaus[selection.colIndex].slice(selection.cardIndex);
    }

    const targetTopCard = col.length > 0 ? col[col.length - 1] : null;
    const baseMovingCard = movingCards[0];

    const isValid = targetTopCard
      ? (baseMovingCard.color !== targetTopCard.color && baseMovingCard.value === targetTopCard.value - 1)
      : (baseMovingCard.value === 13); 

    if (isValid) {
      newTableaus[colIndex] = [...col, ...movingCards];

      if (selection.type === "waste") {
        newWaste.pop();
        setWaste(newWaste);
        setScore(s => s + 5);
      } else if (selection.type === "foundation") {
        newFoundations[selection.colIndex].pop();
        setFoundations(newFoundations);
        setScore(s => Math.max(0, s - 15));
      } else if (selection.type === "tableau") {
        newTableaus[selection.colIndex] = newTableaus[selection.colIndex].slice(0, selection.cardIndex);
        newTableaus = autoFlipTableau(newTableaus);
      }

      setTableaus(newTableaus);
      setMoves(m => m + 1);
    }
    
    setSelection(null);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!mounted) return <div className="min-h-screen bg-gray-950 flex items-center justify-center max-w-full pb-24 md:pb-8"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>;

  const CardView = ({ card, isSelected, onClick, style }: { card: Card | null, isSelected?: boolean, onClick?: () => void, style?: React.CSSProperties }) => {
    if (!card) {
      return (
        <div 
          onClick={onClick}
          className="w-16 h-24 md:w-20 md:h-32 rounded-xl border-2 border-dashed border-emerald-900/50 bg-emerald-950/20 flex items-center justify-center cursor-pointer relative z-0 transition-colors hover:bg-emerald-950/40"
          style={style}
        />
      );
    }

    if (!card.isFaceUp) {
      return (
        <div 
          onClick={onClick}
          className="w-16 h-24 md:w-20 md:h-32 rounded-xl shadow-lg border border-emerald-900 relative cursor-pointer hover:-translate-y-1 transition-transform"
          style={style}
        >
          <div className="absolute inset-0 bg-blue-900 rounded-xl overflow-hidden">
            <div className="absolute inset-1.5 bg-[url('https://www.transparenttextures.com/patterns/argyle.png')] opacity-90 rounded-lg border border-blue-400/20"></div>
          </div>
        </div>
      );
    }

    return (
      <div
        onClick={onClick}
        className={`w-16 h-24 md:w-20 md:h-32 rounded-xl shadow-[0_4px_10px_rgba(0,0,0,0.3)] border border-gray-200 bg-white flex flex-col items-center justify-between py-1.5 md:py-2 cursor-pointer transition-all
          ${card.color === 'red' ? 'text-red-600' : 'text-gray-900'}
          ${isSelected ? 'ring-4 ring-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.8)] -translate-y-2 z-50' : 'hover:-translate-y-1'}
        `}
        style={style}
      >
        <div className="flex flex-col items-center self-start pl-1.5 md:pl-2">
          <span className="font-bold text-sm md:text-lg leading-none">{card.rank}</span>
          <span className="text-xs md:text-sm">{getSuitSymbol(card.suit)}</span>
        </div>
        <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none text-3xl md:text-5xl">
          {getSuitSymbol(card.suit)}
        </div>
        <div className="flex flex-col items-center self-end pr-1.5 md:pr-2 rotate-180">
          <span className="font-bold text-sm md:text-lg leading-none">{card.rank}</span>
          <span className="text-xs md:text-sm">{getSuitSymbol(card.suit)}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-[100dvh] bg-gray-950 text-gray-100 font-sans flex flex-col overflow-x-hidden selection:bg-emerald-500/30 pb-24 md:pb-8 max-w-full">
      
      {/* --- HEADER --- */}
      <header className="h-[70px] bg-[#0a0f16] border-b border-[#1f2937] px-4 flex items-center justify-between shrink-0 z-50 shadow-md">
        <div className="flex items-center space-x-2 md:space-x-4">
          <Link href="/games" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
          </Link>
          <div className="flex items-center space-x-2">
            <Trophy className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />
            <h1 className="text-base md:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 uppercase tracking-widest hidden sm:block">
              KLONDIKE
            </h1>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center space-x-4 md:space-x-8 bg-[#11111a] px-4 md:px-6 py-2 rounded-full border border-[#1f1f2e]">
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Score</span>
            <span className="font-mono font-bold text-emerald-400 text-sm">{score}</span>
          </div>
          <div className="w-px h-6 bg-gray-800"></div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Moves</span>
            <span className="font-mono font-bold text-blue-400 text-sm">{moves}</span>
          </div>
          <div className="w-px h-6 bg-gray-800"></div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Time</span>
            <span className="font-mono font-bold text-amber-400 text-sm">{formatTime(time)}</span>
          </div>
        </div>

        {/* Wallet / New Game */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 bg-gray-900/60 backdrop-blur-sm px-4 py-1.5 rounded-full border border-gray-700/50 mr-2">
            <Coins className="w-4 h-4 text-emerald-400" />
            <p className="font-bold text-emerald-400 text-sm">₹{walletBalance.toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
          </div>
          {gameState === "playing" && (
            <button onClick={returnToBetting} className="flex items-center px-3 py-2 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-lg border border-red-500/30 transition-all text-xs md:text-sm font-bold">
              <RotateCcw className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" /> Forfeit
            </button>
          )}
        </div>
      </header>

      {/* --- PLAYING AREA --- */}
      <main className="flex-grow relative bg-emerald-800 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-700 to-emerald-950 overflow-auto sm:overflow-hidden p-4 md:p-8 flex flex-col w-full">
        
        {/* Felt Texture Overlay */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/felt.png')] opacity-30 mix-blend-overlay pointer-events-none"></div>

        {/* --- PRE-GAME BETTING MODAL --- */}
        <AnimatePresence>
          {gameState === "betting" && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            >
              <div className="px-8 py-8 md:px-12 rounded-3xl bg-[#0a0f16] border border-[#1f2937] shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col items-center max-w-md w-full">
                <h2 className="text-2xl font-black uppercase tracking-widest text-white mb-2">Place Your Bet</h2>
                <p className="text-gray-400 text-sm mb-8 text-center">Stake your entry fee. Complete the Solitaire to win a <span className="text-emerald-400 font-bold">2X Payout!</span></p>
                
                <div className="flex flex-col items-center w-full space-y-6">
                  <div className="flex items-center justify-center w-full bg-[#11111a] py-6 rounded-2xl border border-[#1f1f2e] relative">
                    <button onClick={clearBet} disabled={currentBet === 0} className="absolute left-4 text-xs text-red-400 font-bold uppercase hover:text-red-300 disabled:opacity-50">Clear</button>
                    <span className="text-4xl font-mono font-black text-emerald-400">₹{currentBet.toLocaleString()}</span>
                  </div>

                  {/* Chip Selector */}
                  <div className="flex gap-3 justify-center w-full">
                    {CHIPS.map(chip => (
                      <button 
                        key={chip}
                        onClick={() => addChip(chip)}
                        disabled={walletBalance < chip}
                        className="w-12 h-12 md:w-14 md:h-14 rounded-full border-4 border-dashed border-white/50 bg-gradient-to-br from-blue-600 to-blue-800 shadow-[0_5px_15px_rgba(0,0,0,0.5)] flex items-center justify-center hover:-translate-y-1 hover:scale-105 hover:shadow-[0_0_20px_rgba(37,99,235,0.6)] transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:scale-100"
                      >
                        <span className="font-black text-white text-xs md:text-sm drop-shadow-md">{chip}</span>
                      </button>
                    ))}
                  </div>

                  <button 
                    onClick={startNewGame}
                    disabled={currentBet === 0}
                    className="w-full mt-4 py-4 rounded-xl font-black text-lg md:text-xl uppercase tracking-widest bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)] border border-emerald-400 disabled:opacity-50 disabled:shadow-none transition-all"
                  >
                    Start Game & Lock Bet
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- GAME LAYOUT (Hidden under modal if not playing/victory, but renders for visual) --- */}
        <div className={`transition-opacity duration-500 ${gameState === 'betting' ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
          
          {/* --- TOP ROW (Stock, Waste, Foundations) --- */}
          <div className="flex justify-between w-full max-w-5xl mx-auto mb-8 relative z-10 gap-8">
            
            {/* Stock & Waste */}
            <div className="flex gap-4">
              {/* Stock */}
              <div className="relative cursor-pointer" onClick={handleStockClick}>
                <CardView card={null} />
                {stock.length > 0 && (
                  <div className="absolute inset-0 flex">
                    {stock.length > 1 && <div className="absolute top-1 -left-1 w-full h-full bg-blue-900 rounded-xl border border-blue-400/20 shadow-md"></div>}
                    {stock.length > 2 && <div className="absolute top-2 -left-2 w-full h-full bg-blue-900 rounded-xl border border-blue-400/20 shadow-md"></div>}
                    <div className="absolute top-0 left-0 w-full h-full">
                      <CardView card={stock[stock.length - 1]} />
                    </div>
                  </div>
                )}
              </div>

              {/* Waste */}
              <div className="relative">
                <CardView card={null} />
                {waste.length > 0 && (
                  <div className="absolute inset-0">
                    <CardView 
                      card={waste[waste.length - 1]} 
                      isSelected={selection?.type === 'waste'}
                      onClick={handleWasteClick}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Foundations */}
            <div className="flex gap-2 md:gap-4">
              {foundations.map((col, idx) => (
                <div key={idx} className="relative">
                  <CardView card={null} onClick={() => handleFoundationClick(idx)} />
                  {col.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none text-2xl">
                      {getSuitSymbol(SUITS[idx])}
                    </div>
                  )}
                  {col.map((card, cardIdx) => (
                    <div key={card.id} className="absolute inset-0">
                      <CardView 
                        card={card} 
                        isSelected={selection?.type === 'foundation' && selection.colIndex === idx}
                        onClick={() => handleFoundationClick(idx)}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>

          </div>

          {/* --- BOTTOM ROW (Tableaus) --- */}
          <div className="flex justify-center gap-2 md:gap-4 w-full max-w-5xl mx-auto relative z-10 flex-grow">
            {tableaus.map((col, colIdx) => (
              <div key={colIdx} className="relative w-[12vw] sm:w-16 md:w-20 flex-shrink-0">
                <CardView card={null} onClick={() => handleTableauClick(colIdx, 0)} />
                
                {col.map((card, cardIdx) => {
                  const isSelected = selection?.type === 'tableau' && selection.colIndex === colIdx && cardIdx >= selection.cardIndex;
                  
                  return (
                    <div 
                      key={card.id} 
                      className="absolute w-full transition-all duration-200"
                      style={{ top: `${cardIdx * (card.isFaceUp ? 24 : 12)}px`, zIndex: cardIdx }}
                    >
                      <CardView 
                        card={card} 
                        isSelected={isSelected}
                        onClick={() => handleTableauClick(colIdx, cardIdx)}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

        </div>

        {/* --- VICTORY MODAL --- */}
        <AnimatePresence>
          {gameState === "victory" && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            >
              <div className="px-12 py-8 rounded-3xl bg-emerald-950/90 border-2 border-emerald-500 text-emerald-400 shadow-[0_0_80px_rgba(16,185,129,0.5)] flex flex-col items-center">
                <Trophy className="w-16 h-16 text-yellow-400 mb-4 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]" />
                <h2 className="text-4xl md:text-6xl font-black uppercase tracking-widest drop-shadow-md text-white mb-2">
                  VICTORY!
                </h2>
                <div className="flex gap-6 mt-4 items-center">
                  <div className="text-center">
                    <p className="text-sm text-gray-400 uppercase tracking-widest">Score</p>
                    <p className="text-2xl font-mono font-bold text-emerald-400">{score}</p>
                  </div>
                  <div className="w-px h-12 bg-gray-700"></div>
                  <div className="text-center">
                    <p className="text-sm text-yellow-400 font-black uppercase tracking-widest">Payout (2x)</p>
                    <p className="text-3xl font-mono font-black text-yellow-400">+₹{(currentBet * 2).toLocaleString()}</p>
                  </div>
                  <div className="w-px h-12 bg-gray-700"></div>
                  <div className="text-center">
                    <p className="text-sm text-gray-400 uppercase tracking-widest">Time</p>
                    <p className="text-2xl font-mono font-bold text-amber-400">{formatTime(time)}</p>
                  </div>
                </div>
                <button 
                  onClick={returnToBetting}
                  className="mt-8 px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                >
                  Claim & Play Again
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}
