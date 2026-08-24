"use client";

import { useState, useEffect } from "react";
import { Search, MoreVertical, Edit, Ban, ExternalLink, RefreshCw } from "lucide-react";
import { useUserStore } from "@/store/userStore";

export default function AdminUsersPage() {
  const { session } = useUserStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/admin/users");
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        }
      } catch (error) {
        console.error("Error fetching users", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wider">User Management</h1>
          <p className="text-gray-400 text-sm mt-1">View, edit, and manage registered players.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search by ID or Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-[#11111a] border border-[#1f1f2e] rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 w-64"
          />
        </div>
      </div>

      <div className="bg-[#11111a] border border-[#1f1f2e] rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="text-xs text-gray-500 uppercase bg-[#0a0a0f] border-b border-[#1f1f2e]">
              <tr>
                <th className="px-6 py-4 font-bold">Systematic ID</th>
                <th className="px-6 py-4 font-bold">Contact</th>
                <th className="px-6 py-4 font-bold text-right">Main Wallet</th>
                <th className="px-6 py-4 font-bold text-right">Bonus Wallet</th>
                <th className="px-6 py-4 font-bold text-center">VIP Tier</th>
                <th className="px-6 py-4 font-bold text-center">Role</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f1f2e]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2" />
                    Loading Users...
                  </td>
                </tr>
              ) : users.filter(u => u.systematicId.toLowerCase().includes(searchTerm.toLowerCase()) || (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()))).map((user, idx) => (
                <tr key={idx} className="hover:bg-[#161622] transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-blue-400">{user.systematicId}</td>
                  <td className="px-6 py-4">{user.email || user.phone || 'N/A'}</td>
                  <td className="px-6 py-4 text-right font-bold text-white">₹{Number(user.mainWalletBalance).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                  <td className="px-6 py-4 text-right text-gray-400">₹{Number(user.bonusWalletBalance).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2 py-1 rounded text-xs font-black">
                      L{user.vipLevel || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-bold border ${user.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2">
                      <button className="p-1.5 bg-gray-800 hover:bg-blue-600/20 text-gray-400 hover:text-blue-400 rounded transition-colors" title="Edit Wallet">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded transition-colors" title="Affiliate Tree">
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 bg-gray-800 hover:bg-red-900/40 text-gray-400 hover:text-red-400 rounded transition-colors" title="Ban User">
                        <Ban className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
