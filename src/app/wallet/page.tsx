"use client";

import { useEffect } from "react";
import { useUserStore } from "@/store/userStore";
import { useRouter } from "next/navigation";
import { Wallet, ArrowDownLeft, ArrowUpRight, History, RefreshCw, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useCurrencyStore, CURRENCY_SYMBOLS, formatCurrency, convertFromBase } from "@/store/currencyStore";
import Link from "next/link";

const MOCK_HISTORY = [
  { id: "tx_1", type: "deposit", amount: 50, currency: "USDT", date: "2026-08-24 14:30", status: "completed" },
  { id: "tx_2", type: "withdraw", amount: 15, currency: "USDT", date: "2026-08-23 09:15", status: "completed" },
  { id: "tx_3", type: "deposit", amount: 1000, currency: "INR", date: "2026-08-22 18:45", status: "completed" },
];

export default function WalletPage() {
  const { user, isLoading } = useUserStore();
  const { baseBalance, activeCurrency, fetchBalances } = useCurrencyStore();
  const router = useRouter();

  const currentBalance = convertFromBase(baseBalance, activeCurrency);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen pt-32 pb-12 px-4 flex items-center justify-center bg-[#0a0f16]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-20 bg-[#0a0f16] text-white">
      <div className="container mx-auto px-4 max-w-4xl">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-wider flex items-center">
              <Wallet className="w-8 h-8 mr-4 text-emerald-500" />
              Wallet Dashboard
            </h1>
            <p className="text-gray-400 mt-2 font-medium">Manage your funds securely across all currencies.</p>
          </div>
        </div>

        {/* Balance Card */}
        <div className="bg-[#131824] border border-gray-800 rounded-3xl p-8 shadow-2xl mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div>
              <p className="text-sm text-gray-400 uppercase tracking-widest font-bold mb-2">Total Available Balance ({activeCurrency})</p>
              <div className="flex items-center text-5xl font-black text-white drop-shadow-md">
                <span className="text-emerald-500 mr-2">{CURRENCY_SYMBOLS[activeCurrency]}</span> 
                {formatCurrency(currentBalance, activeCurrency)}
                <button onClick={() => fetchBalances(user.id)} className="ml-4 text-gray-500 hover:text-white transition-colors bg-white/5 p-2 rounded-full">
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <Link 
                href="/wallet/deposit"
                className="flex items-center justify-center px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-105"
              >
                <ArrowDownLeft className="w-5 h-5 mr-2" />
                Deposit
              </Link>
              <Link 
                href="/wallet/withdraw"
                className="flex items-center justify-center px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:scale-105"
              >
                <ArrowUpRight className="w-5 h-5 mr-2" />
                Withdraw
              </Link>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-[#131824] border border-gray-800 rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-800 flex items-center">
             <History className="w-5 h-5 text-gray-400 mr-3" />
             <h2 className="text-xl font-bold uppercase tracking-wider text-white">Recent Transactions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-[#0a0f16] border-b border-gray-800 text-gray-500 uppercase text-xs font-semibold">
                <tr>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {MOCK_HISTORY.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-5 font-bold text-white capitalize flex items-center">
                      {tx.type === 'deposit' 
                        ? <ArrowDownLeft className="w-4 h-4 mr-2 text-emerald-500" /> 
                        : <ArrowUpRight className="w-4 h-4 mr-2 text-orange-500" />
                      }
                      {tx.type}
                    </td>
                    <td className={`px-6 py-5 font-mono font-bold ${tx.type === 'deposit' ? 'text-emerald-400' : 'text-orange-400'}`}>
                      {tx.type === 'deposit' ? '+' : '-'} {tx.amount} {tx.currency}
                    </td>
                    <td className="px-6 py-5 text-gray-500 whitespace-nowrap">{tx.date}</td>
                    <td className="px-6 py-5 text-right">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${
                        tx.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                        tx.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 
                        'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {tx.status === 'completed' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {tx.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                        {tx.status === 'failed' && <XCircle className="w-3 h-3 mr-1" />}
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
