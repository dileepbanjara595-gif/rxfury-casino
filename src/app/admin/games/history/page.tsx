"use client";
import { useState, useEffect } from "react";
import { History, ShieldAlert, RefreshCw } from "lucide-react";

export default function AdminGamesHistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/games/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wider flex items-center">
            <History className="w-6 h-6 mr-2 text-blue-500" />
            Global Game History
          </h1>
          <p className="text-gray-400 text-sm mt-1">Audit trail of completed multiplayer game rounds.</p>
        </div>
        <button onClick={fetchHistory} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg flex items-center transition-colors">
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </button>
      </div>

      <div className="bg-[#11111a] border border-[#1f1f2e] rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="text-xs text-gray-500 uppercase bg-[#0a0a0f] border-b border-[#1f1f2e]">
              <tr>
                <th className="px-6 py-4 font-bold">Time</th>
                <th className="px-6 py-4 font-bold">Room ID</th>
                <th className="px-6 py-4 font-bold">Game</th>
                <th className="px-6 py-4 font-bold">Winner</th>
                <th className="px-6 py-4 font-bold text-right">Pot Size</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f1f2e]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">Loading history...</td>
                </tr>
              ) : history.length > 0 ? history.map((record, idx) => (
                <tr key={idx} className="hover:bg-[#161622] transition-colors">
                  <td className="px-6 py-4 text-gray-400">{new Date(record.createdAt).toLocaleString()}</td>
                  <td className="px-6 py-4 font-mono text-gray-500">{record.roomId}</td>
                  <td className="px-6 py-4 font-bold text-blue-400">{record.gameName}</td>
                  <td className="px-6 py-4 font-bold text-emerald-400">{record.winnerName || record.winnerId}</td>
                  <td className="px-6 py-4 text-right font-bold text-white">,1{record.potAmount}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">No game history available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
