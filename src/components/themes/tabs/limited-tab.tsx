"use client";

import { Check, Lock, Sparkles, User } from "lucide-react";
import type { CustomThemeSettings } from "@/types/theme";
import { AvatarFrame } from "@/components/theme-effects/avatar-frame";
import { useT } from "@/i18n/client";
import {
  FOUNDERS_DROP_ID,
  findCollectible,
  formatSerial,
  type DropStatus,
  type ProfileCollectible,
} from "@/lib/collectibles-shared";

/*
 * Limited ✦ — samlarobjekt i temaeditorn.
 *
 * Ägare ser sitt exemplar som ett samlarkort (ramen live, löpnummer, "1 av
 * 100") och kan använda ramen. Icke-ägare ser samma kort låst — "Slut" eller
 * "X kvar" — eftersom det är knappheten som gör objektet värt något.
 *
 * Gating (samma som feature-access): ägande låser upp den statiska ramen;
 * animationen kräver premium. Servern tvättar ändå vid sparning
 * (sanitizeThemeSettings + AccessUser.collectibles).
 */

interface LimitedTabProps {
  settings: CustomThemeSettings;
  updateSetting: (key: keyof CustomThemeSettings, value: string | boolean | undefined) => void;
  collectibles: readonly ProfileCollectible[];
  drops: readonly DropStatus[];
  /** Premium (eller admin): samlarramen får röra sig. */
  canAnimate: boolean;
  avatarUrl?: string | null;
  onShowUpgrade: () => void;
}

const CARD_FRAME_SIZE = 104;

function Avatar({ url }: { url?: string | null }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" className="h-full w-full object-cover" />
  ) : (
    <span className="flex h-full w-full items-center justify-center bg-slate-800 text-slate-500">
      <User size={34} />
    </span>
  );
}

export function LimitedTab({
  settings,
  updateSetting,
  collectibles,
  drops,
  canAnimate,
  avatarUrl,
  onShowUpgrade,
}: LimitedTabProps) {
  const t = useT();
  const founder = findCollectible(collectibles, FOUNDERS_DROP_ID);
  const status = drops.find((d) => d.id === FOUNDERS_DROP_ID) ?? null;
  const inUse = settings.frameStyle === "founders";

  return (
    <div className="space-y-5">
      <p className="text-[13px] leading-relaxed text-slate-400">{t("collectibles.limited.intro")}</p>

      {founder ? (
        <OwnedFoundersCard
          serial={founder.serial}
          maxSupply={founder.maxSupply}
          inUse={inUse}
          canAnimate={canAnimate}
          avatarUrl={avatarUrl}
          onUse={() => updateSetting("frameStyle", inUse ? "circle" : "founders")}
          onShowUpgrade={onShowUpgrade}
        />
      ) : (
        <LockedFoundersCard status={status} avatarUrl={avatarUrl} />
      )}

      <p className="flex items-center justify-center gap-1.5 pt-1 text-xs text-nordic-highlight">
        <Sparkles size={12} /> {t("collectibles.limited.comingSoon")}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/** Obsidianytan som båda korten delar. */
function CardShell({ children, dim = false }: { children: React.ReactNode; dim?: boolean }) {
  return (
    <div
      className={`relative overflow-hidden rounded-[22px] border p-5 ${
        dim ? "border-white/10" : "border-[#c9a352]/45"
      }`}
      style={{
        background:
          "radial-gradient(120% 80% at 50% 0%, rgba(201,163,82,0.16), transparent 60%), linear-gradient(170deg, #16140f 0%, #0b0b0e 55%, #07070a 100%)",
        boxShadow: dim ? undefined : "inset 0 1px 0 rgba(255,236,179,0.12), 0 12px 32px rgba(0,0,0,0.35)",
      }}
    >
      {/* Graverad hörnlinje — samlarkortskänsla utan att ta fokus. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-[6px] rounded-[17px] border border-[#c9a352]/15"
      />
      <div className="relative">{children}</div>
    </div>
  );
}

function OwnedFoundersCard({
  serial,
  maxSupply,
  inUse,
  canAnimate,
  avatarUrl,
  onUse,
  onShowUpgrade,
}: {
  serial: number;
  maxSupply: number;
  inUse: boolean;
  canAnimate: boolean;
  avatarUrl?: string | null;
  onUse: () => void;
  onShowUpgrade: () => void;
}) {
  const t = useT();
  const serialText = formatSerial(serial, maxSupply);

  return (
    <CardShell>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c9a352]/80">Limited edition</p>
          <h3
            className="mt-1 text-[22px] font-bold leading-none tracking-[-0.01em] text-[#f3dfa2]"
            style={{ fontFamily: '"Playfair Display Variable", "Playfair Display", Georgia, serif' }}
          >
            {t("collectibles.dropNames.founders")}
          </h3>
        </div>
        <span className="rounded-full border border-[#c9a352]/40 bg-[#c9a352]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#ecd08a]">
          {t("collectibles.limited.ownedPill")}
        </span>
      </div>

      <div className="flex flex-col items-center pb-1 pt-5">
        <AvatarFrame frame="founders" size={CARD_FRAME_SIZE} animate={canAnimate}>
          <Avatar url={avatarUrl} />
        </AvatarFrame>
        <p className="mt-5 text-xs font-medium tabular-nums tracking-[0.02em] text-[#c9a352]/90">
          {t("collectibles.limited.serialOf", { serial: serialText, max: maxSupply })}
        </p>
        <p className="mt-3 max-w-[260px] text-center text-xs leading-relaxed text-slate-400">
          {t("collectibles.limited.foundersDesc")}
        </p>
      </div>

      <div className="mt-4 space-y-2">
        <button
          type="button"
          onClick={onUse}
          aria-pressed={inUse}
          className={`flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition-[transform,background-color] duration-100 ease-out active:scale-[0.97] ${
            inUse
              ? "border border-[#c9a352]/50 bg-[#c9a352]/10 text-[#ecd08a]"
              : "bg-[linear-gradient(160deg,#f3dfa2,#c9a352_55%,#9a7428)] text-[#1a1408] shadow-[0_6px_18px_rgba(201,163,82,0.25)]"
          }`}
        >
          {inUse ? (
            <>
              <Check size={16} /> {t("collectibles.limited.inUse")}
            </>
          ) : (
            t("collectibles.limited.useFrame")
          )}
        </button>

        {!canAnimate && (
          <button
            type="button"
            onClick={onShowUpgrade}
            className="flex min-h-[44px] w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-left transition-transform duration-100 ease-out active:scale-[0.98]"
          >
            <span>
              <span className="block text-[13px] font-semibold text-slate-200">{t("collectibles.limited.unlockAnimation")}</span>
              <span className="block text-[11px] text-slate-400">{t("collectibles.limited.animatedLocked")}</span>
            </span>
            <Lock size={15} className="shrink-0 text-amber-400" />
          </button>
        )}
        {inUse && (
          <p className="text-center text-[11px] text-slate-500">
            {canAnimate ? t("collectibles.limited.animated") : t("collectibles.limited.static")}
          </p>
        )}
      </div>
    </CardShell>
  );
}

function LockedFoundersCard({ status, avatarUrl }: { status: DropStatus | null; avatarUrl?: string | null }) {
  const t = useT();
  const soldOut = !status || status.soldOut;

  return (
    <CardShell dim>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Limited edition</p>
          <h3
            className="mt-1 text-[22px] font-bold leading-none tracking-[-0.01em] text-slate-300"
            style={{ fontFamily: '"Playfair Display Variable", "Playfair Display", Georgia, serif' }}
          >
            {t("collectibles.limited.foundersLockedTitle")}
          </h3>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${
            soldOut ? "bg-red-500/15 text-red-300" : "bg-white/10 text-slate-300"
          }`}
        >
          {soldOut ? t("collectibles.limited.soldOutPill") : t("collectibles.limited.lockedPill")}
        </span>
      </div>

      <div className="relative flex flex-col items-center pb-1 pt-5">
        {/* Ramen syns — det är den man går miste om — men står still och är nedtonad. */}
        <div className="relative opacity-55 grayscale-[35%]">
          <AvatarFrame frame="founders" size={CARD_FRAME_SIZE} animate={false}>
            <Avatar url={avatarUrl} />
          </AvatarFrame>
          <span className="absolute left-1/2 top-1/2 z-10 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-slate-200 ring-1 ring-white/15">
            <Lock size={16} />
          </span>
        </div>
        <p className="mt-5 text-[26px] font-bold tabular-nums leading-none tracking-[-0.02em] text-slate-500">
          {status ? `${status.issued}/${status.maxSupply}` : "100/100"}
        </p>
        <p className="mt-3 max-w-[260px] text-center text-[13px] leading-relaxed text-slate-300">
          {soldOut
            ? t("collectibles.limited.foundersSoldOut")
            : t("collectibles.limited.foundersRemaining", { count: status!.remaining })}
        </p>
      </div>
    </CardShell>
  );
}
