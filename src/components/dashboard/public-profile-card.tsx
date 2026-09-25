"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, Copy, Download, ExternalLink, Eye, Share2, Wallet } from "lucide-react";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import { walletKindsForUserAgent, type WalletKind } from "@/lib/wallet/platform";
import { useIsApp } from "@/hooks/useIsApp";
import { useT } from "@/i18n/client";
import { useDashboardToast } from "@/components/dashboard/dashboard-toast";

type PublicProfileCardProps = {
  username: string;
  className?: string;
  /** Öppnar förhandsvisningen (Dela-fliken). */
  onPreview?: () => void;
};

interface CapacitorWindow extends Window {
  Capacitor?: { isPluginAvailable?: (name: string) => boolean };
}

/**
 * Dela-fliken: publik länk, kopiera, systemdelning, QR-kod, öppna profil,
 * förhandsvisning och Wallet-pass.
 */
export function PublicProfileCard({ username, className = "", onPreview }: PublicProfileCardProps) {
  // target="_blank" öppnar systemwebbläsaren i en Capacitor-WebView. För
  // plånbokspassen är det önskat (PassKit måste hantera filen), men för den
  // egna profilen innebar det att appen kastade ut användaren till Safari —
  // en återvändsgränd utan väg tillbaka, och exakt den signal som får en
  // granskare att läsa appen som en inpackad webbplats (4.2). I appen navigerar
  // vi därför inom WebViewen; profilsidan renderas med appens navigation så
  // vägen tillbaka finns kvar. På webben behålls ny flik.
  const isApp = useIsApp();
  const t = useT();
  const toast = useDashboardToast();
  const [copied, setCopied] = useState(false);
  const [walletLoading, setWalletLoading] = useState<"apple" | "google" | null>(null);
  // Startvärde som är säkert för servern (undviker hydration error)
  const [origin, setOrigin] = useState("https://avyracards.se");
  // Serverrenderas som "båda" och smalnas av på klienten när user agent är känd.
  const [walletKinds, setWalletKinds] = useState<WalletKind[]>(["apple", "google"]);
  const [canShare, setCanShare] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
    setWalletKinds(walletKindsForUserAgent(window.navigator.userAgent));
    const cap = (window as CapacitorWindow).Capacitor;
    setCanShare(Boolean(cap?.isPluginAvailable?.("Share")) || typeof navigator.share === "function");
  }, []);

  const publicPath = `/u/${username}`;
  const fullUrl = `${origin}${publicPath}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast({ message: t("dashboard.share.copied"), tone: "success" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ message: t("dashboard.share.copyFailed"), tone: "error" });
    }
  };

  const share = async () => {
    const data = { title: t("dashboard.share.shareTitle"), text: t("dashboard.share.shareText"), url: fullUrl };
    try {
      const cap = (window as CapacitorWindow).Capacitor;
      if (isApp && cap?.isPluginAvailable?.("Share")) {
        const { Share } = await import("@capacitor/share");
        await Share.share({ ...data, dialogTitle: data.title });
        return;
      }
      if (typeof navigator.share === "function") {
        await navigator.share(data);
        return;
      }
      await copyToClipboard();
    } catch (err) {
      // Avbruten delning är inget fel.
      const name = (err as { name?: string; message?: string })?.name ?? "";
      const msg = (err as { message?: string })?.message ?? "";
      if (name === "AbortError" || /cancel/i.test(msg)) return;
      console.error("Kunde inte dela", err);
      await copyToClipboard();
    }
  };

  const downloadQr = () => {
    const canvas = qrCanvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `avyracards-${username}-qr.png`;
    a.click();
  };

  // Passen öppnas i systemwebbläsaren (target="_blank") för att PassKit/Google
  // Wallet-hanteringen ska triggas korrekt, men den delar inte Capacitor-
  // WebViewens sessionscookie. Hämta därför en kortlivad access-token via ett
  // fetch-anrop (som fortfarande har cookien) innan vi öppnar länken.
  const openWallet = async (kind: "apple" | "google") => {
    setWalletLoading(kind);
    try {
      const res = await fetch("/api/wallet/token");
      const data = (await res.json()) as { token?: string };
      const url = data.token ? `/api/wallet/${kind}?token=${encodeURIComponent(data.token)}` : `/api/wallet/${kind}`;
      window.open(url, "_blank");
    } catch (err) {
      console.error("Kunde inte öppna plånbok", err);
      window.open(`/api/wallet/${kind}`, "_blank");
    } finally {
      setWalletLoading(null);
    }
  };

  const tile =
    "flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-slate-900/70 px-4 text-sm font-semibold text-slate-200 transition-colors active:bg-slate-800";

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Länk + kopiera */}
      <section className="space-y-3 rounded-3xl border border-purple-500/20 bg-purple-500/[0.06] p-4">
        <h2 className="text-[13px] font-semibold text-purple-300">{t("dashboard.publicProfile.label")}</h2>
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1 truncate rounded-xl border border-white/10 bg-slate-950/70 px-3.5 py-3 font-mono text-sm text-slate-300">
            {fullUrl.replace(/^https?:\/\//, "")}
          </div>
          <button
            type="button"
            onClick={() => void copyToClipboard()}
            aria-label={t("dashboard.publicProfile.copyLink")}
            title={t("dashboard.publicProfile.copyLink")}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-slate-800 text-slate-200 active:bg-slate-700"
          >
            {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {canShare ? (
            <button type="button" onClick={() => void share()} className={`${tile} col-span-2 border-0 bg-purple-600 text-white active:bg-purple-500`}>
              <Share2 size={18} /> {t("dashboard.share.share")}
            </button>
          ) : null}
          {isApp ? (
            <Link href={publicPath} className={tile} title={t("dashboard.publicProfile.viewProfile")}>
              <ExternalLink size={16} /> {t("dashboard.share.open")}
            </Link>
          ) : (
            <a href={publicPath} target="_blank" rel="noopener noreferrer" className={tile} title={t("dashboard.publicProfile.openInNewTab")}>
              <ExternalLink size={16} /> {t("dashboard.share.open")}
            </a>
          )}
          {onPreview && (
            <button type="button" onClick={onPreview} className={tile}>
              <Eye size={16} /> {t("dashboard.mode.preview")}
            </button>
          )}
        </div>
      </section>

      {/* QR-kod */}
      <section className="flex flex-col items-center gap-3 rounded-3xl border border-white/10 bg-slate-900/50 p-5">
        <h2 className="self-start text-[13px] font-semibold text-slate-300">{t("dashboard.share.qrTitle")}</h2>
        <div className="rounded-2xl bg-white p-3" aria-label={t("dashboard.share.qrAlt")} role="img">
          <QRCodeSVG value={fullUrl} size={184} level="M" marginSize={0} />
        </div>
        <p className="text-center text-[13px] text-nordic-highlight">{t("dashboard.share.qrBody")}</p>
        {/* Högupplöst variant för nedladdning (inte synlig). */}
        <QRCodeCanvas ref={qrCanvasRef} value={fullUrl} size={1024} level="M" marginSize={4} className="hidden" />
        {!isApp && (
          <button type="button" onClick={downloadQr} className={`${tile} w-full`}>
            <Download size={16} /> {t("dashboard.share.qrDownload")}
          </button>
        )}
      </section>

      {/* Plånböcker */}
      <section className="space-y-3 rounded-3xl border border-white/10 bg-slate-900/50 p-4">
        <h2 className="text-[13px] font-semibold text-slate-300">{t("dashboard.share.walletTitle")}</h2>
        <div className={`grid gap-2 ${walletKinds.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
          {walletKinds.includes("apple") && (
            <button
              type="button"
              onClick={() => void openWallet("apple")}
              disabled={walletLoading === "apple"}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#1C1C1E] px-4 text-sm font-semibold text-nordic-secondary shadow-lg disabled:opacity-50"
            >
              <Wallet size={16} />
              <span>{t("dashboard.publicProfile.appleWallet")}</span>
            </button>
          )}
          {walletKinds.includes("google") && (
            <button
              type="button"
              onClick={() => void openWallet("google")}
              disabled={walletLoading === "google"}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-nordic-support bg-nordic-secondary px-4 text-sm font-semibold text-nordic-primary shadow-lg disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M21.75 9.75H13.5V21H21.75C22.5784 21 23.25 20.3284 23.25 19.5V11.25C23.25 10.4216 22.5784 9.75 21.75 9.75Z" fill="#FBBC04" />
                <path d="M12.75 21V9.75H4.5C3.67157 9.75 3 10.4216 3 11.25V19.5C3 20.3284 3.67157 21 4.5 21H12.75Z" fill="#EA4335" />
                <path d="M12.75 3V9.75H21.75C22.2575 9.75 22.708 9.87703 23.1075 10.1006L16.2075 3.20062C15.27 2.26312 14.025 1.75687 12.75 1.75687V3Z" fill="#4285F4" />
                <path d="M4.5 9.75H12.75V3L4.5 9.75Z" fill="#34A853" />
              </svg>
              <span>{t("dashboard.publicProfile.googleWallet")}</span>
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
