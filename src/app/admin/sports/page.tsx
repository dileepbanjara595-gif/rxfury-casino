"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, Play, Pause, Activity } from "lucide-react";

export default function AdminSportsPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const res = await fetch('/api/admin/sports');
      const data = await res.json();
      if(Array.isArray(data)) setMatches(data);
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleSuspend = async (matchId: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/admin/sports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'TOGGLE_SUSPEND', matchId, isSuspended: !currentStatus })
      });
      const data = await res.json();
      if(data.success) {
         fetchMatches();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-8 text-white font-mono">Loading Sports Dashboard...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-white flex items-center">
          <Activity className="w-8 h-8 text-blue-500 mr-3" />
          Sports Risk Management
        </h1>
      </div>

      <div className="bg-[#131824] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Live Matches Feed</h2>
          <span className="bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-xs font-bold border border-red-500/20">
            {matches.filter(m => m.isSuspended).length} Suspended
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-[#0a0f16] border-b border-gray-800 text-gray-500 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Betradar ID</th>
                <th className="px-6 py-4">Sport</th>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Total Bets</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Emergency Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {matches.map((match) => (
                <tr key={match.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs">{match.betradarId}</td>
                  <td className="px-6 py-4">
                     <span className="bg-gray-800 text-gray-300 px-2.5 py-1 rounded text-xs font-bold uppercase">{match.sport}</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-white">{match.title}</td>
                  <td className="px-6 py-4 font-mono">{match._count?.bets || 0}</td>
                  <td className="px-6 py-4">
                    {match.isSuspended ? (
                       <span className="text-red-500 font-bold flex items-center text-xs uppercase"><ShieldAlert className="w-4 h-4 mr-1"/> Suspended</span>
                    ) : (
                       <span className="text-green-500 font-bold flex items-center text-xs uppercase"><Play className="w-4 h-4 mr-1"/> Active</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    
                    <button
                      onClick={() => toggleSuspend(match.id, match.isSuspended)}
                      className={`px-4 py-2 rounded-lg font-bold text-xs uppercase transition-colors ${match.isSuspended ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                    >
                      {match.isSuspended ? 'Resume Match' : 'Suspend Bets'}
                    </button>

                  </td>
                </tr>
              ))}
              
              {matches.length === 0 && (
                <tr>
                   <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No active matches synced from LiveFeed API yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
