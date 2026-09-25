"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronRight, GripVertical, Zap } from "lucide-react";
import { useT } from "@/i18n/client";
import { LinkIcon } from "@/components/icons/link-icon";
import { getReadableTextColor } from "@/utils/color";

export interface LinkItem {
  id: string;
  label: string;
  url: string;
  isVisible: boolean;
  /** Manuellt vald ikon-slug. null = automatisk detektering ur URL:en. */
  icon?: string | null;
  /** Premium: egen färg för just den här knappen. null = temats accentfärg. */
  customColor?: string | null;
}

/** Allt som kan ändras i redigeringsläget, i ett svep. */
export interface LinkEditPatch {
  label: string;
  url: string;
  icon: string | null;
  customColor: string | null;
}

interface LinksListProps {
  links: LinkItem[];
  activeRedirectId: string | null;
  onReorder: (ids: string[]) => void;
  onToggleVisibility: (id: string, next: boolean) => void;
  onOpen: (id: string) => void;
}

const GAP = 8;

/**
 * Länklistan. Sortering sker med Pointer Events på greppet (fungerar med
 * touch i iOS Safari och appen — den gamla HTML5-dra-och-släppen gjorde
 * inte det), piltangenter på greppet för tangentbord, och upp/ner-knappar
 * i redigeringsarket som reserv.
 */
export function LinksList({ links, activeRedirectId, onReorder, onToggleVisibility, onOpen }: LinksListProps) {
  const t = useT();
  const rowRefs = useRef(new Map<string, HTMLLIElement>());
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragRef = useRef<{
    id: string;
    pointerId: number;
    fromIndex: number;
    toIndex: number;
    startPageY: number;
    lastClientY: number;
    rects: { id: string; top: number; height: number }[];
    raf: number;
  } | null>(null);

  const clearTransforms = () => {
    rowRefs.current.forEach((el) => {
      el.style.transition = "";
      el.style.transform = "";
      el.style.zIndex = "";
    });
  };

  const layout = useCallback(() => {
    const d = dragRef.current;
    if (!d) return;
    const dy = d.lastClientY + window.scrollY - d.startPageY;
    const dragged = d.rects[d.fromIndex];
    const center = dragged.top + dragged.height / 2 + dy;

    // Nytt index = antal övriga rader vars mittpunkt ligger ovanför.
    let to = 0;
    d.rects.forEach((r, i) => {
      if (i === d.fromIndex) return;
      if (r.top + r.height / 2 < center) to++;
    });
    d.toIndex = to;

    d.rects.forEach((r, i) => {
      const el = rowRefs.current.get(r.id);
      if (!el) return;
      if (i === d.fromIndex) {
        el.style.transition = "none";
        el.style.transform = `translate3d(0, ${dy}px, 0) scale(1.02)`;
        el.style.zIndex = "20";
        return;
      }
      let shift = 0;
      if (d.fromIndex < to && i > d.fromIndex && i <= to) shift = -(dragged.height + GAP);
      if (d.fromIndex > to && i < d.fromIndex && i >= to) shift = dragged.height + GAP;
      el.style.transition = "transform 200ms cubic-bezier(0.2, 0.8, 0.2, 1)";
      el.style.transform = shift ? `translate3d(0, ${shift}px, 0)` : "";
    });
  }, []);

  const autoScroll = useCallback(() => {
    const d = dragRef.current;
    if (!d) return;
    const edge = 90;
    const y = d.lastClientY;
    let speed = 0;
    if (y < edge + 60) speed = -Math.ceil((edge + 60 - y) / 8);
    else if (y > window.innerHeight - edge) speed = Math.ceil((y - (window.innerHeight - edge)) / 8);
    if (speed) {
      window.scrollBy(0, speed);
      layout();
    }
    d.raf = requestAnimationFrame(autoScroll);
  }, [layout]);

  const endDrag = useCallback(
    (commit: boolean) => {
      const d = dragRef.current;
      if (!d) return;
      cancelAnimationFrame(d.raf);
      dragRef.current = null;
      clearTransforms();
      setDraggingId(null);
      if (commit && d.toIndex !== d.fromIndex) {
        const ids = links.map((l) => l.id);
        const [moved] = ids.splice(d.fromIndex, 1);
        ids.splice(d.toIndex, 0, moved);
        onReorder(ids);
      }
    },
    [links, onReorder],
  );

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d || e.pointerId !== d.pointerId) return;
      d.lastClientY = e.clientY;
      layout();
    };
    const up = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d || e.pointerId !== d.pointerId) return;
      endDrag(e.type === "pointerup");
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [layout, endDrag]);

  const startDrag = (e: React.PointerEvent, id: string) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    const rects = links.map((l) => {
      const r = rowRefs.current.get(l.id)?.getBoundingClientRect();
      return { id: l.id, top: (r?.top ?? 0) + window.scrollY, height: r?.height ?? 0 };
    });
    const fromIndex = links.findIndex((l) => l.id === id);
    dragRef.current = {
      id,
      pointerId: e.pointerId,
      fromIndex,
      toIndex: fromIndex,
      startPageY: e.clientY + window.scrollY,
      lastClientY: e.clientY,
      rects,
      raf: 0,
    };
    setDraggingId(id);
    layout();
    dragRef.current.raf = requestAnimationFrame(autoScroll);
  };

  const moveByKeyboard = (id: string, delta: -1 | 1) => {
    const from = links.findIndex((l) => l.id === id);
    const to = from + delta;
    if (to < 0 || to >= links.length) return;
    const ids = links.map((l) => l.id);
    const [moved] = ids.splice(from, 1);
    ids.splice(to, 0, moved);
    onReorder(ids);
  };

  return (
    <ul className="flex flex-col" style={{ gap: GAP }}>
      {links.map((link) => {
        const isRedirect = activeRedirectId === link.id;
        const dragging = draggingId === link.id;
        return (
          <li
            key={link.id}
            ref={(el) => {
              if (el) rowRefs.current.set(link.id, el);
              else rowRefs.current.delete(link.id);
            }}
            data-link-id={link.id}
            className={`relative flex min-h-[64px] items-center rounded-2xl border bg-slate-900/70 transition-[box-shadow,background-color,opacity] ${
              dragging ? "shadow-2xl shadow-black/60 ring-2 ring-purple-500/60" : ""
            } ${isRedirect ? "border-amber-400/50 bg-amber-950/20" : "border-white/10"}`}
          >
            <button
              type="button"
              aria-label={t("dashboard.links.dragHandle", { title: link.label })}
              onPointerDown={(e) => startDrag(e, link.id)}
              onKeyDown={(e) => {
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  moveByKeyboard(link.id, -1);
                } else if (e.key === "ArrowDown") {
                  e.preventDefault();
                  moveByKeyboard(link.id, 1);
                }
              }}
              className="flex h-16 w-11 shrink-0 cursor-grab items-center justify-center text-slate-500 active:cursor-grabbing"
              style={{ touchAction: "none" }}
            >
              <GripVertical size={20} />
            </button>

            <button
              type="button"
              onClick={() => onOpen(link.id)}
              aria-label={t("dashboard.links.editNamed", { title: link.label })}
              className={`flex min-w-0 flex-1 items-center gap-3 py-3 pr-1 text-left ${link.isVisible ? "" : "opacity-50"}`}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={
                  link.customColor
                    ? { backgroundColor: link.customColor, color: getReadableTextColor(link.customColor) }
                    : { backgroundColor: "rgba(148,163,184,0.12)", color: "#cbd5e1" }
                }
              >
                <LinkIcon url={link.url} title={link.label} icon={link.icon} size={16} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-[15px] font-semibold text-nordic-secondary">{link.label}</span>
                  {isRedirect && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-300">
                      <Zap size={11} fill="currentColor" /> {t("dashboard.links.redirectBadge")}
                    </span>
                  )}
                </span>
                <span className="block truncate text-[13px] text-nordic-highlight">{link.url.replace(/^https?:\/\//, "")}</span>
              </span>
              <ChevronRight size={18} className="shrink-0 text-slate-600" />
            </button>

            <button
              type="button"
              role="switch"
              aria-checked={link.isVisible}
              aria-label={t("dashboard.links.visibleNamed", { title: link.label })}
              onClick={() => onToggleVisibility(link.id, !link.isVisible)}
              className="flex h-16 w-[68px] shrink-0 items-center justify-center"
            >
              <span className={`relative h-[31px] w-[51px] rounded-full transition-colors duration-200 ${link.isVisible ? "bg-emerald-500" : "bg-slate-700"}`}>
                <span
                  className={`absolute left-[2px] top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow transition-transform duration-200 ${
                    link.isVisible ? "translate-x-[20px]" : ""
                  }`}
                />
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
