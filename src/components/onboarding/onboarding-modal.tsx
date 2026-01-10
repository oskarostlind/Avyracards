"use client";

import { useState, useEffect } from "react";
import { X, ChevronRight } from "lucide-react";
import { completeOnboarding } from "@/actions/onboarding";
import { DashboardVisual, StatsVisual, ThemesVisual, HardwareVisual } from "./slides/visuals";
import { HardwareContent } from "./slides/hardware-slide";

interface OnboardingModalProps {
  user: {
    name?: string | null;
    isPremium: boolean;
    hasSeenOnboarding: boolean;
  };
  prices: { standard: string; bundle: string };
}

const STEPS = [
  {
    id: "intro",
    title: "Välkommen till Avyra",
    desc: "Din nya digitala hub. Här samlar du dina länkar, sociala medier och kontaktuppgifter på ett och samma ställe.",
    buttonText: "Visa mig runt",
    visual: DashboardVisual,
  },
  {
    id: "stats",
    title: "Lär känna din publik",
    desc: "Sluta gissa. Med vår inbyggda analys ser du exakt vem som besöker dig, varifrån de kommer och vad de är intresserade av.",
    buttonText: "Spännande",
    visual: StatsVisual,
  },
  {
    id: "themes",
    title: "Designa din identitet",
    desc: "Första intrycket räknas. Välj bland våra professionella teman eller skräddarsy varje detalj för att matcha ditt varumärke.",
    buttonText: "Gå vidare",
    visual: ThemesVisual,
  },
  {
    id: "hardware",
    title: "", 
    desc: "", 
    buttonText: "",
    visual: HardwareVisual,
  },
];

export function OnboardingModal({ user, prices }: OnboardingModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!user.hasSeenOnboarding) {
      const timer = setTimeout(() => setIsOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, [user.hasSeenOnboarding]);

  const handleFinish = async () => {
    setIsOpen(false);
    await completeOnboarding();
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  if (!isOpen) return null;

  const CurrentVisual = STEPS[currentStep].visual;
  const isLastStep = currentStep === STEPS.length - 1;

  return (
    // FIX: Justerad padding och flex för att centrera modalen snyggt även på mobil
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-500">
      
      {/* Container: Inte fullbredd på mobil längre, utan 95% bredd och max 85vh höjd för "pop-up"-känsla */}
      <div className="w-full max-w-[95%] h-auto max-h-[85vh] aspect-[9/16] sm:aspect-auto sm:h-[650px] sm:max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col md:flex-row relative">
        
        {/* Close Button - Flyttad och säkrad position */}
        {!isLastStep && (
            <button 
                onClick={handleFinish} 
                className="absolute top-3 right-3 z-[60] p-2 bg-slate-950/60 backdrop-blur-md md:bg-slate-800/50 hover:bg-slate-800 text-white rounded-full transition-all border border-white/10"
            >
                <X size={18} />
            </button>
        )}

        {/* --- VISUAL COLUMN (Order First on Mobile) --- */}
        {/* Justerad höjd: Tar ca 40% på mobil */}
        <div className="w-full h-[40%] md:h-full md:w-[55%] bg-slate-950 relative order-first md:order-last shrink-0 overflow-hidden">
            <div className="w-full h-full animate-in fade-in zoom-in-95 duration-700 key={currentStep}">
                {STEPS[currentStep].id === "stats" ? (
                    // @ts-ignore
                    <CurrentVisual isPremium={user.isPremium} />
                ) : STEPS[currentStep].id === "hardware" ? (
                      // @ts-ignore
                    <CurrentVisual name={user.name || "Ditt Namn"} />
                ) : (
                    // @ts-ignore
                    <CurrentVisual />
                )}
            </div>
        </div>

        {/* --- CONTENT COLUMN --- */}
        {/* Justerad padding och scroll för små skärmar */}
        <div className="w-full h-[60%] md:h-full md:w-[45%] p-5 sm:p-8 md:p-12 flex flex-col justify-between md:justify-center relative z-10 bg-slate-900 overflow-y-auto">
            
            {/* Progress Dots */}
            <div className="flex gap-2 mb-2 sm:mb-4 md:mb-12 shrink-0">
                {STEPS.map((_, i) => (
                    <div 
                        key={i} 
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                            i === currentStep ? "w-6 sm:w-8 bg-emerald-500" : "w-1.5 sm:w-2 bg-slate-800"
                        }`} 
                    />
                ))}
            </div>

            <div className="flex-1 flex flex-col justify-center">
                {isLastStep ? (
                    // Hardware Content (Priser & Knappar)
                    <div className="h-full">
                        <HardwareContent user={user} onFinish={handleFinish} prices={prices} />
                    </div>
                ) : (
                    <div className="space-y-3 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 key={currentStep}">
                        <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight">
                            {STEPS[currentStep].title}
                        </h2>
                        <p className="text-sm sm:text-lg text-slate-400 leading-relaxed">
                            {STEPS[currentStep].desc}
                        </p>
                    </div>
                )}
            </div>

            {!isLastStep && (
                <div className="mt-4 pt-4 border-t border-slate-800/50 md:border-none shrink-0">
                    <button 
                        onClick={handleNext}
                        className="w-full md:w-auto group flex items-center justify-center gap-2 px-6 py-3 sm:py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base sm:text-lg rounded-xl transition-all shadow-lg shadow-emerald-900/20"
                    >
                        {STEPS[currentStep].buttonText}
                        <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            )}
        </div>

      </div>
    </div>
  );
}