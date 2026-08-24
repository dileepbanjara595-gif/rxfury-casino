"use client";

import { useState, useEffect } from "react";
import { Filter, CheckCircle, XCircle, ArrowUpRight, ArrowDownLeft, RefreshCw } from "lucide-react";
import { useUserStore } from "@/store/userStore";

export default function AdminTransactionsPage() {
  const { session } = useUserStore();
  const [filter, setFilter] = useState("PENDING");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/transactions?status=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [filter]);

  const handleAction = async (id: string, action: 'APPROVE' | 'REJECT') => {
    try {
      const res = await fetch("/api/admin/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action })
      });
      if (res.ok) {
        // Remove from list or refresh
        fetchTransactions();
      } else {
        alert("Action failed");
      }
    } catch (err) {
      alert("Error processing action");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wider">Transactions Queue</h1>
          <p className="text-gray-400 text-sm mt-1">Review and process user deposits and withdrawals.</p>
        </div>
        <div className="flex bg-[#11111a] rounded-lg p-1 border border-[#1f1f2e]">
          {['PENDING', 'APPROVED', 'REJECTED'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-1.5 text-xs font-bold rounded-md uppercase transition-colors ${filter === status ? 'bg-gray-800 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#11111a] border border-[#1f1f2e] rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="text-xs text-gray-500 uppercase bg-[#0a0a0f] border-b border-[#1f1f2e]">
              <tr>
                <th className="px-6 py-4 font-bold">Type</th>
                <th className="px-6 py-4 font-bold">User / ID</th>
                <th className="px-6 py-4 font-bold text-right">Amount</th>
                <th className="px-6 py-4 font-bold">Details (UTR/Bank)</th>
                <th className="px-6 py-4 font-bold">Date</th>
                <th className="px-6 py-4 font-bold">Status</th>
                {filter === "PENDING" && <th className="px-6 py-4 font-bold text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f1f2e]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2" />
                    Loading Transactions...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No {filter.toLowerCase()} transactions found.
                  </td>
                </tr>
              ) : transactions.map((tx, idx) => (
                <tr key={idx} className="hover:bg-[#161622] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {tx.type === 'DEPOSIT' ? (
                        <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded"><ArrowDownLeft className="w-4 h-4" /></div>
                      ) : (
                        <div className="p-1.5 bg-red-500/10 text-red-400 rounded"><ArrowUpRight className="w-4 h-4" /></div>
                      )}
                      <span className="font-bold">{tx.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-mono font-bold text-blue-400">{tx.user.systematicId}</p>
                    <p className="text-xs text-gray-500">{tx.user.email}</p>
                  </td>
                  <td className={`px-6 py-4 text-right font-black ${tx.type === 'DEPOSIT' ? 'text-emerald-400' : 'text-red-400'}`}>
                    ₹{tx.amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-400 max-w-[200px] truncate">
                    {tx.utrOrHash || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(tx.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold border uppercase tracking-wider ${
                      tx.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                      tx.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                      'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                  {filter === "PENDING" && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button onClick={() => handleAction(tx.id, 'APPROVE')} className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/30 text-emerald-400 rounded transition-colors" title="Approve">
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleAction(tx.id, 'REJECT')} className="p-1.5 bg-red-500/10 hover:bg-red-500/30 text-red-400 rounded transition-colors" title="Reject">
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
