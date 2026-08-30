"use client";

import { Settings, Save, Server, Globe, Key } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-500" />
            Platform Settings
          </h1>
          <p className="text-gray-400 text-sm mt-1">Configure global platform variables and integrations.</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold flex items-center transition-colors">
          <Save className="w-4 h-4 mr-2" /> Save Configuration
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        
        {/* General Settings */}
        <div className="bg-[#11111a] border border-[#1f1f2e] p-6 rounded-2xl shadow-lg">
          <h2 className="text-lg font-bold text-white mb-6 uppercase tracking-wider border-b border-[#1f1f2e] pb-3 flex items-center gap-2">
            <Globe className="w-5 h-5 text-gray-400" /> General
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-1">Platform Name</label>
              <input type="text" defaultValue="RXFURY" className="w-full bg-black border border-gray-800 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-1">Support Email</label>
              <input type="email" defaultValue="team@rxfurygame.com" className="w-full bg-black border border-gray-800 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none" />
            </div>
          </div>
        </div>

        {/* API Keys */}
        <div className="bg-[#11111a] border border-[#1f1f2e] p-6 rounded-2xl shadow-lg">
          <h2 className="text-lg font-bold text-white mb-6 uppercase tracking-wider border-b border-[#1f1f2e] pb-3 flex items-center gap-2">
            <Key className="w-5 h-5 text-gray-400" /> Payment Integrations (Rhino)
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-1">Rhino API Key</label>
              <input type="password" defaultValue="rhino_live_xxxxxxx" className="w-full bg-black border border-gray-800 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none font-mono" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-1">Rhino Webhook Secret</label>
              <input type="password" defaultValue="whsec_xxxxxxx" className="w-full bg-black border border-gray-800 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none font-mono" />
            </div>
          </div>
        </div>

        {/* System */}
        <div className="bg-[#11111a] border border-[#1f1f2e] p-6 rounded-2xl shadow-lg">
          <h2 className="text-lg font-bold text-white mb-6 uppercase tracking-wider border-b border-[#1f1f2e] pb-3 flex items-center gap-2">
            <Server className="w-5 h-5 text-gray-400" /> Maintenance Mode
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-bold">Enable Maintenance Mode</p>
              <p className="text-sm text-gray-500">Only Admins can access the site. Users will see a maintenance screen.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

      </div>
    </div>
  );
}
