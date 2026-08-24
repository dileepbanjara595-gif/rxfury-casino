"use client";

import { useState } from "react";
import { useUserStore } from "@/store/userStore";
import { useCurrencyStore, formatCurrency, convertFromBase, CURRENCY_SYMBOLS } from "@/store/currencyStore";
import { Network, Search, ArrowLeft, Users, Filter, Download } from "lucide-react";
import Link from "next/link";

const fullDummyDownline = [
  { id: 1, userId: "FURY-92B1C", tier: "L1", registeredAt: "2026-08-20", turnover: 25000, commission: 500, status: "Active" },
  { id: 2, userId: "FURY-14A9F", tier: "L2", registeredAt: "2026-08-21", turnover: 10000, commission: 100, status: "Active" },
  { id: 3, userId: "FURY-88D2E", tier: "L1", registeredAt: "2026-08-22", turnover: 5000, commission: 100, status: "Inactive" },
  { id: 4, userId: "FURY-33C4A", tier: "L3", registeredAt: "2026-08-22", turnover: 40000, commission: 200, status: "Active" },
  { id: 5, userId: "FURY-71E5B", tier: "L2", registeredAt: "2026-08-23", turnover: 8500, commission: 85, status: "Active" },
  { id: 6, userId: "FURY-99X2Z", tier: "L1", registeredAt: "2026-08-23", turnover: 12000, commission: 240, status: "Active" },
  { id: 7, userId: "FURY-44P9Q", tier: "L3", registeredAt: "2026-08-24", turnover: 0, commission: 0, status: "Inactive" },
  { id: 8, userId: "FURY-11K5M", tier: "L2", registeredAt: "2026-08-24", turnover: 3000, commission: 30, status: "Active" },
];

export default function AffiliateNetworkPage() {
  const { user } = useUserStore();
  const { activeCurrency } = useCurrencyStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTier, setActiveTier] = useState<"All" | "L1" | "L2" | "L3">("All");

  const filteredDownline = fullDummyDownline.filter(row => {
    const matchesSearch = row.userId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = activeTier === "All" || row.tier === activeTier;
    return matchesSearch && matchesTier;
  });

  return (
    <div className="min-h-screen bg-[#0a0f16] text-white pt-24 pb-16 font-sans">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Navigation & Header */}
        <div className="flex items-center mb-8">
          <Link href="/affiliate" className="p-2 mr-4 bg-[#131824] hover:bg-gray-800 border border-gray-700 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-wider flex items-center">
              <Network className="w-6 h-6 mr-3 text-blue-500" />
              Full <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600 ml-2">Network</span>
            </h1>
            <p className="text-gray-400 text-sm mt-1">Manage and track your entire 3-tier affiliate downline.</p>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-[#131824] border border-gray-800 rounded-2xl p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search by User ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0a0f16] border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-gray-400 hidden md:block mr-1" />
            {['All', 'L1', 'L2', 'L3'].map(tier => (
              <button 
                key={tier}
                onClick={() => setActiveTier(tier as any)}
                className={`px-4 py-2 text-sm font-bold rounded-lg border transition-colors flex-1 md:flex-none ${
                  activeTier === tier 
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' 
                    : 'bg-[#0a0f16] text-gray-400 border-gray-700 hover:border-gray-500'
                }`}
              >
                {tier}
              </button>
            ))}
            <button className="p-2 ml-2 bg-[#0a0f16] hover:bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors" title="Export CSV">
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Network Table */}
        <div className="bg-[#131824] border border-gray-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-[#0a0f16] border-b border-gray-800 text-gray-500 uppercase text-xs font-semibold">
                <tr>
                  <th className="px-6 py-5">User ID</th>
                  <th className="px-6 py-5">Network Tier</th>
                  <th className="px-6 py-5">Registration Date</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5 text-right">Turnover Amount</th>
                  <th className="px-6 py-5 text-right">Commission Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {filteredDownline.length > 0 ? (
                  filteredDownline.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-5 font-mono text-white whitespace-nowrap flex items-center">
                        <Users className="w-4 h-4 mr-2 text-gray-500" />
                        {row.userId}
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                          row.tier === 'L1' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                          row.tier === 'L2' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 
                          'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {row.tier}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-gray-300">{row.registeredAt}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-2 ${row.status === 'Active' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                          <span className={row.status === 'Active' ? 'text-gray-300' : 'text-gray-500'}>{row.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right font-medium text-white">
                        {CURRENCY_SYMBOLS[activeCurrency]} {formatCurrency(convertFromBase(row.turnover, activeCurrency), activeCurrency)}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className="text-green-400 font-bold">+ {CURRENCY_SYMBOLS[activeCurrency]} {formatCurrency(convertFromBase(row.commission, activeCurrency), activeCurrency)}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No network activity found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Mock */}
          <div className="bg-[#0a0f16] border-t border-gray-800 px-6 py-4 flex items-center justify-between text-sm">
            <p className="text-gray-500">Showing <span className="text-gray-300 font-bold">{filteredDownline.length}</span> entries</p>
            <div className="flex gap-2">
              <button disabled className="px-3 py-1 rounded-md bg-gray-800/50 text-gray-500 cursor-not-allowed">Previous</button>
              <button className="px-3 py-1 rounded-md bg-blue-600 text-white font-medium">1</button>
              <button className="px-3 py-1 rounded-md bg-[#131824] hover:bg-gray-800 text-gray-300 transition-colors">2</button>
              <button className="px-3 py-1 rounded-md bg-[#131824] hover:bg-gray-800 text-gray-300 transition-colors">Next</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
