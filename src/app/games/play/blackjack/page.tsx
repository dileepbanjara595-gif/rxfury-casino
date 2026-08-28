"use client";

import { useCurrencyStore, convertFromBase, convertToBase, CURRENCY_SYMBOLS, formatCurrency } from '@/store/currencyStore';
import { useState, useEffect } from "react";
import { ArrowLeft, Coins, Crown, Spade, Heart, Club, Diamond, Plus } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface PlayingCard {
  suit: 'spade' | 'heart' | 'diamond' | 'club';
  value: string;
  weight: number;
  color: string;
  isHidden?: boolean;
}

const SUITS: ('spade' | 'heart' | 'diamond' | 'club')[] = ['spade', 'heart', 'diamond', 'club'];
const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const CHIPS = [50, 100, 500, 1000, 5000];

const generateDeck = () => {
  const deck: PlayingCard[] = [];
  SUITS.forEach(suit => {
    VALUES.forEach(val => {
      let weight = parseInt(val);
      if (['J', 'Q', 'K'].includes(val)) weight = 10;
      if (val === 'A') weight = 11;
      
      deck.push({
        suit,
        value: val,
        weight,
        color: (suit === 'heart' || suit === 'diamond') ? 'text-red-600' : 'text-gray-900'
      });
    });
  });
  // Simple shuffle
  return deck.sort(() => Math.random() - 0.5);
};

const calculateScore = (hand: PlayingCard[]) => {
  let score = 0;
  let aces = 0;
  
  hand.forEach(card => {
    if (card.isHidden) return;
    score += card.weight;
    if (card.value === 'A') aces += 1;
  });

  while (score > 21 && aces > 0) {
    score -= 10;
    aces -= 1;
  }
  return score;
};

export default function BlackjackPage() {
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

  const [currentBet, setCurrentBet] = useState(0);
  
  const [deck, setDeck] = useState<PlayingCard[]>([]);
  const [playerHand, setPlayerHand] = useState<PlayingCard[]>([]);
  const [dealerHand, setDealerHand] = useState<PlayingCard[]>([]);
  
  const [gameState, setGameState] = useState<"betting" | "playing" | "dealerTurn" | "gameOver">("betting");
  const [resultMessage, setResultMessage] = useState("");
  const [resultType, setResultType] = useState<"win" | "loss" | "push" | "blackjack">("push");

  useEffect(() => {
    setMounted(true);
    setDeck(generateDeck());
  }, []);

  // --- Actions ---

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

  const drawCard = (currentDeck: PlayingCard[]) => {
    const card = currentDeck.pop();
    return { card, newDeck: currentDeck };
  };

  const dealCards = () => {
    if (currentBet === 0) return;
    
    let currentDeck = [...deck];
    if (currentDeck.length < 10) currentDeck = generateDeck(); // reshuffle

    const pHand: PlayingCard[] = [];
    const dHand: PlayingCard[] = [];

    // Deal 2 cards each
    const draw1 = drawCard(currentDeck); pHand.push(draw1.card!); currentDeck = draw1.newDeck;
    const draw2 = drawCard(currentDeck); dHand.push(draw2.card!); currentDeck = draw2.newDeck;
    const draw3 = drawCard(currentDeck); pHand.push(draw3.card!); currentDeck = draw3.newDeck;
    
    // Dealer hole card
    const draw4 = drawCard(currentDeck); 
    const holeCard = { ...draw4.card!, isHidden: true };
    dHand.push(holeCard); 
    currentDeck = draw4.newDeck;

    setPlayerHand(pHand);
    setDealerHand(dHand);
    setDeck(currentDeck);
    
    const pScore = calculateScore(pHand);
    
    if (pScore === 21) {
      handleGameOver(pHand, dHand, "blackjack");
    } else {
      setGameState("playing");
    }
  };

  const hit = () => {
    let currentDeck = [...deck];
    const draw = drawCard(currentDeck);
    const newHand = [...playerHand, draw.card!];
    
    setPlayerHand(newHand);
    setDeck(currentDeck);

    if (calculateScore(newHand) > 21) {
      handleGameOver(newHand, dealerHand, "bust");
    }
  };

  const doubleDown = () => {
    if (walletBalance >= currentBet) {
      setWalletBalance((prev: any) => prev - currentBet);
      setCurrentBet(prev => prev * 2);
      
      let currentDeck = [...deck];
      const draw = drawCard(currentDeck);
      const newHand = [...playerHand, draw.card!];
      
      setPlayerHand(newHand);
      setDeck(currentDeck);

      if (calculateScore(newHand) > 21) {
        handleGameOver(newHand, dealerHand, "bust");
      } else {
        stand(newHand, dealerHand, currentDeck);
      }
    }
  };

  const stand = (pHand = playerHand, dHand = dealerHand, currentDeck = deck) => {
    setGameState("dealerTurn");
    
    // Reveal dealer hole card
    let finalDealerHand = [...dHand];
    finalDealerHand[1].isHidden = false;
    
    let dScore = calculateScore(finalDealerHand);
    
    // Dealer hits on soft 17
    const dealerPlay = async () => {
      let tempDeck = [...currentDeck];
      while (dScore < 17) {
        // Small delay for dramatic effect
        await new Promise(r => setTimeout(r, 600));
        const draw = drawCard(tempDeck);
        finalDealerHand = [...finalDealerHand, draw.card!];
        setDealerHand([...finalDealerHand]);
        tempDeck = draw.newDeck;
        dScore = calculateScore(finalDealerHand);
      }
      
      setDeck(tempDeck);
      setDealerHand(finalDealerHand);
      evaluateWinner(pHand, finalDealerHand);
    };
    
    dealerPlay();
  };

  const evaluateWinner = (pHand: PlayingCard[], dHand: PlayingCard[]) => {
    const pScore = calculateScore(pHand);
    const dScore = calculateScore(dHand);
    
    if (dScore > 21) {
      handleGameOver(pHand, dHand, "win");
    } else if (pScore > dScore) {
      handleGameOver(pHand, dHand, "win");
    } else if (dScore > pScore) {
      handleGameOver(pHand, dHand, "loss");
    } else {
      handleGameOver(pHand, dHand, "push");
    }
  };

  const handleGameOver = (pHand: PlayingCard[], dHand: PlayingCard[], type: "win" | "loss" | "bust" | "push" | "blackjack") => {
    setGameState("gameOver");
    
    // Reveal dealer card if it was blackjack check
    if (dHand[1]?.isHidden) {
      const revealed = [...dHand];
      revealed[1].isHidden = false;
      setDealerHand(revealed);
    }

    if (type === "win") {
      setResultMessage("YOU WIN!");
      setResultType("win");
      setWalletBalance((prev: any) => prev + (currentBet * 2));
    } else if (type === "blackjack") {
      setResultMessage("BLACKJACK!");
      setResultType("blackjack");
      setWalletBalance((prev: any) => prev + (currentBet * 2.5)); // 3:2 payout
    } else if (type === "loss") {
      setResultMessage("DEALER WINS");
      setResultType("loss");
    } else if (type === "bust") {
      setResultMessage("BUST!");
      setResultType("loss");
    } else {
      setResultMessage("PUSH");
      setResultType("push");
      setWalletBalance((prev: any) => prev + currentBet);
    }
  };

  const resetGame = () => {
    setPlayerHand([]);
    setDealerHand([]);
    setCurrentBet(0);
    setGameState("betting");
  };

  if (!mounted) return <div className="min-h-screen bg-gray-950 flex items-center justify-center max-w-full pb-24 md:pb-8"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>;

  const getSuitIcon = (suit: string, sizeClass: string) => {
    switch(suit) {
      case 'spade': return <Spade className={sizeClass} fill="currentColor" />;
      case 'heart': return <Heart className={sizeClass} fill="currentColor" />;
      case 'diamond': return <Diamond className={sizeClass} fill="currentColor" />;
      case 'club': return <Club className={sizeClass} fill="currentColor" />;
    }
  }

  // Visual Card Component
  const Card = ({ card, index }: { card: PlayingCard, index: number }) => {
    if (card.isHidden) {
      return (
        <motion.div 
          initial={{ opacity: 0, y: -50, rotateY: 180 }}
          animate={{ opacity: 1, y: 0, rotateY: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
          className="w-[70px] h-[100px] md:w-[100px] md:h-[140px] bg-white rounded-lg shadow-xl border border-gray-300 relative ml-[-30px] md:ml-[-40px] first:ml-0"
        >
          <div className="absolute inset-1.5 bg-[url('https://www.transparenttextures.com/patterns/argyle.png')] bg-blue-900 rounded-sm opacity-90 border border-blue-400/20"></div>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: -50, rotateY: 180 }}
        animate={{ opacity: 1, y: 0, rotateY: 0 }}
        transition={{ duration: 0.4, delay: index * 0.1 }}
        className={`w-[70px] h-[100px] md:w-[100px] md:h-[140px] bg-white rounded-lg shadow-[0_5px_15px_rgba(0,0,0,0.5)] border border-gray-200 flex flex-col items-center justify-between py-1.5 md:py-2 ${card.color} ml-[-30px] md:ml-[-40px] first:ml-0 relative z-[${index}] hover:-translate-y-2 transition-transform`}
      >
        <div className="flex flex-col items-center self-start pl-1.5 md:pl-2">
          <span className="font-bold text-sm md:text-xl leading-none">{card.value}</span>
          {getSuitIcon(card.suit, "w-3 h-3 md:w-5 md:h-5")}
        </div>
        <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
          {getSuitIcon(card.suit, "w-10 h-10 md:w-16 md:h-16")}
        </div>
        <div className="flex flex-col items-center self-end pr-1.5 md:pr-2 rotate-180">
          <span className="font-bold text-sm md:text-xl leading-none">{card.value}</span>
          {getSuitIcon(card.suit, "w-3 h-3 md:w-5 md:h-5")}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-[100dvh] bg-[#050914] text-gray-100 font-sans flex flex-col overflow-x-hidden relative selection:bg-emerald-500/30 pb-24 md:pb-8 max-w-full">
      
      {/* Header */}
      <header className="h-[60px] bg-[#0a0f16] border-b border-[#1f2937] px-4 flex items-center justify-between shrink-0 z-50">
        <div className="flex items-center space-x-4">
          <Link href="/games" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center space-x-2">
            <Spade className="w-5 h-5 text-emerald-500" fill="currentColor" />
            <h1 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 uppercase tracking-widest hidden md:block">
              BLACKJACK 21
            </h1>
          </div>
        </div>
        <div className="flex items-center space-x-4 bg-gray-900/60 backdrop-blur-sm px-4 py-1.5 rounded-full border border-gray-700/50">
          <Coins className="w-4 h-4 text-emerald-400" />
          <p className="font-bold text-emerald-400 text-sm">₹{walletBalance.toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
        </div>
      </header>

      {/* Main Table Area */}
      <main className="flex-grow relative bg-[#06101c] flex flex-col items-center overflow-hidden">
        
        {/* The Felt Table Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[40%] w-[120vw] h-[120vh] bg-gradient-to-t from-[#022c1b] to-[#041c13] rounded-[50%] border-t-[20px] border-[#1a110a] shadow-[inset_0_40px_100px_rgba(0,0,0,0.9)]"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-[0.03] mix-blend-overlay"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none"></div>

        {/* Table Imprint / Logo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 pointer-events-none flex flex-col items-center">
          <Crown className="w-24 h-24 text-black mb-2" />
          <div className="text-2xl font-black tracking-[0.5em] text-black">RXFURY</div>
          <div className="text-xs tracking-widest text-black mt-2 font-bold">BLACKJACK PAYS 3 TO 2</div>
          <div className="text-xs tracking-widest text-black mt-1">DEALER MUST DRAW TO 16 AND STAND ON ALL 17s</div>
        </div>

        {/* --- DEALER AREA (Top) --- */}
        <div className="relative z-10 w-full flex flex-col items-center pt-8 md:pt-12 min-h-[220px]">
          {dealerHand.length > 0 && (
            <div className="flex flex-col items-center">
              <div className="flex ml-8">
                {dealerHand.map((card, i) => (
                  <Card key={i} card={card} index={i} />
                ))}
              </div>
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="mt-4 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-emerald-500/30 text-emerald-400 font-bold font-mono shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              >
                Dealer: {calculateScore(dealerHand)}
              </motion.div>
            </div>
          )}
        </div>

        {/* --- WIN / LOSS MODAL OVERLAY --- */}
        <AnimatePresence>
          {gameState === "gameOver" && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 flex flex-col items-center"
            >
              <div className={`px-8 py-4 rounded-2xl backdrop-blur-xl border-2 flex flex-col items-center shadow-2xl ${
                resultType === 'win' || resultType === 'blackjack' ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400 shadow-[0_0_50px_rgba(16,185,129,0.5)]' :
                resultType === 'loss' ? 'bg-red-950/80 border-red-500 text-red-400 shadow-[0_0_50px_rgba(239,68,68,0.5)]' :
                'bg-gray-900/80 border-gray-500 text-gray-300 shadow-[0_0_50px_rgba(156,163,175,0.5)]'
              }`}>
                <h2 className="text-3xl md:text-5xl font-black uppercase tracking-widest drop-shadow-md">
                  {resultMessage}
                </h2>
                {resultType === 'win' && <p className="mt-2 font-mono text-lg text-white">+{currentBet * 2}</p>}
                {resultType === 'blackjack' && <p className="mt-2 font-mono text-lg text-white">+{currentBet * 2.5}</p>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- PLAYER AREA (Bottom) --- */}
        <div className="relative z-10 w-full flex flex-col items-center mt-auto pb-4 min-h-[220px]">
          {playerHand.length > 0 && (
            <div className="flex flex-col items-center">
              <motion.div 
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className={`mb-4 bg-black/60 backdrop-blur-md px-5 py-2 rounded-full border-2 font-black font-mono text-lg shadow-lg ${
                  calculateScore(playerHand) > 21 ? 'border-red-500/50 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]' :
                  calculateScore(playerHand) === 21 ? 'border-amber-500/50 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)]' :
                  'border-emerald-500/30 text-white shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                }`}
              >
                Score: {calculateScore(playerHand)}
              </motion.div>
              <div className="flex ml-8">
                {playerHand.map((card, i) => (
                  <Card key={i} card={card} index={i} />
                ))}
              </div>
            </div>
          )}
        </div>

      </main>

      {/* --- CONTROLS PANEL --- */}
      <div className="relative shrink-0 w-full bg-[#0a0f16] border-t border-[#1f2937] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] z-40 p-4 md:p-6 min-h-[140px] flex items-center justify-center">
        
        {gameState === "betting" || gameState === "gameOver" ? (
          
          /* BETTING PHASE */
          <div className="flex flex-col items-center w-full max-w-2xl space-y-4">
            <div className="flex items-center justify-between w-full">
              
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Current Bet</span>
                <span className="text-2xl font-mono font-black text-emerald-400">₹{currentBet.toLocaleString()}</span>
              </div>

              {/* Chip Selector */}
              <div className="flex gap-2 md:gap-4">
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
                onClick={clearBet}
                disabled={currentBet === 0}
                className="text-xs text-red-400 font-bold uppercase hover:text-red-300 disabled:opacity-50 transition-colors"
              >
                Clear
              </button>
            </div>

            <button 
              onClick={gameState === "gameOver" ? resetGame : dealCards}
              disabled={gameState === "betting" && currentBet === 0}
              className="w-full py-4 rounded-xl font-black text-xl uppercase tracking-widest bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)] border border-emerald-400 disabled:opacity-50 disabled:shadow-none transition-all"
            >
              {gameState === "gameOver" ? "Play Again" : "Deal"}
            </button>
          </div>

        ) : (

          /* ACTION PHASE (PLAYING) */
          <div className="flex items-center justify-center gap-3 md:gap-6 w-full max-w-2xl">
            
            <button 
              onClick={hit}
              disabled={gameState !== "playing" || calculateScore(playerHand) >= 21}
              className="flex-1 py-4 md:py-6 rounded-2xl font-black text-xl md:text-2xl uppercase tracking-widest bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_25px_rgba(37,99,235,0.4)] border border-blue-400 disabled:opacity-50 transition-all flex flex-col items-center justify-center"
            >
              <Plus className="w-6 h-6 mb-1 opacity-50 hidden md:block" />
              Hit
            </button>
            
            <button 
              onClick={() => stand()}
              disabled={gameState !== "playing"}
              className="flex-1 py-4 md:py-6 rounded-2xl font-black text-xl md:text-2xl uppercase tracking-widest bg-red-600 hover:bg-red-500 text-white shadow-[0_0_25px_rgba(239,68,68,0.4)] border border-red-400 disabled:opacity-50 transition-all flex flex-col items-center justify-center"
            >
              <div className="w-6 h-6 mb-1 border-2 border-white/50 rounded hidden md:block" />
              Stand
            </button>

            <button 
              onClick={doubleDown}
              disabled={gameState !== "playing" || playerHand.length > 2 || walletBalance < currentBet}
              className="flex-1 py-4 md:py-6 rounded-2xl font-black text-lg md:text-xl uppercase tracking-widest bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_25px_rgba(245,158,11,0.5)] border border-amber-300 disabled:opacity-50 disabled:grayscale transition-all flex flex-col items-center justify-center"
            >
              <Coins className="w-6 h-6 mb-1 opacity-50 hidden md:block" />
              Double
            </button>

          </div>
        )}

      </div>
    </div>
  );
}
