"use client";

import { useState, useEffect, useRef } from "react";
import { useUserStore } from "@/store/userStore";
import { ArrowLeft, User, Key, Camera, CheckCircle, Upload, Banknote, Wallet } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/supabaseClient";
import { useDepositModalStore } from "@/store/depositModalStore";

export default function AccountSettingsPage() {
  const { session, profileData, setProfileData, isLoading } = useUserStore();
  const { update } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"profile" | "password">("profile");
  
  // Profile State
  const [firstName, setFirstName] = useState(profileData?.firstName || "");
  const [lastName, setLastName] = useState(profileData?.lastName || "");
  const [dob, setDob] = useState(profileData?.dob || "");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(profileData?.avatarUrl || null);
  
  const [profileMsg, setProfileMsg] = useState({ type: "", text: "" });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(
    !(profileData?.firstName || profileData?.lastName)
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password State
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState({ type: "", text: "" });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // OTP Flow State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpStep, setOtpStep] = useState<"request" | "verify" | "reset">("request");
  const [otpCode, setOtpCode] = useState("");
  const [otpMsg, setOtpMsg] = useState({ type: "", text: "" });
  const [isProcessingOtp, setIsProcessingOtp] = useState(false);

  useEffect(() => {
    if (!isLoading && !session) {
      router.push("/");
    }
  }, [isLoading, session, router]);

  // Sync state if profileData loads later
  useEffect(() => {
    if (profileData) {
      if (profileData.firstName) setFirstName(profileData.firstName);
      if (profileData.lastName) setLastName(profileData.lastName);
      if (profileData.dob) setDob(profileData.dob);
      if (profileData.avatarUrl) setProfilePhoto(profileData.avatarUrl);
    }
  }, [profileData]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setProfilePhoto(base64);
        setProfileData({ avatarUrl: base64 }); // Sync photo instantly
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileMsg({ type: "", text: "" });

    try {
      // Simulate API delay
      await new Promise(r => setTimeout(r, 800));
      
      setProfileData({ 
        firstName, 
        lastName, 
        dob, 
        avatarUrl: profilePhoto || undefined 
      });

      setProfileMsg({ type: "success", text: "Profile updated successfully!" });
      setIsEditingProfile(false);
    } catch (err) {
      setProfileMsg({ type: "error", text: "Something went wrong" });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg({ type: "", text: "" });

    if (newPassword.length < 8) {
      setPasswordMsg({ type: "error", text: "Password must be at least 8 characters long." });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "New passwords do not match." });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      // Replace with actual /api/auth/change-password endpoint
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Simulate backend response
      if (oldPassword === "wrong") {
        setPasswordMsg({ type: "error", text: "Current password incorrect." });
      } else {
        setPasswordMsg({ type: "success", text: "Password updated successfully. Please use it for your next login." });
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      setPasswordMsg({ type: "error", text: "Something went wrong" });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleRequestOtp = async () => {
    if (!session?.user?.email) {
      setOtpMsg({ type: "error", text: "Email not found." });
      return;
    }
    setIsProcessingOtp(true);
    setOtpMsg({ type: "", text: "" });
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session.user.email }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtpStep("verify");
        setOtpMsg({ type: "success", text: "OTP sent to your registered email/phone." });
      } else {
        setOtpMsg({ type: "error", text: data.error || "Failed to send OTP." });
      }
    } catch (err) {
      setOtpMsg({ type: "error", text: "Failed to send OTP." });
    } finally {
      setIsProcessingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length < 6) {
      setOtpMsg({ type: "error", text: "Please enter a valid 6-digit OTP." });
      return;
    }
    setIsProcessingOtp(true);
    setOtpMsg({ type: "", text: "" });
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session?.user?.email, otp: otpCode }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtpStep("reset");
        setOtpMsg({ type: "success", text: "OTP verified. Enter your new password." });
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setOtpMsg({ type: "error", text: data.error || "Invalid or expired OTP." });
      }
    } catch (err) {
      setOtpMsg({ type: "error", text: "Verification failed." });
    } finally {
      setIsProcessingOtp(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setOtpMsg({ type: "error", text: "Password must be at least 8 characters long." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setOtpMsg({ type: "error", text: "New passwords do not match." });
      return;
    }

    setIsProcessingOtp(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) throw error;

      setShowOtpModal(false);
      setOtpStep("request");
      setOtpCode("");
      
      setActiveTab("password");
      setPasswordMsg({ type: "success", text: "Password updated successfully. Please use it for your next login." });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setOtpMsg({ type: "error", text: err.message || "Failed to reset password." });
    } finally {
      setIsProcessingOtp(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-[#1a1d29] flex items-center justify-center"><div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="min-h-screen bg-[#1a1d29] text-white font-sans selection:bg-yellow-500/30 pb-20 pt-24">
      <main className="max-w-2xl mx-auto p-4 md:p-8 space-y-8 relative z-10">
        
        {/* Page Title & Back Button */}
        <div className="flex items-center mb-6">
          <Link href="/profile" className="text-gray-400 hover:text-white transition-colors mr-4 bg-white/5 p-2.5 rounded-xl hover:bg-white/10 border border-white/5">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 uppercase tracking-widest">
            Account Settings
          </h1>
        </div>

        {/* Background glow */}
        <div className="absolute top-10 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>

        {/* Tabs */}
        <div className="flex p-1 space-x-1 bg-black/40 rounded-xl border border-white/5 shadow-inner">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex-1 flex items-center justify-center py-3 text-sm font-bold uppercase tracking-widest rounded-lg transition-all ${
              activeTab === "profile"
                ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-black shadow-md"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <User className="w-4 h-4 mr-2" /> Profile
          </button>
          <button
            onClick={() => setActiveTab("password")}
            className={`flex-1 flex items-center justify-center py-3 text-sm font-bold uppercase tracking-widest rounded-lg transition-all ${
              activeTab === "password"
                ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-black shadow-md"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Key className="w-4 h-4 mr-2" /> Security
          </button>
        </div>


        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-300">
            <h2 className="text-lg font-black text-white uppercase tracking-widest mb-6">Personal Information</h2>
            
            {profileMsg.text && (
              <div className={`p-4 rounded-2xl mb-6 font-bold text-sm border ${profileMsg.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                {profileMsg.text}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              
              {/* Avatar Upload */}
              <div className="flex flex-col items-center justify-center mb-8">
                <div 
                  className="relative w-32 h-32 rounded-full border-2 border-yellow-500/50 p-1 flex items-center justify-center bg-black/40 cursor-pointer group hover:border-yellow-500 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {profilePhoto ? (
                    <img src={profilePhoto} alt="Profile" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-gray-500 group-hover:text-yellow-500 transition-colors" />
                  )}
                  
                  <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="image/*" 
                  capture="user" 
                  className="hidden" 
                  onChange={handlePhotoChange}
                />
                <p className="text-xs text-gray-400 mt-3 font-medium uppercase tracking-widest">Tap to upload photo</p>
              </div>

              {/* Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. John"
                    disabled={!isEditingProfile}
                    className={`w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-white font-medium focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all ${!isEditingProfile ? 'opacity-70 cursor-not-allowed' : ''}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Doe"
                    disabled={!isEditingProfile}
                    className={`w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-white font-medium focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all ${!isEditingProfile ? 'opacity-70 cursor-not-allowed' : ''}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Date of Birth</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  disabled={!isEditingProfile}
                  className={`w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-white font-medium focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all [color-scheme:dark] ${!isEditingProfile ? 'opacity-70 cursor-not-allowed' : ''}`}
                />
              </div>

              {isEditingProfile ? (
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-black uppercase tracking-widest py-4 rounded-2xl shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-all disabled:opacity-50 mt-4"
                >
                  {isUpdatingProfile ? "Saving..." : "Update Profile"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(true)}
                  className="w-full bg-white/10 hover:bg-white/20 text-white font-black uppercase tracking-widest py-4 rounded-2xl transition-all mt-4 border border-white/10"
                >
                  Edit Profile
                </button>
              )}
            </form>
          </div>
        )}

        {/* PASSWORD TAB */}
        {activeTab === "password" && (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-300">
            <h2 className="text-lg font-black text-white uppercase tracking-widest mb-6">Change Password</h2>
            
            {passwordMsg.text && (
              <div className={`p-4 rounded-2xl mb-6 font-bold text-sm border ${passwordMsg.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                {passwordMsg.text}
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Current Password</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-white font-medium focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all"
                />
                <div className="text-right mt-2">
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowOtpModal(true);
                      setOtpStep("request");
                      setOtpMsg({ type: "", text: "" });
                    }}
                    className="text-xs font-bold text-yellow-500 hover:text-yellow-400 transition-colors uppercase tracking-widest"
                  >
                    Forgot Current Password?
                  </button>
                </div>
              </div>
              
              <div className="border-t border-white/10 my-4 pt-4">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-white font-medium focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all mb-6"
                />

                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-white font-medium focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-black uppercase tracking-widest py-4 rounded-2xl shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-all disabled:opacity-50 mt-4"
              >
                {isUpdatingPassword ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#1a1d29] border border-white/10 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="p-6 md:p-8">
              <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2">Reset Password</h3>
              <p className="text-sm text-gray-400 mb-6 font-medium">
                {otpStep === "request" && "We will send a 6-digit OTP to your registered email or phone number to verify your identity."}
                {otpStep === "verify" && "Enter the 6-digit OTP sent to your registered contact method."}
                {otpStep === "reset" && "Verification successful. Please enter your new password below."}
              </p>

              {otpMsg.text && (
                <div className={`p-3 rounded-xl mb-6 font-bold text-sm border ${otpMsg.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                  {otpMsg.text}
                </div>
              )}

              {otpStep === "request" && (
                <button
                  onClick={handleRequestOtp}
                  disabled={isProcessingOtp}
                  className="w-full py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(234,179,8,0.3)] disabled:opacity-50"
                >
                  {isProcessingOtp ? "Sending OTP..." : "Send OTP"}
                </button>
              )}

              {otpStep === "verify" && (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Enter 6-digit OTP (e.g. 123456)"
                    maxLength={6}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-white font-medium focus:outline-none focus:border-yellow-500 text-center tracking-widest text-xl transition-all"
                  />
                  <button
                    onClick={handleVerifyOtp}
                    disabled={isProcessingOtp || otpCode.length < 6}
                    className="w-full py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(234,179,8,0.3)] disabled:opacity-50"
                  >
                    {isProcessingOtp ? "Verifying..." : "Verify OTP"}
                  </button>
                </div>
              )}

              {otpStep === "reset" && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-white font-medium focus:outline-none focus:border-yellow-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-white font-medium focus:outline-none focus:border-yellow-500 transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isProcessingOtp}
                    className="w-full py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(234,179,8,0.3)] disabled:opacity-50 mt-2"
                  >
                    {isProcessingOtp ? "Updating..." : "Reset Password"}
                  </button>
                </form>
              )}

              <button 
                onClick={() => setShowOtpModal(false)}
                className="mt-6 w-full text-center text-sm font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-widest"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}







