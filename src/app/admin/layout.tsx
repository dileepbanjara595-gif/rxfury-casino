import { ReactNode } from "react";
import Link from "next/link";
import { LayoutDashboard, Users, CreditCard, ShieldAlert, LogOut, Bell, Settings } from "lucide-react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-[#0a0a0f] text-gray-100 overflow-hidden font-sans">
      
      {/* Sidebar */}
      <aside className="w-64 bg-[#11111a] border-r border-[#1f1f2e] flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-[#1f1f2e]">
          <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 tracking-wider">
            RXFURY ADMIN
          </span>
        </div>
        
        <nav className="flex-grow p-4 space-y-2">
          <Link href="/admin" className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-blue-600/10 text-blue-400 border border-blue-500/20 hover:bg-blue-600/20 transition-colors">
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-bold text-sm">Dashboard</span>
          </Link>
          
          <Link href="/admin/users" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-[#1a1a2e] hover:text-gray-200 transition-colors">
            <Users className="w-5 h-5" />
            <span className="font-bold text-sm">User Management</span>
          </Link>

          <Link href="/admin/transactions" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-[#1a1a2e] hover:text-gray-200 transition-colors">
            <CreditCard className="w-5 h-5" />
            <span className="font-bold text-sm">Payment Queue</span>
          </Link>

          <Link href="/admin/risk" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-[#1a1a2e] hover:text-gray-200 transition-colors">
            <ShieldAlert className="w-5 h-5" />
            <span className="font-bold text-sm">Risk Management</span>
          </Link>
        
          <Link href="/admin/funds" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-[#1a1a2e] hover:text-gray-200 transition-colors">
            <CreditCard className="w-5 h-5" />
            <span className="font-bold text-sm">Manual Funds</span>
          </Link>

          <Link href="/admin/games" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-[#1a1a2e] hover:text-gray-200 transition-colors">
            <ShieldAlert className="w-5 h-5" />
            <span className="font-bold text-sm">Game History</span>
          </Link>
</nav>

        <div className="p-4 border-t border-[#1f1f2e]">
          <Link href="/" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-500 hover:bg-red-900/20 hover:text-red-400 transition-colors">
            <LogOut className="w-5 h-5" />
            <span className="font-bold text-sm">Exit Admin</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col min-w-0">
        
        {/* Topbar */}
        <header className="h-16 bg-[#11111a] border-b border-[#1f1f2e] flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
          <div className="flex items-center text-gray-400">
            <span className="font-mono text-xs bg-gray-800 px-2 py-1 rounded border border-gray-700">SUPER ADMIN PRIVILEGES</span>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-gray-400 hover:text-white transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            </button>
            <Link href="/admin/settings" className="text-gray-400 hover:text-white transition-colors">
              <Settings className="w-5 h-5" />
            </Link>
            <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-emerald-500 rounded-full border-2 border-[#1f1f2e]"></div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-grow overflow-auto p-6 bg-[#0a0a0f]">
          {children}
        </main>
      </div>

    </div>
  );
}
