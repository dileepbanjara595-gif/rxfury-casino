'use client';

import Link from 'next/link';
import { FileCheck, ArrowLeft } from 'lucide-react';

export default function KycAmlPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 pt-28 pb-16 px-4 md:px-8">
      <div className="max-w-4xl mx-auto bg-gray-900 border border-gray-800 rounded-3xl p-6 md:p-12 shadow-2xl">
        <Link href="/" className="inline-flex items-center text-sm font-bold text-gray-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
        </Link>
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl">
            <FileCheck className="w-8 h-8 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white">KYC & AML Policy</h1>
            <p className="text-gray-400 text-sm mt-1">Know Your Customer & Anti-Money Laundering</p>
          </div>
        </div>

        <div className="space-y-6 text-gray-300 text-sm md:text-base leading-relaxed border-t border-gray-800 pt-6">
          <section>
            <h2 className="text-xl font-bold text-white mb-2">1. Compliance Commitment</h2>
            <p>RXFURY is committed to preventing money laundering, terrorism financing, and fraud by implementing robust risk-based Know Your Customer (KYC) and Anti-Money Laundering (AML) monitoring frameworks.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-2">2. Identity Verification Tiers</h2>
            <p>Basic gameplay requires email and mobile verification. Higher withdrawal volumes or suspicious account flags trigger Level 2 KYC verification (government-issued photo ID and proof of address).</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-2">3. Source of Funds & Sanctions Screening</h2>
            <p>Transactions are screened in real time against global sanctions lists, PEP databases, and blockchain intelligence tools to identify tainted addresses and illegal fund transfers.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
