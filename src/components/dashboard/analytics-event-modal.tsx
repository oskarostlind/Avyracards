"use client";

import { useEffect } from "react";
import { ExternalLink, X } from "lucide-react";

import { useT, useLocaleTag } from "@/i18n/client";

/**
 * Detaljvy för en enskild rad i Live-aktivitet.
 *
 * Visar allt vi lagrar om händelsen UTOM `visitorHash` — den är avsiktligt
 * aldrig med i props: hashen finns för att räkna unika besökare, inte för att
 * visas upp, och ska inte lämna servern.
 */

export type AnalyticsActivityItem = {
  id: string;
  type: "VIEW" | "CLICK";
  /** Nyckel i meddelandeträdet för radtexten, t.ex. "analytics.activity.view". */
  messageKey: string;
  /** Läsbart källnamn, redan översatt på servern. */
  source: string;
  /** Har händelsen en källa värd att visa (inte direkt/intern)? */
  hasSource: boolean;
  country: string | null;
  city: string | null;
  device: string | null;
  /** ISO-8601. Formateras i klienten så att tidszonen blir användarens. */
  createdAt: string;
  timeAgo: string;
  linkTitle: string | null;
  linkUrl: string | null;
};

type Props = {
  event: AnalyticsActivityItem | null;
  onClose: () => void;
  /** Landsnamn på användarens språk — samma hjälpare som vyn använder. */
  formatCountry: (code: string) => string;
};

export function AnalyticsEventModal({ event, onClose, formatCountry }: Props) {
  const t = useT();
  const localeTag = useLocaleTag();

  useEffect(() => {
    if (!event) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [event, onClose]);

  if (!event) return null;

  const unknown = t("analytics.eventModal.unknown");

  const place = [event.city, event.country ? formatCountry(event.country) : null]
    .filter(Boolean)
    .join(", ");

  let timestamp = event.createdAt;
  try {
    timestamp = new Intl.DateTimeFormat(localeTag, {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date(event.createdAt));
  } catch {
    /* ogiltigt datum – visa råvärdet hellre än att krascha modalen */
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-nordic-primary/80 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={t("analytics.eventModal.title")}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-nordic-highlight/40 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/5 px-6 py-5">
          <div>
            <h3 className="text-base font-semibold text-slate-100">
              {t("analytics.eventModal.title")}
            </h3>
            <p className="mt-0.5 text-xs text-nordic-highlight">{event.timeAgo}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("analytics.eventModal.close")}
            className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        <dl className="divide-y divide-white/5 px-6 py-2">
          <Row label={t("analytics.eventModal.time")} value={timestamp} />
          <Row
            label={t("analytics.eventModal.type")}
            value={t(
              event.type === "VIEW"
                ? "analytics.eventTypes.view"
                : "analytics.eventTypes.click",
            )}
          />
          <Row label={t("analytics.eventModal.source")} value={event.source || unknown} />
          <Row label={t("analytics.eventModal.place")} value={place || unknown} />
          <Row label={t("analytics.eventModal.device")} value={event.device || unknown} />

          {event.type === "CLICK" && (
            <Row
              label={t("analytics.eventModal.link")}
              value={
                event.linkTitle || event.linkUrl ? (
                  <span className="flex items-center justify-end gap-1.5">
                    <span className="truncate">{event.linkTitle || event.linkUrl}</span>
                    {event.linkUrl && (
                      <a
                        href={event.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-emerald-400 hover:text-emerald-300"
                        aria-label={event.linkUrl}
                      >
                        <ExternalLink size={13} />
                      </a>
                    )}
                  </span>
                ) : (
                  unknown
                )
              }
            />
          )}
        </dl>

        <p className="px-6 pb-5 pt-2 text-[11px] leading-relaxed text-nordic-highlight">
          {t("analytics.eventModal.privacyNote")}
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 py-3">
      <dt className="shrink-0 text-xs font-medium text-nordic-highlight">{label}</dt>
      <dd className="min-w-0 text-right text-sm text-slate-200">{value}</dd>
    </div>
  );
}
