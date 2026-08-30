"use client";

import { useState, useEffect } from "react";
import { Search, Edit, Ban, Plus, RefreshCw, X } from "lucide-react";
import { useUserStore } from "@/store/userStore";

export default function AdminUsersPage() {
  const { session } = useUserStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"CREATE" | "EDIT">("CREATE");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    mainWalletBalance: 0,
    role: "USER"
  });

  const fetchUsers = async () => {
    setIsLoading(true);
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

  useEffect(() => {
    fetchUsers();
  }, []);

  const openCreate = () => {
    setModalMode("CREATE");
    setFormData({ email: "", password: "", mainWalletBalance: 0, role: "USER" });
    setIsModalOpen(true);
  };

  const openEdit = (user: any) => {
    setModalMode("EDIT");
    setCurrentUser(user);
    setFormData({ 
      email: user.email || "", 
      password: "", 
      mainWalletBalance: user.mainWalletBalance || 0,
      role: user.role 
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = "/api/admin/users";
      const method = modalMode === "CREATE" ? "POST" : "PUT";
      const body = modalMode === "CREATE" 
        ? formData 
        : { id: currentUser.id, ...formData };
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        fetchUsers();
      } else {
        alert("Failed to save user");
      }
    } catch (e) {
      alert("Error saving user");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this user?")) return;
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        fetchUsers();
      } else {
        alert("Failed to delete user");
      }
    } catch (e) {
      alert("Error deleting user");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wider">User Management</h1>
          <p className="text-gray-400 text-sm mt-1">View, edit, and manage registered players.</p>
        </div>
        <div className="flex gap-4 items-center">
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
          <button 
            onClick={openCreate}
            className="flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" /> New User
          </button>
        </div>
      </div>

      <div className="bg-[#11111a] border border-[#1f1f2e] rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="text-xs text-gray-500 uppercase bg-[#0a0a0f] border-b border-[#1f1f2e]">
              <tr>
                <th className="px-6 py-4 font-bold">Systematic ID</th>
                <th className="px-6 py-4 font-bold">Email</th>
                <th className="px-6 py-4 font-bold text-right">Main Wallet</th>
                <th className="px-6 py-4 font-bold text-center">Role</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f1f2e]">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2" />
                    Loading Users...
                  </td>
                </tr>
              ) : users.filter(u => u.systematicId.toLowerCase().includes(searchTerm.toLowerCase()) || (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()))).map((user, idx) => (
                <tr key={idx} className="hover:bg-[#161622] transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-blue-400">{user.systematicId}</td>
                  <td className="px-6 py-4">{user.email || 'N/A'}</td>
                  <td className="px-6 py-4 text-right font-bold text-white">,1{Number(user.mainWalletBalance).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-bold border ${user.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2">
                      <button onClick={() => openEdit(user)} className="p-1.5 bg-gray-800 hover:bg-blue-600/20 text-gray-400 hover:text-blue-400 rounded transition-colors" title="Edit User">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(user.id)} className="p-1.5 bg-gray-800 hover:bg-red-900/40 text-gray-400 hover:text-red-400 rounded transition-colors" title="Delete User">
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#11111a] border border-gray-800 w-full max-w-md rounded-2xl shadow-2xl relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X className="w-5 h-5"/></button>
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-xl font-bold text-white uppercase">{modalMode === "CREATE" ? "Create New User" : "Edit User"}</h2>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Email</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-[#0a0a0f] border border-gray-800 rounded-lg py-2 px-3 text-white focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Password {modalMode === "EDIT" && "(Leave blank to keep)"}</label>
                <input required={modalMode === "CREATE"} type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-[#0a0a0f] border border-gray-800 rounded-lg py-2 px-3 text-white focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Main Wallet Balance</label>
                <input type="number" step="0.01" value={formData.mainWalletBalance} onChange={e => setFormData({...formData, mainWalletBalance: parseFloat(e.target.value)})} className="w-full bg-[#0a0a0f] border border-gray-800 rounded-lg py-2 px-3 text-white focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Role</label>
                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full bg-[#0a0a0f] border border-gray-800 rounded-lg py-2 px-3 text-white focus:border-blue-500 outline-none">
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-800 text-white rounded-lg font-bold hover:bg-gray-700">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-500">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
