"use client";

import { Users, CreditCard, ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/store/currencyStore";

type ChartData = {
  name: string;
  revenue: number;
  payouts: number;
};

type DashboardClientProps = {
  totalUsers: number;
  totalDeposits7d: number;
  totalWithdrawals7d: number;
  netGGR: number;
  chartData: ChartData[];
};

export default function DashboardClient({
  totalUsers,
  totalDeposits7d,
  totalWithdrawals7d,
  netGGR,
  chartData
}: DashboardClientProps) {
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
          </div>
          <h3 className="text-gray-400 text-sm font-bold uppercase mb-1">Total Users</h3>
          <p className="text-3xl font-black text-white">{totalUsers.toLocaleString()}</p>
        </div>

        <div className="bg-[#11111a] border border-[#1f1f2e] p-5 rounded-2xl shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <h3 className="text-gray-400 text-sm font-bold uppercase mb-1">Total Deposits (7d)</h3>
          <p className="text-3xl font-black text-white">{formatCurrency(totalDeposits7d, 'INR')}</p>
        </div>

        <div className="bg-[#11111a] border border-[#1f1f2e] p-5 rounded-2xl shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-orange-400" />
            </div>
          </div>
          <h3 className="text-gray-400 text-sm font-bold uppercase mb-1">Total Withdrawals (7d)</h3>
          <p className="text-3xl font-black text-white">{formatCurrency(totalWithdrawals7d, 'INR')}</p>
        </div>

        <div className="bg-[#11111a] border border-[#1f1f2e] p-5 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-purple-500/20 blur-2xl rounded-full"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <h3 className="text-gray-400 text-sm font-bold uppercase mb-1 relative z-10">Net GGR (Deposits - Withdrawals)</h3>
          <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 relative z-10">
            {formatCurrency(netGGR, 'INR')}
          </p>
        </div>

      </div>

      {/* Charts Section */}
      <div className="bg-[#11111a] border border-[#1f1f2e] p-6 rounded-2xl shadow-lg">
        <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wider">Revenue vs Payouts (Last 7 Days)</h3>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                formatter={(value: any) => [formatCurrency(Number(value) || 0, 'INR'), '']}
              />
              <Area type="monotone" dataKey="revenue" name="Deposits" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
              <Area type="monotone" dataKey="payouts" name="Withdrawals" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorPayouts)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
