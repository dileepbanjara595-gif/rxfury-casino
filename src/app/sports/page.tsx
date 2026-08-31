"use client";
import { useState, useEffect } from "react";
import io, { Socket } from "socket.io-client";
import { Search, Trophy, Clock, Lock, RefreshCw, Loader2 } from "lucide-react";
import { useUserStore } from "@/store/userStore";
import { useCurrencyStore, convertFromBase, formatCurrency } from "@/store/currencyStore";

const MOCK_MATCHES = [
  { betradarId: 'mock-c1', sport: 'Cricket', title: 'India vs Australia', odds: { '1': { back: 1.85, lay: 1.87 }, 'X': { back: 12.0, lay: 13.5 }, '2': { back: 2.10, lay: 2.12 } } },
  { betradarId: 'mock-c2', sport: 'Cricket', title: 'England vs Pakistan', odds: { '1': { back: 1.50, lay: 1.52 }, 'X': { back: 15.0, lay: 16.0 }, '2': { back: 2.80, lay: 2.84 } } },
  { betradarId: 'mock-f1', sport: 'Football', title: 'Real Madrid vs Barcelona', odds: { '1': { back: 2.30, lay: 2.32 }, 'X': { back: 3.40, lay: 3.45 }, '2': { back: 2.90, lay: 2.94 } } },
  { betradarId: 'mock-f2', sport: 'Football', title: 'Manchester City vs Arsenal', odds: { '1': { back: 1.95, lay: 1.97 }, 'X': { back: 3.60, lay: 3.65 }, '2': { back: 3.80, lay: 3.85 } } },
  { betradarId: 'mock-t1', sport: 'Tennis', title: 'N. Djokovic vs C. Alcaraz', odds: { '1': { back: 1.70, lay: 1.72 }, 'X': { back: 0.00, lay: 0.00 }, '2': { back: 2.20, lay: 2.22 } } },
];

export default function SportsPage() {
  const { session } = useUserStore();
  const { activeCurrency, baseBalance } = useCurrencyStore();
  const walletBalance = convertFromBase(baseBalance, activeCurrency);

  const [socket, setSocket] = useState<Socket | null>(null);
  const [oddsData, setOddsData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("Cricket");
  const [betSlip, setBetSlip] = useState<any>(null);
  const [stakeAmount, setStakeAmount] = useState(100);
  const [betStatus, setBetStatus] = useState<string | null>(null);
  
  // New States for loading & fallbacks
  const [isLoading, setIsLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setIsLoading(true);
    setUseFallback(false);

    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || (typeof window !== "undefined" ? window.location.origin : ""), {
      transports: ["websocket"],
    });
    setSocket(socketInstance);

    socketInstance.emit("sports:join");
    
    let receivedData = false;

    socketInstance.on("sports:odds", (data: any[]) => {
       if (data && data.length > 0) {
          receivedData = true;
          setOddsData(data);
          setIsLoading(false);
          setUseFallback(false);
       }
    });

    // Fallback timer: if no data received in 4 seconds, deploy mock data
    const fallbackTimer = setTimeout(() => {
       if (!receivedData) {
          setIsLoading(false);
          setUseFallback(true);
       }
    }, 4000);

    return () => {
      clearTimeout(fallbackTimer);
      socketInstance.emit("sports:leave");
      socketInstance.disconnect();
    };
  }, [retryCount]);

  const handlePlaceBet = async () => {
     if (!betSlip || !session?.user?.id) return;
     setBetStatus("Placing bet...");
     
     try {
        const res = await fetch('/api/sports/bet', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
              matchId: betSlip.matchId,
              selection: betSlip.selection,
              odds: betSlip.odds,
              stake: stakeAmount,
              sport: betSlip.sport,
              title: betSlip.title
           })
        });
        const data = await res.json();
        if (data.success) {
           setBetStatus("Bet placed successfully!");
           setTimeout(() => { setBetSlip(null); setBetStatus(null); }, 2000);
        } else {
           setBetStatus(data.error || "Bet failed");
        }
     } catch (e) {
        setBetStatus("Network error");
     }
  };

  const handleRetry = () => {
     setRetryCount(prev => prev + 1);
  };

  const displayMatches = useFallback ? MOCK_MATCHES : oddsData;
  const filteredMatches = displayMatches.filter(m => m.sport === activeTab);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-200 font-sans pb-24">
       {/* Header */}
       <header className="bg-[#11111a] border-b border-[#1f1f2e] p-4 sticky top-[60px] z-20 shadow-md">
         <div className="max-w-7xl mx-auto flex justify-between items-center">
            <h1 className="text-xl font-black text-white flex items-center tracking-widest uppercase">
              <Trophy className="w-5 h-5 text-blue-500 mr-2" /> Exchange
            </h1>
            <div className="font-mono font-bold text-emerald-400">
               Balance: {formatCurrency(walletBalance, activeCurrency)}
            </div>
         </div>
       </header>

       {/* Tabs */}
       <div className="bg-[#11111a] border-b border-[#1f1f2e] sticky top-[125px] z-10 shadow-sm">
         <div className="max-w-7xl mx-auto flex space-x-6 px-4 overflow-x-auto no-scrollbar items-center">
            {['Cricket', 'Football', 'Tennis'].map(tab => (
               <button 
                 key={tab} 
                 onClick={() => setActiveTab(tab)}
                 className={`py-3 font-bold uppercase text-sm tracking-wider border-b-2 whitespace-nowrap transition-colors ${activeTab === tab ? 'text-blue-500 border-blue-500' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
               >
                 {tab}
               </button>
            ))}
            <div className="flex-1"></div>
            <button onClick={handleRetry} className="flex items-center text-xs font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-widest">
               <RefreshCw className={`w-3 h-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
            </button>
         </div>
       </div>

       {/* Network Notice */}
       {useFallback && !isLoading && (
          <div className="max-w-7xl mx-auto px-4 pt-4">
             <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 p-3 rounded-lg text-xs font-bold flex items-center uppercase tracking-widest">
                <Clock className="w-4 h-4 mr-2" />
                LiveFeed API disconnected. Displaying simulated mock data.
             </div>
          </div>
       )}

       {/* Matches */}
       <div className="max-w-7xl mx-auto p-4 flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-4">
             {isLoading ? (
                <div className="bg-[#11111a] border border-[#1f1f2e] p-16 rounded-xl flex flex-col items-center justify-center text-gray-400">
                   <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                   <p className="font-bold uppercase tracking-widest text-sm animate-pulse">Syncing Live Markets...</p>
                </div>
             ) : filteredMatches.length === 0 ? (
                <div className="bg-[#11111a] border border-[#1f1f2e] p-12 rounded-xl text-center text-gray-500 font-bold uppercase">
                   No Live Matches Found for {activeTab}
                </div>
             ) : (
                filteredMatches.map(match => (
                   <div key={match.betradarId} className="bg-[#11111a] border border-[#1f1f2e] rounded-xl overflow-hidden hover:border-[#2f2f3e] transition-colors shadow-lg">
                      <div className="bg-[#181824] px-4 py-2 border-b border-[#1f1f2e] flex justify-between items-center">
                         <div className="flex items-center text-xs font-bold text-gray-400 uppercase tracking-wider">
                           <Clock className="w-3 h-3 text-red-500 animate-pulse mr-1.5" /> LIVE
                         </div>
                         <div className="text-xs font-mono text-gray-500">ID: {match.betradarId}</div>
                      </div>
                      
                      <div className="p-4 flex flex-col lg:flex-row justify-between items-center gap-4">
                         <div className="flex-1 w-full font-bold text-lg text-white">
                           {match.title}
                         </div>

                         {/* Odds Grid */}
                         <div className="flex gap-2">
                           {/* 1 */}
                           <div className="flex flex-col items-center">
                             <span className="text-[10px] text-gray-500 font-bold uppercase mb-1">1</span>
                             <div className="flex gap-1">
                               <button 
                                 onClick={() => setBetSlip({ matchId: match.betradarId, title: match.title, sport: match.sport, selection: '1', odds: match.odds['1'].back })}
                                 className="w-14 h-10 bg-[#72bbef] hover:bg-[#5aaae6] text-black font-bold flex flex-col items-center justify-center rounded-sm transition-colors"
                               >
                                 <span className="text-sm">{match.odds['1']?.back || '-'}</span>
                               </button>
                               <button className="w-14 h-10 bg-[#faa9ba] text-black font-bold flex flex-col items-center justify-center rounded-sm opacity-80 cursor-not-allowed">
                                 <span className="text-sm">{match.odds['1']?.lay || '-'}</span>
                               </button>
                             </div>
                           </div>
                           
                           {/* X */}
                           <div className="flex flex-col items-center">
                             <span className="text-[10px] text-gray-500 font-bold uppercase mb-1">X</span>
                             <div className="flex gap-1">
                               <button 
                                 onClick={() => setBetSlip({ matchId: match.betradarId, title: match.title, sport: match.sport, selection: 'X', odds: match.odds['X'].back })}
                                 disabled={match.sport === 'Tennis' || match.odds['X']?.back === 0}
                                 className="w-14 h-10 bg-[#72bbef] hover:bg-[#5aaae6] text-black font-bold flex flex-col items-center justify-center rounded-sm transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                               >
                                 <span className="text-sm">{match.odds['X']?.back || '-'}</span>
                               </button>
                               <button className="w-14 h-10 bg-[#faa9ba] text-black font-bold flex flex-col items-center justify-center rounded-sm opacity-80 cursor-not-allowed disabled:opacity-20" disabled={match.sport === 'Tennis' || match.odds['X']?.lay === 0}>
                                 <span className="text-sm">{match.odds['X']?.lay || '-'}</span>
                               </button>
                             </div>
                           </div>

                           {/* 2 */}
                           <div className="flex flex-col items-center">
                             <span className="text-[10px] text-gray-500 font-bold uppercase mb-1">2</span>
                             <div className="flex gap-1">
                               <button 
                                 onClick={() => setBetSlip({ matchId: match.betradarId, title: match.title, sport: match.sport, selection: '2', odds: match.odds['2'].back })}
                                 className="w-14 h-10 bg-[#72bbef] hover:bg-[#5aaae6] text-black font-bold flex flex-col items-center justify-center rounded-sm transition-colors"
                               >
                                 <span className="text-sm">{match.odds['2']?.back || '-'}</span>
                               </button>
                               <button className="w-14 h-10 bg-[#faa9ba] text-black font-bold flex flex-col items-center justify-center rounded-sm opacity-80 cursor-not-allowed">
                                 <span className="text-sm">{match.odds['2']?.lay || '-'}</span>
                               </button>
                             </div>
                           </div>
                         </div>
                      </div>
                   </div>
                ))
             )}
          </div>

          {/* BetSlip */}
          <div className="w-full md:w-80 shrink-0">
             <div className="bg-[#11111a] border border-[#1f1f2e] rounded-xl shadow-2xl sticky top-[190px]">
                <div className="bg-[#181824] p-4 border-b border-[#1f1f2e] rounded-t-xl flex justify-between items-center">
                   <h2 className="font-bold text-white uppercase tracking-wider text-sm">Bet Slip</h2>
                   {betSlip && (
                     <button onClick={() => setBetSlip(null)} className="text-xs text-gray-500 hover:text-red-400">CLEAR</button>
                   )}
                </div>
                
                <div className="p-4">
                   {!betSlip ? (
                      <p className="text-sm text-gray-500 text-center py-8">Click on odds to add to betslip.</p>
                   ) : (
                      <div className="space-y-4">
                         <div>
                            <p className="text-xs text-blue-500 font-bold uppercase">{betSlip.sport}</p>
                            <p className="font-bold text-white leading-tight mt-1">{betSlip.title}</p>
                            <div className="flex justify-between mt-3 bg-gray-800/50 p-2 rounded text-sm">
                               <span className="text-gray-400">Selection:</span>
                               <span className="font-bold text-white">{betSlip.selection}</span>
                            </div>
                            <div className="flex justify-between mt-1 bg-gray-800/50 p-2 rounded text-sm">
                               <span className="text-gray-400">Odds:</span>
                               <span className="font-black text-blue-400">{betSlip.odds}</span>
                            </div>
                         </div>
                         
                         <div>
                            <label className="text-xs text-gray-500 font-bold uppercase mb-2 block">Stake</label>
                            <input 
                              type="number" 
                              value={stakeAmount}
                              onChange={(e) => setStakeAmount(Number(e.target.value))}
                              className="w-full bg-[#181824] border border-[#2f2f3e] rounded p-2 text-white font-mono outline-none focus:border-blue-500 transition-colors"
                            />
                         </div>

                         <div className="flex justify-between text-sm pt-2 border-t border-gray-800">
                            <span className="text-gray-400 font-medium">To Return:</span>
                            <span className="font-black text-emerald-400">{(stakeAmount * betSlip.odds).toFixed(2)}</span>
                         </div>

                         <button 
                           onClick={handlePlaceBet}
                           disabled={!!betStatus && betStatus === "Placing bet..."}
                           className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-wider rounded-lg shadow-lg transition-colors disabled:opacity-50"
                         >
                           {betStatus || "Place Bet"}
                         </button>

                         {betStatus && <p className={`text-xs text-center font-bold ${betStatus.includes("success") ? 'text-green-400' : 'text-red-400'}`}>{betStatus}</p>}
                      </div>
                   )}
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}
