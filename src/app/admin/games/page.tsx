import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function GamesAdminPage() {
  const recentSessions = await prisma.gameSession.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
  });

  const recentBets = await prisma.gameHistory.findMany({
    take: 50,
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Game Audit Logs</h2>
        
        <div className="bg-[#131824] rounded-xl border border-gray-800 p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-300 mb-4">Recent Sessions</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="text-xs text-gray-500 uppercase bg-gray-900/50">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Session ID</th>
                  <th className="px-4 py-3">Game</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Outcome</th>
                  <th className="px-4 py-3 rounded-tr-lg">Created At</th>
                </tr>
              </thead>
              <tbody>
                {recentSessions.map((s) => (
                  <tr key={s.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-mono">{s.id}</td>
                    <td className="px-4 py-3 uppercase">{s.gameName}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        s.status === 'COMPLETED' ? 'bg-green-500/10 text-green-400' :
                        s.status === 'BETTING' ? 'bg-blue-500/10 text-blue-400' :
                        'bg-orange-500/10 text-orange-400'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{s.resultOutcome || '-'}</td>
                    <td className="px-4 py-3">{new Date(s.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-[#131824] rounded-xl border border-gray-800 p-6">
          <h3 className="text-lg font-bold text-gray-300 mb-4">Live Bet Audit</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="text-xs text-gray-500 uppercase bg-gray-900/50">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Time</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Game</th>
                  <th className="px-4 py-3">Session</th>
                  <th className="px-4 py-3">Bet Amt</th>
                  <th className="px-4 py-3">Mult/Choice</th>
                  <th className="px-4 py-3">Payout</th>
                  <th className="px-4 py-3 rounded-tr-lg">Result</th>
                </tr>
              </thead>
              <tbody>
                {recentBets.map((b) => (
                  <tr key={b.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="px-4 py-3 whitespace-nowrap">{new Date(b.createdAt).toLocaleTimeString()}</td>
                    <td className="px-4 py-3 font-mono text-gray-300">{b.user?.systematicId || 'Unknown'}</td>
                    <td className="px-4 py-3 uppercase">{b.gameName}</td>
                    <td className="px-4 py-3 font-mono text-xs">{b.sessionId}</td>
                    <td className="px-4 py-3 text-white font-bold">₹{b.betAmount.toFixed(2)}</td>
                    <td className="px-4 py-3">{b.multiplier ? `${b.multiplier}x` : '-'}</td>
                    <td className="px-4 py-3 font-bold text-emerald-400">
                       {b.payoutAmount > 0 ? `+₹${b.payoutAmount.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        b.winLossStatus === 'WIN' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {b.winLossStatus}
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
