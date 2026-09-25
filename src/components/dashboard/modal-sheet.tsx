"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { animateSpring, prefersReducedMotion, projectMomentum, rubberband, type SpringHandle } from "@/lib/spring";

/*
 * Modal som är ett bottom sheet på mobil och en dialog på desktop.
 *
 * Mobil: glider upp nerifrån och stängs åt samma håll (dra i handtaget,
 * tryck utanför, ESC eller stäng-knapp). Dragningen följer fingret 1:1
 * och en snabb flick nedåt stänger även om man inte dragit halva vägen.
 */

interface ModalSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Fast rad längst ner (t.ex. Spara/Avbryt). */
  footer?: ReactNode;
  closeLabel: string;
}

function useIsDesktop() {
  const [desktop, setDesktop] = useState(false);
  useLayoutEffect(() => {
    const mql = window.matchMedia("(min-width: 640px)");
    const update = () => setDesktop(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);
  return desktop;
}

export function ModalSheet({ open, onClose, title, children, footer, closeLabel }: ModalSheetProps) {
  const [rendered, setRendered] = useState(open);
  const panelRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const springRef = useRef<SpringHandle | null>(null);
  const offsetRef = useRef(0);
  const closingRef = useRef(false);
  const isDesktop = useIsDesktop();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const apply = useCallback((y: number) => {
    offsetRef.current = y;
    const panel = panelRef.current;
    if (!panel) return;
    const h = panel.offsetHeight || 1;
    panel.style.transform = `translate3d(0, ${Math.max(y, -40)}px, 0)`;
    if (backdropRef.current) backdropRef.current.style.opacity = String(Math.max(0, Math.min(1, 1 - y / h)));
  }, []);

  const animateTo = useCallback(
    (target: number, velocity = 0, done?: () => void) => {
      springRef.current?.cancel();
      if (prefersReducedMotion()) {
        apply(target);
        done?.();
        return;
      }
      springRef.current = animateSpring(offsetRef.current, target, apply, { dampingRatio: 1, response: 0.32, velocity }, () => {
        springRef.current = null;
        done?.();
      });
    },
    [apply],
  );

  const requestClose = useCallback(
    (velocity = 0) => {
      if (closingRef.current) return;
      closingRef.current = true;
      const h = panelRef.current?.offsetHeight ?? 600;
      animateTo(h + 20, velocity, () => {
        setRendered(false);
        closingRef.current = false;
        onCloseRef.current();
      });
    },
    [animateTo],
  );

  // Öppna / stäng styrt utifrån.
  useEffect(() => {
    if (open) {
      closingRef.current = false;
      setRendered(true);
    } else if (rendered && !closingRef.current) {
      closingRef.current = true;
      const h = panelRef.current?.offsetHeight ?? 600;
      animateTo(h + 20, 0, () => {
        setRendered(false);
        closingRef.current = false;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Inglidning när den monterats.
  useLayoutEffect(() => {
    if (!rendered || !open) return;
    const h = panelRef.current?.offsetHeight ?? 600;
    apply(isDesktop ? 24 : h);
    animateTo(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rendered]);

  // ESC + låst bakgrundsscroll + fokus in i dialogen.
  useEffect(() => {
    if (!rendered) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", onKey);
    const prevFocus = document.activeElement as HTMLElement | null;
    panelRef.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      prevFocus?.focus?.({ preventScroll: true });
    };
  }, [rendered, requestClose]);

  useEffect(() => () => springRef.current?.cancel(), []);

  // --- Dra för att stänga (mobil) ---
  const drag = useRef<{ id: number; y0: number; off0: number; hist: { y: number; t: number }[]; moved: boolean } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    if (isDesktop || (e.pointerType === "mouse" && e.button !== 0)) return;
    springRef.current?.cancel();
    drag.current = { id: e.pointerId, y0: e.clientY, off0: offsetRef.current, hist: [{ y: e.clientY, t: e.timeStamp }], moved: false };
    const move = (ev: PointerEvent) => {
      const d = drag.current;
      if (!d || ev.pointerId !== d.id) return;
      const dy = ev.clientY - d.y0;
      if (!d.moved && Math.abs(dy) < 6) return;
      d.moved = true;
      const raw = d.off0 + dy;
      apply(raw < 0 ? -rubberband(-raw, 400) : raw);
      d.hist.push({ y: ev.clientY, t: ev.timeStamp });
      if (d.hist.length > 8) d.hist.shift();
    };
    const up = (ev: PointerEvent) => {
      const d = drag.current;
      if (!d || ev.pointerId !== d.id) return;
      drag.current = null;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      if (!d.moved) {
        animateTo(0);
        return;
      }
      const recent = d.hist.filter((h) => ev.timeStamp - h.t < 100);
      const a = recent.length > 1 ? recent[0] : d.hist[Math.max(0, d.hist.length - 2)];
      const b = d.hist[d.hist.length - 1];
      const v = (b.y - a.y) / Math.max((b.t - a.t) / 1000, 0.008);
      const h = panelRef.current?.offsetHeight ?? 600;
      const projected = offsetRef.current + projectMomentum(v);
      if (projected > h * 0.5) requestClose(v);
      else animateTo(0, v);
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  if (!rendered || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[55] flex items-end justify-center sm:items-center sm:p-6">
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={() => requestClose()}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[28px] border-t border-white/10 bg-slate-950 shadow-[0_-12px_40px_rgba(0,0,0,0.5)] outline-none will-change-transform sm:max-h-[85vh] sm:max-w-lg sm:rounded-[28px] sm:border"
      >
        <div className="shrink-0 select-none" style={{ touchAction: "none" }} onPointerDown={onPointerDown}>
          <div className="flex h-6 items-center justify-center sm:hidden">
            <span className="h-[5px] w-10 rounded-full bg-white/25" />
          </div>
          <div className="flex items-center justify-between gap-3 px-5 pb-3 sm:pt-4">
            <h2 className="text-lg font-semibold tracking-tight text-nordic-secondary">{title}</h2>
            <button
              type="button"
              onClick={() => requestClose()}
              aria-label={closeLabel}
              className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white/5 active:bg-white/10"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5">{children}</div>
        {footer && (
          <div
            className="shrink-0 border-t border-white/10 bg-slate-950 px-5 pt-3"
            style={{ paddingBottom: "max(env(safe-area-inset-bottom), 12px)" }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
