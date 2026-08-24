"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  History, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  ArrowLeft,
  Calendar,
  Gamepad2
} from "lucide-react";
import Link from "next/link";

// --- MOCK DATA GENERATION ---
const GAMES = ["Aviator", "K3 Lottery", "Mines", "Teen Patti", "Texas Hold'em", "Chicken Road", "Bridge"];
const STATUSES = ["WON", "LOST"];

interface SessionRecord {
  id: string;
  date: string;
  game: string;
  bet: number;
  multiplier: number;
  payout: number;
  status: "WON" | "LOST";
}

const generateMockData = (): SessionRecord[] => {
  const data: SessionRecord[] = [];
  const baseDate = new Date("2026-08-22T00:00:00Z");

  for (let i = 1; i <= 500; i++) {
    const game = GAMES[Math.floor(Math.random() * GAMES.length)];
    const status = STATUSES[Math.floor(Math.random() * STATUSES.length)] as "WON" | "LOST";
    const bet = [50, 100, 200, 500, 1000, 5000][Math.floor(Math.random() * 6)];
    let multiplier = 0;
    let payout = 0;

    if (status === "WON") {
      multiplier = Number((1.5 + Math.random() * 3).toFixed(2));
      payout = Number((bet * multiplier).toFixed(2));
    } else {
      multiplier = 0;
      payout = -bet;
    }

    const recDate = new Date(baseDate.getTime() - i * 45 * 60000); // subtract 45 mins per record

    data.push({
      id: `#SES-${100000 + i}`,
      date: recDate.toLocaleString('en-GB', { 
        day: '2-digit', month: 'short', year: 'numeric', 
        hour: '2-digit', minute:'2-digit' 
      }),
      game,
      bet,
      multiplier,
      payout,
      status,
    });
  }
  return data;
};

const ALL_DATA = generateMockData();

export default function HistoryPage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Filters
  const [selectedGame, setSelectedGame] = useState("All Games");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedPeriod, setSelectedPeriod] = useState("All Time"); // UI only mock for now
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter Logic
  const filteredData = useMemo(() => {
    return ALL_DATA.filter(item => {
      const matchGame = selectedGame === "All Games" || item.game === selectedGame;
      const matchStatus = selectedStatus === "All" || item.status === selectedStatus;
      return matchGame && matchStatus;
    });
  }, [selectedGame, selectedStatus]);

  // Pagination Logic
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // Reset to page 1 if filter changes
  useMemo(() => {
    setCurrentPage(1);
  }, [selectedGame, selectedStatus]);

  const currentData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages - 1, totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, 2, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  if (!isMounted) {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-blue-500/30 pb-12">
      
      {/* Header */}
      <header className="bg-[#0a0f16] border-b border-[#1f2937] px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-blue-500" />
            <h1 className="text-lg md:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 uppercase tracking-widest">
              Betting & Session History
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-8 space-y-6">

        {/* --- FILTERS SECTION --- */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 md:p-6 shadow-lg flex flex-col lg:flex-row gap-4 items-end lg:items-center justify-between">
          
          <div className="flex items-center gap-2 text-gray-400 shrink-0 w-full lg:w-auto pb-2 lg:pb-0 border-b border-gray-800 lg:border-none">
            <Filter className="w-5 h-5" />
            <span className="font-bold uppercase tracking-wider text-sm">Filters</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            
            {/* Game Filter */}
            <div className="flex flex-col">
              <label className="text-xs text-gray-500 font-bold uppercase mb-1 flex items-center gap-1"><Gamepad2 className="w-3 h-3"/> Game Type</label>
              <select 
                value={selectedGame}
                onChange={(e) => setSelectedGame(e.target.value)}
                className="bg-[#050914] border border-gray-700 rounded-lg py-2.5 px-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option>All Games</option>
                {GAMES.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex flex-col">
              <label className="text-xs text-gray-500 font-bold uppercase mb-1">Status</label>
              <select 
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-[#050914] border border-gray-700 rounded-lg py-2.5 px-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option>All</option>
                <option>WON</option>
                <option>LOST</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div className="flex flex-col">
              <label className="text-xs text-gray-500 font-bold uppercase mb-1 flex items-center gap-1"><Calendar className="w-3 h-3"/> Period</label>
              <select 
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-[#050914] border border-gray-700 rounded-lg py-2.5 px-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option>All Time</option>
                <option>Today</option>
                <option>Last 7 Days</option>
                <option>This Month</option>
              </select>
            </div>

          </div>
        </div>

        {/* --- DATA TABLE --- */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-xl overflow-hidden flex flex-col min-h-[600px]">
          
          <div className="overflow-x-auto flex-grow">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-[#0a0f16] border-b border-gray-800 text-xs font-bold uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-6 py-5 whitespace-nowrap">Date & Time</th>
                  <th className="px-6 py-5">Session ID</th>
                  <th className="px-6 py-5">Game</th>
                  <th className="px-6 py-5 text-right">Bet Amount</th>
                  <th className="px-6 py-5 text-center">Multiplier</th>
                  <th className="px-6 py-5 text-right">Payout / Profit</th>
                  <th className="px-6 py-5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {currentData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center text-gray-500 font-medium">
                      No records found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  currentData.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-800/40 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-xs">{row.date}</td>
                      <td className="px-6 py-4 font-mono font-bold text-gray-500 group-hover:text-blue-400 transition-colors text-xs">{row.id}</td>
                      <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
                        <div className="w-6 h-6 bg-gray-800 rounded flex items-center justify-center shrink-0">
                          <Gamepad2 className="w-3 h-3 text-gray-400" />
                        </div>
                        {row.game}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-medium text-gray-300">
                        ₹{row.bet.toLocaleString('en-IN', {minimumFractionDigits: 2})}
                      </td>
                      <td className="px-6 py-4 text-center font-mono text-gray-500">
                        {row.status === 'WON' ? `${row.multiplier}x` : '-'}
                      </td>
                      <td className={`px-6 py-4 text-right font-mono font-bold ${row.status === 'WON' ? 'text-emerald-400' : 'text-red-400/80'}`}>
                        {row.status === 'WON' ? '+' : ''}₹{row.payout.toLocaleString('en-IN', {minimumFractionDigits: 2})}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${
                          row.status === 'WON' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
                            : 'bg-red-500/10 text-red-500/80 border-red-500/20'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* --- PAGINATION SYSTEM --- */}
          {totalPages > 0 && (
            <div className="bg-[#0a0f16] border-t border-gray-800 px-4 md:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 mt-auto">
              
              <div className="text-xs text-gray-500 font-medium">
                Showing <span className="font-bold text-gray-300">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-gray-300">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of <span className="font-bold text-gray-300">{totalItems}</span> records
              </div>

              <div className="flex items-center space-x-1">
                
                {/* First Page */}
                <button 
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded hover:bg-gray-800 text-gray-400 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  title="First Page"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                
                {/* Previous Page */}
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded hover:bg-gray-800 text-gray-400 disabled:opacity-30 disabled:hover:bg-transparent transition-colors mr-2"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Page Numbers */}
                {getPageNumbers().map((page, idx) => (
                  <button
                    key={idx}
                    onClick={() => typeof page === 'number' && setCurrentPage(page)}
                    disabled={page === "..."}
                    className={`min-w-[32px] h-[32px] rounded text-xs font-bold flex items-center justify-center transition-all ${
                      page === currentPage 
                        ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.5)] border border-blue-500' 
                        : page === "..."
                        ? 'text-gray-500 cursor-default'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white border border-transparent'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                {/* Next Page */}
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded hover:bg-gray-800 text-gray-400 disabled:opacity-30 disabled:hover:bg-transparent transition-colors ml-2"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Last Page */}
                <button 
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded hover:bg-gray-800 text-gray-400 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  title="Last Page"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>

              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
