"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
// VIKTIGT: Importera signIn från next-auth/react (eller var din klient-auth ligger)
import { signIn } from "next-auth/react"; 

interface RegisterFormProps {
  selectedPlan?: string; 
}

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

export default function RegisterForm({ selectedPlan = "free" }: RegisterFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [globalError, setGlobalError] = useState<string>("");
  const [isLoggingIn, setIsLoggingIn] = useState(false); // Ny state för "Loggar in..."

  const planFromUrl = searchParams.get("plan");
  const activePlan = planFromUrl || selectedPlan;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      profileMode: "social",
    },
  });

  const selectedMode = watch("profileMode");

  const onSubmit = async (data: RegisterFormData) => {
    setGlobalError("");

    try {
      // 1. Skapa kontot
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

      // 2. Automatiskt Inloggning (Lazy Verification)
      setIsLoggingIn(true);
      
      const signInResult = await signIn("credentials", {
        redirect: false, // Vi hanterar redirect manuellt för att styra flödet
        email: data.email,
        password: data.password,
      });

      if (signInResult?.error) {
        // Om inloggningen av någon anledning falierar (ovanligt efter lyckad reg)
        setGlobalError("Konto skapat, men inloggningen misslyckades. Vänligen logga in manuellt.");
        router.push("/login?registered=true");
        return;
      }

      // 3. Styr vart användaren hamnar ("Sticky Intent")
      if (activePlan === "premium" || activePlan === "bundle") {
          // Om de ville ha Bundle -> Skicka till Order
          // Om de ville ha Premium -> Skicka till Checkout
          if (activePlan === "bundle") {
             router.push("/order?bundle=pro-bundle");
          } else {
             router.push("/checkout/premium"); // Eller var du har din rena premium-checkout
          }
      } else {
          // Gratis -> Dashboard
          router.push("/dashboard");
      }
      
      router.refresh(); // Uppdatera sessionen i klienten

    } catch (error) {
      setGlobalError("Kunde inte nå servern. Kontrollera din anslutning.");
      setIsLoggingIn(false);
    }
  };

  const isLoading = isSubmitting || isLoggingIn;

  return (
    <div className="w-full max-w-md mx-auto p-6 space-y-8 bg-nordic-primary text-nordic-secondary rounded-3xl border border-nordic-highlight/40 shadow-2xl">
      <div className="text-center space-y-2">
        <h6 className="text-xs font-bold tracking-widest text-nordic-highlight uppercase">SOCIALCARD</h6>
        <h1 className="text-3xl font-bold tracking-tight">Skapa konto</h1>
        <p className="text-sm text-nordic-highlight">
          Registrera dig för att skapa din digitala kortprofil.
        </p>
        
        {activePlan !== "free" && (
            <div className="mt-2 inline-block px-3 py-1 rounded-full bg-nordic-accent/10 border border-nordic-accent/30 text-xs font-bold text-nordic-accent uppercase tracking-wide">
                Vald plan: {activePlan === "bundle" ? "Pro Bundle" : "Premium"}
            </div>
        )}
      </div>

      {globalError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-sm animate-in fade-in slide-in-from-top-2">
          <AlertCircle size={18} />
          <span>{globalError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-3">
          <label className="text-sm font-medium text-nordic-highlight">Profiltyp</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setValue("profileMode", "social")}
              className={`p-4 rounded-xl border flex flex-col items-start gap-2 transition-all ${
                selectedMode === "social"
                  ? "bg-nordic-accent text-nordic-primary border-nordic-accent"
                  : "bg-nordic-primary border-nordic-highlight/40 text-nordic-highlight hover:border-nordic-highlight/60"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${selectedMode === "social" ? "bg-nordic-primary" : "bg-nordic-highlight/60"}`} />
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
                  ? "bg-nordic-accent text-nordic-primary border-nordic-accent"
                  : "bg-nordic-primary border-nordic-highlight/40 text-nordic-highlight hover:border-nordic-highlight/60"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${selectedMode === "business" ? "bg-nordic-primary" : "bg-nordic-highlight/60"}`} />
                <span className="font-bold text-sm">Business</span>
              </div>
              <p className="text-[10px] opacity-80 text-left leading-tight">
                För yrkespersoner, säljare och företag som vill ha ett modernt visitkort.
              </p>
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="username" className="block text-sm font-medium text-nordic-highlight">
            Användarnamn
          </label>
          <input
            {...register("username")}
            id="username"
            type="text"
            className={`w-full px-4 py-3 rounded-xl bg-nordic-primary border text-nordic-secondary placeholder:text-nordic-highlight/60 focus:outline-none focus:ring-2 focus:ring-nordic-accent/60 transition-all ${
              errors.username ? "border-red-500/50 focus:border-red-500" : "border-nordic-highlight/40 focus:border-nordic-accent"
            }`}
            placeholder="t.ex. elonmusk"
          />
          {errors.username && (
            <p className="text-xs text-red-400 ml-1">{errors.username.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-nordic-highlight">
            E-post
          </label>
          <input
            {...register("email")}
            id="email"
            type="email"
            className={`w-full px-4 py-3 rounded-xl bg-nordic-primary border text-nordic-secondary placeholder:text-nordic-highlight/60 focus:outline-none focus:ring-2 focus:ring-nordic-accent/60 transition-all ${
              errors.email ? "border-red-500/50 focus:border-red-500" : "border-nordic-highlight/40 focus:border-nordic-accent"
            }`}
            placeholder="namn@exempel.se"
          />
          {errors.email && (
            <p className="text-xs text-red-400 ml-1">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-nordic-highlight">
            Lösenord
          </label>
          <input
            {...register("password")}
            id="password"
            type="password"
            className={`w-full px-4 py-3 rounded-xl bg-nordic-primary border text-nordic-secondary placeholder:text-nordic-highlight/60 focus:outline-none focus:ring-2 focus:ring-nordic-accent/60 transition-all ${
              errors.password ? "border-red-500/50 focus:border-red-500" : "border-nordic-highlight/40 focus:border-nordic-accent"
            }`}
            placeholder="••••••••"
          />
          {errors.password && (
            <p className="text-xs text-red-400 ml-1">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 bg-nordic-secondary text-nordic-primary font-bold rounded-xl hover:bg-nordic-support focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-nordic-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? <Loader2 className="animate-spin" /> : "Skapa konto & Logga in"}
        </button>
      </form>

      <p className="text-center text-xs text-nordic-highlight">
        Genom att skapa konto godkänner du våra{" "}
        <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-200">
          användarvillkor
        </a>{" "}
        och{" "}
        <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-200">
          integritetspolicyn
        </a>
        . Villkoren har nolltolerans mot stötande eller kränkande innehåll — konton
        som bryter mot dem stängs av.
      </p>
    </div>
  );
}