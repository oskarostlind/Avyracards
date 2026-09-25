"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import {
  animateSpring,
  prefersReducedMotion,
  projectMomentum,
  rubberband,
  type SpringHandle,
} from "@/lib/spring";

/**
 * Bottom sheet för temaeditorn på mobil.
 *
 * - Följer fingret 1:1 (Pointer Events + pointer capture).
 * - Kan gripas mitt i en animation — fjädern startar alltid från nuvarande läge.
 * - Snappunkt väljs utifrån vart gesten är på väg (momentum-projektion),
 *   och fingrets hastighet lämnas över till fjädern så det inte blir ett glapp.
 * - Mjukt motstånd förbi översta/understa läget i stället för hårt stopp.
 *
 * `snapPoints` är synlig höjd i px, stigande. Arket är alltid lika högt som
 * största snappunkten och flyttas med transform — bara compositor-egenskaper
 * animeras.
 */

interface BottomSheetProps {
  snapPoints: number[];
  snapIndex: number;
  onSnapChange: (index: number) => void;
  /** Dragbar yta överst (handtag, flikar). */
  header: ReactNode;
  children: ReactNode;
  handleLabel: string;
  /** Avstånd från containerns botten (t.ex. höjden på spara-raden). */
  bottomOffset?: number;
}

const DRAG_THRESHOLD = 8;

interface DragState {
  pointerId: number;
  startY: number;
  startVisible: number;
  dragging: boolean;
  interrupted: boolean;
  history: { y: number; t: number }[];
}

export function BottomSheet({
  snapPoints,
  snapIndex,
  onSnapChange,
  header,
  children,
  handleLabel,
  bottomOffset = 0,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const maxVisible = snapPoints[snapPoints.length - 1];
  const minVisible = snapPoints[0];

  const visibleRef = useRef(snapPoints[snapIndex]);
  const targetRef = useRef(snapPoints[snapIndex]);
  const springRef = useRef<SpringHandle | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);

  // Innehållsytans höjd uppdateras först när arket landat (inte varje bildruta),
  // så att scrollområdet slutar exakt vid synlig kant.
  const [settledVisible, setSettledVisible] = useState(snapPoints[snapIndex]);
  const [headerHeight, setHeaderHeight] = useState(0);

  const apply = useCallback(
    (visible: number) => {
      visibleRef.current = visible;
      const el = sheetRef.current;
      if (el) el.style.transform = `translate3d(0, ${maxVisible - visible}px, 0)`;
    },
    [maxVisible],
  );

  const animateTo = useCallback(
    (target: number, velocity = 0) => {
      springRef.current?.cancel();
      targetRef.current = target;

      if (prefersReducedMotion()) {
        apply(target);
        setSettledVisible(target);
        return;
      }

      // Under rörelsen: låt innehållet vara så högt som behövs så inget klipps.
      setSettledVisible((prev) => Math.max(prev, target, visibleRef.current));
      const hadMomentum = Math.abs(velocity) > 400;
      springRef.current = animateSpring(
        visibleRef.current,
        target,
        apply,
        // Studs bara när gesten själv hade fart (en flick) — annars kritiskt dämpad.
        { dampingRatio: hadMomentum ? 0.85 : 1, response: 0.32, velocity },
        () => {
          springRef.current = null;
          setSettledVisible(target);
        },
      );
    },
    [apply],
  );

  // Första rendering: placera utan animation.
  useLayoutEffect(() => {
    apply(snapPoints[snapIndex]);
    setSettledVisible(snapPoints[snapIndex]);
    targetRef.current = snapPoints[snapIndex];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxVisible]);

  // Styrt utifrån (t.ex. tryck på en flik): animera dit från där arket är nu.
  useEffect(() => {
    const target = snapPoints[snapIndex];
    if (target !== targetRef.current) animateTo(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapIndex, snapPoints.join(",")]);

  useEffect(() => () => springRef.current?.cancel(), []);

  useEffect(() => {
    const el = headerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setHeaderHeight(el.getBoundingClientRect().height));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const nearestIndex = (value: number) => {
    let best = 0;
    snapPoints.forEach((p, i) => {
      if (Math.abs(p - value) < Math.abs(snapPoints[best] - value)) best = i;
    });
    return best;
  };

  // Rörelse och släpp lyssnas på `window`, inte på elementet: annars tappas
  // gesten när fingret/pekaren lämnar arket (t.ex. drar uppåt förbi kanten)
  // eller när något annat (en modal) råkar ligga under pekaren vid släpp.
  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      const s = dragRef.current;
      if (!s || s.pointerId !== e.pointerId) return;
      const dy = e.clientY - s.startY;

      if (!s.dragging) {
        if (Math.abs(dy) < DRAG_THRESHOLD) return;
        s.dragging = true;
        // Räkna från där tröskeln passerades, så arket inte hoppar 8 px.
        s.startY = e.clientY;
        s.startVisible = visibleRef.current;
        setSettledVisible(maxVisible);
      }

      let next = s.startVisible - (e.clientY - s.startY);
      if (next > maxVisible) next = maxVisible + rubberband(next - maxVisible, maxVisible);
      if (next < minVisible) next = minVisible - rubberband(minVisible - next, maxVisible);
      apply(next);

      // Alla delsampel sedan förra bildrutan — ger stabilare hastighet vid snabba flickar.
      const samples = typeof e.getCoalescedEvents === "function" ? e.getCoalescedEvents() : [];
      for (const c of samples.length ? samples : [e]) s.history.push({ y: c.clientY, t: c.timeStamp });
      if (s.history.length > 12) s.history.splice(0, s.history.length - 12);
    },
    [apply, maxVisible, minVisible],
  );

  const detachRef = useRef<() => void>(() => {});

  const finish = useCallback(
    (e: PointerEvent) => {
      const s = dragRef.current;
      if (!s || s.pointerId !== e.pointerId) return;
      dragRef.current = null;
      detachRef.current();

      if (!s.dragging) {
        // Ett tryck som avbröt en animation: fortsätt mot samma mål.
        if (s.interrupted) animateTo(targetRef.current);
        return;
      }

      suppressClickRef.current = true;
      // Nollställ om inget klick följer (t.ex. släpp utanför arket).
      setTimeout(() => (suppressClickRef.current = false), 0);
      const now = e.timeStamp;
      // Hastighet ur de senaste ~100 ms. Finns bara ett sampel där (händelser
      // kan slås ihop per bildruta) används de två sista, om fingret fortfarande
      // rörde sig strax före släpp — annars räknas det som stillastående.
      const last = s.history[s.history.length - 1];
      const recent = s.history.filter((h) => now - h.t < 100);
      const first =
        recent.length > 1 ? recent[0] : now - last.t < 80 && s.history.length > 1 ? s.history[s.history.length - 2] : last;
      const dt = Math.max((last.t - first.t) / 1000, 0.008);
      // Positiv y-hastighet = nedåt = mindre synlig höjd.
      const visibleVelocity = first === last ? 0 : -((last.y - first.y) / dt);

      const projected = visibleRef.current + projectMomentum(visibleVelocity, 0.995);
      const index = nearestIndex(projected);
      animateTo(snapPoints[index], visibleVelocity);
      if (index !== snapIndex) onSnapChange(index);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [animateTo, snapIndex, snapPoints.join(","), onSnapChange],
  );

  // Senaste versionerna av handlers — window-lyssnarna pekar hit.
  const moveRef = useRef(onPointerMove);
  const finishRef = useRef(finish);
  moveRef.current = onPointerMove;
  finishRef.current = finish;

  useEffect(() => () => detachRef.current(), []);

  const onPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    detachRef.current();
    // Grip mitt i en animation: stanna där arket faktiskt är just nu.
    const interrupted = springRef.current !== null;
    springRef.current?.cancel();
    springRef.current = null;
    dragRef.current = {
      pointerId: e.pointerId,
      startY: e.clientY,
      startVisible: visibleRef.current,
      dragging: false,
      interrupted,
      history: [{ y: e.clientY, t: e.timeStamp }],
    };

    const move = (ev: PointerEvent) => moveRef.current(ev);
    const up = (ev: PointerEvent) => finishRef.current(ev);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    detachRef.current = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      detachRef.current = () => {};
    };
  };

  const onClickCapture = (e: React.MouseEvent) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      e.stopPropagation();
      e.preventDefault();
    }
  };

  const dragHandlers = { onPointerDown, onClickCapture };

  const atPeek = snapIndex === 0;

  return (
    <div
      ref={sheetRef}
      role="region"
      className="absolute inset-x-0 z-30 flex flex-col rounded-t-[28px] border-t border-white/10 bg-slate-950/85 shadow-[0_-12px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl backdrop-saturate-150 will-change-transform [@media(prefers-reduced-transparency:reduce)]:bg-slate-950 [@media(prefers-reduced-transparency:reduce)]:backdrop-blur-none"
      style={{
        height: maxVisible,
        bottom: bottomOffset,
        transform: `translate3d(0, ${maxVisible - snapPoints[snapIndex]}px, 0)`,
      }}
    >
      <div ref={headerRef} className="shrink-0 select-none" style={{ touchAction: "pan-x" }} {...dragHandlers}>
        <button
          type="button"
          aria-label={handleLabel}
          onClick={() => onSnapChange(snapIndex === 0 ? 1 : 0)}
          className="flex h-6 w-full items-center justify-center"
        >
          <span className="h-[5px] w-10 rounded-full bg-white/25" />
        </button>
        {header}
      </div>

      {/* I nedfällt läge är även innehållet en dragyta (vertikalt), så man kan
          dra upp arket var som helst. Uppfällt scrollar innehållet som vanligt. */}
      <div
        className="min-h-0 overflow-y-auto overscroll-contain"
        style={{
          height: Math.max(settledVisible - headerHeight, 0),
          touchAction: atPeek ? "pan-x" : "pan-y",
        }}
        {...(atPeek ? dragHandlers : {})}
      >
        {children}
      </div>
    </div>
  );
}
