"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react"; // Tog bort oanvända ikoner

// 1. Definiera validerings-schema
const RegisterSchema = z.object({
  profileMode: z.enum(["social", "business"]),
  username: z
    .string()
    .min(3, "Användarnamnet måste vara minst 3 tecken")
    .max(30, "Max 30 tecken")
    .regex(/^[a-zA-Z0-9_]+$/, "Endast bokstäver, siffror och understreck"),
  email: z.string().email("Ogiltig e-postadress"),
  password: z.string().min(6, "Lösenordet måste vara minst 6 tecken"),
});

type RegisterFormData = z.infer<typeof RegisterSchema>;

export default function RegisterForm() {
  const router = useRouter();
  const [globalError, setGlobalError] = useState<string>("");

  // 2. Koppla React Hook Form
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      profileMode: "social", // Standardval
    },
  });

  const selectedMode = watch("profileMode");

  const onSubmit = async (data: RegisterFormData) => {
    setGlobalError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        setGlobalError(result.error || "Registreringen misslyckades.");
        return;
      }

      // Succé! Skicka till inloggning med flagga
      router.push("/login?registered=true");
      
    } catch (error) {
      setGlobalError("Kunde inte nå servern. Kontrollera din anslutning.");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 space-y-8 bg-gray-950 text-white rounded-3xl border border-gray-800 shadow-2xl">
      <div className="text-center space-y-2">
        <h6 className="text-xs font-bold tracking-widest text-gray-500 uppercase">SOCIALCARD</h6>
        <h1 className="text-3xl font-bold tracking-tight">Skapa konto</h1>
        <p className="text-sm text-gray-400">
          Registrera dig för att skapa din digitala kortprofil.
        </p>
      </div>

      {globalError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-sm animate-in fade-in slide-in-from-top-2">
          <AlertCircle size={18} />
          <span>{globalError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Profiltyp Väljare */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-300">Profiltyp</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setValue("profileMode", "social")}
              className={`p-4 rounded-xl border flex flex-col items-start gap-2 transition-all ${
                selectedMode === "social"
                  ? "bg-blue-600 border-blue-500 text-white"
                  : "bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${selectedMode === "social" ? "bg-white" : "bg-gray-600"}`} />
                <span className="font-bold text-sm">Social</span>
              </div>
              <p className="text-[10px] opacity-80 text-left leading-tight">
                För kreatörer, influencers och profiler som vill samla sociala medier.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setValue("profileMode", "business")}
              className={`p-4 rounded-xl border flex flex-col items-start gap-2 transition-all ${
                selectedMode === "business"
                  ? "bg-emerald-600 border-emerald-500 text-white"
                  : "bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700"
              }`}
            >
               <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${selectedMode === "business" ? "bg-white" : "bg-gray-600"}`} />
                <span className="font-bold text-sm">Business</span>
              </div>
              <p className="text-[10px] opacity-80 text-left leading-tight">
                För yrkespersoner, säljare och företag som vill ha ett modernt visitkort.
              </p>
            </button>
          </div>
        </div>

        {/* Användarnamn */}
        <div className="space-y-2">
          <label htmlFor="username" className="block text-sm font-medium text-gray-300">
            Användarnamn
          </label>
          <input
            {...register("username")}
            id="username"
            type="text"
            className={`w-full px-4 py-3 rounded-xl bg-gray-900 border text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ${
              errors.username ? "border-red-500/50 focus:border-red-500" : "border-gray-800 focus:border-blue-500"
            }`}
            placeholder="t.ex. elonmusk"
          />
          {errors.username && (
            <p className="text-xs text-red-400 ml-1">{errors.username.message}</p>
          )}
        </div>

        {/* E-post */}
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-gray-300">
            E-post
          </label>
          <input
            {...register("email")}
            id="email"
            type="email"
            className={`w-full px-4 py-3 rounded-xl bg-gray-900 border text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ${
              errors.email ? "border-red-500/50 focus:border-red-500" : "border-gray-800 focus:border-blue-500"
            }`}
            placeholder="namn@exempel.se"
          />
          {errors.email && (
            <p className="text-xs text-red-400 ml-1">{errors.email.message}</p>
          )}
        </div>

        {/* Lösenord */}
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-gray-300">
            Lösenord
          </label>
          <input
            {...register("password")}
            id="password"
            type="password"
            className={`w-full px-4 py-3 rounded-xl bg-gray-900 border text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ${
              errors.password ? "border-red-500/50 focus:border-red-500" : "border-gray-800 focus:border-blue-500"
            }`}
            placeholder="••••••••"
          />
          {errors.password && (
            <p className="text-xs text-red-400 ml-1">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {isSubmitting ? <Loader2 className="animate-spin" /> : "Skapa konto"}
        </button>
      </form>

      <p className="text-center text-xs text-gray-500">
        Genom att skapa konto godkänner du våra användarvillkor.
      </p>
    </div>
  );
}