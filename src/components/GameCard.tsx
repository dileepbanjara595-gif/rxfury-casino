"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import { useCurrencyStore } from "@/store/currencyStore";
import { useUIStore } from "@/store/uiStore";
import { Gamepad2, Info, Play, Trophy, Sparkles } from "lucide-react";

interface GameCardProps {
  game: {
    id: string;
    name: string;
    category: string;
    tag?: string;
    isLive?: boolean;
    color?: string;
    gradient?: string;
    icon: string;
  };
  onInfoClick?: (gameName: string) => void;
}

export default function GameCard({ game, onInfoClick }: GameCardProps) {
  const router = useRouter();
  const { session } = useUserStore();
  const { baseBalance } = useCurrencyStore();
  const { openInsufficientFundsModal } = useUIStore();

  const handleGameLaunch = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 1. Check Auth
    if (!session?.user) {
      router.push('/login?callbackUrl=/games/play/' + game.id);
      return;
    }

    // 2. Check Balance
    if (baseBalance <= 0) {
      openInsufficientFundsModal();
      return;
    }

    // 3. Navigate to game
    router.push('/games/play/' + game.id);
  };

  const bgStyle = game.color || game.gradient || "from-blue-500 to-indigo-600";

  return (
    <div 
      onClick={handleGameLaunch}
      className="group relative rounded-2xl overflow-hidden border border-gray-700 hover:border-yellow-500/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_25px_rgba(234,179,8,0.25)] flex flex-col h-64 md:h-72 bg-gray-900 cursor-pointer"
    >
      {/* Full Cover Game Image */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <img 
          src={game.icon} 
          alt={game.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-in-out opacity-90 group-hover:opacity-100"
          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f16] via-[#0a0f16]/80 to-transparent"></div>
        <div className={`absolute inset-0 bg-gradient-to-br ${bgStyle} opacity-40 mix-blend-overlay`}></div>
      </div>

      {/* Content Overlay */}
      <div className="relative z-20 flex flex-col h-full p-4 md:p-5 justify-between">
        
        {/* Top Bar: Badges */}
        <div className="flex justify-between items-start">
          <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] md:text-xs font-black tracking-widest text-yellow-400 border border-yellow-500/30 uppercase shadow-lg">
            {game.category}
          </div>
          {/* Info Icon */}
          {onInfoClick && (
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                e.preventDefault();
                onInfoClick(game.name); 
              }}
              className="bg-black/50 hover:bg-black/80 backdrop-blur-md p-1.5 rounded-full text-gray-300 hover:text-white border border-gray-600 transition-colors cursor-pointer"
              title="How to Play"
            >
              <Info className="w-4 h-4" />
            </button>
          )}
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
            {game.isLive ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Live</span>
              </>
            ) : (
              <>
                {(game.tag === "Skill" || game.category === "Skill") ? (
                  <Trophy className="w-2.5 h-2.5 text-emerald-400" />
                ) : (
                  <Sparkles className="w-2.5 h-2.5 text-blue-400" />
                )}
                <span className="text-[9px] font-bold text-blue-300 uppercase tracking-widest">
                  {game.tag || game.category}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
