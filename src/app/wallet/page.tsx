"use client";

import { useEffect, useState } from "react";
import { useUserStore } from "@/store/userStore";
import { useRouter } from "next/navigation";
import { Wallet, ArrowDownLeft, ArrowUpRight, History, RefreshCw, CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";
import { useCurrencyStore, CURRENCY_SYMBOLS, formatCurrency, convertFromBase, LIMITS } from "@/store/currencyStore";

const MOCK_HISTORY = [
  { id: "tx_1", type: "deposit", amount: 50, currency: "USDT", date: "2026-08-24 14:30", status: "completed" },
  { id: "tx_2", type: "withdraw", amount: 15, currency: "USDT", date: "2026-08-23 09:15", status: "completed" },
  { id: "tx_3", type: "deposit", amount: 1000, currency: "INR", date: "2026-08-22 18:45", status: "completed" },
];

export default function WalletPage() {
  const { user, isLoading } = useUserStore();
  const { baseBalance, activeCurrency, fetchBalances } = useCurrencyStore();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");

  // Form states
  const [amount, setAmount] = useState<number | "">("");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const currentBalance = convertFromBase(baseBalance, activeCurrency);
  const isCrypto = activeCurrency !== 'INR';

  // Dynamic limits
  const minDeposit = isCrypto ? LIMITS.MIN_CRYPTO_DEPOSIT_USD : LIMITS.MIN_FIAT_DEPOSIT_INR;
  // Withdraw limit is exact equivalent of ₹1500 in crypto
  const minWithdraw = isCrypto 
    ? convertFromBase(LIMITS.MIN_FIAT_WITHDRAW_INR, activeCurrency) 
    : LIMITS.MIN_FIAT_WITHDRAW_INR;

  const isDepositValid = amount !== "" && amount >= minDeposit;
  const isWithdrawValid = amount !== "" && amount >= minWithdraw && amount <= currentBalance && details.trim().length >= 5;

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

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDepositValid) return;
    
    setErrorMsg("");
    setSuccessMsg("");
    setIsSubmitting(true);
    
    try {
      // Stub for real deposit processing flow
      await new Promise(r => setTimeout(r, 1000));
      setSuccessMsg("Deposit request initiated. Please complete the payment.");
      setAmount("");
    } catch (err) {
      setErrorMsg("Deposit failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isWithdrawValid) return;

    setErrorMsg("");
    setSuccessMsg("");
    setIsSubmitting(true);
    
    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, details })
      });
      const data = await res.json();

      if (res.ok) {
        setSuccessMsg("Withdrawal requested! Amount has been deducted and is pending admin approval.");
        fetchBalances(user.id);
        setAmount("");
        setDetails("");
      } else {
        setErrorMsg(data.error || "Withdrawal failed");
      }
    } catch (err) {
      setErrorMsg("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

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
          </div>
        </div>

        {/* Unified Wallet Forms (Tabs) */}
        <div className="bg-[#131824] border border-gray-800 rounded-3xl p-6 shadow-2xl mb-8">
          <div className="flex gap-4 mb-6 border-b border-gray-800 pb-4">
            <button
              onClick={() => { setActiveTab("deposit"); setSuccessMsg(""); setErrorMsg(""); setAmount(""); }}
              className={`flex-1 flex items-center justify-center py-4 rounded-xl font-black uppercase tracking-widest transition-all ${activeTab === 'deposit' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-gray-800/50 text-gray-400 hover:text-white'}`}
            >
              <ArrowDownLeft className="w-5 h-5 mr-2" /> Deposit
            </button>
            <button
              onClick={() => { setActiveTab("withdraw"); setSuccessMsg(""); setErrorMsg(""); setAmount(""); }}
              className={`flex-1 flex items-center justify-center py-4 rounded-xl font-black uppercase tracking-widest transition-all ${activeTab === 'withdraw' ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)]' : 'bg-gray-800/50 text-gray-400 hover:text-white'}`}
            >
              <ArrowUpRight className="w-5 h-5 mr-2" /> Withdraw
            </button>
          </div>

          {successMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500 text-emerald-400 p-4 rounded-xl flex items-start gap-3 mb-6">
              <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
              <p className="font-medium">{successMsg}</p>
            </div>
          )}

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-xl mb-6">
              {errorMsg}
            </div>
          )}

          {/* DEPOSIT FORM */}
          {activeTab === 'deposit' && (
            <form onSubmit={handleDepositSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Deposit Amount ({activeCurrency})</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">{CURRENCY_SYMBOLS[activeCurrency]}</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value) || "")}
                    placeholder="0.00"
                    className={`w-full bg-[#0a0a0f] border ${amount !== "" && amount < minDeposit ? 'border-red-500' : 'border-gray-800'} rounded-xl py-4 pl-8 pr-4 text-white font-bold text-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all`}
                  />
                </div>
                {amount !== "" && amount < minDeposit && (
                  <p className="text-red-400 text-xs mt-2 font-bold flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Minimum deposit amount is {CURRENCY_SYMBOLS[activeCurrency]}{formatCurrency(minDeposit, activeCurrency)} {activeCurrency}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={!isDepositValid || isSubmitting}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all disabled:opacity-50 disabled:shadow-none"
              >
                {isSubmitting ? "Processing..." : "Proceed to Payment"}
              </button>
            </form>
          )}

          {/* WITHDRAW FORM */}
          {activeTab === 'withdraw' && (
            <form onSubmit={handleWithdrawSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Withdrawal Amount ({activeCurrency})</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">{CURRENCY_SYMBOLS[activeCurrency]}</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value) || "")}
                    placeholder="0.00"
                    className={`w-full bg-[#0a0a0f] border ${(amount !== "" && (amount < minWithdraw || amount > currentBalance)) ? 'border-red-500' : 'border-gray-800'} rounded-xl py-4 pl-8 pr-4 text-white font-bold text-xl focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all`}
                  />
                </div>
                {amount !== "" && amount < minWithdraw && (
                  <p className="text-red-400 text-xs mt-2 font-bold flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Minimum withdrawal amount is {CURRENCY_SYMBOLS[activeCurrency]}{formatCurrency(minWithdraw, activeCurrency)} {activeCurrency}
                  </p>
                )}
                {amount !== "" && amount > currentBalance && (
                  <p className="text-red-400 text-xs mt-2 font-bold flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Amount exceeds available balance
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Payout Details ({isCrypto ? 'Crypto Address' : 'UPI ID'})
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder={isCrypto ? "Enter your USDT address (TRC20/ERC20)..." : "Enter your UPI ID (e.g. name@upi)..."}
                  rows={2}
                  className="w-full bg-[#0a0a0f] border border-gray-800 rounded-xl py-3 px-4 text-white font-mono focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={!isWithdrawValid || isSubmitting}
                className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all disabled:opacity-50 disabled:shadow-none"
              >
                {isSubmitting ? "Processing..." : "Submit Withdrawal"}
              </button>
            </form>
          )}
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
