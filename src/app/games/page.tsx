"use client";

import { useState } from "react";
import { Search, Info, Play, Filter, Sparkles, Spade, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCurrencyStore } from "@/store/currencyStore";
import { useUIStore } from "@/store/uiStore";
import { useUserStore } from "@/store/userStore";
import GameCard from "@/components/GameCard";

type Category = "All" | "Fast" | "Card" | "Skill";

interface Game {
  id: string;
  name: string;
  category: "Fast" | "Card" | "Skill";
  gradient: string;
  icon: string;
  isLive?: boolean;
}

const gamesList: Game[] = [
  { id: "aviator", name: "Aviator", category: "Fast", isLive: true, gradient: "from-red-500 to-orange-600", icon: "/images/games/aviator.png" },
  { id: "mines", name: "Mines", category: "Fast", isLive: true, gradient: "from-emerald-500 to-teal-700", icon: "/images/games/mines.jpg" },
  { id: "chicken-road", name: "Chicken Road", category: "Fast", isLive: true, gradient: "from-yellow-400 to-orange-500", icon: "/images/games/chicken-road.jpg" },
  { id: "big-small", name: "Big & Small", category: "Fast", isLive: true, gradient: "from-blue-500 to-indigo-600", icon: "/images/games/big-small.jpg" },
  { id: "k3", name: "K3", category: "Fast", isLive: true, gradient: "from-purple-500 to-pink-600", icon: "/images/games/k3.jpg" },
  { id: "moto-racing", name: "Moto Racing", category: "Fast", isLive: true, gradient: "from-gray-600 to-gray-900", icon: "/images/games/moto-racing.jpg" },
  { id: "rummy", name: "Rummy", category: "Card", isLive: true, gradient: "from-red-700 to-red-900", icon: "/images/games/rummy.jpg" },
  { id: "teen-patti", name: "Teen Patti", category: "Card", isLive: true, gradient: "from-orange-600 to-red-700", icon: "/images/games/teen-patti.jpg" },
  { id: "poker", name: "Poker", category: "Card", isLive: true, gradient: "from-blue-700 to-blue-900", icon: "/images/games/poker.jpg" },
  { id: "blackjack", name: "Blackjack", category: "Card", isLive: true, gradient: "from-gray-800 to-black", icon: "/images/games/blackjack.jpg" },
  { id: "solitaire", name: "Solitaire", category: "Skill", isLive: false, gradient: "from-green-600 to-green-800", icon: "/images/games/solitaire.jpg" },
  { id: "bridge", name: "Bridge", category: "Card", isLive: true, gradient: "from-indigo-600 to-purple-800", icon: "/images/games/bridge.jpg" },
];

export default function GamesLobbyPage() {
  const router = useRouter();
  const { session } = useUserStore();
  const { baseBalance } = useCurrencyStore();
  const { openInsufficientFundsModal } = useUIStore();

  const [activeTab, setActiveTab] = useState<Category>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const filteredGames = gamesList.filter((game) => {
    const matchesTab = activeTab === "All" || game.category === activeTab;
    const matchesSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleGameLaunch = (e: React.MouseEvent, gameId: string) => {
    if (!session?.user) {
      e.preventDefault();
      router.push('/login');
      return;
    }

    if (baseBalance <= 0) {
      e.preventDefault();
      openInsufficientFundsModal();
      return;
    }

    router.push(`/games/play/${gameId}`);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans pb-12">
      
      {/* Header & Hero Section */}
      <div className="bg-gray-900 border-b border-gray-800 pt-28 pb-8 px-4 md:px-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            
            {/* Tabs */}
            <div className="flex bg-gray-950 p-1 rounded-xl w-full md:w-auto border border-gray-800 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab("All")}
                className={`flex-1 md:flex-none whitespace-nowrap px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === "All" ? "bg-gray-800 text-white shadow-sm" : "text-gray-400 hover:text-white hover:bg-gray-900"
                }`}
              >
                All Games
              </button>
              <button
                onClick={() => setActiveTab("Fast")}
                className={`flex-1 md:flex-none whitespace-nowrap px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center ${
                  activeTab === "Fast" ? "bg-gray-800 text-white shadow-sm" : "text-gray-400 hover:text-white hover:bg-gray-900"
                }`}
              >
                <Sparkles className="w-4 h-4 mr-1.5 text-yellow-400" />
                Fast / Crash
              </button>
              <button
                onClick={() => setActiveTab("Card")}
                className={`flex-1 md:flex-none whitespace-nowrap px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center ${
                  activeTab === "Card" ? "bg-gray-800 text-white shadow-sm" : "text-gray-400 hover:text-white hover:bg-gray-900"
                }`}
              >
                <Spade className="w-4 h-4 mr-1.5 text-blue-400" />
                Classic Cards
              </button>
              <button
                onClick={() => setActiveTab("Skill")}
                className={`flex-1 md:flex-none whitespace-nowrap px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center ${
                  activeTab === "Skill" ? "bg-gray-800 text-white shadow-sm" : "text-gray-400 hover:text-white hover:bg-gray-900"
                }`}
              >
                <Trophy className="w-4 h-4 mr-1.5 text-emerald-400" />
                Skill & Casual
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
                className="block w-full pl-10 pr-4 py-3 bg-gray-950 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-inner text-sm"
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
              <GameCard key={game.id} game={game} onInfoClick={setActiveModal} />
            ))}
          </div>
        )}
      </div>

      {/* 'How to Play' Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-lg cursor-pointer"
            >
              ✕
            </button>
            <div className="flex items-center space-x-3 mb-4">
              <Info className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-bold text-white">How to Play {activeModal}</h2>
            </div>
            <div className="space-y-4 text-gray-300 text-sm">
              <p>1. Select your stake and place your wager before the session starts.</p>
              <p>2. Complete objectives or cash out dynamically as multipliers scale.</p>
              <p>3. Winnings are settled directly to your wallet in real time.</p>
              <p className="text-xs text-gray-500 pt-4 border-t border-gray-800">
                This is a provably fair game backed by cryptographic random seeds.
              </p>
            </div>
            <button 
              onClick={() => setActiveModal(null)}
              className="w-full mt-6 bg-gray-800 hover:bg-gray-700 text-white font-semibold py-2.5 rounded-lg transition-colors cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
