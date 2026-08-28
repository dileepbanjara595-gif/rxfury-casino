"use client";

import { useState } from "react";
import { HelpCircle, Expand, Menu, RefreshCw, CircleDollarSign, ArrowLeft, User, Volume2, Music, Keyboard, ShieldCheck, FileText, Clock, Copy, X } from "lucide-react";
import { useCurrencyStore, CURRENCY_SYMBOLS, formatCurrency, convertFromBase, convertToBase } from "@/store/currencyStore";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// Helper Components
const ToggleRow = ({ label, icon, active, onClick }: { label: string, icon: React.ReactNode, active: boolean, onClick: () => void }) => (
  <div className="flex items-center justify-between p-3 hover:bg-[#2a3045] rounded-lg cursor-pointer transition-colors" onClick={onClick}>
    <div className="flex items-center space-x-3 text-gray-300">
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </div>
    <div className={`w-10 h-5 rounded-full relative transition-colors ${active ? 'bg-green-500' : 'bg-gray-600'}`}>
      <div className={`absolute top-0.5 bottom-0.5 w-4 bg-white rounded-full transition-transform shadow-sm ${active ? 'translate-x-5' : 'translate-x-0.5'}`}></div>
    </div>
  </div>
);

const MenuRow = ({ label, icon, onClick }: { label: string, icon: React.ReactNode, onClick: () => void }) => (
  <div className="flex items-center space-x-3 p-3 text-gray-300 hover:text-white hover:bg-[#2a3045] rounded-lg cursor-pointer transition-colors" onClick={onClick}>
    {icon}
    <span className="text-sm font-medium">{label}</span>
  </div>
);

export default function ChickenRoad() {
  const { activeCurrency, baseBalance, setBaseBalance } = useCurrencyStore();
  const displayBalance = convertFromBase(baseBalance, activeCurrency);
  const sym = CURRENCY_SYMBOLS[activeCurrency];

  const [difficulty, setDifficulty] = useState("Easy");
  const [betAmount, setBetAmount] = useState<number | "">(20);
  
  // Settings & Menus State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'howToPlay' | 'provablyFair' | 'gameRules' | 'betHistory' | null>(null);
  const [toggles, setToggles] = useState({ sound: true, music: true, space: false });

  // Game Engine State
  const [gameStatus, setGameStatus] = useState<'idle' | 'playing' | 'crashed' | 'cashed_out'>('idle');
  const [currentStep, setCurrentStep] = useState(0); // 0 to 9
  const [chickenPosition, setChickenPosition] = useState<{col: number, row: number} | null>(null);
  const [firePositions, setFirePositions] = useState<number[][]>([]);
  const [revealedGrates, setRevealedGrates] = useState<{col: number, row: number, type: 'safe' | 'fire'}[]>([]);
  
  const steps = [
    { mult: 1.12 }, { mult: 1.28 }, { mult: 1.47 }, { mult: 1.70 },
    { mult: 1.98 }, { mult: 2.33 }, { mult: 2.76 }, { mult: 3.32 },
    { mult: 4.05 }, { mult: 5.02 }
  ];

  // Actions
  const handlePlay = () => {
    const bet = Number(betAmount);
    if (!bet || bet <= 0) return alert("Enter a valid bet amount");
    if (bet > displayBalance) return alert("Insufficient Balance in this wallet!");

    // Generate Fire Positions
    let firesCount = 1;
    if (difficulty === "Medium") firesCount = 2;
    if (difficulty === "Hard") firesCount = 3;
    if (difficulty === "Hardcore") firesCount = 4;

    const newFires = Array.from({length: 10}).map(() => {
       // Single row mode: Probability of hitting fire is (firesCount / 5)
       const isFire = Math.random() < (firesCount / 5);
       return isFire ? [0] : [];
    });

    // Deduct bet from global balance
    setBaseBalance(baseBalance - convertToBase(bet, activeCurrency));
    
    setFirePositions(newFires);
    setRevealedGrates([]);
    setChickenPosition(null);
    setCurrentStep(0);
    setGameStatus('playing');
  };

  const handleGrateClick = (colIdx: number, rowIdx: number) => {
    if (gameStatus !== 'playing' || colIdx !== currentStep) return;

    const isFire = firePositions[colIdx].includes(rowIdx);
    
    if (isFire) {
      // Collision
      setRevealedGrates(prev => [...prev, { col: colIdx, row: rowIdx, type: 'fire' }]);
      setChickenPosition({ col: colIdx, row: rowIdx });
      setGameStatus('crashed');
      
      // Reveal all other fires in this column for transparency
      firePositions[colIdx].forEach(fireRow => {
         if (fireRow !== rowIdx) {
            setRevealedGrates(prev => [...prev, { col: colIdx, row: fireRow, type: 'fire' }]);
         }
      });
      
    } else {
      // Safe
      setRevealedGrates(prev => [...prev, { col: colIdx, row: rowIdx, type: 'safe' }]);
      setChickenPosition({ col: colIdx, row: rowIdx });
      
      if (currentStep + 1 >= steps.length) {
         // Auto cashout on last step
         handleCashout(currentStep + 1);
      } else {
         setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleCashout = (completedSteps = currentStep) => {
    if (completedSteps === 0 || gameStatus !== 'playing') return;
    
    const mult = steps[completedSteps - 1].mult;
    const winAmount = Number(betAmount) * mult;
    
    // Add winnings to global balance
    setBaseBalance(baseBalance + convertToBase(winAmount, activeCurrency));
    
    setGameStatus('cashed_out');
  };

  // Current active multiplier for display
  const currentMultiplier = currentStep > 0 ? steps[currentStep - 1].mult : 1.00;
  const currentWin = Number(betAmount) * currentMultiplier;
  const isPlaying = gameStatus === 'playing';



  return (
    <div className="min-h-screen bg-[#0F1923] flex flex-col items-center justify-center p-4 max-w-full pb-24 md:pb-8">
      
      {/* Mobile Back Button */}
      <div className="w-full max-w-6xl mb-4 md:hidden">
         <Link href="/games" className="text-gray-400 hover:text-white flex items-center font-bold">
            <ArrowLeft className="w-5 h-5 mr-2" /> Games Menu
         </Link>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-[1200px] h-[700px] bg-[#1e2335] rounded-xl overflow-hidden flex flex-col shadow-2xl border border-gray-800 font-sans relative">
        
        {/* 1. Top Bar */}
        <header className="h-16 bg-[#171a27] border-b border-[#23283c] flex items-center justify-between px-6 shrink-0 relative z-40">
          <div className="flex items-center space-x-4">
             <Link href="/games" className="text-gray-400 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5 hidden md:block" />
             </Link>
             <h1 className="text-xl font-black text-white uppercase tracking-widest italic">CHICKEN ROAD</h1>
          </div>
          
          <div className="flex items-center space-x-3 md:space-x-4">
            <button onClick={() => setActiveModal('howToPlay')} className="hidden md:flex items-center space-x-2 text-gray-400 hover:text-white bg-[#23283c] px-3 py-1.5 rounded-md text-sm font-bold transition-colors">
              <HelpCircle className="w-4 h-4" />
              <span>How to play?</span>
            </button>
            <div className="flex items-center space-x-2 bg-[#2a3045] px-4 py-1.5 rounded-full text-white font-bold shadow-inner border border-[#343b59]">
              <CircleDollarSign className="w-4 h-4 text-green-400" />
              <span>{sym} {formatCurrency(displayBalance, activeCurrency)}</span>
            </div>
            <div className="hidden sm:flex space-x-2 text-gray-400 ml-2 relative">
              <button className="hover:text-white p-1 rounded hover:bg-[#23283c] transition-colors"><Expand className="w-5 h-5" /></button>
              
              {/* Menu Trigger */}
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)} 
                className={`p-1 rounded transition-colors ${isMenuOpen ? 'text-white bg-[#2a3045]' : 'hover:text-white hover:bg-[#23283c]'}`}
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-10 right-0 w-72 bg-[#23283c] border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col font-sans"
                  >
                    {/* Avatar Header */}
                    <div className="flex items-center space-x-3 p-4 border-b border-gray-700 bg-[#1e2335]">
                       <div className="w-10 h-10 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white shadow-inner"><User className="w-5 h-5" /></div>
                       <div className="flex flex-col">
                         <span className="text-white font-bold text-sm tracking-wide">Magenta Te...</span>
                         <span className="text-gray-400 text-xs hover:text-white cursor-pointer transition-colors mt-0.5">Change avatar</span>
                       </div>
                    </div>
                    {/* Toggles */}
                    <div className="flex flex-col p-2 border-b border-gray-700">
                      <ToggleRow label="Sound" icon={<Volume2 className="w-4 h-4"/>} active={toggles.sound} onClick={() => setToggles(p => ({...p, sound: !p.sound}))} />
                      <ToggleRow label="Music" icon={<Music className="w-4 h-4"/>} active={toggles.music} onClick={() => setToggles(p => ({...p, music: !p.music}))} />
                      <ToggleRow label="«Space» to spin & go" icon={<Keyboard className="w-4 h-4"/>} active={toggles.space} onClick={() => setToggles(p => ({...p, space: !p.space}))} />
                    </div>
                    {/* Links */}
                    <div className="flex flex-col p-2">
                      <MenuRow label="Provably fair settings" icon={<ShieldCheck className="w-4 h-4 text-purple-400"/>} onClick={() => {setActiveModal('provablyFair'); setIsMenuOpen(false);}} />
                      <MenuRow label="Game rules" icon={<FileText className="w-4 h-4 text-blue-400"/>} onClick={() => {setActiveModal('gameRules'); setIsMenuOpen(false);}} />
                      <MenuRow label="My bet history" icon={<Clock className="w-4 h-4 text-green-400"/>} onClick={() => {setActiveModal('betHistory'); setIsMenuOpen(false);}} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Modals Container */}
        <AnimatePresence>
          {activeModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-[#2a3045] w-full max-w-lg rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col font-sans border border-gray-700"
              >
                {/* Modal Header */}
                <div className="flex justify-between items-center p-5 border-b border-[#343b59] bg-[#1e2335]">
                  <h2 className="text-white text-lg font-black tracking-wide">
                    {activeModal === 'howToPlay' && "How to play?"}
                    {activeModal === 'provablyFair' && "Provably fair settings"}
                    {activeModal === 'gameRules' && "Game rules"}
                    {activeModal === 'betHistory' && "My bet history"}
                  </h2>
                  <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-white p-1.5 rounded-full hover:bg-[#343b59] transition-colors"><X className="w-5 h-5"/></button>
                </div>
                
                {/* Modal Body */}
                <div className="p-6 overflow-y-auto max-h-[70vh]">
                   
                   {/* How To Play */}
                   {activeModal === 'howToPlay' && (
                     <ol className="list-decimal pl-5 space-y-4 text-gray-300 text-sm leading-relaxed">
                        <li>Specify the amount of your bet.</li>
                        <li>Choose a difficulty level... The game has 4 difficulty levels:
                          <ul className="list-disc pl-5 mt-2 space-y-2 text-gray-400">
                            <li><span className="text-white font-bold">Easy</span> – there are 24 lines at this level.</li>
                            <li><span className="text-white font-bold">Medium</span> – there are 22 lines at this level.</li>
                            <li><span className="text-white font-bold">Hard</span> – there are 20 lines at this level.</li>
                            <li><span className="text-white font-bold">Hardcore</span> – at the level of 15 lines.</li>
                          </ul>
                        </li>
                        <li>Press <strong className="text-green-400">&quot;Play&quot;</strong> button.</li>
                        <li>Your goal is to get through as many lines covers as possible.</li>
                        <li>In the menu, there is an option to enable <strong className="text-white">&quot;Space&quot;</strong> to spin & go...</li>
                        <li className="text-red-400 font-medium">Malfunction voids all pays and plays.</li>
                     </ol>
                   )}

                   {/* Provably Fair */}
                   {activeModal === 'provablyFair' && (
                     <div className="space-y-6">
                        <p className="text-gray-400 text-sm">This game uses Provably Fair technology to ensure all game results are unbiased and generated entirely randomly.</p>
                        
                        <div>
                          <label className="block text-gray-400 text-xs font-bold mb-2 uppercase tracking-widest">Next client (Your) seed:</label>
                          <div className="flex bg-[#1e2335] rounded-lg p-3 items-center border border-[#343b59] group hover:border-gray-500 transition-colors">
                            <input readOnly value="aa899705d2e8b06b" className="flex-1 bg-transparent text-white outline-none text-sm font-mono" />
                            <button className="text-gray-500 hover:text-white p-1 rounded hover:bg-[#343b59] transition-colors"><Copy className="w-4 h-4" /></button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-gray-400 text-xs font-bold mb-2 uppercase tracking-widest">Next server seed SHA256:</label>
                          <div className="flex bg-[#1e2335] rounded-lg p-3 items-center border border-[#343b59] group hover:border-gray-500 transition-colors">
                            <input readOnly value="5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8" className="flex-1 bg-transparent text-white outline-none text-sm font-mono truncate mr-3" />
                            <button className="text-gray-500 hover:text-white p-1 rounded hover:bg-[#343b59] transition-colors"><Copy className="w-4 h-4" /></button>
                          </div>
                        </div>

                        <p className="text-gray-500 text-xs text-center border-t border-[#343b59] pt-5 mt-6 italic">
                          You can check fairness of each bet from bets history
                        </p>
                     </div>
                   )}

                   {/* Game Rules */}
                   {activeModal === 'gameRules' && (
                     <div className="space-y-4">
                        <p className="text-gray-400 text-sm mb-6">Bet limits are presented below for standard operations.</p>
                        
                        <div className="bg-[#343b59] rounded-xl p-4 flex justify-between items-center shadow-inner border border-[#4b5580]/30">
                          <span className="text-gray-400 font-medium tracking-wide">Min bet</span>
                          <span className="text-white font-black text-lg">17 INR</span>
                        </div>
                        
                        <div className="bg-[#343b59] rounded-xl p-4 flex justify-between items-center shadow-inner border border-[#4b5580]/30">
                          <span className="text-gray-400 font-medium tracking-wide">Max bet</span>
                          <span className="text-white font-black text-lg">12 434 INR</span>
                        </div>

                        <div className="bg-[#343b59] rounded-xl p-4 flex justify-between items-center shadow-inner border border-[#4b5580]/30">
                          <span className="text-gray-400 font-medium tracking-wide">Max win</span>
                          <span className="text-green-400 font-black text-lg">867 830 INR</span>
                        </div>

                        <p className="text-gray-500 text-xs text-center mt-6 uppercase tracking-widest font-bold">
                          Malfunction voids all pays and plays
                        </p>
                     </div>
                   )}

                   {/* Bet History */}
                   {activeModal === 'betHistory' && (
                     <div className="space-y-4">
                        <div className="overflow-hidden rounded-xl border border-[#343b59] shadow-inner bg-[#1e2335]">
                          <table className="w-full text-sm text-left text-gray-400">
                            <thead className="text-xs uppercase bg-[#343b59] text-gray-300">
                              <tr>
                                <th className="px-4 py-4 font-bold">Date</th>
                                <th className="px-4 py-4 font-bold">Bet</th>
                                <th className="px-4 py-4 font-bold">Mult.</th>
                                <th className="px-4 py-4 font-bold text-right">Win</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#343b59]">
                              <tr>
                                <td colSpan={4} className="px-4 py-12 text-center text-gray-500 italic">No bets found in recent history.</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <button className="w-full bg-[#1e4620] hover:bg-[#2e6b30] text-green-400 font-black py-4 rounded-xl transition-colors mt-2 shadow-[0_0_15px_rgba(34,197,94,0.1)] tracking-widest">
                          LOAD MORE
                        </button>
                     </div>
                   )}

                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2. Middle Section */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative z-10">
          
          {/* Left Sidebar */}
          <aside className="w-full md:w-64 bg-[#23283c] border-r border-[#171a27] flex flex-col shrink-0 order-2 md:order-1 h-48 md:h-auto border-t md:border-t-0">
            <div className="p-4 border-b border-[#171a27]">
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-400 font-bold text-xs uppercase tracking-wider">Live wins:</span>
                <div className="flex items-center space-x-2 bg-[#1e2335] px-2 py-1 rounded-md">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]"></div>
                  <span className="text-gray-400 text-xs font-bold">Online: 2474</span>
                </div>
              </div>
              
              {/* Live Feed */}
              <div className="space-y-1.5 max-h-24 md:max-h-48 overflow-y-auto no-scrollbar">
                {[
                  { user: 9646, amount: 24.50 },
                  { user: 1234, amount: 50.00 },
                  { user: 5521, amount: 10.20 },
                  { user: 9812, amount: 100.50 },
                  { user: 4321, amount: 75.80 },
                ].map((win, i) => (
                  <div key={i} className="flex justify-between items-center text-xs bg-[#1e2335] px-3 py-2 rounded-md border border-[#2a3045]/50">
                    <span className="text-gray-400 font-mono">User{win.user}</span>
                    <span className="text-green-400 font-bold">+{sym}{win.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chicken Character (Sidebar Home) */}
            <div className="flex-1 p-4 hidden md:flex flex-col items-center justify-end relative">
               
               {/* Arched Doorway */}
               <div className="absolute bottom-8 w-40 h-48 bg-gradient-to-b from-black to-gray-900 rounded-t-full border-4 border-gray-800 shadow-[inset_0_20px_50px_rgba(0,0,0,0.8)] z-0 flex justify-center">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-20"></div>
                  <div className="absolute bottom-0 w-32 h-4 bg-black rounded-[100%] filter blur-sm"></div>
               </div>

               <div className="w-32 h-32 mb-12 flex items-center justify-center relative z-10">
                  {gameStatus === 'idle' && (
                    <motion.div 
                      key="chicken-home"
                      layoutId="chicken" 
                      className="z-30 bg-transparent border-none"
                      initial={{ opacity: 0, scale: 0.5 }}
                      transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    >
                      <img src="/chicken1.jpg" alt="Idle Chicken" className="w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-2xl z-20 transition-transform duration-500 rounded-full" />
                    </motion.div>
                  )}
               </div>
               {/* Shadow */}
               <div className="w-24 h-4 bg-black/40 rounded-[100%] blur-sm absolute bottom-10 z-0"></div>
            </div>
          </aside>

          {/* Main Game Board (10x5 Grid) */}
          <main className="flex-1 bg-[#2d3548] relative flex flex-col justify-center px-2 md:px-6 overflow-hidden order-1 md:order-2">
            
            {/* Atmospheric Background Glows */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px]"></div>
              <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[100px]"></div>
            </div>

            {/* Status Overlays */}
            <AnimatePresence>
              {gameStatus === 'crashed' && (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none">
                  <div className="bg-red-500/20 border border-red-500 p-8 rounded-3xl text-center shadow-[0_0_50px_rgba(239,68,68,0.3)]">
                    <h2 className="text-5xl font-black text-red-500 uppercase tracking-widest drop-shadow-lg mb-2">CRASHED!</h2>
                    <p className="text-gray-300 font-bold">You hit a fire trap.</p>
                  </div>
                </motion.div>
              )}
              {gameStatus === 'cashed_out' && (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none">
                  <div className="bg-green-500/20 border border-green-500 p-8 rounded-3xl text-center shadow-[0_0_50px_rgba(34,197,94,0.3)]">
                    <h2 className="text-5xl font-black text-green-500 uppercase tracking-widest drop-shadow-lg mb-2">WINNER!</h2>
                    <p className="text-gray-300 font-bold text-xl">+{sym} {formatCurrency(currentWin, activeCurrency)}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 10x5 Interactive Grid */}
            <motion.div 
              animate={gameStatus === 'crashed' ? { x: [-15, 15, -10, 10, -5, 5, 0] } : {}}
              transition={{ duration: 0.4 }}
              className="flex justify-between items-center w-full h-full max-w-5xl mx-auto py-6 md:py-10 z-10 relative"
            >
              
              {/* Highway Dashed Lines (Background) */}
              <div className="absolute inset-0 flex justify-between px-[5%] pointer-events-none opacity-20 z-0">
                 {[...Array(9)].map((_, i) => (
                    <div key={i} className="h-full border-r-4 border-dashed border-white/50"></div>
                 ))}
              </div>
              {[...Array(10)].map((_, colIdx) => (
                <div key={colIdx} className={`flex flex-col h-full w-[8%] max-w-[64px] transition-opacity duration-300 z-10 ${currentStep < colIdx && gameStatus === 'playing' ? 'opacity-40 pointer-events-none' : ''}`}>
                  
                  {/* Multiplier Label (Premium Circle) */}
                  <div className="flex-1 flex flex-col justify-start pt-10 items-center w-full">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#3d4665]/80 flex items-center justify-center shadow-[inset_0_0_20px_rgba(0,0,0,0.5),_0_0_15px_rgba(100,150,255,0.2)] relative border-2 border-[#54628f]">
                       <div className="absolute inset-1 rounded-full border border-[#7485c2]/30 pointer-events-none"></div>
                       <span className={`font-black text-sm md:text-lg drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] transition-colors ${currentStep >= colIdx && gameStatus !== 'idle' ? 'text-white' : 'text-gray-300'}`}>
                         {steps[colIdx].mult}x
                       </span>
                    </div>
                  </div>

                  {/* Single Grate at Bottom */}
                  <div className="h-24 md:h-32 w-full flex flex-col justify-end">
                    {[0].map((rowIdx) => {
                      const isRevealed = revealedGrates.find(g => g.col === colIdx && g.row === rowIdx);
                      const hasChicken = chickenPosition?.col === colIdx && chickenPosition?.row === rowIdx;
                      const isActiveCol = gameStatus === 'playing' && currentStep === colIdx;

                      return (
                        <button 
                          key={rowIdx}
                          onClick={() => handleGrateClick(colIdx, rowIdx)}
                          disabled={gameStatus !== 'playing' || colIdx !== currentStep}
                          className={`relative w-full h-[60%] rounded-t-full border-t-[3px] md:border-t-4 border-l-[3px] md:border-l-4 border-r-[3px] md:border-r-4 flex flex-col items-center justify-end pb-2 md:pb-3 transition-all duration-300 overflow-visible
                            ${isActiveCol 
                                ? 'bg-[#3d456b] border-[#4b5580] hover:brightness-125 shadow-[0_-5px_20px_rgba(96,165,250,0.2)] cursor-pointer' 
                                : 'bg-[#2a3045] border-[#1f2436] shadow-[inset_0_-10px_20px_rgba(0,0,0,0.6)]'
                            }
                            ${isRevealed?.type === 'fire' ? 'bg-red-900/80 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)]' : ''}
                            ${isRevealed?.type === 'safe' ? 'bg-green-900/60 border-green-500' : ''}
                          `}
                        >
                          {/* Fire Vent / Grill */}
                          <div className="flex justify-center items-end space-x-[2px] md:space-x-1 z-0 w-full px-2 md:px-4">
                            {[...Array(5)].map((_, i) => (
                              <div key={i} className="flex-1 h-6 md:h-10 bg-[#12151e] rounded-t-full shadow-[inset_0_2px_5px_rgba(0,0,0,0.8)]"></div>
                            ))}
                          </div>
                          
                          <AnimatePresence>
                            {hasChicken && (
                              <motion.div 
                                key="chicken"
                                layoutId="chicken"
                                className="absolute -top-10 md:-top-16 z-30 flex justify-center w-full bg-transparent border-none"
                                transition={{ type: "spring", stiffness: 350, damping: 30 }}
                              >
                                <motion.div
                                  initial={{ y: -60, scale: 1.3 }}
                                  animate={{ y: 0, scale: 1 }}
                                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                                >
                                  {gameStatus === 'crashed' ? (
                                    <img src="/chicken3.jpg" alt="Roasted Chicken" className="w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-[0_0_15px_rgba(255,0,0,0.8)] z-10 transition-transform duration-500 rounded-full" />
                                  ) : (
                                    <img src="/chicken2.jpg" alt="Hopping Chicken" className="w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-2xl z-20 transition-transform duration-500 rounded-full" />
                                  )}
                                </motion.div>
                              </motion.div>
                            )}
                            
                            {isRevealed?.type === 'safe' && hasChicken && (
                               <motion.div 
                                 key="safe"
                                 initial={{ opacity: 1, scale: 0 }}
                                 animate={{ opacity: 0, scale: 2 }}
                                 transition={{ duration: 0.5 }}
                                 className="absolute inset-0 bg-yellow-400 rounded-[2rem] filter blur-md mix-blend-screen pointer-events-none z-10"
                               ></motion.div>
                            )}

                            {isRevealed?.type === 'fire' && (
                               <motion.div 
                                 key="fire"
                                 initial={{ scaleY: 0, opacity: 0 }} 
                                 animate={{ scaleY: 1.5, scaleX: 1.3, opacity: 1 }} 
                                 transition={{ duration: 0.4, ease: "easeOut" }}
                                 className="absolute bottom-4 z-40 text-5xl md:text-7xl filter drop-shadow-[0_0_30px_rgba(239,68,68,1)] origin-bottom"
                               >
                                 🔥
                               </motion.div>
                            )}
                          </AnimatePresence>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </motion.div>
          </main>

        </div>

        {/* 3. Bottom Control Panel */}
        <footer className="h-auto md:h-32 bg-[#171a27] border-t border-gray-800 flex flex-col md:flex-row shrink-0 divide-y md:divide-y-0 md:divide-x divide-gray-800 relative z-20">
          
          {/* Left Zone (Betting) */}
          <div className={`flex-1 p-4 flex flex-col justify-center px-6 md:px-8 transition-opacity duration-300 ${isPlaying ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex bg-[#1e2335] border border-[#343b59] rounded-lg overflow-hidden h-12 mb-3">
              <button className="px-3 md:px-4 text-gray-500 font-bold text-xs hover:bg-[#23283c] transition-colors" onClick={() => setBetAmount(10)}>MIN</button>
              <input 
                type="number" 
                value={betAmount} 
                onChange={(e) => setBetAmount(e.target.value ? Number(e.target.value) : "")}
                className="flex-1 bg-transparent text-center text-white font-bold text-lg outline-none w-full min-w-0"
                disabled={isPlaying}
              />
              <button className="px-3 md:px-4 text-gray-500 font-bold text-xs hover:bg-[#23283c] transition-colors" onClick={() => setBetAmount(10000)}>MAX</button>
            </div>
            <div className="flex space-x-2">
              {[20, 50, 100, 500].map(amt => (
                <button 
                  key={amt} 
                  onClick={() => setBetAmount(amt)}
                  disabled={isPlaying}
                  className="flex-1 bg-[#343b59] hover:bg-[#4b5580] text-gray-300 text-xs md:text-sm font-bold py-2 rounded-md transition-colors border border-[#4b5580]/50"
                >
                  {amt} {sym}
                </button>
              ))}
            </div>
          </div>

          {/* Center Zone (Difficulty) */}
          <div className={`flex-[1.5] p-4 flex flex-col justify-center items-center px-6 md:px-8 bg-[#1a1e2d] md:bg-transparent transition-opacity duration-300 ${isPlaying ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex justify-between w-full text-xs font-bold mb-3">
              <span className="text-gray-400 uppercase tracking-wider">Difficulty</span>
              <span className="text-gray-500 hidden sm:inline">Chance of collision</span>
            </div>
            
            <div className="w-full flex bg-[#1e2335] rounded-xl p-1.5 border border-[#2a3045] shadow-inner">
              {["Easy", "Medium", "Hard", "Hardcore"].map(diff => (
                <button 
                  key={diff}
                  onClick={() => setDifficulty(diff)}
                  disabled={isPlaying}
                  className={`flex-1 py-2.5 text-xs md:text-sm font-black uppercase tracking-wider rounded-lg transition-all ${
                    difficulty === diff 
                      ? 'bg-[#343b59] text-white shadow-md border border-[#4b5580]' 
                      : 'text-gray-500 hover:text-gray-300 hover:bg-[#23283c]/50 border border-transparent'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Right Zone (Actions) */}
          <div className="flex-1 p-4 flex items-center justify-center md:justify-end space-x-4 px-6 md:px-8">
            <button className={`w-14 h-14 md:w-16 md:h-16 bg-[#343b59] rounded-xl flex items-center justify-center transition-colors shadow-lg border border-[#4b5580]/50 shrink-0 ${isPlaying ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#4b5580]'}`} disabled={isPlaying}>
              <RefreshCw className="w-5 h-5 md:w-6 md:h-6 text-gray-400" />
            </button>
            
            {gameStatus !== 'playing' ? (
              <button 
                onClick={handlePlay}
                className="flex-1 md:flex-none md:w-48 h-14 md:h-16 bg-[#2ecc71] hover:bg-[#27ae60] rounded-xl text-white text-xl md:text-2xl font-black shadow-[0_0_20px_rgba(46,204,113,0.2)] hover:shadow-[0_0_30px_rgba(46,204,113,0.4)] transition-all active:scale-95 flex items-center justify-center uppercase tracking-wider"
              >
                Play
              </button>
            ) : (
              <div className="flex flex-1 md:flex-none space-x-3">
                <button 
                  onClick={() => handleCashout()}
                  className="flex-1 md:w-32 h-14 md:h-16 bg-yellow-500 hover:bg-yellow-400 rounded-xl text-yellow-950 text-sm md:text-base font-black shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-all active:scale-95 flex flex-col items-center justify-center uppercase leading-tight border border-yellow-300"
                >
                  <span>Cashout</span>
                  <span className="text-[10px] md:text-xs font-bold">{sym} {formatCurrency(currentWin, activeCurrency)}</span>
                </button>
                <button 
                  onClick={() => {
                     // Pick a random row
                     const randomRow = Math.floor(Math.random() * 5);
                     handleGrateClick(currentStep, randomRow);
                  }}
                  className="flex-1 md:w-32 h-14 md:h-16 bg-[#2ecc71] hover:bg-[#27ae60] rounded-xl text-white text-lg md:text-xl font-black shadow-[0_0_20px_rgba(46,204,113,0.2)] hover:shadow-[0_0_30px_rgba(46,204,113,0.4)] transition-all active:scale-95 flex items-center justify-center uppercase tracking-wider border border-[#2ecc71]"
                >
                  GO
                </button>
              </div>
            )}
          </div>

        </footer>
      </div>
    </div>
  );
}
