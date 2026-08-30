'use client';

import Link from 'next/link';
import { Lock, ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 pt-28 pb-16 px-4 md:px-8">
      <div className="max-w-4xl mx-auto bg-gray-900 border border-gray-800 rounded-3xl p-6 md:p-12 shadow-2xl">
        <Link href="/" className="inline-flex items-center text-sm font-bold text-gray-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
        </Link>
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
            <Lock className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white">Privacy Policy</h1>
            <p className="text-gray-400 text-sm mt-1">Last updated: August 2026</p>
          </div>
        </div>

        <div className="space-y-6 text-gray-300 text-sm md:text-base leading-relaxed border-t border-gray-800 pt-6">
          <section>
            <h2 className="text-xl font-bold text-white mb-2">1. Information We Collect</h2>
            <p>We collect essential account details including email address, encrypted authentication hashes, transaction histories, wallet addresses, and basic device telemetry to safeguard your account against unauthorized access.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-2">2. How We Use Your Data</h2>
            <p>Your data is used strictly to facilitate deposits/withdrawals, prevent fraudulent activities, ensure anti-money laundering compliance, and provide customer support. We never sell personal information to third parties.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-2">3. Data Encryption & Security</h2>
            <p>All sensitive communications are encrypted using modern TLS 1.3 encryption and industry-standard hashing. Financial keys and passwords are never stored in plain text.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-2">4. Cookies & Session Storage</h2>
            <p>We use session cookies and local storage tokens exclusively for authentication state persistence and global currency preference management.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
