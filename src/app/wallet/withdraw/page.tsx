"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Wallet, ArrowDownLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";

export default function WithdrawPage() {
  const { session, isLoading } = useUserStore();
  const [balance, setBalance] = useState<number>(0);
  const [amount, setAmount] = useState<number | "">("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    // In a real app, you'd fetch the exact current balance from an API to be safe
    // For now we use the session's balance, but ideally trigger a refresh
    if (session?.user) {
      setBalance(1000);
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!amount || amount < 500) {
      setErrorMsg("Minimum withdrawal amount is ₹500");
      return;
    }
    if (amount > balance) {
      setErrorMsg("Insufficient wallet balance");
      return;
    }
    if (details.length < 5) {
      setErrorMsg("Please enter valid payout details");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, details })
      });
      const data = await res.json();

      if (res.ok) {
        setSuccessMsg("Withdrawal requested! Amount has been deducted and is pending admin approval.");
        setBalance(b => b - Number(amount));
        setAmount("");
        setDetails("");
      } else {
        setErrorMsg(data.error || "Withdrawal failed");
      }
    } catch (err) {
      setErrorMsg("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div></div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans selection:bg-red-500/30">
      <header className="h-[70px] bg-[#0a0f16] border-b border-[#1f2937] px-4 flex items-center shrink-0">
        <Link href="/wallet" className="text-gray-400 hover:text-white transition-colors mr-4">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <ArrowDownLeft className="w-6 h-6 text-red-500 mr-2" />
        <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-400 uppercase tracking-widest">
          Withdraw Funds
        </h1>
      </header>

      <main className="max-w-xl mx-auto p-4 md:p-8 space-y-6 mt-4">

        <div className="bg-gradient-to-br from-[#11111a] to-[#1a1114] border border-red-900/30 p-6 rounded-2xl shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Withdrawable Balance</p>
            <p className="text-3xl font-mono font-black text-white">₹{balance.toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
          </div>
          <Wallet className="w-12 h-12 text-red-500/20" />
        </div>
        
        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500 text-emerald-400 p-4 rounded-xl flex items-start gap-3">
            <CheckCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <p className="font-medium">{successMsg}</p>
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-xl">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-[#11111a] border border-[#1f1f2e] p-6 rounded-2xl shadow-lg space-y-6">
          
          <div>
            <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Withdrawal Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value) || "")}
                placeholder="0.00"
                className="w-full bg-[#0a0a0f] border border-gray-800 rounded-xl py-4 pl-8 pr-4 text-white font-bold text-xl focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                required
              />
            </div>
            <p className="text-xs text-gray-600 mt-2">Minimum withdrawal: ₹500</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Payout Details</label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Enter Bank A/C & IFSC or UPI ID..."
              rows={3}
              className="w-full bg-[#0a0a0f] border border-gray-800 rounded-xl py-3 px-4 text-white font-mono focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all resize-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] transition-all disabled:opacity-50 disabled:shadow-none mt-4"
          >
            {loading ? "Processing..." : "Withdraw Now"}
          </button>
        </form>

      </main>
    </div>
  );
}



