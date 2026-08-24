"use client";

import { useState } from "react";
import { useUserStore } from "@/store/userStore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import Image from "next/image";
import { 
  Copy, Wallet, History, Gamepad2, Settings, HeadphonesIcon, LogOut, ChevronRight, X, QrCode, Bitcoin, Building2 
} from "lucide-react";

export default function ProfileDashboard() {
  const { session } = useUserStore();
  const router = useRouter();
  
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txTab, setTxTab] = useState<"deposit" | "withdraw">("deposit");
  const [copied, setCopied] = useState(false);

  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1d29]">
        <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const handleCopyId = () => {
    if ((session.user as any)?.systematicId) {
      navigator.clipboard.writeText((session.user as any)?.systematicId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#1a1d29] text-white pb-20 md:pb-0 relative">
      
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-yellow-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6 relative z-10">
        
        {/* HEADER: User Info */}
        <div className="flex items-center space-x-4 p-4 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md shadow-lg">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center p-0.5 shadow-[0_0_15px_rgba(234,179,8,0.4)]">
            <Image src={`${(session.user as any)?.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`}`} alt="Avatar" width={64} height={64} className="w-full h-full rounded-full bg-[#1a1d29]" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-black text-white">{(session.user as any)?.firstName || session.user.email?.split("@")[0] || "Player"}</h2>
            <div className="flex items-center mt-1">
              <span className="text-sm font-bold text-gray-400 bg-black/40 px-2 py-0.5 rounded-md border border-white/5">
                ID: {(session.user as any)?.systematicId}
              </span>
              <button onClick={handleCopyId} className="ml-2 text-yellow-500 hover:text-yellow-400 transition-colors">
                <Copy className="w-4 h-4" />
              </button>
              {copied && <span className="ml-2 text-xs text-green-400 font-bold">Copied!</span>}
            </div>
          </div>
          <div className="text-right">
            <div className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest">
              VIP {(session.user as any)?.vipLevel || 1}
            </div>
          </div>
        </div>

        {/* WALLET CARD (Interactive) */}
        <div 
          onClick={() => setIsTxModalOpen(true)}
          className="cursor-pointer group relative overflow-hidden bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-3xl p-6 shadow-2xl hover:border-yellow-500/50 transition-all duration-300"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-[50px] group-hover:bg-yellow-500/20 transition-colors"></div>
          <div className="flex items-center space-x-3 mb-2">
            <Wallet className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Total Balance</span>
          </div>
          <div className="flex items-end justify-between">
            <h3 className="text-4xl md:text-5xl font-black text-white drop-shadow-md">
              <span className="text-yellow-500">₹</span>
              {(((session.user as any)?.mainWalletBalance as number) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h3>
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-yellow-500/20 transition-colors">
              <ChevronRight className="w-6 h-6 text-yellow-500" />
            </div>
          </div>
          <div className="mt-4 flex gap-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
            <span>Main: ₹{(((session.user as any)?.mainWalletBalance as number) || 0).toLocaleString()}</span>
            <span>Bonus: ₹{(((session.user as any)?.bonusWalletBalance as number) || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* QUICK ACTIONS ROW */}
        <div className="flex gap-4">
          <button 
            onClick={() => { setTxTab("deposit"); setIsTxModalOpen(true); }}
            className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-black py-4 rounded-2xl shadow-[0_0_15px_rgba(234,179,8,0.3)] hover:shadow-[0_0_25px_rgba(234,179,8,0.5)] transition-all uppercase tracking-widest"
          >
            Deposit
          </button>
          <button 
            onClick={() => { setTxTab("withdraw"); setIsTxModalOpen(true); }}
            className="flex-1 bg-white/5 border border-white/10 text-white font-black py-4 rounded-2xl hover:bg-white/10 transition-all uppercase tracking-widest"
          >
            Withdraw
          </button>
        </div>

        {/* ACTION MENU LIST */}
        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md">
          
          <Link href="/history" className="flex items-center justify-between p-5 border-b border-white/5 hover:bg-white/5 transition-colors">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-500/20 p-2 rounded-xl text-blue-400"><History className="w-5 h-5" /></div>
              <span className="font-bold text-gray-200">Transaction History</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </Link>
          
          <Link href="/history" className="flex items-center justify-between p-5 border-b border-white/5 hover:bg-white/5 transition-colors">
            <div className="flex items-center space-x-4">
              <div className="bg-emerald-500/20 p-2 rounded-xl text-emerald-400"><Gamepad2 className="w-5 h-5" /></div>
              <span className="font-bold text-gray-200">Game Records</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </Link>

          <div className="flex items-center justify-between p-5 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer">
            <div className="flex items-center space-x-4">
              <div className="bg-orange-500/20 p-2 rounded-xl text-orange-400"><HeadphonesIcon className="w-5 h-5" /></div>
              <span className="font-bold text-gray-200">Help & Support</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </div>

          <Link href="/settings" className="flex items-center justify-between p-5 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer">
            <div className="flex items-center space-x-4">
              <div className="bg-purple-500/20 p-2 rounded-xl text-purple-400"><Settings className="w-5 h-5" /></div>
              <span className="font-bold text-gray-200">Account Settings</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </Link>

          <button onClick={handleLogout} className="w-full flex items-center justify-between p-5 hover:bg-red-500/10 transition-colors">
            <div className="flex items-center space-x-4">
              <div className="bg-red-500/20 p-2 rounded-xl text-red-400"><LogOut className="w-5 h-5" /></div>
              <span className="font-bold text-red-400">Secure Logout</span>
            </div>
          </button>
        </div>
      </div>

      {/* TRANSACTION MODAL */}
      {isTxModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#1a1d29] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl w-full max-w-md shadow-2xl relative animate-in slide-in-from-bottom sm:zoom-in-95 duration-300">
            
            {/* Modal Header & Tabs */}
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <div className="flex space-x-2 bg-black/40 p-1 rounded-xl border border-white/5">
                <button 
                  onClick={() => setTxTab("deposit")}
                  className={`px-6 py-2 rounded-lg text-sm font-bold uppercase tracking-widest transition-all ${
                    txTab === "deposit" ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-black shadow-md" : "text-gray-400 hover:text-white"
                  }`}
                >
                  Deposit
                </button>
                <button 
                  onClick={() => setTxTab("withdraw")}
                  className={`px-6 py-2 rounded-lg text-sm font-bold uppercase tracking-widest transition-all ${
                    txTab === "withdraw" ? "bg-white/10 text-white shadow-md" : "text-gray-400 hover:text-white"
                  }`}
                >
                  Withdraw
                </button>
              </div>
              <button onClick={() => setIsTxModalOpen(false)} className="bg-black/40 p-2 rounded-full text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 max-h-[70vh] overflow-y-auto no-scrollbar">
              {txTab === "deposit" ? (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Select Payment Method</h4>
                  <Link href="/wallet/deposit" className="group flex items-center justify-between p-4 bg-black/40 hover:bg-black/60 border border-white/10 hover:border-yellow-500/50 rounded-2xl transition-all">
                    <div className="flex items-center space-x-4">
                      <div className="bg-blue-500/20 p-3 rounded-xl border border-blue-500/30 group-hover:scale-110 transition-transform"><QrCode className="w-6 h-6 text-blue-400" /></div>
                      <div>
                        <h4 className="font-bold text-white">UPI / QR Scan</h4>
                        <p className="text-xs text-gray-400 font-medium">Instant • ₹100 Min</p>
                      </div>
                    </div>
                    <ChevronRight className="text-yellow-500 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <div className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-2xl opacity-50 cursor-not-allowed">
                    <div className="flex items-center space-x-4">
                      <div className="bg-orange-500/20 p-3 rounded-xl border border-orange-500/30"><Bitcoin className="w-6 h-6 text-orange-400" /></div>
                      <div>
                        <h4 className="font-bold text-white">USDT (Crypto)</h4>
                        <p className="text-xs text-gray-400 font-medium">Coming Soon</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Select Payout Method</h4>
                  <Link href="/wallet/withdraw" className="group flex items-center justify-between p-4 bg-black/40 hover:bg-black/60 border border-white/10 hover:border-white/30 rounded-2xl transition-all">
                    <div className="flex items-center space-x-4">
                      <div className="bg-emerald-500/20 p-3 rounded-xl border border-emerald-500/30 group-hover:scale-110 transition-transform"><Building2 className="w-6 h-6 text-emerald-400" /></div>
                      <div>
                        <h4 className="font-bold text-white">IMPS Bank Transfer</h4>
                        <p className="text-xs text-gray-400 font-medium">30-60 Mins • ₹500 Min</p>
                      </div>
                    </div>
                    <ChevronRight className="text-white w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}



