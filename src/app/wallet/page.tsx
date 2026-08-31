"use client";

import { useEffect, useState } from "react";
import { useUserStore } from "@/store/userStore";
import { useRouter } from "next/navigation";
import { Wallet, ArrowDownLeft, ArrowUpRight, History, RefreshCw, CheckCircle2, Clock, XCircle, AlertCircle, Copy, FileText } from "lucide-react";
import { useCurrencyStore, CURRENCY_SYMBOLS, formatCurrency, convertFromBase, LIMITS } from "@/store/currencyStore";
import { QRCodeSVG } from "qrcode.react";

export default function WalletPage() {
  const { user, isLoading } = useUserStore();
  const { baseBalance, activeCurrency, fetchBalances } = useCurrencyStore();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");

  // Form states
  const [amount, setAmount] = useState<number | "">("");
  const [details, setDetails] = useState(""); // used for UTR, TxID, or Withdrawal Bank details
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  
  // Payment Gateway states
  const [showGateway, setShowGateway] = useState(false);
  const [settings, setSettings] = useState<any>({});
  const [txHistory, setTxHistory] = useState<any[]>([]);

  const currentBalance = convertFromBase(baseBalance, activeCurrency);
  const isCrypto = activeCurrency !== 'INR';

  // Dynamic limits
  const minDeposit = isCrypto ? LIMITS.MIN_CRYPTO_DEPOSIT_USD : LIMITS.MIN_FIAT_DEPOSIT_INR;
  const minWithdraw = isCrypto ? convertFromBase(LIMITS.MIN_FIAT_WITHDRAW_INR, activeCurrency) : LIMITS.MIN_FIAT_WITHDRAW_INR;

  const isDepositValid = amount !== "" && amount >= minDeposit;
  const isWithdrawValid = amount !== "" && amount >= minWithdraw && amount <= currentBalance && details.trim().length >= 5;
  const isGatewaySubmitValid = details.trim().length >= 5;

  const [dynamicCryptoAddress, setDynamicCryptoAddress] = useState<string>("");
  const [isLoadingCrypto, setIsLoadingCrypto] = useState(false);

  useEffect(() => {
    if (activeTab === 'deposit' && showGateway && isCrypto) {
      const fetchAddress = async () => {
        setIsLoadingCrypto(true);
        try {
          const res = await fetch('/api/rhino/deposit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user?.id || 'guest', asset: 'USDT', depositChains: ['TRON'] })
          });
          const data = await res.json();
          if (data.success) {
            setDynamicCryptoAddress(data.address);
          }
        } catch (e) {
          console.error("Rhino fetch error:", e);
        }
        setIsLoadingCrypto(false);
      };
      fetchAddress();
    }
  }, [showGateway, isCrypto, activeTab, user]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    // Fetch Settings
    fetch("/api/settings").then(r => r.json()).then(data => setSettings(data || {}));
    
    // Fetch User Transaction History
    if (user?.id) {
       fetch("/api/admin/transactions").then(r => r.json()).then(data => {
         // Since the admin endpoint returns all, we should really have a user-specific one,
         // but we can filter here for now if needed. 
         // Wait, /api/admin/transactions requires ADMIN role! I need to create a /api/wallet/history route.
       }).catch(e => console.error(e));
       // Quick inline fetch for user history
       fetchUserHistory();
    }
  }, [user]);

  const fetchUserHistory = async () => {
    try {
      const res = await fetch("/api/wallet/history");
      if (res.ok) {
        setTxHistory(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen pt-32 pb-12 px-4 flex items-center justify-center bg-[#0a0f16]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const handleDepositInit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDepositValid) return;
    setErrorMsg("");
    setSuccessMsg("");
    setShowGateway(true);
    setDetails(""); // Reset UTR/TxID
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isGatewaySubmitValid) return;
    
    setErrorMsg("");
    setSuccessMsg("");
    setIsSubmitting(true);
    
    try {
      const res = await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, utr: details }) // API expects 'utr' (used for TxID too)
      });
      const data = await res.json();
      
      if (res.ok) {
        setSuccessMsg("Deposit request submitted! Please wait for admin verification.");
        setAmount("");
        setDetails("");
        setShowGateway(false);
        fetchUserHistory();
      } else {
        setErrorMsg(data.error || "Deposit failed");
      }
    } catch (err) {
      setErrorMsg("Deposit submission error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isWithdrawValid) return;

    setErrorMsg("");
    setSuccessMsg("");
    setIsSubmitting(true);
    
    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, details })
      });
      const data = await res.json();

      if (res.ok) {
        setSuccessMsg("Withdrawal requested! Amount has been deducted and is pending admin approval.");
        fetchBalances(user.id);
        fetchUserHistory();
        setAmount("");
        setDetails("");
      } else {
        setErrorMsg(data.error || "Withdrawal failed");
      }
    } catch (err) {
      setErrorMsg("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  }

  return (
    <div className="min-h-screen pt-28 pb-20 bg-[#0a0f16] text-white">
      <div className="container mx-auto px-4 max-w-4xl">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-wider flex items-center">
              <Wallet className="w-8 h-8 mr-4 text-emerald-500" />
              Wallet Dashboard
            </h1>
            <p className="text-gray-400 mt-2 font-medium">Manage your funds securely across all currencies.</p>
          </div>
        </div>

        {/* Balance Card */}
        <div className="bg-[#131824] border border-gray-800 rounded-3xl p-8 shadow-2xl mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div>
              <p className="text-sm text-gray-400 uppercase tracking-widest font-bold mb-2">Total Available Balance ({activeCurrency})</p>
              <div className="flex items-center text-5xl font-black text-white drop-shadow-md">
                <span className="text-emerald-500 mr-2">{CURRENCY_SYMBOLS[activeCurrency]}</span> 
                {formatCurrency(currentBalance, activeCurrency)}
                <button onClick={() => fetchBalances(user.id)} className="ml-4 text-gray-500 hover:text-white transition-colors bg-white/5 p-2 rounded-full">
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Unified Wallet Forms (Tabs) */}
        <div className="bg-[#131824] border border-gray-800 rounded-3xl p-6 shadow-2xl mb-8">
          <div className="flex gap-4 mb-6 border-b border-gray-800 pb-4">
            <button
              onClick={() => { setActiveTab("deposit"); setShowGateway(false); setSuccessMsg(""); setErrorMsg(""); setAmount(""); }}
              className={`flex-1 flex items-center justify-center py-4 rounded-xl font-black uppercase tracking-widest transition-all ${activeTab === 'deposit' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-gray-800/50 text-gray-400 hover:text-white'}`}
            >
              <ArrowDownLeft className="w-5 h-5 mr-2" /> Deposit
            </button>
            <button
              onClick={() => { setActiveTab("withdraw"); setShowGateway(false); setSuccessMsg(""); setErrorMsg(""); setAmount(""); }}
              className={`flex-1 flex items-center justify-center py-4 rounded-xl font-black uppercase tracking-widest transition-all ${activeTab === 'withdraw' ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)]' : 'bg-gray-800/50 text-gray-400 hover:text-white'}`}
            >
              <ArrowUpRight className="w-5 h-5 mr-2" /> Withdraw
            </button>
          </div>

          {successMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500 text-emerald-400 p-4 rounded-xl flex items-start gap-3 mb-6">
              <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
              <p className="font-medium">{successMsg}</p>
            </div>
          )}

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-xl mb-6">
              {errorMsg}
            </div>
          )}

          {/* DEPOSIT FORM */}
          {activeTab === 'deposit' && !showGateway && (
            <form onSubmit={handleDepositInit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Deposit Amount ({activeCurrency})</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">{CURRENCY_SYMBOLS[activeCurrency]}</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value) || "")}
                    placeholder="0.00"
                    className={`w-full bg-[#0a0a0f] border ${amount !== "" && amount < minDeposit ? 'border-red-500' : 'border-gray-800'} rounded-xl py-4 pl-8 pr-4 text-white font-bold text-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all`}
                  />
                </div>
                {amount !== "" && amount < minDeposit && (
                  <p className="text-red-400 text-xs mt-2 font-bold flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Minimum deposit amount is {CURRENCY_SYMBOLS[activeCurrency]}{formatCurrency(minDeposit, activeCurrency)} {activeCurrency}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={!isDepositValid}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all disabled:opacity-50 disabled:shadow-none"
              >
                Proceed to Payment
              </button>
            </form>
          )}

          {/* DEPOSIT GATEWAY (FIAT OR CRYPTO) */}
          {activeTab === 'deposit' && showGateway && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="p-6 bg-gray-900 border border-gray-800 rounded-2xl flex flex-col items-center">
                <h2 className="text-xl font-bold uppercase mb-4 tracking-widest">
                  Scan & Pay {CURRENCY_SYMBOLS[activeCurrency]}{amount}
                </h2>
                
                {/* QR Code */}
                <div className="bg-white p-4 rounded-xl mb-6 inline-block">
                  {isCrypto ? (
                    isLoadingCrypto ? (
                    <div className="w-[160px] h-[160px] flex items-center justify-center">
                      <span className="text-emerald-500 font-bold uppercase text-xs animate-pulse">Loading Live Address...</span>
                    </div>
                  ) : (
                    <QRCodeSVG value={dynamicCryptoAddress || settings.cryptoAddress || "fallback"} size={160} />
                  )
                  ) : (
                    settings.upiQrUrl ? (
                      <img src={settings.upiQrUrl} alt="UPI QR" className="w-40 h-40 object-cover" />
                    ) : (
                      <QRCodeSVG value={`upi://pay?pa=${encodeURIComponent(settings.activeUpiId || "")}&pn=${encodeURIComponent("RXFURY")}&am=${amount}&cu=INR`} size={160} />
                    )
                  )}
                </div>

                <div className="w-full max-w-sm bg-[#0a0f16] border border-gray-800 p-4 rounded-xl flex items-center justify-between mb-2">
                   <div className="overflow-hidden">
                     <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{isCrypto ? 'USDT (TRC20) Address' : 'UPI ID'}</p>
                     <p className="text-sm font-mono text-emerald-400 truncate pr-4">
                       {isCrypto ? (isLoadingCrypto ? "Generating..." : dynamicCryptoAddress || settings.cryptoAddress) : settings.activeUpiId}
                     </p>
                   </div>
                   <button onClick={() => handleCopy(isCrypto ? settings.cryptoAddress : settings.activeUpiId)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg">
                     <Copy className="w-4 h-4" />
                   </button>
                </div>
              </div>

              <form onSubmit={handleDepositSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                    {isCrypto ? 'Transaction Hash (TxID)' : '12-Digit UTR Number'}
                  </label>
                  <div className="relative">
                    <FileText className="w-5 h-5 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      placeholder={isCrypto ? "Enter TxID..." : "e.g. 123456789012"}
                      className="w-full bg-[#0a0a0f] border border-gray-800 rounded-xl py-3 pl-11 pr-4 text-white font-mono focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <button type="button" onClick={() => setShowGateway(false)} className="flex-1 py-4 bg-gray-800 hover:bg-gray-700 font-bold rounded-xl uppercase">Back</button>
                  <button
                    type="submit"
                    disabled={!isGatewaySubmitValid || isSubmitting}
                    className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? "Submitting..." : "Verify Payment"}
                  </button>
                </div>
              </form>
            </div>
          )}


          {/* WITHDRAW FORM */}
          {activeTab === 'withdraw' && (
            <form onSubmit={handleWithdrawSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Withdrawal Amount ({activeCurrency})</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">{CURRENCY_SYMBOLS[activeCurrency]}</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value) || "")}
                    placeholder="0.00"
                    className={`w-full bg-[#0a0a0f] border ${(amount !== "" && (amount < minWithdraw || amount > currentBalance)) ? 'border-red-500' : 'border-gray-800'} rounded-xl py-4 pl-8 pr-4 text-white font-bold text-xl focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all`}
                  />
                </div>
                {amount !== "" && amount < minWithdraw && (
                  <p className="text-red-400 text-xs mt-2 font-bold flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Minimum withdrawal amount is {CURRENCY_SYMBOLS[activeCurrency]}{formatCurrency(minWithdraw, activeCurrency)} {activeCurrency}
                  </p>
                )}
                {amount !== "" && amount > currentBalance && (
                  <p className="text-red-400 text-xs mt-2 font-bold flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Amount exceeds available balance
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Payout Details ({isCrypto ? 'Crypto Address' : 'UPI ID'})
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder={isCrypto ? "Enter your USDT address (TRC20/ERC20)..." : "Enter your UPI ID (e.g. name@upi)..."}
                  rows={2}
                  className="w-full bg-[#0a0a0f] border border-gray-800 rounded-xl py-3 px-4 text-white font-mono focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={!isWithdrawValid || isSubmitting}
                className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all disabled:opacity-50 disabled:shadow-none"
              >
                {isSubmitting ? "Processing..." : "Submit Withdrawal"}
              </button>
            </form>
          )}
        </div>

        {/* Transaction History */}
        <div className="bg-[#131824] border border-gray-800 rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-800 flex items-center">
             <History className="w-5 h-5 text-gray-400 mr-3" />
             <h2 className="text-xl font-bold uppercase tracking-wider text-white">Recent Transactions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-[#0a0f16] border-b border-gray-800 text-gray-500 uppercase text-xs font-semibold">
                <tr>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Details</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {txHistory.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No transactions found</td></tr>
                ) : txHistory.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-5 font-bold text-white flex items-center">
                      {tx.type === 'DEPOSIT' 
                        ? <ArrowDownLeft className="w-4 h-4 mr-2 text-emerald-500" /> 
                        : <ArrowUpRight className="w-4 h-4 mr-2 text-orange-500" />
                      }
                      {tx.type}
                    </td>
                    <td className={`px-6 py-5 font-mono font-bold ${tx.type === 'DEPOSIT' ? 'text-emerald-400' : 'text-orange-400'}`}>
                      {tx.type === 'DEPOSIT' ? '+' : '-'} {tx.amount} {tx.currency || 'INR'}
                    </td>
                    <td className="px-6 py-5 text-gray-500 font-mono text-xs max-w-[120px] truncate">{tx.utrOrHash || "---"}</td>
                    <td className="px-6 py-5 text-right">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${
                        tx.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                        tx.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 
                        'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {tx.status === 'APPROVED' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {tx.status === 'PENDING' && <Clock className="w-3 h-3 mr-1" />}
                        {tx.status === 'REJECTED' && <XCircle className="w-3 h-3 mr-1" />}
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
