"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Settings, CreditCard, Layers, Bell } from "lucide-react";
import { useT } from "@/i18n/client";

export function SettingsTabs() {
  const t = useT();
  const searchParams = useSearchParams();
  // ÄNDRAT: Default är nu "account" istället för "profile"
  const currentView = searchParams.get("view") || "account";

  const tabs = [
    // Tog bort "Profil" härifrån
    { id: "account", label: t("settings.tabs.account"), icon: Settings },
    { id: "notifications", label: t("settings.tabs.notifications"), icon: Bell },
    { id: "billing", label: t("settings.tabs.billing"), icon: CreditCard },
    { id: "cards", label: t("settings.tabs.cards"), icon: Layers },
  ];

  return (
    <div className="flex w-full gap-2 overflow-x-auto border-b border-nordic-highlight/40 pb-px mb-8">
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
                : "border-transparent text-nordic-highlight hover:text-slate-200"
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