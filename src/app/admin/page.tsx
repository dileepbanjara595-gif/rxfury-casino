"use client";

import { Users, CreditCard, ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const mockRevenueData = [
  { name: 'Mon', revenue: 4000, payouts: 2400 },
  { name: 'Tue', revenue: 3000, payouts: 1398 },
  { name: 'Wed', revenue: 2000, payouts: 9800 },
  { name: 'Thu', revenue: 2780, payouts: 3908 },
  { name: 'Fri', revenue: 1890, payouts: 4800 },
  { name: 'Sat', revenue: 2390, payouts: 3800 },
  { name: 'Sun', revenue: 3490, payouts: 4300 },
];

export default function AdminDashboardPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wider">Overview Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Platform performance metrics for the last 7 days.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-[#11111a] border border-[#1f1f2e] p-5 rounded-2xl shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <span className="flex items-center text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">
              <ArrowUpRight className="w-3 h-3 mr-1" /> +12%
            </span>
          </div>
          <h3 className="text-gray-400 text-sm font-bold uppercase mb-1">Total Users</h3>
          <p className="text-3xl font-black text-white">24,592</p>
        </div>

        <div className="bg-[#11111a] border border-[#1f1f2e] p-5 rounded-2xl shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="flex items-center text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">
              <ArrowUpRight className="w-3 h-3 mr-1" /> +8.4%
            </span>
          </div>
          <h3 className="text-gray-400 text-sm font-bold uppercase mb-1">Total Deposits (7d)</h3>
          <p className="text-3xl font-black text-white">₹14.2M</p>
        </div>

        <div className="bg-[#11111a] border border-[#1f1f2e] p-5 rounded-2xl shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-orange-400" />
            </div>
            <span className="flex items-center text-xs font-bold text-red-400 bg-red-400/10 px-2 py-1 rounded">
              <ArrowDownRight className="w-3 h-3 mr-1" /> -2.1%
            </span>
          </div>
          <h3 className="text-gray-400 text-sm font-bold uppercase mb-1">Total Withdrawals (7d)</h3>
          <p className="text-3xl font-black text-white">₹8.9M</p>
        </div>

        <div className="bg-[#11111a] border border-[#1f1f2e] p-5 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-purple-500/20 blur-2xl rounded-full"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-purple-400" />
            </div>
            <span className="flex items-center text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">
              <ArrowUpRight className="w-3 h-3 mr-1" /> +24%
            </span>
          </div>
          <h3 className="text-gray-400 text-sm font-bold uppercase mb-1 relative z-10">Net GGR (Gross Gaming Rev)</h3>
          <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 relative z-10">₹5.3M</p>
        </div>

      </div>

      {/* Charts Section */}
      <div className="bg-[#11111a] border border-[#1f1f2e] p-6 rounded-2xl shadow-lg">
        <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wider">Revenue vs Payouts</h3>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockRevenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPayouts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="name" stroke="#4b5563" tick={{fill: '#6b7280', fontSize: 12}} axisLine={false} tickLine={false} />
              <YAxis stroke="#4b5563" tick={{fill: '#6b7280', fontSize: 12}} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value/1000}k`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px' }}
                itemStyle={{ fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
              <Area type="monotone" dataKey="payouts" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorPayouts)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
