"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, Save, AlertTriangle, CheckCircle } from "lucide-react";

export default function AdminRiskPage() {
  const [settings, setSettings] = useState({
    aviator_new_rtp: 50, aviator_old_rtp: 30,
    mines_new_rtp: 50, mines_old_rtp: 30,
    k3_new_rtp: 50, k3_old_rtp: 30
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const fetchRTP = async () => {
      try {
        const res = await fetch("/api/admin/risk");
        if (res.ok) {
          const data = await res.json();
          setSettings(prev => ({ ...prev, ...data }));
        }
      } catch (error) {
        console.error("Failed to fetch RTP settings");
      } finally {
        setLoading(false);
      }
    };
    fetchRTP();
  }, []);

  const handleChange = (key: keyof typeof settings, value: number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Global RTP settings updated successfully.' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update settings.' });
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

  const renderGameControl = (title: string, gameKey: 'aviator' | 'mines' | 'k3', colorClass: string, accentClass: string) => (
    <div className="space-y-6 pt-4 border-t border-[#1f1f2e] mt-4">
      <h3 className={`text-sm font-bold uppercase tracking-wider ${colorClass}`}>{title} Target RTP</h3>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase">New User (Rounds 1-3)</label>
            <span className={`font-mono font-bold ${colorClass}`}>{settings[`${gameKey}_new_rtp` as keyof typeof settings]}%</span>
          </div>
          <input type="range" min="10" max="90" step="1" 
            value={settings[`${gameKey}_new_rtp` as keyof typeof settings]} 
            onChange={e => handleChange(`${gameKey}_new_rtp` as keyof typeof settings, Number(e.target.value))} 
            className={`w-full ${accentClass}`} 
          />
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Old User (Rounds 4+)</label>
            <span className={`font-mono font-bold ${colorClass}`}>{settings[`${gameKey}_old_rtp` as keyof typeof settings]}%</span>
          </div>
          <input type="range" min="10" max="90" step="1" 
            value={settings[`${gameKey}_old_rtp` as keyof typeof settings]} 
            onChange={e => handleChange(`${gameKey}_old_rtp` as keyof typeof settings, Number(e.target.value))} 
            className={`w-full ${accentClass}`} 
          />
        </div>
      </div>
    </div>
  );
  
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
          <h2 className="text-lg font-bold text-white mb-2 uppercase tracking-wider pb-3">RTP Controller</h2>
          <p className="text-xs text-gray-500 mb-6">Strictly enforce mathematical winning probabilities. Slider ranges restricted to 10% - 90%.</p>
          
          <div className="space-y-2 mt-2">
            {renderGameControl("Aviator", "aviator", "text-blue-400", "accent-blue-500")}
            {renderGameControl("Mines", "mines", "text-emerald-400", "accent-emerald-500")}
            {renderGameControl("K3 Lottery", "k3", "text-purple-400", "accent-purple-500")}
          </div>
        </div>

        {/* Security Alerts */}
        <div className="bg-[#11111a] border border-red-900/50 p-6 rounded-2xl shadow-lg h-fit">
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
          </div>
        </div>

      </div>
    </div>
  );
}
