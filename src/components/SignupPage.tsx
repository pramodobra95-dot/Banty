import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserCheck, Mail, Lock, Building, Phone, MapPin, ArrowLeft, ShieldCheck, CheckCircle2 } from "lucide-react";

interface SignupPageProps {
  signUpName: string;
  setSignUpName: (val: string) => void;
  signUpEmail: string;
  setSignUpEmail: (val: string) => void;
  signUpPassword: string;
  setSignUpPassword: (val: string) => void;
  signUpCompany: string;
  setSignUpCompany: (val: string) => void;
  signUpMobile: string;
  setSignUpMobile: (val: string) => void;
  signUpCity: string;
  setSignUpCity: (val: string) => void;
  signUpRole: "buyer" | "vendor" | "admin";
  setSignUpRole: (val: "buyer" | "vendor" | "admin") => void;
  handleSignUpSubmit: (e: React.FormEvent) => Promise<void>;
  handleGoogleAuth: (flow: "login" | "signup") => void;
  authLoading: boolean;
}

export default function SignupPage({
  signUpName, setSignUpName,
  signUpEmail, setSignUpEmail,
  signUpPassword, setSignUpPassword,
  signUpCompany, setSignUpCompany,
  signUpMobile, setSignUpMobile,
  signUpCity, setSignUpCity,
  signUpRole, setSignUpRole,
  handleSignUpSubmit, handleGoogleAuth, authLoading,
}: SignupPageProps) {
  const navigate = useNavigate();
  const isVendor = signUpRole === "vendor";

  return (
    <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-5 bg-white p-7 rounded-2xl border border-slate-200 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-[#0066FF]" />

        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <button onClick={() => navigate("/")} className="text-xs font-bold text-slate-500 hover:text-[#0066FF] flex items-center gap-1.5 transition-colors border-0 bg-transparent cursor-pointer">
            <ArrowLeft className="w-4 h-4" /> Back to Solutions
          </button>
          <span className="text-[10px] bg-blue-50 text-[#0066FF] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Registration
          </span>
        </div>

        <div className="text-center space-y-1.5">
          <div className="flex items-center justify-center gap-2">
            <div className="w-8 h-8 bg-[#FFC107] rounded flex items-center justify-center font-black text-slate-900 text-lg shadow-sm">B</div>
            <span className="text-xl font-black tracking-tight text-slate-900"><span className="text-[#FFC107]">BANT</span><span className="text-[#0066FF]">Confirm</span></span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">{isVendor ? "Create Vendor Account" : "Create Enterprise Account"}</h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            {isVendor ? "Create your login now. We will send a confirmation email and open your Vendor Dashboard immediately." : "Build your professional identity and unlock the BANTConfirm sourcing workspace."}
          </p>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">I want to join as</label>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setSignUpRole("buyer")} className={`py-2 text-center rounded-lg text-xs font-extrabold border transition-all cursor-pointer ${signUpRole === "buyer" ? "bg-blue-50 border-[#0066FF] text-[#0066FF]" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"}`}>Sourcing Buyer</button>
            <button type="button" onClick={() => setSignUpRole("vendor")} className={`py-2 text-center rounded-lg text-xs font-extrabold border transition-all cursor-pointer ${isVendor ? "bg-blue-50 border-[#0066FF] text-[#0066FF]" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"}`}>Solution Provider</button>
          </div>
        </div>

        {isVendor && (
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 space-y-1.5">
            <p className="text-xs font-black text-slate-800">Simple vendor onboarding</p>
            <div className="grid grid-cols-1 gap-1 text-[10px] text-slate-600">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> Create your own email and password</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> Get registration confirmation by email</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> Add products from your Vendor Dashboard</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSignUpSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Full Name *</label>
            <div className="relative"><UserCheck className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input type="text" required placeholder="e.g. Anand Sen" value={signUpName} onChange={(e) => setSignUpName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-xs focus:ring-1 focus:ring-blue-500 outline-none" /></div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Corporate Email *</label>
            <div className="relative"><Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input type="email" required placeholder="e.g. anand@company.com" value={signUpEmail} onChange={(e) => setSignUpEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-xs focus:ring-1 focus:ring-blue-500 outline-none" /></div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">{isVendor ? "Create Your Vendor Password *" : "Password *"}</label>
            <div className="relative"><Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input type="password" required minLength={6} placeholder="Minimum 6 characters" value={signUpPassword} onChange={(e) => setSignUpPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-xs focus:ring-1 focus:ring-blue-500 outline-none" /></div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Company Name *</label>
            <div className="relative"><Building className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input type="text" required placeholder="e.g. Zenith Solutions Ltd" value={signUpCompany} onChange={(e) => setSignUpCompany(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-xs focus:ring-1 focus:ring-blue-500 outline-none" /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1"><label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Mobile *</label><div className="relative"><Phone className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" /><input type="text" required placeholder="+91 99999 88888" value={signUpMobile} onChange={(e) => setSignUpMobile(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 outline-none" /></div></div>
            <div className="space-y-1"><label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">City *</label><div className="relative"><MapPin className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" /><input type="text" required placeholder="e.g. Noida" value={signUpCity} onChange={(e) => setSignUpCity(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 outline-none" /></div></div>
          </div>
          <button type="submit" disabled={authLoading} className="w-full bg-[#0066FF] hover:bg-blue-700 text-white font-extrabold py-3 rounded-lg text-xs transition-all shadow-md cursor-pointer border-0 mt-3 disabled:opacity-60">
            {authLoading ? "Creating your secure account..." : isVendor ? "Create Vendor Account & Open Dashboard" : "Create Account"}
          </button>
        </form>

        <div className="relative flex py-1 items-center"><div className="flex-grow border-t border-slate-100"></div><span className="flex-shrink mx-3 text-slate-400 text-[10px] font-bold uppercase tracking-wider">or</span><div className="flex-grow border-t border-slate-100"></div></div>
        <button type="button" onClick={() => handleGoogleAuth("signup")} disabled={authLoading} className="w-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-extrabold py-2.5 rounded-lg text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 bg-white">
          <span>{authLoading ? "Establishing Link..." : "Continue with Google"}</span>
        </button>

        <div className="border-t border-slate-100 pt-5 text-center"><p className="text-xs text-slate-500">Already have an account? <Link to="/login" className="text-[#0066FF] hover:underline font-extrabold">Sign in</Link></p></div>
      </div>
    </div>
  );
}
