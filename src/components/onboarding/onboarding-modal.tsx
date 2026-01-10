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
  prices: { standard: string; bundle: string }; // <--- NYTT
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-500">
      
      <div className="w-full max-w-5xl h-[650px] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col md:flex-row relative">
        
        {!isLastStep && (
            <button 
                onClick={handleFinish} 
                className="absolute top-6 right-6 z-20 p-2 bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full transition-all"
            >
                <X size={20} />
            </button>
        )}

        {/* --- LEFT COLUMN: CONTENT --- */}
        <div className="w-full md:w-[45%] p-8 md:p-12 flex flex-col justify-center relative z-10 bg-slate-900">
            
            <div className="flex gap-2 mb-8 md:mb-12">
                {STEPS.map((_, i) => (
                    <div 
                        key={i} 
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                            i === currentStep ? "w-8 bg-emerald-500" : "w-2 bg-slate-800"
                        }`} 
                    />
                ))}
            </div>

            <div className="flex-1 flex flex-col justify-center">
                {isLastStep ? (
                    // SKICKAR MED PRICES HÄR
                    <HardwareContent user={user} onFinish={handleFinish} prices={prices} />
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 key={currentStep}">
                        <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight">
                            {STEPS[currentStep].title}
                        </h2>
                        <p className="text-lg text-slate-400 leading-relaxed">
                            {STEPS[currentStep].desc}
                        </p>
                    </div>
                )}
            </div>

            {!isLastStep && (
                <div className="mt-8 md:mt-0 pt-8">
                    <button 
                        onClick={handleNext}
                        className="group flex items-center gap-3 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg rounded-xl transition-all shadow-lg shadow-emerald-900/20"
                    >
                        {STEPS[currentStep].buttonText}
                        <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            )}
        </div>

        {/* --- RIGHT COLUMN: VISUAL --- */}
        <div className="hidden md:block w-[55%] h-full bg-slate-950 relative">
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

      </div>
    </div>
  );
}