"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Settings, CreditCard, Layers } from "lucide-react";

export function SettingsTabs() {
  const searchParams = useSearchParams();
  // ÄNDRAT: Default är nu "account" istället för "profile"
  const currentView = searchParams.get("view") || "account";

  const tabs = [
    // Tog bort "Profil" härifrån
    { id: "account", label: "Konto & Integritet", icon: Settings },
    { id: "billing", label: "Prenumeration", icon: CreditCard },
    { id: "cards", label: "Mina Kort", icon: Layers },
  ];

  return (
    <div className="flex w-full gap-2 overflow-x-auto border-b border-slate-800 pb-px mb-8">
      {tabs.map((tab) => {
        const isActive = currentView === tab.id;
        const Icon = tab.icon;
        return (
          <Link
            key={tab.id}
            href={`/profile/settings?view=${tab.id}`}
            className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              isActive
                ? "border-purple-500 text-purple-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Icon size={16} />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}