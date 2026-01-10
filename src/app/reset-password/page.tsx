"use client";

import { resetPassword } from "@/actions/reset-password";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-nordic-primary text-nordic-secondary">
        <div className="p-6 bg-slate-900 border border-nordic-highlight/40 rounded-xl shadow-xl">
            Ogiltig eller saknad återställningskod.
        </div>
      </div>
    );
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    
    // Lägg till token i formData manuellt
    formData.append("token", token!);
    
    const res = await resetPassword(formData);
    
    // Om vi är här har redirect inte skett (dvs fel)
    setLoading(false);
    if (res?.error) setError(res.error);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-nordic-primary px-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-slate-900 border border-nordic-highlight/20 rounded-2xl shadow-2xl">
        
        {/* Header Section (Matchar Login-form) */}
        <div className="text-center space-y-2">
            <h3 className="text-xs font-bold tracking-widest text-nordic-highlight uppercase">
              AvyraCards
            </h3>
            <h1 className="text-3xl font-bold text-nordic-secondary tracking-tight">
              Nytt lösenord
            </h1>
            <p className="text-nordic-highlight text-sm">
              Välj ett säkert lösenord och bekräfta det nedan.
            </p>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form action={handleSubmit} className="space-y-6">
          
          <div className="space-y-4">
            {/* Fält 1: Lösenord */}
            <div className="space-y-2">
                <label 
                  htmlFor="password" 
                  className="text-sm font-medium text-nordic-secondary block"
                >
                    Nytt lösenord
                </label>
                <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      className="w-full px-4 py-3 bg-nordic-primary border border-nordic-highlight/30 rounded-xl text-nordic-secondary placeholder:text-nordic-highlight/50 focus:outline-none focus:ring-2 focus:ring-nordic-accent/50 focus:border-nordic-accent transition-all pr-10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-nordic-highlight hover:text-nordic-secondary p-1"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
            </div>

            {/* Fält 2: Bekräfta Lösenord */}
            <div className="space-y-2">
                <label 
                  htmlFor="confirmPassword" 
                  className="text-sm font-medium text-nordic-secondary block"
                >
                    Bekräfta lösenord
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password" 
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-nordic-primary border border-nordic-highlight/30 rounded-xl text-nordic-secondary placeholder:text-nordic-highlight/50 focus:outline-none focus:ring-2 focus:ring-nordic-accent/50 focus:border-nordic-accent transition-all"
                  placeholder="••••••••"
                />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-nordic-secondary hover:bg-nordic-support text-nordic-primary font-bold rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-white/5 flex items-center justify-center gap-2"
          >
            {loading ? (
                <>
                    <Loader2 size={18} className="animate-spin" /> Sparar...
                </>
            ) : (
                "Spara nytt lösenord"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}