import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Mail, ArrowLeft, ShieldCheck, Sparkles } from "lucide-react";

interface LoginPageProps {
  authEmail: string;
  setAuthEmail: (email: string) => void;
  authPassword: string;
  setAuthPassword: (password: string) => void;
  authRole: "buyer" | "vendor" | "admin";
  setAuthRole: (role: "buyer" | "vendor" | "admin") => void;
  handleLoginSubmit: (e: React.FormEvent) => Promise<void>;
  handleGoogleAuth: (flow: "login" | "signup") => void;
  authLoading: boolean;
  isForgotPasswordView: boolean;
  setIsForgotPasswordView: (val: boolean) => void;
  forgotPasswordEmail: string;
  setForgotPasswordEmail: (email: string) => void;
  forgotPasswordLoading: boolean;
  forgotPasswordError: string | null;
  forgotPasswordSuccess: boolean;
  setForgotPasswordSuccess: (val: boolean) => void;
  handleForgotPasswordSubmit: (e: React.FormEvent) => Promise<void>;
}

export default function LoginPage({
  authEmail,
  setAuthEmail,
  authPassword,
  setAuthPassword,
  authRole,
  setAuthRole,
  handleLoginSubmit,
  handleGoogleAuth,
  authLoading,
  isForgotPasswordView,
  setIsForgotPasswordView,
  forgotPasswordEmail,
  setForgotPasswordEmail,
  forgotPasswordLoading,
  forgotPasswordError,
  forgotPasswordSuccess,
  setForgotPasswordSuccess,
  handleForgotPasswordSubmit,
}: LoginPageProps) {
  const navigate = useNavigate();

  return (
    <div className="flex-grow flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl border border-slate-200 shadow-xl relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-[#0066FF]" />

        {/* Home Link */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <button
            onClick={() => navigate("/")}
            className="text-xs font-bold text-slate-500 hover:text-[#0066FF] flex items-center gap-1.5 transition-colors border-0 bg-transparent cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Solutions
          </button>
          <span className="text-[10px] bg-blue-50 text-[#0066FF] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Secure Session
          </span>
        </div>

        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <div className="w-8 h-8 bg-[#FFC107] rounded flex items-center justify-center font-black text-slate-900 text-lg shadow-sm">
              B
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900">
              <span className="text-[#FFC107]">BANT</span>
              <span className="text-[#0066FF]">Confirm</span>
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {isForgotPasswordView ? "Recover Password" : "Login to Workspace"}
          </h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            {isForgotPasswordView
              ? "Confirm your corporate email identity to retrieve access."
              : "Access verified requirements, matching algorithms, and enterprise SaaS catalogs."}
          </p>
        </div>

        {isForgotPasswordView ? (
          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
            <div className="text-center space-y-2 pb-2">
              <p className="text-xs text-slate-500 leading-relaxed">
                Enter your registered email address below and we'll send you a secure link to reset your password instantly.
              </p>
            </div>

            {forgotPasswordSuccess ? (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5 text-center space-y-3">
                <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-sm font-extrabold">
                  ✓
                </div>
                <p className="text-xs text-emerald-800 font-bold leading-relaxed">
                  Security verification email dispatched successfully! Please check your inbox and click the reset link.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPasswordView(false);
                    setForgotPasswordSuccess(false);
                  }}
                  className="text-xs text-[#0066FF] hover:underline font-extrabold cursor-pointer border-0 bg-transparent"
                >
                  Return to Login
                </button>
              </div>
            ) : (
              <>
                {forgotPasswordError && (
                  <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-xs text-red-700 font-medium">
                    {forgotPasswordError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Corporate Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. info.bouuz@gmail.co"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={forgotPasswordLoading}
                  className="w-full bg-[#0066FF] hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold py-2.5 rounded-lg text-xs transition-all shadow-sm cursor-pointer border-0"
                >
                  {forgotPasswordLoading ? "Dispatching security link..." : "Send Reset Link"}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPasswordView(false);
                      setForgotPasswordSuccess(false);
                    }}
                    className="text-xs text-[#0066FF] hover:underline font-extrabold cursor-pointer border-0 bg-transparent"
                  >
                    Back to Login
                  </button>
                </div>
              </>
            )}
          </form>
        ) : (
          <div className="space-y-6">
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="hidden space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Select System Role
                </label>
                <select
                  value={authRole}
                  onChange={(e) => setAuthRole(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer text-slate-700"
                >
                  <option value="buyer">Sourcing Buyer (Procurement / SME)</option>
                  <option value="vendor">Solution Provider (SaaS / Vendor)</option>
                  <option value="admin">Marketplace Administrator (Admin)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Corporate Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. info.bouuz@gmail.co"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPasswordView(true);
                      setForgotPasswordEmail(authEmail);
                      setForgotPasswordSuccess(false);
                    }}
                    className="text-[10px] text-[#0066FF] hover:underline font-bold cursor-pointer border-0 bg-transparent"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-[#0066FF] hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold py-3 rounded-lg text-xs transition-all shadow-md cursor-pointer border-0 mt-4"
              >
                {authLoading ? "Establishing Secure Connection..." : "Authenticate Session"}
              </button>
            </form>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-100"></div>
              <span className="flex-shrink mx-3 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                or
              </span>
              <div className="flex-grow border-t border-slate-100"></div>
            </div>

            <button
              type="button"
              onClick={() => handleGoogleAuth("login")}
              disabled={authLoading}
              className="w-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-extrabold py-2.5 rounded-lg text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 bg-white"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M5.26620007,9.76452941 C6.19875005,6.93863435 8.8544399,4.90909091 12,4.90909091 C13.6909091,4.90909091 15.2181818,5.52272727 16.4181818,6.54545455 L19.8272727,3.13636364 C17.7636364,1.19090909 15.0181818,0 12,0 C7.33124803,0 3.32766107,2.83615413 1.5791244,6.92488349 L5.26620007,9.76452941 Z"
                />
                <path
                  fill="#4285F4"
                  d="M23.490008,12.2727273 C23.490008,11.4136364 23.4136444,10.5954545 23.2727354,9.81818182 L12,9.81818182 L12,14.6363636 L18.4545455,14.6363636 C18.1772727,16.1272727 17.3363636,17.3909091 16.0727273,18.2363636 L19.8272727,21.1454545 C22.0227273,19.1181818 23.490008,16.1272727 23.490008,12.2727273 Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.26620007,14.2354706 L1.5791244,17.0751165 C3.32766107,21.1638459 7.33124803,24 12,24 C15.0181818,24 17.7636364,22.8090909 19.8272727,20.8636364 L16.0727273,17.9545455 C15.0318182,18.65 13.6272727,19.0909091 12,19.0909091 C8.8544399,19.0909091 6.19875005,17.0613657 5.26620007,14.2354706 Z"
                />
                <path
                  fill="#34A853"
                  d="M5.26620007,9.76452941 C4.98185012,10.6300181 4.82352941,11.5574679 4.82352941,12.5190909 C4.82352941,13.4807139 4.98185012,14.4081637 5.26620007,15.2736524 L1.5791244,18.1132983 C0.570258163,16.4258909 0,14.4925722 0,12.5190909 C0,10.5456096 0.570258163,8.61229093 1.5791244,6.92488349 L5.26620007,9.76452941 Z"
                />
              </svg>
              <span>{authLoading ? "Establishing Link..." : "Continue with Google"}</span>
            </button>

            <div className="border-t border-slate-100 pt-5 text-center">
              <p className="text-xs text-slate-500">
                Don't have an enterprise account?{" "}
                <Link
                  to="/signup"
                  className="text-[#0066FF] hover:underline font-extrabold"
                >
                  Create free account
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
