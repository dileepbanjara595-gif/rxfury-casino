'use client';

import Link from 'next/link';
import { Shield, ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 pt-28 pb-16 px-4 md:px-8">
      <div className="max-w-4xl mx-auto bg-gray-900 border border-gray-800 rounded-3xl p-6 md:p-12 shadow-2xl">
        <Link href="/" className="inline-flex items-center text-sm font-bold text-gray-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
        </Link>
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-2xl">
            <Shield className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white">Terms & Conditions</h1>
            <p className="text-gray-400 text-sm mt-1">Last updated: August 2026</p>
          </div>
        </div>

        <div className="space-y-6 text-gray-300 text-sm md:text-base leading-relaxed border-t border-gray-800 pt-6">
          <section>
            <h2 className="text-xl font-bold text-white mb-2">1. Agreement to Terms</h2>
            <p>By accessing or registering on RXFURY, you acknowledge and agree to comply with all terms and conditions set forth herein. You must be at least 18 years old or the legal age of majority in your jurisdiction to participate in real-money games.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-2">2. Account Registration & Security</h2>
            <p>Users are responsible for maintaining the confidentiality of their credentials. Only one account per person/household is permitted. Multi-accounting, bot automation, and arbitrage betting are strictly prohibited and will result in account forfeiture.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-2">3. Deposits & Withdrawals</h2>
            <p>All deposits must originate from accounts registered in the user's verified name. Withdrawals are processed swiftly according to network confirmations and verified KYC levels. Minimum deposit and withdrawal thresholds apply as displayed in the cashier.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-2">4. Fair Play & Provable Fairness</h2>
            <p>All games on RXFURY utilize certified Random Number Generators (RNG) and cryptographic hash verification to ensure provably fair outcomes. Results cannot be manipulated by either players or platform operators.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-2">5. Limitation of Liability</h2>
            <p>Gaming involves financial risk. RXFURY is not liable for losses resulting from user gameplay decisions, internet latency, or unauthorized access arising from player negligence.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
