"use client";

import { useState, useEffect } from "react";
import { Settings, Save, Smartphone, Hash, Image as ImageIcon, CheckCircle, RefreshCw } from "lucide-react";

export default function AdminSettingsPage() {
  const [activeUpiId, setActiveUpiId] = useState("");
  const [upiQrUrl, setUpiQrUrl] = useState("");
  const [cryptoAddress, setCryptoAddress] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (res.ok) {
        setActiveUpiId(data.activeUpiId || "");
        setUpiQrUrl(data.upiQrUrl || "");
        setCryptoAddress(data.cryptoAddress || "");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activeUpiId, upiQrUrl, cryptoAddress })
      });
      if (res.ok) {
        setMessage("Settings successfully updated!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Failed to update settings.");
      }
    } catch (e) {
      setMessage("Error saving settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wider flex items-center">
            <Settings className="w-6 h-6 mr-3 text-red-500" /> Payment Gateway Settings
          </h1>
          <p className="text-gray-400 text-sm mt-1">Configure active deposit addresses and QR codes for user payments.</p>
        </div>
      </div>

      <div className="bg-[#11111a] border border-[#1f1f2e] rounded-2xl shadow-lg p-6 md:p-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <RefreshCw className="w-8 h-8 animate-spin mb-4" />
            <p>Loading configurations...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            
            {message && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl flex items-center gap-3">
                <CheckCircle className="w-5 h-5" />
                <span className="font-bold">{message}</span>
              </div>
            )}

            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white uppercase tracking-widest border-b border-gray-800 pb-2">Fiat Deposit (UPI)</h2>
              
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Active UPI ID</label>
                <div className="relative">
                  <Smartphone className="w-5 h-5 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={activeUpiId}
                    onChange={(e) => setActiveUpiId(e.target.value)}
                    placeholder="e.g. rxfury@ybl"
                    className="w-full bg-[#0a0a0f] border border-gray-800 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
                <p className="text-[10px] text-gray-600 mt-1">Users will see this UPI ID when attempting to deposit Fiat (INR).</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Static QR Image URL (Optional)</label>
                <div className="relative">
                  <ImageIcon className="w-5 h-5 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={upiQrUrl}
                    onChange={(e) => setUpiQrUrl(e.target.value)}
                    placeholder="https://example.com/qr.png"
                    className="w-full bg-[#0a0a0f] border border-gray-800 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
                <p className="text-[10px] text-gray-600 mt-1">If provided, this image will be shown. Otherwise, a QR code will be generated dynamically from the UPI ID.</p>
              </div>
            </div>

            <div className="space-y-4 pt-4 mt-6 border-t border-gray-800">
              <h2 className="text-lg font-bold text-white uppercase tracking-widest border-b border-gray-800 pb-2">Crypto Deposit (USDT TRC20)</h2>
              
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">USDT Deposit Address</label>
                <div className="relative">
                  <Hash className="w-5 h-5 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={cryptoAddress}
                    onChange={(e) => setCryptoAddress(e.target.value)}
                    placeholder="T..."
                    className="w-full bg-[#0a0a0f] border border-gray-800 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
                <p className="text-[10px] text-gray-600 mt-1">Users will send USDT to this address.</p>
              </div>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full md:w-auto px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl uppercase tracking-widest flex items-center justify-center transition-all disabled:opacity-50"
              >
                {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5 mr-2" /> Save Settings</>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
