'use client';

import { useState, useEffect } from 'react';
import { useAuthModalStore } from '@/store/authModalStore';
import { X, Mail, Lock, ShieldCheck, ArrowRight, KeyRound } from 'lucide-react';
import { signIn } from "next-auth/react";
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AuthModal() {
  const { isOpen, view, closeModal, setView } = useAuthModalStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [recoveryOtpSent, setRecoveryOtpSent] = useState(false);
  
  // Resend Timer State
  const [countdown, setCountdown] = useState(0);

  // Unified state for errors and success messages
  const [status, setStatus] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  // Reset state when modal opens/closes or view changes
  useEffect(() => {
    setStatus(null);
    setIsLoading(false);
    setOtpSent(false);
    setRecoveryOtpSent(false);
    setEmail('');
    setPassword('');
    setNewPassword('');
    setOtp('');
    setCountdown(0);
  }, [isOpen, view]);

  // Countdown timer logic
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  if (!isOpen) return null;

  // Supabase: Send Real OTP & Save Password (Registration)
    const handleSendOtp = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setStatus({ type: 'error', message: 'Please enter both an email and a secure password first.' });
      return;
    }
    
    setIsLoading(true);
    setStatus(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });

      if (error) {
        throw new Error(error.message);
      }

      // Supabase security feature: if identities is empty, the user might already exist.
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        throw new Error('User already exists. Please log in instead.');
      }

      setOtpSent(true);
      setCountdown(30);
      setStatus({ type: 'success', message: 'OTP Sent successfully! Please check your email inbox (and spam).' });
    } catch (err: any) {
      if (err.status === 429) {
        setStatus({ type: 'error', message: 'Rate limit exceeded. Please wait a moment before requesting another OTP.' });
      } else {
        setStatus({ type: 'error', message: err.message || 'Failed to send OTP.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Supabase: Resend Registration OTP
  const handleResendOtp = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus(null);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email
      });

      if (error) {
        throw new Error(error.message);
      }
      
      setCountdown(30);
      setStatus({ type: 'success', message: 'OTP Resent successfully! Please check your email inbox (and spam).' });
    } catch (err: any) {
      if (err.status === 429) {
        setStatus({ type: 'error', message: 'Rate limit exceeded. Please wait a moment before requesting another OTP.' });
      } else {
        setStatus({ type: 'error', message: err.message || 'Failed to resend OTP.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Supabase: Forgot Password OTP (Recovery)
  const handleSendRecoveryOtp = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!email) {
      setStatus({ type: 'error', message: 'Please enter your email address first.' });
      return;
    }
    
    setIsLoading(true);
    setStatus(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) {
        throw new Error(error.message);
      }
      
      setRecoveryOtpSent(true);
      setStatus({ type: 'success', message: 'Recovery OTP Sent! Please check your email.' });
    } catch (err: any) {
      if (err.status === 429) {
        setStatus({ type: 'error', message: 'Rate limit exceeded. Please wait before requesting another recovery OTP.' });
      } else {
        setStatus({ type: 'error', message: err.message || 'Failed to send recovery OTP.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus(null);

    try {
      if (view === 'login') {
                const res = await signIn("credentials", {
          redirect: false,
          email,
          password
        });
        if (res?.error) {
          throw new Error("Invalid credentials");
        }

        

        closeModal();
        router.refresh();

      } else if (view === 'register') {
                if (!otpSent) {
          setStatus({ type: 'error', message: 'Please send an OTP first.' });
          setIsLoading(false);
          return;
        }

        if (!otp) {
          setStatus({ type: 'error', message: 'Please enter the verification code.' });
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.verifyOtp({
          email,
          token: otp,
          type: 'signup'
        });

        if (error) {
          throw new Error(error.message);
        }

        setStatus({ 
          type: 'success', 
          message: 'Account Verified & Created Successfully! Redirecting...' 
        });
        
        setTimeout(() => {
          closeModal();
          router.refresh();
        }, 1500);

      } else if (view === 'forgot_password') {
        if (!recoveryOtpSent) {
          setStatus({ type: 'error', message: 'Please request a recovery OTP first.' });
          setIsLoading(false);
          return;
        }

        if (!newPassword || newPassword.length < 6) {
          setStatus({ type: 'error', message: 'Please enter a valid new password (min 6 characters).' });
          setIsLoading(false);
          return;
        }

        // 1. Verify Recovery OTP
        const { error: verifyError } = await supabase.auth.verifyOtp({
          email,
          token: otp,
          type: 'recovery'
        });

        if (verifyError) {
          throw new Error(verifyError.message);
        }

        // 2. Update to New Password (the session is active after verifyOtp)
        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword
        });

        if (updateError) {
          throw new Error(updateError.message);
        }

        setStatus({ 
          type: 'success', 
          message: 'Password Reset Successfully! You can now log in.' 
        });
        
        setTimeout(() => {
          setView('login');
        }, 2000);
      }
    } catch (err: any) {
      if (err.status === 429) {
        setStatus({ type: 'error', message: 'Rate limit exceeded. Please wait.' });
      } else {
        setStatus({ type: 'error', message: err.message || 'An error occurred. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#1a1d29] border border-white/10 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Close Button */}
        <button 
          onClick={closeModal}
          className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/80 text-gray-400 hover:text-white rounded-full transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Premium Banner */}
        <div className="relative h-32 bg-gradient-to-r from-blue-900 to-blue-950 flex flex-col items-center justify-center overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[150px] bg-blue-500/20 rounded-full blur-[80px] pointer-events-none"></div>
          {view === 'forgot_password' ? (
            <KeyRound className="w-10 h-10 text-blue-400 mb-2 relative z-10" />
          ) : (
            <ShieldCheck className="w-10 h-10 text-blue-400 mb-2 relative z-10" />
          )}
          <h2 className="text-2xl font-black text-white uppercase tracking-widest relative z-10">
            {view === 'login' ? 'Welcome Back' : view === 'forgot_password' ? 'Reset Password' : 'Create Account'}
          </h2>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 relative z-10 bg-[#1a1d29] max-h-[70vh] overflow-y-auto hide-scrollbar">
          
          {/* Tabs */}
          {view !== 'forgot_password' && (
            <div className="flex p-1 bg-black/40 rounded-xl mb-6 border border-white/5">
              <button
                onClick={() => setView('login')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                  view === 'login'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setView('register')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                  view === 'register'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Register
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {status && (
              <div className={`border text-sm p-3 rounded-lg text-center font-medium ${
                status.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}>
                {status.message}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                Email Address
              </label>
              <div className={`relative ${(view === 'register' || view === 'forgot_password') ? 'flex gap-2' : ''}`}>
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-11 pr-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                  required
                />
                
                {/* Send OTP button for Register */}
                {view === 'register' && (
                  <button
                    type="button"
                    onClick={otpSent ? handleResendOtp : handleSendOtp}
                    disabled={isLoading || (otpSent && countdown > 0)}
                    className="whitespace-nowrap rounded-xl bg-gray-800 px-4 py-3.5 text-xs font-bold uppercase tracking-widest text-blue-400 hover:bg-gray-700 focus:outline-none border border-gray-700 disabled:opacity-50 min-w-[120px]"
                  >
                    {countdown > 0 ? `Wait ${countdown}s` : otpSent ? 'Resend' : 'Send OTP'}
                  </button>
                )}
                
                {/* Send OTP button for Forgot Password */}
                {view === 'forgot_password' && (
                  <button
                    type="button"
                    onClick={handleSendRecoveryOtp}
                    disabled={isLoading || recoveryOtpSent}
                    className="whitespace-nowrap rounded-xl bg-gray-800 px-4 py-3.5 text-xs font-bold uppercase tracking-widest text-blue-400 hover:bg-gray-700 focus:outline-none border border-gray-700 disabled:opacity-50"
                  >
                    {recoveryOtpSent ? 'OTP Sent' : 'Send OTP'}
                  </button>
                )}
              </div>
            </div>

            {/* Password Field for Login and Register */}
            {(view === 'login' || view === 'register') && (
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
              </div>
            )}

            {/* Forgot Password Link (Login View Only) */}
            {view === 'login' && (
              <div className="flex justify-end mt-1">
                <button
                  type="button"
                  onClick={() => setView('forgot_password')}
                  className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {/* OTP and New Password Fields for Recovery */}
            {view === 'forgot_password' && recoveryOtpSent && (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                    Enter Recovery Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="w-full px-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white text-lg placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors tracking-[0.5em] font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {/* OTP Field for Register */}
            {view === 'register' && otpSent && (
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                  Enter Verification Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="w-full px-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white text-lg placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors tracking-[0.5em] font-mono text-center"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-4 rounded-xl text-white font-black bg-blue-600 hover:bg-blue-500 transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] disabled:opacity-50 mt-4 uppercase tracking-widest"
            >
              {isLoading ? 'Processing...' : view === 'login' ? 'Login Securely' : view === 'forgot_password' ? 'Reset Password' : 'Verify & Register'}
              {!isLoading && <ArrowRight className="ml-2 w-5 h-5" />}
            </button>

            {/* Back to Login Link for Forgot Password */}
            {view === 'forgot_password' && (
              <div className="flex justify-center mt-4 border-t border-white/10 pt-4">
                <button
                  type="button"
                  onClick={() => setView('login')}
                  className="text-sm font-bold text-gray-400 hover:text-white transition-colors"
                >
                  Back to Sign In
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}









