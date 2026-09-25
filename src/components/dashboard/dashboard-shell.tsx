"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { User, Link as PrismaLink } from "@prisma/client";
import NextLink from "next/link";
import {
  LayoutGrid,
  Briefcase,
  Eye,
  Power,
  Mail,
  ExternalLink,
  RefreshCw,
  AppWindow,
  Link2,
  UserRound,
  Share2,
  type LucideIcon,
} from "lucide-react";

import { SocialView } from "@/components/dashboard/social/social-view";
import { BusinessView } from "@/components/dashboard/business/business-view";
import { ProfilePreviewModal } from "@/components/dashboard/profile-preview-modal";
import { OnboardingModal } from "@/components/onboarding/onboarding-modal";
import { OrderCardWidget } from "@/components/dashboard/order-card-widget";
import { PushManager } from "@/components/dashboard/push-manager";
import { DashboardToastProvider, useDashboardToast } from "@/components/dashboard/dashboard-toast";
import { useHeaderBottom } from "@/hooks/useHeaderBottom";
import { useT } from "@/i18n/client";

export type DashboardTab = "links" | "profile" | "share";
const TABS: DashboardTab[] = ["links", "profile", "share"];

type DashboardShellProps = {
  user: User & { links: PrismaLink[] } & {
    hasSeenOnboarding: boolean;
    hasOrderedCard?: boolean;
    // Nytt Apple-konto med auto-genererat username (email-prefix/relay-alias)
    // som ännu inte har gått igenom onboardingens username-steg.
    needsUsernameSetup?: boolean;
  };
  prices: { standard: string; bundle: string };
};

function getEmailProviderLink(email: string) {
  if (email.includes("@gmail")) return "https://mail.google.com/";
  if (email.includes("@outlook") || email.includes("@hotmail") || email.includes("@live")) return "https://outlook.live.com/mail/";
  if (email.includes("@yahoo")) return "https://mail.yahoo.com/";
  if (email.includes("@proton")) return "https://mail.proton.me/";
  if (email.includes("@icloud")) return "https://www.icloud.com/mail";
  return "mailto:";
}

export function DashboardShell(props: DashboardShellProps) {
  return (
    <DashboardToastProvider>
      <DashboardShellInner {...props} />
    </DashboardToastProvider>
  );
}

/*
 * Dashboarden (/dashboard). Tidigare en enda lång scroll (~2 400 px) med
 * profilformulär först och länkarna sist. Nu tre flikar — Länkar (det man
 * gör oftast) · Profil · Dela — med samma funktioner som förut.
 */
function DashboardShellInner({ user, prices }: DashboardShellProps) {
  const t = useT();
  const router = useRouter();
  const toast = useDashboardToast();
  const headerBottom = useHeaderBottom();

  const [activeMode, setActiveMode] = useState<"SOCIAL" | "BUSINESS">((user.profileMode as "SOCIAL" | "BUSINESS") ?? "SOCIAL");
  const [viewMode, setViewMode] = useState<"SOCIAL" | "BUSINESS">(activeMode);
  const [tab, setTab] = useState<DashboardTab>("links");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const profileDirty = useRef(false);
  const tabsRef = useRef<HTMLDivElement>(null);

  // Fliken ligger i URL:en (?tab=) så att omladdning och delade länkar hamnar rätt.
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("tab");
    if (fromUrl && (TABS as string[]).includes(fromUrl)) setTab(fromUrl as DashboardTab);
  }, []);

  const selectTab = (next: DashboardTab) => {
    setTab(next);
    const url = new URL(window.location.href);
    if (next === "links") url.searchParams.delete("tab");
    else url.searchParams.set("tab", next);
    window.history.replaceState(window.history.state, "", url.toString());
    // Håll flikraden i vy när man byter från långt ner på sidan.
    const bar = tabsRef.current;
    if (bar && bar.getBoundingClientRect().top < headerBottom) {
      window.scrollTo({ top: window.scrollY + bar.getBoundingClientRect().top - headerBottom, behavior: "auto" });
    }
  };

  const onDirtyChange = useCallback((dirty: boolean) => {
    profileDirty.current = dirty;
  }, []);

  const switchMode = (next: "SOCIAL" | "BUSINESS") => {
    if (next === viewMode) return;
    // Formuläret för det andra läget byts ut — varna i stället för att tyst
    // kasta osparade ändringar (hände tidigare).
    if (profileDirty.current && !window.confirm(t("dashboard.profile.switchConfirm"))) return;
    profileDirty.current = false;
    setViewMode(next);
  };

  const handleActivate = () => {
    if (viewMode === activeMode) return;
    const previous = activeMode;
    startTransition(async () => {
      setActiveMode(viewMode);
      try {
        const res = await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profileMode: viewMode }),
        });
        if (!res.ok) throw new Error(String(res.status));
        toast({
          message: viewMode === "SOCIAL" ? t("dashboard.mode.activatedSocial") : t("dashboard.mode.activatedBusiness"),
          tone: "success",
        });
        router.refresh();
      } catch (error) {
        console.error("Failed to activate profile mode", error);
        setActiveMode(previous);
        toast({ message: t("common.somethingWentWrong"), tone: "error" });
      }
    });
  };

  const verificationLink = user.email ? getEmailProviderLink(user.email) : "mailto:";
  const isGenericMailto = verificationLink === "mailto:";

  const tabs: { id: DashboardTab; label: string; icon: LucideIcon }[] = [
    { id: "links", label: t("dashboard.tabs.links"), icon: Link2 },
    { id: "profile", label: t("dashboard.tabs.profile"), icon: UserRound },
    { id: "share", label: t("dashboard.tabs.share"), icon: Share2 },
  ];

  const modeButton = (mode: "SOCIAL" | "BUSINESS", Icon: LucideIcon, label: string) => {
    const selected = viewMode === mode;
    const live = activeMode === mode;
    return (
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        onClick={() => switchMode(mode)}
        className={`relative flex h-11 flex-1 items-center justify-center gap-2 rounded-[10px] px-3 text-sm font-semibold transition-[background-color,color] sm:flex-none sm:px-4 ${
          selected
            ? mode === "BUSINESS"
              ? "bg-nordic-accent/15 text-nordic-secondary ring-1 ring-nordic-accent/40"
              : "bg-slate-800 text-nordic-secondary ring-1 ring-white/10"
            : "text-nordic-highlight hover:text-nordic-secondary"
        }`}
      >
        <Icon size={16} />
        {label}
        {live && (
          <span className="absolute right-1.5 top-1.5 flex h-2 w-2" aria-label={t("dashboard.mode.activeProfile")}>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75 motion-reduce:animate-none" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      <PushManager />

      {/* Verifierings-banner */}
      {!user.emailVerified && (
        <div className="flex flex-col items-start justify-between gap-3 rounded-3xl border border-blue-500/20 bg-blue-500/10 p-4 animate-in fade-in slide-in-from-top-2 sm:flex-row sm:items-center sm:p-5">
          <div className="flex gap-3">
            <div className="h-fit rounded-xl bg-blue-500/20 p-2.5">
              <Mail className="text-blue-400" size={22} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-nordic-secondary sm:text-base">{t("dashboard.verifyBanner.title")}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-nordic-highlight sm:text-sm">
                {t("dashboard.verifyBanner.bodyBefore")} <span className="font-medium text-nordic-secondary">{user.email}</span>.{" "}
                <br className="hidden sm:block" />
                <span className="hidden sm:inline">{t("dashboard.verifyBanner.bodyAfter")}</span>
              </p>
            </div>
          </div>
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
            <a
              href={verificationLink}
              target={isGenericMailto ? "_self" : "_blank"}
              rel="noopener noreferrer"
              className="flex min-h-[44px] items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-colors hover:bg-blue-500"
            >
              {isGenericMailto ? (
                <>
                  {t("dashboard.verifyBanner.openMailApp")} <AppWindow size={14} />
                </>
              ) : (
                <>
                  {t("dashboard.verifyBanner.openInbox")} <ExternalLink size={14} />
                </>
              )}
            </a>
            <NextLink
              href={`/verify-resend?email=${encodeURIComponent(user.email || "")}`}
              className="flex min-h-[44px] items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-nordic-highlight/20 px-4 text-sm font-medium text-nordic-highlight transition-all hover:bg-nordic-highlight/5"
            >
              <RefreshCw size={14} />
              {/* Etiketten visas även på mobil (var tidigare bara en ikon). */}
              <span>{t("dashboard.verifyBanner.resend")}</span>
            </NextLink>
          </div>
        </div>
      )}

      {/* Upsell (visas bara om kort saknas) */}
      {!user.hasOrderedCard && <OrderCardWidget isPremium={user.isPremium} prices={prices} />}

      {/* Rubrik + läge */}
      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-nordic-secondary sm:text-3xl">{t("dashboard.header.title")}</h1>
          <p className="mt-0.5 hidden text-sm text-nordic-highlight sm:block">
            {viewMode === "SOCIAL" ? t("dashboard.header.subtitleSocial") : t("dashboard.header.subtitleBusiness")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div role="radiogroup" aria-label={t("dashboard.mode.editing")} className="flex flex-1 rounded-[14px] border border-white/10 bg-nordic-primary/70 p-1 sm:flex-none">
            {modeButton("SOCIAL", LayoutGrid, t("dashboard.mode.social"))}
            {modeButton("BUSINESS", Briefcase, t("dashboard.mode.business"))}
          </div>
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            title={t("dashboard.mode.previewTitle")}
            className="flex h-[54px] shrink-0 items-center gap-2 rounded-[14px] border border-nordic-support bg-nordic-secondary px-4 text-sm font-bold text-nordic-primary shadow-lg transition-all hover:bg-nordic-support"
          >
            <Eye size={18} />
            <span>{t("dashboard.mode.preview")}</span>
          </button>
        </div>
      </div>

      {/* Live-status: vilket läge besökarna ser */}
      {viewMode !== activeMode ? (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-400/25 bg-amber-950/25 p-3 pl-4 animate-in fade-in">
          <p className="min-w-0 flex-1 text-[13px] text-amber-100">
            {viewMode === "BUSINESS" ? t("dashboard.mode.notLiveBusiness") : t("dashboard.mode.notLiveSocial")}
          </p>
          <button
            type="button"
            onClick={handleActivate}
            disabled={isPending}
            className="flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl bg-nordic-secondary px-3.5 text-sm font-bold text-nordic-primary disabled:opacity-60"
          >
            <Power size={16} className={isPending ? "animate-spin" : ""} />
            {viewMode === "SOCIAL" ? t("dashboard.mode.activateSocial") : t("dashboard.mode.activateBusiness")}
          </button>
        </div>
      ) : (
        <p className="flex items-center gap-2 px-1 text-[13px] text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          {viewMode === "SOCIAL" ? t("dashboard.mode.liveSocial") : t("dashboard.mode.liveBusiness")}
        </p>
      )}

      {/* Flikar — klistras under navbaren */}
      <div
        ref={tabsRef}
        className="sticky z-30 -mx-4 bg-slate-950/85 px-4 py-2 backdrop-blur-xl [@media(prefers-reduced-transparency:reduce)]:bg-slate-950"
        style={{ top: headerBottom }}
      >
        <div role="tablist" aria-label={t("dashboard.tabs.label")} className="grid grid-cols-3 gap-1 rounded-[14px] border border-white/10 bg-slate-900/80 p-1">
          {tabs.map(({ id, label, icon: Icon }) => {
            const selected = tab === id;
            return (
              <button
                key={id}
                id={`tab-${id}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`panel-${id}`}
                onClick={() => selectTab(id)}
                className={`flex h-11 items-center justify-center gap-2 rounded-[10px] text-sm font-semibold transition-[background-color,color] ${
                  selected ? "bg-white text-slate-950 shadow" : "text-slate-300 hover:text-white"
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="pb-6">
        {viewMode === "BUSINESS" ? (
          <BusinessView user={user} tab={tab} onDirtyChange={onDirtyChange} onPreview={() => setIsPreviewOpen(true)} />
        ) : (
          <SocialView user={user} tab={tab} onDirtyChange={onDirtyChange} onPreview={() => setIsPreviewOpen(true)} />
        )}
      </div>

      <ProfilePreviewModal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} username={user.username || ""} mode={viewMode} />

      <OnboardingModal
        user={{
          name: user.name,
          username: user.username,
          isPremium: user.isPremium,
          hasSeenOnboarding: user.hasSeenOnboarding,
          needsUsernameSetup: user.needsUsernameSetup ?? false,
          // Skickades inte med tidigare -> "kortet är på väg"-grenen kunde aldrig visas.
          hasOrderedCard: user.hasOrderedCard ?? false,
        }}
        prices={prices}
      />
    </div>
  );
}
