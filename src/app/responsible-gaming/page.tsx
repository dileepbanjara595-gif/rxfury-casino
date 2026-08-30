'use client';

import Link from 'next/link';
import { HeartHandshake, ArrowLeft } from 'lucide-react';

export default function ResponsibleGamingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 pt-28 pb-16 px-4 md:px-8">
      <div className="max-w-4xl mx-auto bg-gray-900 border border-gray-800 rounded-3xl p-6 md:p-12 shadow-2xl">
        <Link href="/" className="inline-flex items-center text-sm font-bold text-gray-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
        </Link>
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl">
            <HeartHandshake className="w-8 h-8 text-rose-400" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white">Responsible Gaming</h1>
            <p className="text-gray-400 text-sm mt-1">Play Safely & In Control</p>
          </div>
        </div>

        <div className="space-y-6 text-gray-300 text-sm md:text-base leading-relaxed border-t border-gray-800 pt-6">
          <section>
            <h2 className="text-xl font-bold text-white mb-2">1. Play for Fun, Not as an Income Source</h2>
            <p>Gambling should always be treated as entertainment. Never gamble money you cannot afford to lose, and never attempt to chase losses.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-2">2. Self-Exclusion & Deposit Limits</h2>
            <p>Players can configure daily, weekly, or monthly deposit caps in account settings. If you feel you need a break, you can request temporary or permanent self-exclusion by contacting support at team@rxfurygame.com.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-2">3. Underage Protection (18+)</h2>
            <p>Underage gambling is strictly illegal. We implement strict age verification tools to prevent minors from accessing real-money games.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
