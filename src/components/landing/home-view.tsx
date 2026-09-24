"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowRight, Check, ChevronDown, ShieldCheck, Users } from "lucide-react";
import { useIsApp } from "@/hooks/useIsApp";
import { logIosNativeRuntime } from "@/lib/ios-native-runtime-debug";
import { useT } from "@/i18n/client";
import { AppStoreLink } from "@/components/app-store-link";
import { CardPreview3D } from "@/components/card-preview-3d";

/**
 * Startsidan — riktning "Kortet i fokus" (prototyp C, 2026-09-25).
 *
 * Det fysiska kortet är hjälten och renderas med SAMMA komponent som shopen
 * (CardPreview3D: ISO ID-1-geometri, matt svart genomfärgad PVC, enbart
 * lockupen på framsidan). Bredvid står en telefon där besökaren kan växla
 * Social/Business och se profilen ändra sig — det är kärnkonceptet visat,
 * inte beskrivet.
 *
 * Designregler som sidan följer: en accent (nordic-accent), återkoppling på
 * tryck (active:scale), inga eviga animationer, tryckytor ≥ 44 px, all copy
 * ur i18n-trädet. Metadata + JSON-LD sätts i app/page.tsx (serverskal).
 */

type Mode = "SOCIAL" | "BUSINESS";

export function HomeView() {
  const t = useT();
  const router = useRouter();
  const { status } = useSession();
  const isApp = useIsApp();
  const [mode, setMode] = useState<Mode>("SOCIAL");

  // Inuti appen är startsidan bara en omväg: inloggad → dashboard, annars login.
  useEffect(() => {
    if (!isApp || status === "loading") return;

    if (status === "authenticated") {
      logIosNativeRuntime({
        scope: "APP_SHELL",
        location: "home-view.tsx:redirect",
        message: "App redirect to dashboard",
        data: { status },
      });
      router.replace("/dashboard");
      return;
    }

    logIosNativeRuntime({
      scope: "APP_SHELL",
      location: "home-view.tsx:redirect",
      message: "App redirect to login",
      data: { status },
    });
    router.replace("/login");
  }, [isApp, status, router]);

  return (
    <div className="bg-nordic-primary text-nordic-secondary selection:bg-nordic-accent/30">
      {/* ------------------------------------------------------------ HERO */}
      <section className="relative overflow-hidden px-4 pb-20 pt-16 md:px-8 md:pt-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-24 h-[700px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(69,208,193,0.16)_0%,rgba(2,6,23,0)_60%)]"
        />

        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-5 text-center">
          <span className="inline-flex h-8 items-center gap-2 rounded-full border border-white/10 px-3.5 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-300">
            {t("home.badgeNew")}
            <span className="text-nordic-accent">·</span>
            <span className="normal-case tracking-normal">{t("home.badgeFeature")}</span>
          </span>

          <h1 className="max-w-4xl text-[44px] font-extrabold leading-[0.98] tracking-[-0.045em] sm:text-6xl md:text-[84px]">
            {t("home.heroLine1")} {t("home.heroLine2")} {t("home.heroLine3")}
          </h1>

          <p className="max-w-xl text-lg leading-relaxed text-slate-400 md:text-xl">
            {t("home.heroBody")}
          </p>
        </div>

        {/* Scenen: kortet + telefonen. Staplas på mobil, sida vid sida från lg. */}
        <div className="relative mx-auto mt-12 flex max-w-6xl flex-col items-center gap-10 lg:mt-16 lg:flex-row lg:items-center lg:justify-center lg:gap-16">
          <div className="w-full max-w-[520px] lg:-rotate-6 lg:transition-transform lg:duration-500 lg:ease-out lg:hover:rotate-0">
            <CardPreview3D material="plastic" color="#1b1b1d" design="minimal" showControls={false} />
            <p className="mt-2 text-center text-xs text-slate-500">{t("home.demoCardCaption")}</p>
          </div>

          <PhoneDemo mode={mode} onChange={setMode} />
        </div>

        <div className="relative mx-auto mt-12 flex max-w-6xl flex-col items-center gap-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/get-started"
              className="inline-flex h-14 items-center justify-center rounded-xl bg-nordic-secondary px-7 text-base font-bold text-nordic-primary transition-[transform,background-color] duration-150 hover:bg-white active:scale-[0.98]"
            >
              {t("home.ctaCreate")}
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-xl border border-white/15 px-6 text-base font-semibold text-nordic-secondary transition-[transform,background-color] duration-150 hover:bg-white/5 active:scale-[0.98]"
            >
              {t("home.ctaHow")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-x-7 gap-y-2 text-[13px] font-semibold text-slate-400">
            <Trust>{t("home.trust1")}</Trust>
            <Trust>{t("home.trust2")}</Trust>
            <Trust>{t("home.trust3")}</Trust>
          </div>

          <AppStoreLink campaign="web-home-hero" className="text-xs font-medium" />
        </div>
      </section>

      <div className="mx-auto flex max-w-6xl flex-col gap-0 px-4 md:px-8">
        {/* --------------------------------------------------------- PROBLEM */}
        <section className="grid gap-12 border-y border-white/10 py-16 lg:grid-cols-[1.1fr_1fr] lg:gap-20 lg:py-20">
          <div className="flex flex-col gap-5">
            <h2 className="text-4xl font-extrabold leading-[1.02] tracking-[-0.04em] md:text-[56px]">
              {t("home.problemTitle1")} {t("home.problemTitle2")}
            </h2>
            <p className="max-w-lg text-lg leading-relaxed text-slate-400">{t("home.problemBody")}</p>
            <p className="pt-2 text-xl font-bold tracking-[-0.01em] text-nordic-accent md:text-2xl">
              {t("home.solutionLine")}
            </p>
          </div>

          <ul className="flex flex-col">
            <ProblemRow name={t("home.problemLinkedin")} desc={t("home.problemLinkedinDesc")} label={t("home.sometimesYouShare")} />
            <ProblemRow name={t("home.problemInstagram")} desc={t("home.problemInstagramDesc")} label={t("home.sometimesYouShare")} />
            <ProblemRow name={t("home.problemCard")} desc={t("home.problemCardDesc")} label={t("home.sometimesYouShare")} />
            <ProblemRow name={t("home.problemWrong")} desc={t("home.problemWrongDesc")} label={t("home.sometimesYouShare")} highlight last />
          </ul>
        </section>

        {/* ---------------------------------------------------- KÄRNKONCEPT */}
        <section className="grid items-center gap-12 py-20 lg:grid-cols-2 lg:gap-20 lg:py-28">
          <div className="flex flex-col gap-6">
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-nordic-accent">{t("home.coreBadge")}</span>
            <h2 className="text-4xl font-extrabold leading-[1.02] tracking-[-0.04em] md:text-[56px]">
              {t("home.coreTitle1")}
              <br />
              {t("home.coreTitle2")}
            </h2>
            <p className="max-w-md text-lg leading-relaxed text-slate-400">{t("home.coreBody")}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-14 rounded-3xl border border-white/10 bg-white/[0.04] p-7">
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-nordic-accent px-2.5 py-1.5 text-[10px] font-extrabold tracking-[0.14em] text-[#041B18]">
                <Users className="h-3 w-3" /> SOCIAL
              </span>
              <div>
                <h3 className="text-xl font-bold tracking-[-0.01em]">{t("home.socialView")}</h3>
                <p className="mt-1 text-sm text-slate-400">{t("home.socialViewDesc")}</p>
              </div>
            </div>
            <div className="flex flex-col gap-14 rounded-3xl bg-nordic-secondary p-7 text-nordic-primary">
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-nordic-primary px-2.5 py-1.5 text-[10px] font-extrabold tracking-[0.14em] text-nordic-secondary">
                <ShieldCheck className="h-3 w-3" /> BUSINESS
              </span>
              <div>
                <h3 className="text-xl font-bold tracking-[-0.01em]">{t("home.businessView")}</h3>
                <p className="mt-1 text-sm text-slate-600">{t("home.businessViewDesc")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------- SÅ FUNKAR DET */}
        <section id="how-it-works" className="scroll-mt-24 rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 md:p-16">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between md:gap-10">
            <h2 className="text-4xl font-extrabold leading-none tracking-[-0.04em] md:text-5xl">{t("home.howTitle")}</h2>
            <p className="text-lg text-slate-400">{t("home.howSubtitle")}</p>
          </div>

          <ol className="mt-12 grid gap-10 md:grid-cols-3">
            <Step n={1} title={t("home.step1Title")} desc={t("home.step1Desc")} label={t("home.stepLabel", { n: 1 })} active />
            <Step n={2} title={t("home.step2Title")} desc={t("home.step2Desc")} label={t("home.stepLabel", { n: 2 })} />
            <Step n={3} title={t("home.step3Title")} desc={t("home.step3Desc")} label={t("home.stepLabel", { n: 3 })} />
          </ol>
        </section>

        {/* ------------------------------------------------------------ FAQ */}
        <section id="faq" className="max-w-3xl scroll-mt-24 py-20 lg:py-28">
          <div className="flex flex-col gap-3">
            <h2 className="text-4xl font-extrabold leading-none tracking-[-0.04em] md:text-5xl">{t("home.faqTitle")}</h2>
            <p className="text-slate-400">
              {t("home.faqSubtitle")}{" "}
              <Link href="/contact" className="text-nordic-accent hover:text-nordic-accent/80">
                {t("footer.contactAndQuote")}
              </Link>
            </p>
          </div>

          <div className="mt-10 border-t border-white/10">
            <FaqItem question={t("home.faq1Q")} answer={t("home.faq1A")} defaultOpen />
            <FaqItem question={t("home.faq2Q")} answer={t("home.faq2A")} />
            <FaqItem question={t("home.faq3Q")} answer={t("home.faq3A")} />
            <FaqItem question={t("home.faq4Q")} answer={t("home.faq4A")} />
            <FaqItem question={t("home.faq5Q")} answer={t("home.faq5A")} />
          </div>
        </section>

        {/* ------------------------------------------------------ SLUT-CTA */}
        <section className="flex flex-col items-center gap-6 pb-28 pt-4 text-center">
          <h2 className="max-w-3xl text-4xl font-extrabold leading-[0.98] tracking-[-0.045em] md:text-7xl">
            {t("home.finalTitle1")} {t("home.finalTitle2")}
          </h2>
          <p className="max-w-xl text-lg leading-relaxed text-slate-400">{t("home.finalBody")}</p>
          <Link
            href="/get-started"
            className="inline-flex h-[60px] items-center justify-center rounded-2xl bg-nordic-accent px-9 text-lg font-extrabold text-[#041B18] transition-[transform,filter] duration-150 hover:brightness-110 active:scale-[0.98]"
          >
            {t("home.ctaCreate")}
          </Link>
          <div className="flex gap-7 text-sm font-semibold">
            <Link href="/social" className="text-nordic-accent hover:text-nordic-accent/80">{t("home.exploreSocial")}</Link>
            <Link href="/business" className="text-nordic-accent hover:text-nordic-accent/80">{t("home.exploreBusiness")}</Link>
          </div>
        </section>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- DELAR

function Trust({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Check className="h-3.5 w-3.5 text-nordic-accent" strokeWidth={3} />
      {children}
    </span>
  );
}

function ProblemRow({
  name,
  desc,
  label,
  highlight = false,
  last = false,
}: {
  name: string;
  desc: string;
  label: string;
  highlight?: boolean;
  last?: boolean;
}) {
  return (
    <li
      className={`grid grid-cols-[110px_1fr] items-baseline gap-x-4 gap-y-1 py-5 sm:grid-cols-[130px_1fr_1fr] ${
        last ? "" : "border-b border-white/10"
      }`}
    >
      <span className={`text-[11px] font-bold uppercase tracking-[0.12em] ${highlight ? "text-nordic-accent/80" : "text-slate-500"}`}>
        {label}
      </span>
      <span className={`text-xl font-bold tracking-[-0.02em] md:text-2xl ${highlight ? "text-nordic-accent" : ""}`}>{name}</span>
      <span className="col-start-2 text-sm text-slate-400 sm:col-start-3">{desc}</span>
    </li>
  );
}

function Step({ n, title, desc, label, active = false }: { n: number; title: string; desc: string; label: string; active?: boolean }) {
  return (
    <li className={`flex flex-col gap-4 border-t-2 pt-5 ${active ? "border-nordic-accent" : "border-white/15"}`} value={n}>
      <span className={`text-xs font-extrabold uppercase tracking-[0.12em] ${active ? "text-nordic-accent" : "text-slate-400"}`}>{label}</span>
      <h3 className="text-2xl font-bold tracking-[-0.02em]">{title}</h3>
      <p className="text-[15px] leading-relaxed text-slate-400">{desc}</p>
    </li>
  );
}

/**
 * Telefonen i hero. Besökaren växlar Social/Business och profilen byter
 * namnform, underrubrik, länkar och knapp — samma konto, två vyer.
 */
function PhoneDemo({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  const t = useT();
  const social = mode === "SOCIAL";

  const links = social
    ? [
        { label: t("home.demoSocial1"), color: "#E1306C" },
        { label: t("home.demoSocial2"), color: "#2A2D36" },
        { label: t("home.demoSocial3"), color: "#1DB954" },
        { label: t("home.demoSocial4"), color: "#45D0C1" },
      ]
    : [
        { label: t("home.demoBusiness1"), color: "#45D0C1" },
        { label: t("home.demoBusiness2"), color: "#45D0C1" },
        { label: t("home.demoBusiness3"), color: "#45D0C1" },
        { label: t("home.demoBusiness4"), color: "#0A66C2" },
      ];

  const tab = (active: boolean) =>
    `h-9 rounded-full px-4 text-[11px] font-extrabold tracking-[0.1em] transition-[background-color,color,transform] duration-150 active:scale-95 ${
      active ? "bg-nordic-accent text-[#041B18]" : "text-slate-400 hover:text-nordic-secondary"
    }`;

  return (
    <div
      className="flex h-[560px] w-[280px] shrink-0 flex-col gap-4 overflow-hidden rounded-[44px] border border-white/10 bg-[#0B0B10] p-5 shadow-[0_40px_80px_-30px_rgba(0,0,0,1),inset_0_0_0_8px_#020617]"
      aria-live="polite"
    >
      <div aria-hidden="true" className="mx-auto h-6 w-[90px] rounded-full bg-nordic-primary" />

      <div className="flex flex-col items-center gap-2">
        <div
          className={`flex h-[76px] w-[76px] items-center justify-center rounded-full text-2xl font-extrabold text-nordic-primary ${
            social ? "bg-gradient-to-br from-nordic-accent to-[#1E6F67]" : "bg-nordic-secondary"
          }`}
        >
          AL
        </div>
        <div className="text-lg font-bold">{social ? t("home.demoNameShort") : t("home.demoName")}</div>
        <div className="text-xs text-slate-400">{social ? t("home.demoSocialSub") : t("home.demoBusinessSub")}</div>
      </div>

      <div role="group" aria-label={t("home.demoToggleLabel")} className="mx-auto flex gap-1 rounded-full bg-white/[0.06] p-1">
        <button type="button" aria-pressed={social} onClick={() => onChange("SOCIAL")} className={tab(social)}>
          SOCIAL
        </button>
        <button type="button" aria-pressed={!social} onClick={() => onChange("BUSINESS")} className={tab(!social)}>
          BUSINESS
        </button>
      </div>

      <ul className="flex flex-col gap-2.5">
        {links.map((link) => (
          <li
            key={`${mode}-${link.label}`}
            className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-3.5 text-[13px] font-semibold"
          >
            <span aria-hidden="true" className="h-[26px] w-[26px] shrink-0 rounded-lg" style={{ backgroundColor: link.color }} />
            <span className="truncate">{link.label}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto flex h-12 items-center justify-center rounded-2xl bg-nordic-accent text-[13px] font-extrabold text-[#041B18]">
        {social ? t("home.demoSocialCta") : t("home.demoBusinessCta")}
      </div>
    </div>
  );
}

function FaqItem({ question, answer, defaultOpen = false }: { question: string; answer: string; defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-white/10">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="flex min-h-[64px] w-full items-center justify-between gap-4 py-5 text-left"
      >
        <span className="text-[17px] font-bold">{question}</span>
        <ChevronDown
          className={`shrink-0 text-nordic-accent transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          size={20}
        />
      </button>
      <div className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${isOpen ? "grid-rows-[1fr] pb-6 opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden">
          <p className="text-[15px] leading-relaxed text-slate-400">{answer}</p>
        </div>
      </div>
    </div>
  );
}
