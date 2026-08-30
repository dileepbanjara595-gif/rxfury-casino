"use client";

import { useState, useEffect } from "react";
import { useDepositModalStore, TransactionType, ModalView } from "@/store/depositModalStore";
import { useUserStore } from "@/store/userStore";
import { useCurrencyStore, CURRENCY_SYMBOLS, formatCurrency, convertFromBase } from "@/store/currencyStore";
import { X, Copy, CheckCircle2, AlertCircle, ChevronLeft, QrCode, Smartphone, Building2, Banknote, Timer, ShieldAlert, ArrowDownLeft, ArrowUpRight, Bitcoin } from "lucide-react";
import QRCode from "react-qr-code";
import Image from "next/image";

// Constants
const FIAT_METHODS = [
  { id: "upi", name: "UPI / Unified Payments Interface", icon: "upi", type: "fiat", min: 500 },
  { id: "phonepe", name: "PhonePe", icon: "phonepe", type: "fiat", min: 500 },
  { id: "paytm", name: "Paytm", icon: "paytm", type: "fiat", min: 500 },
  { id: "gpay", name: "GPay", icon: "gpay", type: "fiat", min: 500 },
];

const CRYPTO_METHODS = [
  { id: "usdt_trc20", name: "USDT", network: "TRC20", symbol: "USDT", type: "crypto", address: "TXYZ...fake_trc20_address", min: 5 },
  { id: "usdt_erc20", name: "USDT", network: "ERC20", symbol: "USDT", type: "crypto", address: "0xABC...fake_erc20_address", min: 10 },
  { id: "usdt_bep20", name: "USDT", network: "BEP20", symbol: "USDT", type: "crypto", address: "0xDEF...fake_bep20_address", min: 5 },
  { id: "usdt_sol", name: "USDT", network: "SOL", symbol: "USDT", type: "crypto", address: "SOL...fake_sol_address", min: 5 },
  { id: "usdc_erc20", name: "USDC", network: "ERC20", symbol: "USDC", type: "crypto", address: "0xABC...fake_erc20_usdc", min: 10 },
  { id: "usdc_sol", name: "USDC", network: "SOL", symbol: "USDC", type: "crypto", address: "SOL...fake_sol_usdc", min: 5 },
  { id: "btc", name: "Bitcoin", network: "BTC", symbol: "BTC", type: "crypto", address: "bc1q...fake_btc_address", min: 0.001 },
  { id: "eth", name: "Ethereum", network: "ERC20", symbol: "ETH", type: "crypto", address: "0xETH...fake_eth_address", min: 0.01 },
  { id: "doge", name: "Dogecoin", network: "DOGE", symbol: "DOGE", type: "crypto", address: "DOGE...fake_doge_address", min: 50 },
  { id: "ltc", name: "Litecoin", network: "LTC", symbol: "LTC", type: "crypto", address: "LTC...fake_ltc_address", min: 0.1 },
  { id: "trx", name: "TRON", network: "TRX", symbol: "TRX", type: "crypto", address: "TXYZ...fake_trx_address", min: 50 },
  { id: "sol", name: "Solana", network: "SOL", symbol: "SOL", type: "crypto", address: "SOL...fake_sol_address", min: 0.1 },
  { id: "bch", name: "BitcoinCash", network: "BCH", symbol: "BCH", type: "crypto", address: "BCH...fake_bch_address", min: 0.05 },
  { id: "bnb_bep20", name: "BNB", network: "BEP20", symbol: "BNB", type: "crypto", address: "0xBNB...fake_bnb_address", min: 0.05 },
];

const WITHDRAW_METHODS = [
  { id: "imps", name: "IMPS Bank Transfer", type: "fiat", min: 1500 },
  { id: "bank", name: "Bank Transfer", type: "fiat", min: 1000 },
  { id: "usdt_trc20", name: "USDT", network: "TRC20", type: "crypto", min: 10 },
  { id: "usdt_bep20", name: "USDT", network: "BEP20", type: "crypto", min: 10 },
  { id: "btc", name: "Bitcoin", network: "BTC", type: "crypto", min: 50 },
  { id: "eth", name: "Ethereum", network: "ERC20", type: "crypto", min: 50 },
];

const FIAT_PILLS = [500, 700, 1000, 1500, 3000, 5000];

export default function DepositModal() {
  const { isOpen, type, view, selectedMethod, closeModal, setView, setMethod, openModal } = useDepositModalStore();
  const { user } = useUserStore();
  const { baseBalance, activeCurrency } = useCurrencyStore();
  
  const currentBalance = convertFromBase(baseBalance, activeCurrency);

  // States
  const [amount, setAmount] = useState<string>("");
  const [utr, setUtr] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(480); // 8 minutes

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (view === "upi_qr" && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [view, timeLeft]);

  if (!isOpen) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderMethodGrid = () => (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-widest">{type === 'deposit' ? 'Deposit' : 'Withdrawal'}</h2>
          <p className="text-sm text-gray-400 font-bold uppercase tracking-wider mt-1">Select payment method</p>
        </div>
        <button onClick={closeModal} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Fiat Options</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {(type === 'deposit' ? FIAT_METHODS : WITHDRAW_METHODS.filter(m => m.type === 'fiat')).map((method) => (
              <div 
                key={method.id} 
                onClick={() => {
                  setMethod(method);
                  if (type === 'withdraw') {
                    if (currentBalance < method.min) {
                      setView('insufficient_funds');
                    } else {
                      setView('fiat_withdraw');
                    }
                  } else {
                    setView('fiat_amount');
                  }
                }}
                className="bg-[#131824] border border-gray-800 rounded-xl p-4 cursor-pointer hover:bg-white/5 hover:border-gray-600 transition-all group text-center"
              >
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Banknote className="w-6 h-6 text-emerald-500" />
                </div>
                <p className="text-sm font-bold text-gray-300">{method.name}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Crypto Options</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {(type === 'deposit' ? CRYPTO_METHODS : WITHDRAW_METHODS.filter(m => m.type === 'crypto')).map((method) => (
              <div 
                key={method.id} 
                onClick={() => {
                  setMethod(method);
                  if (type === 'withdraw') {
                    if (currentBalance < method.min) {
                      setView('insufficient_funds');
                    } else {
                      setView('crypto_withdraw');
                    }
                  } else {
                    setView('crypto_qr');
                  }
                }}
                className="bg-[#131824] border border-gray-800 rounded-xl p-4 cursor-pointer hover:bg-white/5 hover:border-gray-600 transition-all group text-center"
              >
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Bitcoin className="w-6 h-6 text-yellow-500" />
                </div>
                <p className="text-sm font-bold text-gray-300">{method.name}</p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-gray-800 rounded text-xs font-mono text-gray-400">{method.network}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderFiatAmount = () => (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <button onClick={() => setView('methods')} className="p-2 mr-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
          <ChevronLeft className="w-5 h-5 text-gray-400" />
        </button>
        <h2 className="text-xl font-black text-white uppercase tracking-widest">Enter Amount</h2>
        <button onClick={closeModal} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors ml-auto">
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      <div className="bg-[#131824] border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center">
            <Smartphone className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-gray-400 text-sm font-bold uppercase tracking-wider">Deposit Method</p>
            <p className="text-lg font-bold text-white">{selectedMethod?.name}</p>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Amount ({activeCurrency})</label>
          <input 
            type="number" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-[#0a0f16] border border-gray-700 rounded-xl px-4 py-3 text-white font-black text-xl focus:outline-none focus:border-emerald-500 transition-colors"
            placeholder="0.00"
          />
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {FIAT_PILLS.map(pill => (
            <button 
              key={pill} 
              onClick={() => setAmount(pill.toString())}
              className="bg-white/5 hover:bg-white/10 border border-gray-700 rounded-lg py-2 text-sm font-bold text-gray-300 transition-colors"
            >
              {pill}
            </button>
          ))}
        </div>

        <button 
          onClick={() => {
            if (Number(amount) > 0) setView('upi_qr');
          }}
          disabled={!amount || Number(amount) <= 0}
          className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-black font-black uppercase tracking-widest rounded-xl hover:from-emerald-400 hover:to-emerald-500 transition-all disabled:opacity-50"
        >
          Proceed to Deposit
        </button>
      </div>
    </div>
  );

  const renderUpiQR = () => (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black text-white uppercase tracking-widest">Complete Deposit</h2>
        <button onClick={closeModal} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      <div className="bg-[#131824] border border-gray-800 rounded-xl p-6 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full bg-emerald-500/20 py-2 flex items-center justify-center gap-2">
          <Timer className="w-4 h-4 text-emerald-500" />
          <span className="text-emerald-500 font-bold font-mono">
            {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
          </span>
        </div>

        <div className="mt-8 mb-6 bg-white p-4 rounded-xl inline-block">
          <QRCode value="upi://pay?pa=abhay-271@pytes&pn=RXFURY&am=500" size={160} />
        </div>

        <div className="bg-[#0a0f16] border border-gray-700 rounded-xl p-4 mb-6 flex justify-between items-center text-left">
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">UPI ID</p>
            <p className="text-sm font-mono text-gray-300">abhay-271@pytes</p>
          </div>
          <button onClick={() => handleCopy('abhay-271@pytes')} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
            {copied ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5 text-gray-400" />}
          </button>
        </div>

        <div className="text-left mb-6">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Submit 12-Digit UTR Number</label>
          <input 
            type="text" 
            value={utr}
            onChange={(e) => setUtr(e.target.value)}
            className="w-full bg-[#0a0f16] border border-gray-700 rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:border-emerald-500 transition-colors"
            placeholder="e.g. 123456789012"
            maxLength={12}
          />
        </div>

        <button 
          className="w-full py-4 bg-emerald-600 text-white font-black uppercase tracking-widest rounded-xl hover:bg-emerald-500 transition-all disabled:opacity-50"
          disabled={utr.length !== 12}
        >
          Confirm Payment
        </button>
      </div>
    </div>
  );

  const renderCryptoQR = () => (
    <div className="flex h-full min-h-[500px]">
      {/* Sidebar */}
      <div className="w-1/3 bg-[#0a0f16] border-r border-gray-800 p-4 overflow-y-auto hidden md:block">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Select Crypto</h3>
        <div className="space-y-2">
          {CRYPTO_METHODS.map(method => (
            <div 
              key={method.id}
              onClick={() => setMethod(method)}
              className={`flex items-center p-3 rounded-xl cursor-pointer transition-colors ${selectedMethod?.id === method.id ? 'bg-emerald-500/10 border border-emerald-500/30' : 'hover:bg-white/5 border border-transparent'}`}
            >
              <Bitcoin className={`w-5 h-5 mr-3 ${selectedMethod?.id === method.id ? 'text-emerald-500' : 'text-gray-400'}`} />
              <div>
                <p className={`text-sm font-bold ${selectedMethod?.id === method.id ? 'text-emerald-400' : 'text-gray-300'}`}>{method.name}</p>
                <p className="text-xs text-gray-500">{method.network}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 p-6 relative flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-widest">Deposit {selectedMethod?.symbol}</h2>
            <p className="text-sm text-gray-400 font-bold">Network: <span className="text-emerald-400">{selectedMethod?.network}</span></p>
          </div>
          <button onClick={closeModal} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="bg-white p-4 rounded-xl mb-6 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
            <QRCode value={selectedMethod?.address || "fallback"} size={180} />
          </div>

          <div className="w-full max-w-sm bg-[#131824] border border-gray-800 rounded-xl p-4 mb-4 flex justify-between items-center">
            <div className="overflow-hidden">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Deposit Address</p>
              <p className="text-sm font-mono text-gray-300 truncate pr-4">{selectedMethod?.address}</p>
            </div>
            <button onClick={() => handleCopy(selectedMethod?.address || "")} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors shrink-0">
              {copied ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5 text-gray-400" />}
            </button>
          </div>

          <div className="w-full max-w-sm bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex gap-3 text-left">
            <ShieldAlert className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-400 font-bold">Important Network Notice</p>
              <p className="text-xs text-yellow-500/80 mt-1">
                Send only {selectedMethod?.symbol} to this {selectedMethod?.network} address. Min. deposit: {selectedMethod?.min} {selectedMethod?.symbol}.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderInsufficientFunds = () => (
    <div className="p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
       <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
         <X className="w-10 h-10 text-red-500" />
       </div>
       <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-3">Insufficient Balance</h2>
       <p className="text-gray-400 text-sm max-w-xs mb-8">
         Not enough money to withdraw. The minimum withdrawal amount for {selectedMethod?.name} ({selectedMethod?.type === 'crypto' ? selectedMethod?.network : 'Fiat'}) is higher than your balance.
       </p>
       <div className="flex gap-4 w-full max-w-xs">
         <button onClick={closeModal} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors">
           Cancel
         </button>
         <button onClick={() => openModal('deposit', 'methods')} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors">
           Deposit Now
         </button>
       </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closeModal} />
      
      <div className="bg-[#0a0f16] border border-gray-800 rounded-3xl w-full max-w-3xl relative z-10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] overflow-y-auto">
        {view === 'methods' && renderMethodGrid()}
        {view === 'fiat_amount' && renderFiatAmount()}
        {view === 'upi_qr' && renderUpiQR()}
        {view === 'crypto_qr' && renderCryptoQR()}
        {view === 'insufficient_funds' && renderInsufficientFunds()}
        {/* Placeholders for actual withdraw flows if balance is sufficient */}
        {(view === 'fiat_withdraw' || view === 'crypto_withdraw') && (
           <div className="p-8 text-center">
             <h2 className="text-xl font-bold text-white mb-4">Withdrawal Flow</h2>
             <p className="text-gray-400 mb-6">Balance is sufficient! Proceed with the real withdrawal form here.</p>
             <button onClick={closeModal} className="px-6 py-2 bg-white/10 rounded-xl">Close</button>
           </div>
        )}
      </div>
    </div>
  );
}



