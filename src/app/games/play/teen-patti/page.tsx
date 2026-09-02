"use client";

import { useCurrencyStore, convertFromBase, convertToBase } from '@/store/currencyStore';
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Clock, History, XCircle, Plus, Minus, Info } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useUserStore } from "@/store/userStore";
import io, { Socket } from "socket.io-client";

export default function TeenPattiLivePage() {
  const [mounted, setMounted] = useState(false);
  const { session } = useUserStore();
  
  const { activeCurrency, baseBalance } = useCurrencyStore();
  const walletBalance = convertFromBase(baseBalance, activeCurrency);

  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"table" | "history">("table");

  useEffect(() => {
    setMounted(true);

    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || (typeof window !== "undefined" ? window.location.origin : ""), {
      transports: ["websocket"],
      reconnectionAttempts: 5,
    });
    setSocket(socketInstance);

    const uid = session?.user?.id || 'guest-' + Math.floor(Math.random()*1000);
    const uname = session?.user?.email?.split('@')[0] || 'Guest';

    socketInstance.emit("teen-patti:join", {
      id: uid,
      name: uname,
      avatar: session?.user?.profilePhoto || 'https://i.pravatar.cc/150?u='+uid,
      balance: walletBalance
    });

    socketInstance.on("game:teen-patti:state", (state: any) => {
      setGameState(state);
    });

    socketInstance.emit("teen-patti:history");
    socketInstance.on("game:teen-patti:history", (hist: any) => {
      setHistory(hist);
    });

    return () => {
      socketInstance.emit("teen-patti:leave", uid);
      socketInstance.disconnect();
    };
  }, [session, walletBalance]);

  if (!mounted) {
    return <div className="min-h-screen bg-[#0F1923] flex items-center justify-center"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const uid = session?.user?.id || '';
  const mySeat = gameState?.seats?.find((s: any) => s && s.id === uid);
  const isMyTurn = mySeat && gameState.currentTurnIdx === mySeat.seatIndex;

  const handleAction = (action: string) => {
    if (socket && isMyTurn) {
      socket.emit("teen-patti:action", { action, userId: uid });
    }
  };

  const getSuitIcon = (suit: string) => {
    switch(suit) {
      case 'hearts': return '♥';
      case 'diamonds': return '♦';
      case 'clubs': return '♣';
      case 'spades': return '♠';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0f14] via-[#2c131a] to-[#0f1923] text-gray-100 font-sans flex flex-col overflow-x-hidden">
      
      {/* Header */}
      <header className="h-[72px] bg-[#1C2A36]/80 backdrop-blur-md border-b border-[#2A3B4C] p-4 flex items-center justify-between shadow-lg z-20 shrink-0">
        <div className="flex items-center space-x-4">
          <Link href="/games" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-black text-amber-500 uppercase tracking-widest">Live Teen Patti</h1>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={() => setActiveTab('table')} className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'table' ? 'bg-amber-600 text-white' : 'bg-gray-800 text-gray-400'}`}>Table</button>
          <button onClick={() => setActiveTab('history')} className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'history' ? 'bg-amber-600 text-white' : 'bg-gray-800 text-gray-400'}`}>History</button>
        </div>
      </header>

      {activeTab === 'table' ? (
        <main className="flex-grow relative flex flex-col items-center p-4">
          
          <div className="mb-4 text-center">
             <div className="inline-block bg-black/50 border border-amber-500/30 px-6 py-2 rounded-full">
                <span className="text-amber-500 font-bold uppercase tracking-widest text-sm mr-3">Pot</span>
                <span className="text-white font-mono font-black text-xl">,1{gameState?.pot || 0}</span>
             </div>
             <div className="mt-2 text-xs text-gray-400 uppercase tracking-wider">
               State: <span className="text-white font-bold">{gameState?.state || 'CONNECTING...'}</span>
               {gameState?.state !== 'WAITING' && <span className="ml-2 text-amber-400">00:{gameState?.countdown?.toString().padStart(2, '0')}</span>}
             </div>
          </div>

          {/* Oval Table */}
          <div className="relative w-full max-w-4xl aspect-[2/1] mt-8">
            <div className="absolute inset-0 bg-emerald-800/80 rounded-[200px] border-[15px] border-amber-900 shadow-[inset_0_0_50px_rgba(0,0,0,0.8),0_0_50px_rgba(0,0,0,0.5)]">
               <div className="absolute inset-0 border border-emerald-500/20 rounded-[200px] m-4 pointer-events-none"></div>
            </div>

            {/* Seats */}
            {gameState?.seats?.map((seat: any, i: number) => {
              if (!seat) return null;
              
              const isCurrent = gameState.currentTurnIdx === seat.seatIndex;
              const isMe = seat.id === uid;
              
              // Oval positioning maths
              const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
              const rx = 40; // x radius %
              const ry = 40; // y radius %
              const top = 50 + ry * Math.sin(angle);
              const left = 50 + rx * Math.cos(angle);

              return (
                <div key={seat.id} className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center" style={{ top: `${top}%`, left: `${left}%` }}>
                  <div className={`relative w-16 h-16 rounded-full border-4 ${isCurrent ? 'border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.6)] animate-pulse' : seat.packed ? 'border-red-900 opacity-50' : 'border-gray-600'}`}>
                    <img src={seat.avatar} alt="avatar" className="w-full h-full rounded-full object-cover" />
                    {seat.packed && <div className="absolute inset-0 bg-red-900/60 rounded-full flex items-center justify-center"><XCircle className="text-white w-6 h-6"/></div>}
                  </div>
                  <div className="mt-2 bg-black/80 px-2 py-1 rounded text-xs text-center border border-gray-800 min-w-[80px]">
                    <div className="font-bold text-white truncate">{isMe ? 'You' : seat.name}</div>
                    <div className="text-amber-400 font-mono">,1{seat.balance}</div>
                  </div>

                  {/* Cards */}
                  {!seat.packed && seat.state === 'PLAYING' && (
                    <div className="flex -space-x-4 mt-2">
                       {seat.cards?.length > 0 ? seat.cards.map((c: any, cidx: number) => (
                         <div key={cidx} className={`w-8 h-12 bg-white rounded flex items-center justify-center font-bold text-xs shadow-md border border-gray-300 ${c.color}`}>
                           {c.value}{getSuitIcon(c.suit)}
                         </div>
                       )) : (
                         [1,2,3].map(cidx => (
                           <div key={cidx} className="w-8 h-12 bg-blue-900 rounded border border-blue-400/50 shadow-md flex items-center justify-center">
                             <div className="w-6 h-10 border border-blue-400/20 rounded-sm bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                           </div>
                         ))
                       )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Controls */}
          {mySeat && !mySeat.packed && mySeat.state === 'PLAYING' && (
             <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/90 border-t border-gray-800 flex justify-center gap-4 z-30">
               <button 
                 onClick={() => handleAction('PACK')}
                 disabled={!isMyTurn}
                 className="px-6 py-3 bg-red-900/50 text-red-400 border border-red-500/50 rounded-xl font-bold uppercase hover:bg-red-900 disabled:opacity-50"
               >
                 Pack
               </button>
               <button 
                 onClick={() => handleAction('CHAAL')}
                 disabled={!isMyTurn}
                 className="px-10 py-3 bg-amber-600 text-white border border-amber-400 rounded-xl font-bold uppercase tracking-widest hover:bg-amber-500 disabled:opacity-50 shadow-[0_0_20px_rgba(217,119,6,0.5)]"
               >
                 Chaal (,1{gameState.pot > 0 ? 100 : 100})
               </button>
             </div>
          )}

        </main>
      ) : (
        <main className="flex-grow p-4 md:p-8 max-w-4xl mx-auto w-full">
           <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-6 flex items-center">
             <History className="w-6 h-6 mr-3 text-amber-500" />
             Match History
           </h2>
           <div className="bg-[#11111a] border border-[#1f1f2e] rounded-xl overflow-hidden">
             <table className="w-full text-left text-sm">
               <thead className="bg-[#0a0a0f] text-gray-500 uppercase text-xs border-b border-[#1f1f2e]">
                 <tr>
                   <th className="px-6 py-4">Room ID</th>
                   <th className="px-6 py-4">Winner</th>
                   <th className="px-6 py-4 text-right">Pot Size</th>
                   <th className="px-6 py-4 text-right">Time</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-[#1f1f2e]">
                 {history.length > 0 ? history.map((h, i) => (
                   <tr key={i} className="hover:bg-[#161622]">
                     <td className="px-6 py-4 font-mono text-gray-400">{h.roomId}</td>
                     <td className="px-6 py-4 font-bold text-amber-400">{h.winnerName}</td>
                     <td className="px-6 py-4 text-right font-mono font-bold text-emerald-400">,1{h.potAmount}</td>
                     <td className="px-6 py-4 text-right text-gray-500">{new Date(h.timestamp).toLocaleTimeString()}</td>
                   </tr>
                 )) : (
                   <tr>
                     <td colSpan={4} className="px-6 py-12 text-center text-gray-500">No recent history available.</td>
                   </tr>
                 )}
               </tbody>
             </table>
           </div>
        </main>
      )}
    </div>
  );
}
