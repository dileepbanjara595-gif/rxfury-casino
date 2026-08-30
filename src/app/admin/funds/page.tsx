"use client";

import { useState } from "react";
import { DollarSign, Search, CheckCircle, AlertCircle } from "lucide-react";

export default function ManualFundsPage() {
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/manual-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, amount: parseFloat(amount) }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: `Successfully transferred ₹${amount} to ${email}.` });
        setEmail("");
        setAmount("");
      } else {
        setMessage({ type: 'error', text: data.error || "Failed to transfer funds." });
      }
    } catch (error) {
      setMessage({ type: 'error', text: "An error occurred during transfer." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white uppercase tracking-wider">Manual Fund Transfer</h1>
        <p className="text-gray-400 text-sm mt-1">Directly add funds to a user's wallet via their email address.</p>
      </div>

      <div className="bg-[#11111a] border border-[#1f1f2e] p-8 rounded-2xl shadow-lg">
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-bold">{message.text}</span>
          </div>
        )}

        <form onSubmit={handleTransfer} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-400 uppercase tracking-wide mb-2">User Email ID</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="player@example.com"
                className="w-full pl-12 pr-4 py-3 bg-[#161622] border border-[#1f1f2e] rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-400 uppercase tracking-wide mb-2">Amount to Add (₹)</label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="number"
                min="1"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1000.00"
                className="w-full pl-12 pr-4 py-3 bg-[#161622] border border-[#1f1f2e] rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-xl uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : "Transfer Funds"}
          </button>
        </form>
      </div>
    </div>
  );
}
