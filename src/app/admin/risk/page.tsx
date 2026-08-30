"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, Save, AlertTriangle, CheckCircle } from "lucide-react";

export default function AdminRiskPage() {
  const [aviatorRTP, setAviatorRTP] = useState(97);
  const [minesRTP, setMinesRTP] = useState(96.5);
  const [k3RTP, setK3RTP] = useState(98);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const fetchRTP = async () => {
      try {
        const res = await fetch("/api/admin/risk");
        if (res.ok) {
          const data = await res.json();
          setAviatorRTP(data.aviatorRTP);
          setMinesRTP(data.minesRTP);
          setK3RTP(data.k3RTP);
        }
      } catch (error) {
        console.error("Failed to fetch RTP settings");
      } finally {
        setLoading(false);
      }
    };
    fetchRTP();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aviatorRTP, minesRTP, k3RTP }),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Global RTP settings updated successfully.' });
      } else {
        setMessage({ type: 'error', text: 'Failed to update settings.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while saving.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-400">Loading risk parameters...</div>;
  }
  
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wider flex items-center">
            <ShieldAlert className="w-6 h-6 mr-2 text-red-500" />
            Risk Management
          </h1>
          <p className="text-gray-400 text-sm mt-1">Control game RTP (Return to Player) and monitor high-risk accounts.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold flex items-center transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4 mr-2" /> {saving ? "Saving..." : "Save Global Settings"}
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span className="font-bold">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* RTP Controller */}
        <div className="bg-[#11111a] border border-[#1f1f2e] p-6 rounded-2xl shadow-lg">
          <h2 className="text-lg font-bold text-white mb-6 uppercase tracking-wider border-b border-[#1f1f2e] pb-3">RTP Controller</h2>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-bold text-gray-300">Aviator Target RTP</label>
                <span className="text-blue-400 font-mono font-bold">{aviatorRTP}%</span>
              </div>
              <input type="range" min="80" max="99" step="0.1" value={aviatorRTP} onChange={e => setAviatorRTP(Number(e.target.value))} className="w-full accent-blue-500" />
              <p className="text-xs text-gray-500 mt-1">Controls the crash curve generation probability.</p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-bold text-gray-300">Mines Target RTP</label>
                <span className="text-emerald-400 font-mono font-bold">{minesRTP}%</span>
              </div>
              <input type="range" min="80" max="99" step="0.1" value={minesRTP} onChange={e => setMinesRTP(Number(e.target.value))} className="w-full accent-emerald-500" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-bold text-gray-300">K3 Lottery Target RTP</label>
                <span className="text-purple-400 font-mono font-bold">{k3RTP}%</span>
              </div>
              <input type="range" min="80" max="99" step="0.1" value={k3RTP} onChange={e => setK3RTP(Number(e.target.value))} className="w-full accent-purple-500" />
            </div>
          </div>
        </div>

        {/* Security Alerts */}
        <div className="bg-[#11111a] border border-red-900/50 p-6 rounded-2xl shadow-lg">
          <h2 className="text-lg font-bold text-red-400 mb-6 uppercase tracking-wider border-b border-[#1f1f2e] pb-3 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" /> Security Alerts
          </h2>
          
          <div className="space-y-4">
            <div className="bg-red-950/30 border border-red-900/50 p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-red-400 font-bold text-sm">Suspicious Win Pattern</h4>
                  <p className="text-xs text-gray-400 mt-1">User <span className="font-mono text-white">FURY-8812</span> has won 15 consecutive Aviator rounds above 10x.</p>
                </div>
                <button className="text-xs bg-red-600 text-white px-2 py-1 rounded">Investigate</button>
              </div>
            </div>

            <div className="bg-orange-950/30 border border-orange-900/50 p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-orange-400 font-bold text-sm">Multiple Accounts IP</h4>
                  <p className="text-xs text-gray-400 mt-1">3 new accounts created from IP 192.168.1.105 within 10 minutes.</p>
                </div>
                <button className="text-xs bg-orange-600 text-white px-2 py-1 rounded">View Logs</button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
