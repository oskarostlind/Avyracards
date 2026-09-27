"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  LayoutTemplate,
  User,
  RotateCcw,
  Loader2,
  Image as ImageIcon,
  BoxSelect,
  Briefcase,
  Share2,
  Check,
  ZoomIn,
  ZoomOut,
  type LucideIcon,
} from "lucide-react";

import { type CustomThemeSettings, defaultSettings, type ThemeMode } from "@/types/theme";
import { ProfilePreview } from "@/components/profile-preview";
import { getProfileData } from "@/lib/profile-mapper";
import { canAccess } from "@/lib/feature-access";
import { useRouter } from "next/navigation";
import { UpgradeModal } from "@/components/themes/upgrade-modal";
import { PremiumGateProvider, type PremiumTeaser } from "@/components/themes/premium-gate";
import { useT } from "@/i18n/client";
import { animateSpring, prefersReducedMotion, type SpringHandle } from "@/lib/spring";

import { BottomSheet } from "./bottom-sheet";
import { SegmentedControl } from "./theme-controls";
import { TemplatesTab } from "./tabs/templates-tab";
import { BackgroundTab } from "./tabs/background-tab";
import { ButtonsTab } from "./tabs/buttons-tab";
import { ProfileTab } from "./tabs/profile-tab";
import { LimitedTab } from "./tabs/limited-tab";
import { Gem } from "lucide-react";
import type { DropStatus, ProfileCollectible } from "@/lib/collectibles-shared";

/*
 * Temaeditorn (/profile/themes).
 *
 * Mobil (< lg): previewn får hela skärmen och inställningarna ligger i ett
 * dragbart bottom sheet med tre lägen (nedfällt / halvt / helt). Nedfällt
 * visar mallarna som en karusell — det vanligaste man gör — med previewn
 * fullt synlig ovanför. Tidigare delades skärmen 45/55 och inställningarna
 * fick ~200 px, och previewn klipptes upptill och nedtill.
 *
 * Desktop (lg+): preview till vänster, panel till höger (som förut).
 *
 * Båda lägena (Social/Business) har egna osparade ändringar; "Spara" sparar
 * alla lägen med ändringar, och man varnas innan osparat försvinner.
 */

interface UserThemeData {
  profileMode?: ThemeMode;
  isPremium?: boolean;
  isAdmin?: boolean;
  [key: string]: unknown;
}

interface ThemeEditorProps {
  initialSettings: CustomThemeSettings;
  initialBusinessSettings: CustomThemeSettings;
  userData: UserThemeData;
}

type Tab = "templates" | "background" | "buttons" | "profile" | "limited";

/*
 * Auto-zoom i previewn: det man redigerar zoomas in mjukt. Målen är
 * data-preview-target-attributen i profile-preview.tsx. "all" = utzoomat.
 */
type ZoomTarget = "avatar" | "name" | "bio" | "buttons";
type Focus = readonly ZoomTarget[] | "all";

const TAB_FOCUS: Record<Tab, Focus> = {
  templates: "all",
  background: "all",
  buttons: ["buttons"],
  // Profilfliken börjar med typsnittsväljaren -> namn + bio.
  profile: ["name", "bio"],
  // Samlarobjekten är ramar + Founder-badgen under namnet.
  limited: ["avatar", "name"],
};

/** Senast ändrade inställning -> vad som ska synas. */
function focusForKey(key: keyof CustomThemeSettings): Focus | null {
  if (key.startsWith("button") || key === "accentColor" || key === "textColor" || key === "showSaveContact") return ["buttons"];
  if (key === "frameStyle" || key === "nameEffect") return ["avatar", "name"];
  if (key === "font" || key === "headingFont") return ["name", "bio"];
  if (key.startsWith("background") || key.startsWith("gradient") || key === "hideBranding") return "all";
  return null;
}

/** Sektion i arket (data-editor-section) -> vad som ska synas. */
const SECTION_FOCUS: Record<string, Focus> = {
  font: ["name", "bio"],
  frame: ["avatar", "name"],
  nameEffect: ["avatar", "name"],
  branding: "all",
};

// Lagom inzoomat: målet ska kännas i fokus, men sammanhanget ska synas runt om.
const MAX_ZOOM = 1.7;
const ZOOM_PAD = 28;
// animateSpring slutar när |x - mål| < 0,5 — skalan animeras därför i tusendelar.
const Z_UNIT = 1000;

const PHONE_W = 375 + 16; // inkl. 8 px ram på varje sida
const PHONE_H = 750 + 16;
// Mobil: lägesväljaren ligger vertikalt i sidomarginalen bredvid telefonen och
// tar ingen höjd. Desktop: liten pill ovanför telefonen (där finns plats).
const MODE_BAR_H_MOBILE = 12;
const MODE_BAR_H_DESKTOP = 44;

function withDefaults(s: Partial<CustomThemeSettings> | undefined): CustomThemeSettings {
  return { ...defaultSettings, ...(s || {}) };
}

function sameSettings(a: CustomThemeSettings, b: CustomThemeSettings): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]) as Set<keyof CustomThemeSettings>;
  for (const k of keys) {
    const x = a[k];
    const y = b[k];
    if (x === y) continue;
    if ((x === undefined || x === "") && (y === undefined || y === "")) continue;
    if (typeof x === "string" && typeof y === "string" && x.toLowerCase() === y.toLowerCase()) continue;
    return false;
  }
  return true;
}

function useMediaQuery(query: string): boolean | null {
  const [matches, setMatches] = useState<boolean | null>(null);
  useLayoutEffect(() => {
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [query]);
  return matches;
}

function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setSize((prev) => (prev.width === r.width && prev.height === r.height ? prev : { width: r.width, height: r.height }));
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  });
  return [ref, size] as const;
}

/** Var navbaren slutar — så editorn kan fylla exakt resten (även med safe area i appen). */
function useHeaderBottom(): number {
  const [bottom, setBottom] = useState(64);
  useLayoutEffect(() => {
    const header = document.querySelector("body header");
    if (!header) {
      setBottom(0);
      return;
    }
    const measure = () => setBottom(Math.max(0, Math.round(header.getBoundingClientRect().bottom)));
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(header);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);
  return bottom;
}

/* -------------------------------------------------------------------------- */
/*  Auto-zoom ("kamera") över telefonen                                       */
/* -------------------------------------------------------------------------- */

interface Camera {
  /** Telefonens mittpunkt i preview-ytan (px). */
  x: number;
  y: number;
  /** Skala (1 = telefonens naturliga storlek). */
  s: number;
}

/**
 * Flyttar och skalar telefonen så att målet (data-preview-target) hamnar mitt
 * i den synliga delen av previewn, ovanför arket.
 *
 * - Fjäder (dampingRatio 1, response 0,4) per axel. En ny målpunkt startar från
 *   där telefonen faktiskt är och med nuvarande hastighet — zoomen kan byta mål
 *   mitt i utan hopp.
 * - Målets läge mäts med getBoundingClientRect och räknas om till telefonens
 *   egna koordinater (division med aktuell skala), så mätningen stämmer även
 *   mitt i en animation.
 * - Ligger målet utanför telefonens skärm (många länkar) scrollas previewn
 *   först dit, och kameran siktar på där målet hamnar efter scrollen.
 * - Reducerad rörelse: direkt byte.
 *
 * Transformen skrivs direkt till DOM:en (inte via React-state) — 60 bilder/s
 * utan omrenderingar.
 */
function usePreviewCamera({
  phoneRef,
  base,
  focus,
  view,
  remeasureKey,
}: {
  phoneRef: React.RefObject<HTMLDivElement>;
  /** Utzoomat läge: telefonen centrerad och inpassad. */
  base: Camera;
  focus: Focus;
  /** Synlig yta ovanför arket där målet ska hamna (mitt + storlek, px i preview-ytan). */
  view: { cx: number; cy: number; width: number; height: number };
  /** Ändras när innehållet kan ha flyttats (inställningar, läge). */
  remeasureKey: unknown;
}) {
  const cam = useRef<Camera>(base);
  const springs = useRef<{ x?: SpringHandle; y?: SpringHandle; s?: SpringHandle }>({});
  const placed = useRef(false);

  const apply = useCallback(() => {
    const el = phoneRef.current;
    if (!el) return;
    const { x, y, s } = cam.current;
    el.style.transform = `translate3d(${x - PHONE_W / 2}px, ${y - PHONE_H / 2}px, 0) scale(${s})`;
  }, [phoneRef]);

  const moveTo = useCallback(
    (target: Camera) => {
      const cur = cam.current;
      const same =
        Math.abs(cur.x - target.x) < 0.5 && Math.abs(cur.y - target.y) < 0.5 && Math.abs(cur.s - target.s) < 0.0005;
      const running = springs.current.x || springs.current.y || springs.current.s;
      if (same && !running) return;

      const prev = springs.current;
      if (!placed.current || prefersReducedMotion()) {
        prev.x?.cancel();
        prev.y?.cancel();
        prev.s?.cancel();
        springs.current = {};
        cam.current = { ...target };
        placed.current = true;
        apply();
        return;
      }

      // Fortsätt från nuvarande läge OCH hastighet (avbrytbar, inget glapp).
      const vx = prev.x?.current().velocity ?? 0;
      const vy = prev.y?.current().velocity ?? 0;
      const vs = prev.s?.current().velocity ?? 0;
      prev.x?.cancel();
      prev.y?.cancel();
      prev.s?.cancel();

      const opts = { dampingRatio: 1, response: 0.4 };
      const next: typeof springs.current = {};
      const done = (k: "x" | "y" | "s") => () => {
        if (springs.current[k] === next[k]) delete springs.current[k];
      };
      next.x = animateSpring(cur.x, target.x, (v) => ((cam.current.x = v), apply()), { ...opts, velocity: vx }, done("x"));
      next.y = animateSpring(cur.y, target.y, (v) => ((cam.current.y = v), apply()), { ...opts, velocity: vy }, done("y"));
      next.s = animateSpring(
        cur.s * Z_UNIT,
        target.s * Z_UNIT,
        (v) => ((cam.current.s = v / Z_UNIT), apply()),
        { ...opts, velocity: vs },
        done("s"),
      );
      springs.current = next;
    },
    [apply],
  );

  useEffect(
    () => () => {
      springs.current.x?.cancel();
      springs.current.y?.cancel();
      springs.current.s?.cancel();
    },
    [],
  );

  const focusKey = focus === "all" ? "all" : focus.join(",");

  useLayoutEffect(() => {
    const phone = phoneRef.current;
    if (!phone || base.s <= 0) return;

    const compute = (): Camera => {
      // För liten synlig yta (arket helt uppdraget): ingen zoom.
      if (focus === "all" || view.height < 140 || view.width < 140) return base;
      const root = phone.querySelector<HTMLElement>("[data-preview-root]");
      const targets = focus
        .map((f) => phone.querySelector<HTMLElement>(`[data-preview-target="${f}"]`))
        .filter((el): el is HTMLElement => Boolean(el));
      if (!root || targets.length === 0) return base;

      const phoneRect = phone.getBoundingClientRect();
      const sNow = phoneRect.width / PHONE_W || cam.current.s;
      const rootRect = root.getBoundingClientRect();
      const rootTop = (rootRect.top - phoneRect.top) / sNow;
      const rootLeft = (rootRect.left - phoneRect.left) / sNow;

      // Målets ruta i innehållets koordinater (oberoende av scroll).
      let top = Infinity;
      let bottom = -Infinity;
      let left = Infinity;
      let right = -Infinity;
      for (const el of targets) {
        const r = el.getBoundingClientRect();
        top = Math.min(top, (r.top - rootRect.top) / sNow + root.scrollTop);
        bottom = Math.max(bottom, (r.bottom - rootRect.top) / sNow + root.scrollTop);
        left = Math.min(left, (r.left - rootRect.left) / sNow);
        right = Math.max(right, (r.right - rootRect.left) / sNow);
      }

      // Scrolla previewn så att målet ligger på telefonens skärm.
      const maxScroll = Math.max(root.scrollHeight - root.clientHeight, 0);
      const wanted = Math.min(Math.max((top + bottom) / 2 - root.clientHeight / 2, 0), maxScroll);
      const fits = top >= root.scrollTop && bottom <= root.scrollTop + root.clientHeight;
      const scrollTo = fits ? root.scrollTop : wanted;
      if (scrollTo !== root.scrollTop) root.scrollTo({ top: scrollTo, behavior: prefersReducedMotion() ? "auto" : "smooth" });

      const w = right - left + ZOOM_PAD * 2;
      const h = bottom - top + ZOOM_PAD * 2;
      const s = Math.max(base.s, Math.min(MAX_ZOOM, view.width / w, view.height / h));
      // Målets mitt relativt telefonens mitt (lokala px).
      const px = rootLeft + (left + right) / 2 - PHONE_W / 2;
      const py = rootTop + (top + bottom) / 2 - scrollTo - PHONE_H / 2;
      return { x: view.cx - s * px, y: view.cy - s * py, s };
    };

    moveTo(compute());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey, base.x, base.y, base.s, view.cx, view.cy, view.width, view.height, remeasureKey, moveTo]);
}

interface ToastState {
  id: number;
  message: string;
  tone: "success" | "error" | "neutral";
  action?: { label: string; onClick: () => void };
}

export function ThemeEditor({ initialSettings, initialBusinessSettings, userData }: ThemeEditorProps) {
  const t = useT();
  const router = useRouter();

  const [mode, setMode] = useState<ThemeMode>(userData.profileMode || "SOCIAL");

  const [socialSettings, setSocialSettings] = useState<CustomThemeSettings>(() => withDefaults(initialSettings));
  const [businessSettings, setBusinessSettings] = useState<CustomThemeSettings>(() => withDefaults(initialBusinessSettings));
  // Senast sparade läge — det "osparat" jämförs mot och det "Återställ" går tillbaka till.
  const [savedSocial, setSavedSocial] = useState<CustomThemeSettings>(() => withDefaults(initialSettings));
  const [savedBusiness, setSavedBusiness] = useState<CustomThemeSettings>(() => withDefaults(initialBusinessSettings));

  const [activeTab, setActiveTab] = useState<Tab>("templates");
  const [isSaving, setIsSaving] = useState(false);
  // Öppen uppgraderingsruta = det som trycktes på (null = stängd).
  const [upgradeTeaser, setUpgradeTeaser] = useState<PremiumTeaser | null>(null);
  const requestPremium = useCallback((teaser?: PremiumTeaser) => setUpgradeTeaser(teaser ?? { kind: "generic" }), []);
  const closeUpgrade = useCallback(() => setUpgradeTeaser(null), []);
  const [focusHint, setFocusHint] = useState<Focus | null>(null);
  const [zoomedOut, setZoomedOut] = useState(false);
  const [sheetSnap, setSheetSnap] = useState(0);
  const [toast, setToast] = useState<ToastState | null>(null);

  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const headerBottom = useHeaderBottom();
  const [containerRef, containerSize] = useElementSize<HTMLDivElement>();
  const [previewRef, previewSize] = useElementSize<HTMLDivElement>();
  const [saveBarRef, saveBarSize] = useElementSize<HTMLDivElement>();

  const isUserPremium = userData.isPremium || false;
  const isUserAdmin = userData.isAdmin || false;
  const accessUser = useMemo(() => ({ isPremium: isUserPremium, isAdmin: isUserAdmin }), [isUserPremium, isUserAdmin]);

  const currentSettings = mode === "BUSINESS" ? businessSettings : socialSettings;
  const socialDirty = !sameSettings(socialSettings, savedSocial);
  const businessDirty = !sameSettings(businessSettings, savedBusiness);
  const dirtyModes: ThemeMode[] = [
    ...(socialDirty ? (["SOCIAL"] as const) : []),
    ...(businessDirty ? (["BUSINESS"] as const) : []),
  ];
  const isDirty = dirtyModes.length > 0;

  const mappedProfileData = useMemo(() => getProfileData(userData, mode), [userData, mode]);

  // --- Toast ---
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();
  const showToast = useCallback((next: Omit<ToastState, "id">) => {
    clearTimeout(toastTimer.current);
    setToast({ ...next, id: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), next.action ? 5000 : 2600);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  // --- Varna innan osparade ändringar försvinner ---
  const dirtyRef = useRef(isDirty);
  dirtyRef.current = isDirty;
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    // Klientnavigering (Next <Link>) triggar inte beforeunload — fånga länkklick.
    const onClick = (e: MouseEvent) => {
      if (!dirtyRef.current || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const anchor = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin === window.location.origin && url.pathname === window.location.pathname) return;
      if (!window.confirm(t("themes.editor.leaveConfirm"))) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [t]);

  // --- Ändra inställningar ---
  const setForMode = (m: ThemeMode, updater: (prev: CustomThemeSettings) => CustomThemeSettings) => {
    if (m === "BUSINESS") setBusinessSettings(updater);
    else setSocialSettings(updater);
  };

  const updateSetting = (key: keyof CustomThemeSettings, value: string | number | boolean | undefined) => {
    setForMode(mode, (prev) => ({ ...prev, [key]: value }));
    // Zooma till det som ändrades (knappfärg -> knapparna osv.).
    const f = focusForKey(key);
    if (f) {
      setFocusHint(f);
      setZoomedOut(false);
    }
  };

  const applyTemplate = (newSettings: Partial<CustomThemeSettings>) => {
    setForMode(mode, (prev) => ({ ...prev, ...newSettings }));
  };

  // --- Återställ (med ångra i stället för bekräftelsedialog) ---
  const handleDiscard = () => {
    const snapshot = { social: socialSettings, business: businessSettings };
    setSocialSettings(savedSocial);
    setBusinessSettings(savedBusiness);
    showToast({
      message: t("themes.editor.discarded"),
      tone: "neutral",
      action: {
        label: t("themes.editor.undo"),
        onClick: () => {
          setSocialSettings(snapshot.social);
          setBusinessSettings(snapshot.business);
          setToast(null);
        },
      },
    });
  };

  // --- Spara alla lägen med ändringar ---
  const handleSave = async () => {
    if (!isDirty || isSaving) return;
    setIsSaving(true);
    // Aktuellt läge först — det är det användaren tittar på.
    const order = dirtyModes.includes(mode) ? [mode, ...dirtyModes.filter((m) => m !== mode)] : dirtyModes;
    let sanitized = false;
    try {
      for (const m of order) {
        const settings = m === "BUSINESS" ? businessSettings : socialSettings;
        const res = await fetch("/api/themes/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: m, settings }),
        });

        if (res.status === 403) {
          requestPremium({ kind: "generic" });
          return;
        }
        if (!res.ok) throw new Error(`save failed: ${res.status}`);

        const json = await res.json();
        const clean = withDefaults(json.data);
        // Servern kan ha tvättat bort premiumfält — visa det som faktiskt sparades.
        setForMode(m, () => clean);
        if (m === "BUSINESS") setSavedBusiness(clean);
        else setSavedSocial(clean);
        if (json.sanitized) sanitized = true;
      }

      if (sanitized) requestPremium({ kind: "generic" });
      showToast({ message: t("themes.editor.saved"), tone: "success" });
      router.refresh();
    } catch (error) {
      console.error(error);
      showToast({ message: t("themes.editor.saveFailed"), tone: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  // --- Layoutmått ---
  const saveBarH = saveBarSize.height || 76;
  const available = Math.max(containerSize.height - saveBarH, 0);
  const MODE_BAR_H = isDesktop ? MODE_BAR_H_DESKTOP : MODE_BAR_H_MOBILE;
  const snapPoints = useMemo(() => {
    const peek = 206; // handtag + flikar + mallkarusell
    const full = Math.max(available - 48, peek + 120);
    const half = Math.min(Math.max(Math.round(available * 0.52), peek + 80), full - 40);
    return [peek, half, full];
  }, [available]);

  // Previewn skalas för att få plats ovanför arket (halvt läge som mest —
  // helt uppfällt täcker arket previewn, och då behöver den inte krympa mer).
  const coveredBySheet = isDesktop ? 0 : saveBarH + snapPoints[Math.min(sheetSnap, 1)];
  const scale = useMemo(() => {
    const w = previewSize.width - 32;
    const h = previewSize.height - MODE_BAR_H - (isDesktop ? 48 : 12) - coveredBySheet;
    if (w <= 0 || h <= 0) return 0.5;
    return Math.min(w / PHONE_W, h / PHONE_H, 1);
  }, [previewSize.width, previewSize.height, coveredBySheet, isDesktop, MODE_BAR_H]);
  const phoneCenterY = MODE_BAR_H + (previewSize.height - MODE_BAR_H - coveredBySheet) / 2;

  // --- Auto-zoom ---
  // Synlig yta = mellan lägesväljaren och arkets faktiska läge (även helt uppdraget).
  const sheetCover = isDesktop ? 0 : saveBarH + snapPoints[sheetSnap];
  const viewTop = isDesktop ? MODE_BAR_H : 8;
  const viewH = Math.max(previewSize.height - sheetCover - viewTop - 8, 0);
  const view = useMemo(
    () => ({ cx: previewSize.width / 2, cy: viewTop + viewH / 2, width: Math.max(previewSize.width - 24, 0), height: viewH }),
    [previewSize.width, viewTop, viewH],
  );
  const baseCamera = useMemo<Camera>(() => ({ x: previewSize.width / 2, y: phoneCenterY, s: scale }), [previewSize.width, phoneCenterY, scale]);
  const autoFocus: Focus = focusHint ?? TAB_FOCUS[activeTab];
  const focus: Focus = zoomedOut ? "all" : autoFocus;
  const canZoom = autoFocus !== "all" && viewH >= 140;
  const phoneRef = useRef<HTMLDivElement>(null);
  usePreviewCamera({
    phoneRef,
    base: baseCamera,
    focus: canZoom ? focus : "all",
    view,
    remeasureKey: `${mode}|${sheetSnap}|${JSON.stringify(currentSettings)}`,
  });

  // Sektionen man scrollar i arket styr zoomen (Profil: typsnitt -> namn+bio,
  // ram/namneffekt -> bild+namn, logga -> hela).
  const onSheetScroll = useCallback(
    (e: React.UIEvent<HTMLElement>) => {
      const scroller = e.target as HTMLElement;
      if (!scroller.querySelectorAll) return;
      const sections = scroller.querySelectorAll<HTMLElement>("[data-editor-section]");
      if (sections.length === 0) return;
      const top = scroller.getBoundingClientRect().top + 56;
      let current: string | null = null;
      for (const el of Array.from(sections)) {
        if (el.getBoundingClientRect().bottom > top) {
          current = el.dataset.editorSection ?? null;
          break;
        }
      }
      const f = current ? SECTION_FOCUS[current] : undefined;
      if (f) setFocusHint((prev) => (prev === f ? prev : f));
    },
    [],
  );

  // Nyp (två fingrar) och dubbeltryck på previewn växlar in/utzoomat.
  const gesture = useRef<{ dist: number; lastTap: number; lastX: number; lastY: number }>({ dist: 0, lastTap: 0, lastX: 0, lastY: 0 });
  const onPreviewTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const [a, b] = [e.touches[0], e.touches[1]];
      gesture.current.dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    }
  };
  const onPreviewTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length !== 2 || !gesture.current.dist || !canZoom) return;
    const [a, b] = [e.touches[0], e.touches[1]];
    const ratio = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) / gesture.current.dist;
    if (ratio < 0.8) {
      setZoomedOut(true);
      gesture.current.dist = 0;
    } else if (ratio > 1.25) {
      setZoomedOut(false);
      gesture.current.dist = 0;
    }
  };
  const onPreviewPointerUp = (e: React.PointerEvent) => {
    if (!canZoom) return;
    const g = gesture.current;
    const now = e.timeStamp;
    if (now - g.lastTap < 320 && Math.hypot(e.clientX - g.lastX, e.clientY - g.lastY) < 24) {
      setZoomedOut((z) => !z);
      g.lastTap = 0;
      return;
    }
    g.lastTap = now;
    g.lastX = e.clientX;
    g.lastY = e.clientY;
  };

  const selectTab = (tab: Tab) => {
    setActiveTab(tab);
    setFocusHint(null);
    setZoomedOut(false);
    if (!isDesktop && sheetSnap === 0 && tab !== "templates") setSheetSnap(1);
  };

  const accentBtn =
    mode === "BUSINESS" ? "bg-blue-600 active:bg-blue-500 shadow-blue-500/25" : "bg-purple-600 active:bg-purple-500 shadow-purple-500/25";

  // --- Delar ---
  const tabs: { id: Tab; icon: LucideIcon; label: string }[] = [
    { id: "templates", icon: LayoutTemplate, label: t("themes.tabTemplates") },
    { id: "background", icon: ImageIcon, label: t("themes.tabBackground") },
    { id: "buttons", icon: BoxSelect, label: t("themes.tabButtons") },
    { id: "profile", icon: User, label: t("themes.tabProfile") },
    { id: "limited", icon: Gem, label: t("collectibles.limited.tab") },
  ];

  const tabBar = (
    <div role="tablist" aria-label={t("themes.editor.settings")} className="flex gap-2 overflow-x-auto px-4 pb-3 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {tabs.map(({ id, icon: Icon, label }) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => selectTab(id)}
            className={`flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-[background-color,color,transform] duration-150 active:scale-[0.96] ${
              active ? "bg-white text-slate-950" : "bg-white/[0.07] text-slate-300 hover:bg-white/10"
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        );
      })}
    </div>
  );

  const tabContent = (() => {
    switch (activeTab) {
      case "templates":
        return (
          <TemplatesTab
            isPremium={isUserPremium}
            isAdmin={isUserAdmin}
            onApply={(tpl) => applyTemplate(tpl.settings)}
            onShowUpgrade={requestPremium}
            mode={mode}
            currentSettings={currentSettings}
            layout={!isDesktop && sheetSnap === 0 ? "strip" : "grid"}
            columns={isDesktop ? 2 : 3}
          />
        );
      case "background":
        return (
          <BackgroundTab
            settings={currentSettings}
            updateSetting={updateSetting}
            canUseImage={canAccess("theme_background_image", accessUser)}
            canAnimate={canAccess("theme_animated_background", accessUser)}
            onShowUpgrade={requestPremium}
          />
        );
      case "buttons":
        return (
          <ButtonsTab
            settings={currentSettings}
            updateSetting={updateSetting}
            isPremium={isUserPremium}
            isAdmin={isUserAdmin}
            onShowUpgrade={requestPremium}
          />
        );
      case "profile":
        return (
          <ProfileTab settings={currentSettings} updateSetting={updateSetting} displayName={mappedProfileData.displayName} />
        );
      case "limited":
        return (
          <LimitedTab
            settings={currentSettings}
            updateSetting={updateSetting}
            collectibles={(userData.collectibles as ProfileCollectible[] | undefined) ?? []}
            drops={(userData.drops as DropStatus[] | undefined) ?? []}
            canAnimate={canAccess("theme_premium_frames", accessUser)}
            avatarUrl={mappedProfileData.image}
            onShowUpgrade={() => requestPremium({ kind: "frame", frame: "founders" })}
          />
        );
    }
  })();

  const saveLabel = isDirty
    ? dirtyModes.length > 1
      ? t("themes.editor.saveBoth")
      : t("themes.editor.save")
    : t("themes.editor.allSaved");

  const saveBar = (
    <div className="flex items-center gap-3">
      {isDirty && (
        <button
          type="button"
          onClick={handleDiscard}
          className="flex h-12 shrink-0 items-center gap-2 rounded-2xl bg-white/[0.07] px-4 text-sm font-semibold text-slate-300 transition-transform active:scale-[0.97]"
        >
          <RotateCcw size={16} />
          {t("themes.editor.discard")}
        </button>
      )}
      <button
        type="button"
        onClick={handleSave}
        disabled={!isDirty || isSaving}
        aria-live="polite"
        className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl text-[15px] font-semibold transition-[background-color,transform,opacity] duration-150 ${
          isDirty ? `${accentBtn} text-white shadow-lg active:scale-[0.98]` : "bg-white/[0.06] text-nordic-highlight"
        }`}
      >
        {isSaving ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : isDirty ? (
          <>
            <span aria-hidden className="h-2 w-2 rounded-full bg-amber-300" />
            {saveLabel}
          </>
        ) : (
          <>
            <Check size={18} />
            {saveLabel}
          </>
        )}
      </button>
    </div>
  );

  // Kompakt pill (28 px hög) — tidigare en 44 px bred rad som åt previewyta.
  // Tryckytan är ändå ~46 px: knapparna har en osynlig ::after-yta ovan/under.
  const modeControl = (
    <div className="rounded-full bg-slate-950/70 p-0.5 shadow-lg backdrop-blur-xl [@media(prefers-reduced-transparency:reduce)]:bg-slate-950">
      <SegmentedControl
        size="xs"
        ariaLabel={t("themes.editor.editingProfile")}
        value={mode}
        onChange={(v) => setMode(v as ThemeMode)}
        activeClassName={mode === "BUSINESS" ? "bg-blue-600 text-white shadow-sm" : "bg-purple-600 text-white shadow-sm"}
        options={[
          { value: "SOCIAL", label: <><Share2 size={12} /> {t("themes.social")}</>, dot: socialDirty },
          { value: "BUSINESS", label: <><Briefcase size={12} /> {t("themes.business")}</>, dot: businessDirty },
        ]}
      />
    </div>
  );

  // Mobil: två små knappar på höjden i vänstermarginalen (telefonen är smal
  // nog att det alltid finns ~70 px fritt på sidorna). Tar ingen previewhöjd.
  const modeControlVertical = (
    <div
      role="radiogroup"
      aria-label={t("themes.editor.editingProfile")}
      className="flex w-[60px] flex-col gap-1 rounded-2xl border border-white/10 bg-slate-950/70 p-1 shadow-lg backdrop-blur-xl [@media(prefers-reduced-transparency:reduce)]:bg-slate-950"
    >
      {([
        { value: "SOCIAL" as const, icon: Share2, label: t("themes.social"), dirty: socialDirty, active: "bg-purple-600" },
        { value: "BUSINESS" as const, icon: Briefcase, label: t("themes.business"), dirty: businessDirty, active: "bg-blue-600" },
      ]).map(({ value, icon: Icon, label, dirty, active }) => {
        const on = mode === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={label}
            onClick={() => setMode(value)}
            className={`relative flex h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-semibold transition-[background-color,color,transform] duration-150 active:scale-[0.95] ${
              on ? `${active} text-white` : "text-nordic-highlight"
            }`}
          >
            <Icon size={16} />
            {label}
            {dirty && <span aria-hidden className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-amber-400" />}
          </button>
        );
      })}
    </div>
  );

  return (
    <PremiumGateProvider accessUser={accessUser} onRequest={requestPremium}>
      <UpgradeModal
        isOpen={upgradeTeaser !== null}
        onClose={closeUpgrade}
        teaser={upgradeTeaser}
        preview={{
          settings: currentSettings,
          displayName: mappedProfileData.displayName,
          image: mappedProfileData.image,
          linkTitles: mappedProfileData.links.map((l) => l.title || l.url),
        }}
      />

      <div
        ref={containerRef}
        className="fixed inset-x-0 bottom-0 z-40 flex flex-col overflow-hidden bg-[#050505] supports-[overflow:clip]:overflow-clip lg:flex-row"
        style={{ top: headerBottom }}
        // Arket sticker ut under containern när det är nedfällt (transform). Med
        // overflow:hidden kan webbläsaren ändå scrolla containern när något
        // fokuseras (t.ex. ett fält när tangentbordet öppnas) — då hoppar hela
        // editorn. overflow:clip förhindrar det; nollställningen är reserv för
        // äldre WebKit.
        onScroll={(e) => {
          if (e.currentTarget.scrollTop !== 0) e.currentTarget.scrollTop = 0;
        }}
      >
        {/* --- LIVE PREVIEW --- */}
        <div ref={previewRef} className="relative min-h-0 flex-1 overflow-hidden supports-[overflow:clip]:overflow-clip">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "20px 20px" }}
          />

          {isDesktop ? (
            <div className="absolute inset-x-0 top-1.5 z-20 flex justify-center">{modeControl}</div>
          ) : (
            <div className="absolute left-2 top-2 z-20">{modeControlVertical}</div>
          )}

          {/* Telefonen. Transformen (placering + auto-zoom) skrivs av usePreviewCamera. */}
          <div
            ref={phoneRef}
            data-preview-phone=""
            onTouchStart={onPreviewTouchStart}
            onTouchMove={onPreviewTouchMove}
            onPointerUp={onPreviewPointerUp}
            className="absolute left-0 top-0 z-10 overflow-hidden rounded-[3rem] border-[8px] border-slate-700/50 bg-nordic-primary shadow-2xl ring-1 ring-white/10"
            style={{
              width: PHONE_W,
              height: PHONE_H,
              transform: `translate3d(${baseCamera.x - PHONE_W / 2}px, ${baseCamera.y - PHONE_H / 2}px, 0) scale(${scale})`,
            }}
          >
            <ProfilePreview data={mappedProfileData} customSettings={currentSettings} isPremium={isUserPremium} isAdmin={isUserAdmin} />
          </div>

          {/* Visa hela / zooma in — syns bara när det finns något att zooma till. */}
          {canZoom && (
            <button
              type="button"
              onClick={() => setZoomedOut((z) => !z)}
              aria-pressed={zoomedOut}
              className="absolute right-2 z-20 flex h-11 items-center gap-1.5 rounded-full border border-white/10 bg-slate-950/70 px-3.5 text-xs font-semibold text-slate-100 shadow-lg backdrop-blur-xl transition-transform duration-100 active:scale-95 [@media(prefers-reduced-transparency:reduce)]:bg-slate-950"
              style={{ top: 8 }}
            >
              {zoomedOut ? <ZoomIn size={16} aria-hidden /> : <ZoomOut size={16} aria-hidden />}
              {zoomedOut ? t("themes.editor.zoomIn") : t("themes.editor.zoomOut")}
            </button>
          )}

          <Toast toast={toast} onDismiss={() => setToast(null)} />
        </div>

        {/* --- DESKTOP-PANEL --- */}
        {isDesktop && (
          <aside className="flex w-[400px] shrink-0 flex-col border-l border-white/10 bg-nordic-primary">
            <div className="pt-4">{tabBar}</div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-2" onScroll={onSheetScroll}>{tabContent}</div>
            <div className="border-t border-white/10 p-4">{saveBar}</div>
          </aside>
        )}

        {/* --- MOBIL: BOTTOM SHEET + SPARA-RAD --- */}
        {isDesktop === false && containerSize.height > 0 && (
          <>
            <BottomSheet
              snapPoints={snapPoints}
              snapIndex={sheetSnap}
              onSnapChange={setSheetSnap}
              header={tabBar}
              handleLabel={sheetSnap === 0 ? t("themes.editor.expandSheet") : t("themes.editor.collapseSheet")}
              bottomOffset={saveBarH}
              onContentScroll={onSheetScroll}
            >
              {activeTab === "templates" && sheetSnap === 0 ? (
                tabContent
              ) : (
                <div className="px-4 pb-8 pt-2">{tabContent}</div>
              )}
            </BottomSheet>

            <div
              ref={saveBarRef}
              className="absolute inset-x-0 bottom-0 z-40 border-t border-white/10 bg-slate-950 px-4 pt-3"
              style={{ paddingBottom: "max(env(safe-area-inset-bottom), 12px)" }}
            >
              {saveBar}
            </div>
          </>
        )}
      </div>
    </PremiumGateProvider>
  );
}

function Toast({ toast, onDismiss }: { toast: ToastState | null; onDismiss: () => void }) {
  // Behåll senaste innehållet under utgångsanimationen.
  const [shown, setShown] = useState<ToastState | null>(toast);
  useEffect(() => {
    if (toast) setShown(toast);
  }, [toast]);

  const visible = Boolean(toast);
  const Icon = shown?.tone === "success" ? Check : null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`absolute inset-x-0 top-3 z-30 flex justify-center px-4 transition-[opacity,transform] duration-300 ease-out motion-reduce:translate-y-0 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-3 opacity-0"
      }`}
    >
      {shown && (
        <div
          className={`flex min-h-[44px] max-w-sm items-center gap-3 rounded-2xl border px-4 py-2 text-sm font-semibold shadow-xl backdrop-blur-xl ${
            shown.tone === "error"
              ? "border-red-500/30 bg-red-950/90 text-red-100"
              : "border-white/10 bg-slate-900/90 text-nordic-secondary"
          }`}
        >
          {Icon && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
              <Icon size={14} strokeWidth={3} />
            </span>
          )}
          <span>{shown.message}</span>
          {shown.action && (
            <button
              type="button"
              onClick={shown.action.onClick}
              className="-mr-2 h-10 rounded-xl px-3 text-sm font-bold text-purple-300 active:bg-white/10"
            >
              {shown.action.label}
            </button>
          )}
          {!shown.action && (
            <button type="button" onClick={onDismiss} className="sr-only">
              OK
            </button>
          )}
        </div>
      )}
    </div>
  );
}
