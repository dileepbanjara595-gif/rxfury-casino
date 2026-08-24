"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Copy, CheckCircle, Wallet, RefreshCw } from "lucide-react";
import Link from "next/link";
import QRCode from "react-qr-code";

const UPI_ID = "abhay-271@pytes";
const PRESET_AMOUNTS = [500, 1000, 5000, 10000];

export default function DepositPage() {
  const [amount, setAmount] = useState<number | "">("");
  const [utr, setUtr] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [showQR, setShowQR] = useState(false);
  const [timeLeft, setTimeLeft] = useState(240); // 4 minutes

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showQR && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showQR, timeLeft]);

  const handleCopy = () => {
    navigator.clipboard.writeText(UPI_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateQR = () => {
    setErrorMsg("");
    if (!amount || amount < 100) {
      setErrorMsg("Minimum deposit amount is ₹100");
      return;
    }
    setShowQR(true);
    setTimeLeft(240); // Reset timer to 4 mins
  };

  const handleRefreshQR = () => {
    setTimeLeft(240);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!amount || amount < 100) {
      setErrorMsg("Minimum deposit amount is ₹100");
      return;
    }
    if (utr.length < 12) {
      setErrorMsg("Please enter a valid 12-digit UTR number");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, utr })
      });
      const data = await res.json();

      if (res.ok) {
        setSuccessMsg("Deposit submitted! Balance will reflect after admin verification.");
        setAmount("");
        setUtr("");
        setShowQR(false); // Reset flow
      } else {
        setErrorMsg(data.error || "Deposit failed");
      }
    } catch (err) {
      setErrorMsg("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeString = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  const qrValue = `upi://pay?pa=${UPI_ID}&pn=RXFURY&am=${amount}&cu=INR`;

  return (
    <div className="min-h-screen bg-[#1a1d29] text-white font-sans selection:bg-yellow-500/30">
      <header className="h-[70px] bg-white/5 border-b border-white/10 px-4 flex items-center shrink-0 backdrop-blur-md sticky top-0 z-10">
        <Link href="/wallet" className="text-gray-400 hover:text-white transition-colors mr-4">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <Wallet className="w-6 h-6 text-yellow-500 mr-2" />
        <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 uppercase tracking-widest">
          Add Funds
        </h1>
      </header>

      <main className="max-w-xl mx-auto p-4 md:p-8 space-y-8 mt-4 relative z-0">
        
        {/* Background glow */}
        <div className="absolute top-20 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>
        
        {successMsg && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-4 rounded-2xl flex items-start gap-3 shadow-lg">
            <CheckCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <p className="font-bold tracking-wide">{successMsg}</p>
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl font-bold tracking-wide shadow-lg">
            {errorMsg}
          </div>
        )}

        {/* Step 1: Amount */}
        <div className="bg-white/5 border border-white/10 p-6 md:p-8 rounded-3xl shadow-2xl backdrop-blur-md">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">1. Select Amount</h2>
          <div className="grid grid-cols-4 gap-2 mb-6">
            {PRESET_AMOUNTS.map(amt => (
              <button
                key={amt}
                type="button"
                onClick={() => setAmount(amt)}
                disabled={showQR}
                className={`py-3 rounded-xl font-bold border transition-all ${
                  amount === amt 
                    ? "bg-yellow-500/20 border-yellow-500 text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]" 
                    : "bg-black/40 border-white/10 text-gray-400 hover:border-white/30 disabled:opacity-50"
                }`}
              >
                ₹{amt}
              </button>
            ))}
          </div>
          <div className="relative mb-6">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">₹</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value) || "")}
              disabled={showQR}
              placeholder="Enter Custom Amount"
              className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-10 pr-4 text-white text-lg font-black focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all disabled:opacity-50"
            />
          </div>
          
          {!showQR && (
            <button
              onClick={handleGenerateQR}
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-black uppercase tracking-widest py-4 rounded-2xl shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-all"
            >
              Generate QR & Pay
            </button>
          )}
        </div>

        {/* Step 2 & 3: Hidden until Generate QR is clicked */}
        {showQR && (
          <div className="space-y-8 animate-in slide-in-from-top-4 duration-500">
            {/* Step 2: Payment Gateway Interface */}
            <div className="bg-white/5 border border-white/10 p-6 md:p-8 rounded-3xl shadow-2xl backdrop-blur-md flex flex-col items-center relative overflow-hidden">
              <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest w-full mb-6 text-center">2. Scan & Pay</h2>
              
              <div className="text-center mb-6">
                <p className="text-sm text-gray-300 font-bold tracking-wide">
                  Please complete your payment within <span className={`text-xl ml-2 font-mono ${timeLeft <= 60 ? 'text-red-400 animate-pulse' : 'text-yellow-500'}`}>{timeString}</span>
                </p>
              </div>

              <div className="relative w-56 h-56 flex items-center justify-center mb-8">
                {/* Timer Expired State */}
                {timeLeft === 0 ? (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center z-20 border border-red-500/30">
                    <p className="text-red-400 font-bold mb-4 text-center px-4">QR Code Expired.<br/>Please generate a new one.</p>
                    <button 
                      onClick={handleRefreshQR}
                      className="flex items-center space-x-2 bg-yellow-500 text-black px-4 py-2 rounded-xl font-bold hover:bg-yellow-400 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Refresh</span>
                    </button>
                  </div>
                ) : null}
                
                {/* Real QR Code */}
                <div className={`bg-white p-4 rounded-2xl shadow-[0_0_30px_rgba(234,179,8,0.2)] ${timeLeft === 0 ? 'blur-sm opacity-50' : ''} transition-all duration-300`}>
                  <QRCode
                    value={qrValue}
                    size={192}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    viewBox={`0 0 256 256`}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 bg-black/40 border border-white/10 px-4 py-3 rounded-2xl w-full">
                <div className="flex-grow">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Payee UPI ID</p>
                  <p className="font-mono font-bold text-yellow-500 tracking-wider text-base md:text-lg">{UPI_ID}</p>
                </div>
                <button
                  onClick={handleCopy}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-colors flex items-center justify-center border border-white/5"
                >
                  {copied ? <CheckCircle className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Step 3: UTR Submission */}
            <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 p-6 md:p-8 rounded-3xl shadow-2xl backdrop-blur-md">
              <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">3. Verify Payment</h2>
              <p className="text-xs text-gray-400 mb-6 font-medium leading-relaxed">
                After transferring exactly <span className="text-yellow-500 font-bold">₹{amount}</span>, enter the 12-digit UTR / Reference Number generated by your bank app to process your deposit.
              </p>
              
              <input
                type="text"
                value={utr}
                onChange={(e) => setUtr(e.target.value)}
                placeholder="Enter 12-Digit UTR"
                maxLength={12}
                className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-white font-mono text-lg uppercase focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all mb-6 tracking-widest"
                required
              />

              <button
                type="submit"
                disabled={loading || timeLeft === 0}
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-black uppercase tracking-widest py-4 rounded-2xl shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-all disabled:opacity-50 disabled:shadow-none"
              >
                {loading ? "Submitting..." : "Submit Payment for Verification"}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

