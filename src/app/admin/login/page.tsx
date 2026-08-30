'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Mail, Lock, ArrowRight, ShieldAlert, AlertCircle } from 'lucide-react';

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await signIn('credentials', {
        email,
        password,
        isAdminLogin: 'true',
        redirect: false
      });

      if (res?.error) {
        setError('Invalid admin credentials. Access Denied.');
        setIsLoading(false);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      setError('Something went wrong during sign in.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-red-600/10 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#0a0a0f] border border-red-900/30 rounded-3xl p-8 shadow-[0_0_50px_rgba(220,38,38,0.05)] relative z-10">
        
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex items-center gap-2 mb-4 group">
            <ShieldAlert className="w-10 h-10 text-red-500 transition-transform group-hover:scale-110" />
            <span className="text-3xl font-black text-white tracking-wider">RXFURY ADMIN</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">System Access</h1>
          <p className="text-red-400 text-sm mt-1 font-mono">Restricted Area. Authorized Personnel Only.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-400 text-sm font-bold">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Admin Email</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-gray-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@rxfurygame.com"
                required
                className="w-full pl-11 pr-4 py-3.5 bg-black border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-red-500 transition-colors text-sm font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Passcode</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-gray-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-11 pr-4 py-3.5 bg-black border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-red-500 transition-colors text-sm font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl uppercase tracking-widest text-sm transition-all shadow-[0_0_25px_rgba(220,38,38,0.2)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-6"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                Authenticate <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-800 text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-white transition-colors">
            ← Return to Public Site
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <AdminLoginContent />
    </Suspense>
  );
}
