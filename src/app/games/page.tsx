"use client";

import { useState } from "react";
import { Search, Info, Play, Filter, Sparkles, Spade } from "lucide-react";
import Link from "next/link";

type Category = "All" | "Fast" | "Card";

interface Game {
  id: string;
  name: string;
  category: "Fast" | "Card";
  gradient: string;
  icon: string;
}

const gamesList: Game[] = [
  { id: "aviator", name: "Aviator", category: "Fast", gradient: "from-red-500 to-orange-600", icon: "/images/games/aviator.png" },
  { id: "mines", name: "Mines", category: "Fast", gradient: "from-emerald-500 to-teal-700", icon: "/images/games/mines.jpg" },
  { id: "chicken-road", name: "Chicken Road", category: "Fast", gradient: "from-yellow-400 to-orange-500", icon: "/images/games/chicken-road.jpg" },
  { id: "big-small", name: "Big & Small", category: "Fast", gradient: "from-blue-500 to-indigo-600", icon: "/images/games/big-small.jpg" },
  { id: "k3", name: "K3", category: "Fast", gradient: "from-purple-500 to-pink-600", icon: "/images/games/k3.jpg" },
  { id: "moto-racing", name: "Moto Racing", category: "Fast", gradient: "from-gray-600 to-gray-900", icon: "/images/games/moto-racing.jpg" },
  { id: "rummy", name: "Rummy", category: "Card", gradient: "from-red-700 to-red-900", icon: "/images/games/rummy.jpg" },
  { id: "teen-patti", name: "Teen Patti", category: "Card", gradient: "from-orange-600 to-red-700", icon: "/images/games/teen-patti.jpg" },
  { id: "poker", name: "Poker", category: "Card", gradient: "from-blue-700 to-blue-900", icon: "/images/games/poker.jpg" },
  { id: "blackjack", name: "Blackjack", category: "Card", gradient: "from-gray-800 to-black", icon: "/images/games/blackjack.jpg" },
  { id: "solitaire", name: "Solitaire", category: "Card", gradient: "from-green-600 to-green-800", icon: "/images/games/solitaire.jpg" },
  { id: "bridge", name: "Bridge", category: "Card", gradient: "from-indigo-600 to-purple-800", icon: "/images/games/bridge.jpg" },
];

export default function GamesLobbyPage() {
  const [activeTab, setActiveTab] = useState<Category>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const filteredGames = gamesList.filter((game) => {
    const matchesTab = activeTab === "All" || game.category === activeTab;
    const matchesSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans pb-12">
      
      {/* Header & Hero Section */}
      <div className="bg-gray-900 border-b border-gray-800 pt-28 pb-8 px-4 md:px-8 shadow-2xl relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            
            {/* Tabs */}
            <div className="flex bg-gray-950 p-1 rounded-xl w-full md:w-auto border border-gray-800 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab("All")}
                className={`flex-1 md:flex-none whitespace-nowrap px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === "All" ? "bg-gray-800 text-white shadow-sm" : "text-gray-400 hover:text-white hover:bg-gray-900"
                }`}
              >
                All Games
              </button>
              <button
                onClick={() => setActiveTab("Fast")}
                className={`flex-1 md:flex-none whitespace-nowrap px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center ${
                  activeTab === "Fast" ? "bg-gray-800 text-white shadow-sm" : "text-gray-400 hover:text-white hover:bg-gray-900"
                }`}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Fast / Crash
              </button>
              <button
                onClick={() => setActiveTab("Card")}
                className={`flex-1 md:flex-none whitespace-nowrap px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center ${
                  activeTab === "Card" ? "bg-gray-800 text-white shadow-sm" : "text-gray-400 hover:text-white hover:bg-gray-900"
                }`}
              >
                <Spade className="w-4 h-4 mr-2" />
                Classic Cards
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative w-full md:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="text"
                placeholder="Search games..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-4 py-3 bg-gray-950 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-inner"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-gray-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Game Grid */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-12">
        
        {filteredGames.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No games found matching "{searchQuery}"</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {filteredGames.map((game) => (
              <Link 
                href={`/games/play/${game.id}`}
                key={game.id} 
                className="group relative rounded-2xl overflow-hidden border border-gray-700 hover:border-yellow-500/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_25px_rgba(234,179,8,0.25)] flex flex-col h-64 md:h-72 bg-gray-900"
              >
                {/* Full Cover Game Image */}
                <div className="absolute inset-0 pointer-events-none z-0">
                  <img 
                    src={game.icon} 
                    alt={game.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-in-out opacity-90 group-hover:opacity-100"
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                  {/* Sleek Gradient Overlay for Text Readability over the image */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f16] via-[#0a0f16]/80 to-transparent"></div>
                  {/* Subtle color tint based on game category */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-40 mix-blend-overlay`}></div>
                </div>

                {/* Content Overlay */}
                <div className="relative z-20 flex flex-col h-full p-4 md:p-5 justify-between">
                  
                  {/* Top Bar: Badges */}
                  <div className="flex justify-between items-start">
                    <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] md:text-xs font-black tracking-widest text-yellow-400 border border-yellow-500/30 uppercase shadow-lg">
                      {game.category}
                    </div>
                    {/* Info Icon */}
                    <button 
                      onClick={(e) => { e.preventDefault(); setActiveModal(game.name); }}
                      className="bg-black/50 hover:bg-black/80 backdrop-blur-md p-1.5 rounded-full text-gray-300 hover:text-white border border-gray-600 transition-colors"
                      title="How to Play"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Play Button Overlay on Hover (Center) */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <div className="bg-yellow-500/90 text-gray-900 p-4 rounded-full shadow-[0_0_30px_rgba(234,179,8,0.6)] transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                      <Play className="w-6 h-6 fill-current" />
                    </div>
                  </div>

                  {/* Bottom Bar: Title & Live Status */}
                  <div className="mt-auto flex items-end justify-between">
                    <h3 className="text-xl md:text-2xl font-black text-white tracking-tight drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] leading-none">
                      {game.name}
                    </h3>
                    <div className="flex items-center space-x-1.5 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg border border-gray-700 shadow-md">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                      <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Live</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 'How to Play' Dummy Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              ✕
            </button>
            <div className="flex items-center space-x-3 mb-4">
              <Info className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-bold text-white">How to Play {activeModal}</h2>
            </div>
            <div className="space-y-4 text-gray-300 text-sm">
              <p>1. Place your bet before the round starts.</p>
              <p>2. Watch the multiplier increase.</p>
              <p>3. Cash out before the round ends to win your bet multiplied by that amount!</p>
              <p className="text-xs text-gray-500 pt-4 border-t border-gray-800">
                This is a provably fair game. Results are generated via a secure server seed.
              </p>
            </div>
            <button 
              onClick={() => setActiveModal(null)}
              className="w-full mt-6 bg-gray-800 hover:bg-gray-700 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
