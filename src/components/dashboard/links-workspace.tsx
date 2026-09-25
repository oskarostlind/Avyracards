"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link2, Plus, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { LinksList, type LinkItem, type LinkEditPatch } from "@/components/links-list";
import { LinkEditorSheet } from "@/components/dashboard/link-editor-sheet";
import { UpgradeModal } from "@/components/themes/upgrade-modal";
import { useDashboardToast } from "@/components/dashboard/dashboard-toast";
import { canAccess } from "@/lib/feature-access";
import { useT } from "@/i18n/client";

interface LinksWorkspaceProps {
  initialLinks: LinkItem[];
  mode: "SOCIAL" | "BUSINESS";
  activeRedirectId?: string | null;
  /** Behövs för att veta om per-länk-färg ska vara upplåst. */
  isPremium?: boolean;
  isAdmin?: boolean;
}

/*
 * Länkar-fliken. Samma API-anrop som tidigare (POST/PATCH/DELETE /api/links,
 * POST /api/links/reorder, PATCH /api/profile för redirect) men:
 * - varje anrop kontrollerar svaret och backar + visar fel om det misslyckas
 *   (tidigare såg ett serverfel ut som att det lyckats),
 * - radering kan ångras i 5 s i stället för att ske direkt utan bekräftelse,
 * - redigering sker i ett ark i stället för inline i ett trångt kort.
 */
export function LinksWorkspace({
  initialLinks,
  mode,
  activeRedirectId: initialRedirectId,
  isPremium = false,
  isAdmin = false,
}: LinksWorkspaceProps) {
  const t = useT();
  const router = useRouter();
  const toast = useDashboardToast();
  const [links, setLinks] = useState(initialLinks);
  const [activeRedirectId, setActiveRedirectId] = useState<string | null>(initialRedirectId ?? null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [editor, setEditor] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  // Länkar som väntar på radering (ångra-fönstret) — döljs men finns kvar på servern.
  const pendingDeletes = useRef(new Set<string>());

  // Samma källa som /api/links använder vid sparning. Ett UI-lås som glöms
  // bort får inte bli en datalucka — se sanitizeLinkCustomization.
  const canCustomizeColor = canAccess("link_custom_color", { isPremium, isAdmin });

  useEffect(() => {
    setLinks(initialLinks.filter((l) => !pendingDeletes.current.has(l.id)));
    setActiveRedirectId(initialRedirectId ?? null);
  }, [initialLinks, initialRedirectId, mode]);

  const refresh = useCallback(async () => {
    const response = await fetch(`/api/links?mode=${mode}`);
    if (response.ok) {
      const data = (await response.json()) as LinkItem[];
      setLinks(data.filter((l) => !pendingDeletes.current.has(l.id)));
    }
    router.refresh();
  }, [mode, router]);

  const readError = async (res: Response, fallback: string) => {
    const data = await res.json().catch(() => null);
    return (data && typeof data.error === "string" && data.error) || fallback;
  };

  // --- Skapa ---
  const handleCreate = useCallback(
    async ({ label, url }: { label: string; url: string }) => {
      try {
        const res = await fetch("/api/links", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label, url, mode }),
        });
        if (!res.ok) return await readError(res, t("links.saveFailed"));
        await refresh();
        toast({ message: t("dashboard.links.added"), tone: "success" });
        return null;
      } catch {
        return t("common.networkError");
      }
    },
    [mode, refresh, t, toast],
  );

  // --- Redigera ---
  const handleSave = useCallback(
    async (id: string, patch: LinkEditPatch) => {
      try {
        // OBS: fältet heter `label` i API:t (inte `title`).
        const res = await fetch(`/api/links/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label: patch.label, url: patch.url, icon: patch.icon, customColor: patch.customColor }),
        });
        if (!res.ok) return await readError(res, t("links.saveFailed"));
        const json = await res.json().catch(() => null);
        // Servern tvättade bort en premium-funktion -> visa uppgraderingen.
        if (json?.sanitized) setShowUpgrade(true);
        await refresh();
        toast({ message: t("dashboard.links.saved"), tone: "success" });
        return null;
      } catch {
        return t("common.networkError");
      }
    },
    [refresh, t, toast],
  );

  // --- Redirect ---
  const handleSetRedirect = useCallback(
    async (linkId: string) => {
      const prev = activeRedirectId;
      const isActivating = linkId !== prev;
      const newId = isActivating ? linkId : null;
      setActiveRedirectId(newId);
      try {
        const res = await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ redirectLinkId: newId, redirectEnabled: isActivating }),
        });
        if (!res.ok) throw new Error(String(res.status));
        const label = links.find((l) => l.id === linkId)?.label ?? "";
        toast({
          message: isActivating ? t("dashboard.links.redirectOnToast", { title: label }) : t("dashboard.links.redirectOffToast"),
          tone: "success",
        });
        router.refresh();
      } catch (error) {
        console.error("Failed to set redirect", error);
        setActiveRedirectId(prev);
        toast({ message: t("common.somethingWentWrong"), tone: "error" });
      }
    },
    [activeRedirectId, links, router, t, toast],
  );

  // --- Sortering ---
  // Ett anrop i taget: två överlappande reorder-transaktioner mot samma rader
  // kan ge deadlock i Postgres (hittades i e2e vid snabba flyttar). Nya
  // ändringar under ett pågående anrop slås ihop till nästa anrop.
  const reorderState = useRef<{ inFlight: boolean; queued: string[] | null; lastGood: LinkItem[] | null }>({
    inFlight: false,
    queued: null,
    lastGood: null,
  });

  const sendReorder = useCallback(
    async (ids: string[]) => {
      const st = reorderState.current;
      if (st.inFlight) {
        st.queued = ids;
        return;
      }
      st.inFlight = true;
      try {
        // Väntande raderingar finns fortfarande på servern — låt dem ligga sist.
        const order = [...ids, ...Array.from(pendingDeletes.current)];
        const res = await fetch("/api/links/reorder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order }),
        });
        if (!res.ok) throw new Error(String(res.status));
        st.inFlight = false;
        if (st.queued) {
          const next = st.queued;
          st.queued = null;
          await sendReorder(next);
        } else {
          st.lastGood = null;
        }
      } catch (error) {
        console.error("Failed to reorder", error);
        st.inFlight = false;
        st.queued = null;
        if (st.lastGood) setLinks(st.lastGood);
        st.lastGood = null;
        toast({ message: t("dashboard.links.reorderFailed"), tone: "error" });
      }
    },
    [t, toast],
  );

  const handleReorder = useCallback(
    (ids: string[]) => {
      const st = reorderState.current;
      // Ordningen innan den här serien av flyttar — dit backar vi vid fel.
      if (!st.lastGood) st.lastGood = links;
      const byId = new Map(links.map((l) => [l.id, l]));
      setLinks(ids.map((id) => byId.get(id)!).filter(Boolean));
      void sendReorder(ids);
    },
    [links, sendReorder],
  );

  const moveLink = useCallback(
    (id: string, delta: -1 | 1) => {
      const from = links.findIndex((l) => l.id === id);
      const to = from + delta;
      if (from < 0 || to < 0 || to >= links.length) return;
      const ids = links.map((l) => l.id);
      const [moved] = ids.splice(from, 1);
      ids.splice(to, 0, moved);
      void handleReorder(ids);
    },
    [links, handleReorder],
  );

  // --- Synlighet ---
  const handleToggleVisibility = useCallback(
    async (id: string, next: boolean) => {
      setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, isVisible: next } : l)));
      try {
        const res = await fetch(`/api/links/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isVisible: next }),
        });
        if (!res.ok) throw new Error(String(res.status));
      } catch (error) {
        console.error("Failed to toggle visibility", error);
        setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, isVisible: !next } : l)));
        toast({ message: t("common.somethingWentWrong"), tone: "error" });
      }
    },
    [t, toast],
  );

  // --- Radera (med ångra) ---
  const handleDelete = useCallback(
    (id: string) => {
      const index = links.findIndex((l) => l.id === id);
      const link = links[index];
      if (!link) return;
      const wasRedirect = activeRedirectId === id;

      pendingDeletes.current.add(id);
      setLinks((prev) => prev.filter((l) => l.id !== id));
      if (wasRedirect) setActiveRedirectId(null);
      setEditor({ open: false, id: null });

      const restore = () => {
        pendingDeletes.current.delete(id);
        setLinks((prev) => {
          if (prev.some((l) => l.id === id)) return prev;
          const next = [...prev];
          next.splice(Math.min(index, next.length), 0, link);
          return next;
        });
        if (wasRedirect) setActiveRedirectId(id);
      };

      toast({
        message: t("dashboard.links.deleted", { title: link.label }),
        tone: "neutral",
        action: { label: t("dashboard.links.undo"), onClick: restore },
        onExpire: () => {
          void (async () => {
            try {
              const res = await fetch(`/api/links/${id}`, { method: "DELETE" });
              if (!res.ok && res.status !== 404) throw new Error(String(res.status));
              pendingDeletes.current.delete(id);
              await refresh();
            } catch (error) {
              console.error("Failed to delete link", error);
              restore();
              toast({ message: t("dashboard.links.deleteFailed"), tone: "error" });
            }
          })();
        },
      });
    },
    [activeRedirectId, links, refresh, t, toast],
  );

  const editing = editor.id ? links.find((l) => l.id === editor.id) ?? null : null;
  const editingIndex = editing ? links.findIndex((l) => l.id === editing.id) : -1;
  const redirectLink = activeRedirectId ? links.find((l) => l.id === activeRedirectId) : null;

  return (
    <div className="space-y-4">
      {/* Portal + högre z än redigeringsarket: uppgraderingen kan öppnas inifrån arket
          (låst färgväljare) och måste då hamna ovanpå det. */}
      {showUpgrade &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="relative z-[70]">
            <UpgradeModal isOpen onClose={() => setShowUpgrade(false)} />
          </div>,
          document.body,
        )}

      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-nordic-secondary">
            {mode === "BUSINESS" ? t("dashboard.sections.linksBusiness") : t("dashboard.sections.linksSocial")}
          </h2>
          <p className="text-[13px] text-nordic-highlight">{t("dashboard.links.count", { count: links.length })}</p>
        </div>
        <button
          type="button"
          onClick={() => setEditor({ open: true, id: null })}
          className="flex h-11 shrink-0 items-center gap-2 rounded-full bg-nordic-secondary px-4 text-sm font-semibold text-nordic-primary shadow-lg active:scale-[0.97]"
        >
          <Plus size={18} /> {t("dashboard.links.new")}
        </button>
      </div>

      {redirectLink && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-400/30 bg-amber-950/30 p-3 pl-4">
          <Zap size={18} className="shrink-0 text-amber-400" fill="currentColor" />
          <p className="min-w-0 flex-1 text-[13px] text-amber-100">
            {t("dashboard.links.redirectBanner", { title: redirectLink.label })}
          </p>
          <button
            type="button"
            onClick={() => void handleSetRedirect(redirectLink.id)}
            className="h-10 shrink-0 rounded-xl bg-amber-400/15 px-3 text-[13px] font-semibold text-amber-200 active:bg-amber-400/25"
          >
            {t("dashboard.links.redirectTurnOff")}
          </button>
        </div>
      )}

      {links.length === 0 ? (
        <button
          type="button"
          onClick={() => setEditor({ open: true, id: null })}
          className="flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed border-white/15 px-6 py-10 text-center"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-slate-300">
            <Link2 size={22} />
          </span>
          <span className="text-[15px] font-semibold text-nordic-secondary">{t("dashboard.links.emptyTitle")}</span>
          <span className="text-[13px] text-nordic-highlight">{t("dashboard.links.emptyBody")}</span>
        </button>
      ) : (
        <>
          <LinksList
            links={links}
            activeRedirectId={activeRedirectId}
            onReorder={(ids) => void handleReorder(ids)}
            onToggleVisibility={(id, next) => void handleToggleVisibility(id, next)}
            onOpen={(id) => setEditor({ open: true, id })}
          />
          <p className="px-1 text-[12px] text-slate-500">{t("dashboard.links.hint")}</p>
        </>
      )}

      <LinkEditorSheet
        open={editor.open}
        link={editing}
        mode={mode}
        isRedirect={Boolean(editing && activeRedirectId === editing.id)}
        canCustomizeColor={canCustomizeColor}
        onShowUpgrade={() => setShowUpgrade(true)}
        onClose={() => setEditor((e) => ({ ...e, open: false }))}
        onCreate={handleCreate}
        onSave={handleSave}
        onDelete={handleDelete}
        onToggleRedirect={(id) => void handleSetRedirect(id)}
        onMove={moveLink}
        canMoveUp={editingIndex > 0}
        canMoveDown={editingIndex >= 0 && editingIndex < links.length - 1}
      />
    </div>
  );
}
