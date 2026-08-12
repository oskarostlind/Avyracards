"use client";

import { useRef, useState, useMemo, CSSProperties } from "react";
import Image from "next/image";
import { QrCode, Wifi, RotateCw } from "lucide-react";
import ReactCardFlip from 'react-card-flip';

/**
 * KORTPREVIEW
 *
 * Renderingen speglar de faktiska produkterna vi köper från NFC21 / nfc-tag-shop.de
 * (se ClickUp "Produkt & leverantörer", 86c6qdj6d). Ändra inte geometrin utan att
 * först dubbelkolla leverantörens datablad — siffrorna nedan är hämtade därifrån.
 *
 *  PLAST   NFC card PVC, 85,6 x 54 mm, 0,86 mm, matt svart GENOMFÄRGAD, NTAG216.
 *          Tryck på EN sida, tryckfinish satin. Alla plastkort är identiska och
 *          bär Avyras egen design — kunden får inget eget namn tryckt.
 *
 *  METALL  NFC card metal/PVC, 85,6 x 54 mm, 1,20 mm, NTAG213, tryck på EN sida.
 *          Framsidan har en TUNN GLANSIG PVC-PANEL på 82 x 51 mm med on-metal-skikt
 *          bakom. Runt panelen syns alltså en borstad metallram på ca 1,8 mm i sidled
 *          och 1,5 mm i höjdled. Otryckt trycks panelen i samma färg som metallen.
 *          Baksidan är bar borstad metall utan tryck.
 */

// --- GEOMETRI (ISO 7810 ID-1, mm) ---
const CARD_W = 85.6;
const CARD_H = 54;
const CARD_RADIUS = 3.18;

// Metallkortets tryckpanel
const PANEL_W = 82;
const PANEL_H = 51;
const PANEL_RADIUS = 2.4;

// Omräknat till procent av kortytan
const PANEL_INSET_X = ((CARD_W - PANEL_W) / 2 / CARD_W) * 100;   // 2.103 %
const PANEL_INSET_Y = ((CARD_H - PANEL_H) / 2 / CARD_H) * 100;   // 2.778 %
const CARD_RADIUS_CSS = `${(CARD_RADIUS / CARD_W) * 100}% / ${(CARD_RADIUS / CARD_H) * 100}%`;
const PANEL_RADIUS_CSS = `${(PANEL_RADIUS / PANEL_W) * 100}% / ${(PANEL_RADIUS / PANEL_H) * 100}%`;

interface CardPreview3DProps {
  material: "plastic" | "metal";
  color: string;
  design: "minimal" | "qr";
  customImage?: string | null;
}

// --- FÄRGHJÄLP -------------------------------------------------------------
// Alla ytbehandlingar härleds ur den hex som ligger på produktvarianten i DB.
// På så vis matchar färgprickarna i väljaren alltid kortet, oavsett vad admin sätter.

type Hsl = { h: number; s: number; l: number };

const LEGACY_COLORS: Record<string, string> = {
  black: "#1a1a1a", white: "#f5f5f5", red: "#dc2626",
  blue: "#2563eb", green: "#16a34a", yellow: "#ca8a04", grey: "#4b5563",
  "metal-black": "#2a2c2f", silver: "#b8bcc0", gold: "#c9a961", rosegold: "#c58a72",
};

function hexToHsl(hex: string): Hsl {
  let clean = hex.replace("#", "").trim();
  if (clean.length === 3) clean = clean.split("").map((c) => c + c).join("");
  const num = parseInt(clean, 16);
  if (Number.isNaN(num) || clean.length !== 6) return { h: 220, s: 4, l: 12 };

  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

/** Skiftar ljushet och mättnad kring baskulören — grunden i all metalliksimulering. */
function shade({ h, s, l }: Hsl, dl: number, ds = 0, alpha = 1): string {
  const ll = Math.min(100, Math.max(0, l + dl));
  const ss = Math.min(100, Math.max(0, s + ds));
  return alpha === 1
    ? `hsl(${h.toFixed(1)} ${ss.toFixed(1)}% ${ll.toFixed(1)}%)`
    : `hsl(${h.toFixed(1)} ${ss.toFixed(1)}% ${ll.toFixed(1)}% / ${alpha})`;
}

interface Finish {
  hsl: Hsl;
  /** Borstad, matt metallyta — används på ram och baksida. */
  brushed: CSSProperties;
  /** Glansig PVC-panel — endast metallkortets framsida. */
  gloss: CSSProperties;
  /** Matt satinplast. */
  matte: CSSProperties;
  /** Kortets synliga kant (metallkant är ljus, plastkant mörk). */
  edgeColor: string;
  /** true när ytan är ljus nog att kräva mörk text. */
  needsDarkText: boolean;
}

function buildFinish(hex: string): Finish {
  const c = hexToHsl(hex);

  // Borstad metall: fin horisontell slipriktning + anisotropiskt ljusband.
  // Slipningen går längs kortets långsida, därför horisontella linjer.
  const grain =
    "repeating-linear-gradient(to bottom," +
    " rgba(255,255,255,0.055) 0px, rgba(255,255,255,0.055) 1px," +
    " rgba(0,0,0,0.045) 1px, rgba(0,0,0,0.045) 2px," +
    " rgba(255,255,255,0.018) 2px, rgba(255,255,255,0.018) 3px)";

  const anisotropic =
    `linear-gradient(to bottom,` +
    ` ${shade(c, 9, -2)} 0%,` +
    ` ${shade(c, -3, 1)} 24%,` +
    ` ${shade(c, 13, -4)} 47%,` +
    ` ${shade(c, -5, 2)} 70%,` +
    ` ${shade(c, 5, -1)} 100%)`;

  const brushed: CSSProperties = {
    backgroundImage: `${grain}, ${anisotropic}`,
    backgroundColor: shade(c, 0),
  };

  // Glansig PVC: bredare, mjukare övergångar och en tydlig specular-svep.
  const gloss: CSSProperties = {
    backgroundImage:
      `linear-gradient(158deg,` +
      ` ${shade(c, 17, -3)} 0%,` +
      ` ${shade(c, 3, 0)} 33%,` +
      ` ${shade(c, -7, 2)} 61%,` +
      ` ${shade(c, 9, -2)} 100%)`,
    backgroundColor: shade(c, 0),
  };

  // Matt satinplast: nästan platt, bara en aning djup upptill.
  const matte: CSSProperties = {
    backgroundImage:
      `linear-gradient(to bottom, ${shade(c, 2.5)} 0%, ${shade(c, 0)} 42%, ${shade(c, -2)} 100%)`,
    backgroundColor: shade(c, 0),
  };

  return {
    hsl: c,
    brushed,
    gloss,
    matte,
    edgeColor: shade(c, 18, -4),
    needsDarkText: c.l > 62,
  };
}

// --- KOMPONENT -------------------------------------------------------------

export function CardPreview3D({ material, color, design, customImage }: CardPreview3DProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
  const [isFlipped, setIsFlipped] = useState(false);

  const isMetal = material === "metal";

  const baseHex = useMemo(() => {
    if (color?.startsWith("#")) return color;
    return LEGACY_COLORS[color?.toLowerCase()] ?? (isMetal ? "#2a2c2f" : "#1b1b1d");
  }, [color, isMetal]);

  const finish = useMemo(() => buildFinish(baseHex), [baseHex]);

  // --- MUSHANTERING (Tilt) ---
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();

    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;

    setRotate({ x: -yPct * 15, y: xPct * 15 });
    setGlare({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
      opacity: 1,
    });
  };

  const handleReset = () => {
    setRotate({ x: 0, y: 0 });
    setGlare((prev) => ({ ...prev, opacity: 0 }));
  };

  const textClass = finish.needsDarkText ? "text-[#141518]" : "text-nordic-secondary";

  // Metallkortet är 1,20 mm, plast 0,86 mm — skillnaden syns som kantens tjocklek.
  const edgeThickness = ((isMetal ? 1.2 : 0.86) / CARD_W) * 100;

  const faceStyle: CSSProperties = {
    width: "100%",
    height: "100%",
    borderRadius: CARD_RADIUS_CSS,
    overflow: "hidden",
    position: "relative",
    boxShadow: isMetal
      ? `0 ${edgeThickness * 0.9}% 0 -0.15% ${finish.edgeColor}, 0 18px 40px -12px rgba(0,0,0,0.55)`
      : `0 ${edgeThickness * 0.9}% 0 -0.15% ${finish.edgeColor}, 0 12px 30px -10px rgba(0,0,0,0.45)`,
  };

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      <div className="perspective-1000 w-full flex items-center justify-center py-4 select-none">

        {/* SIZE CONTAINER — exakt ID-1-proportion */}
        <div
          className="relative w-[85%] md:w-[90%] max-w-[600px]"
          style={{ aspectRatio: `${CARD_W} / ${CARD_H}` }}
        >
          {/* TILT CONTAINER */}
          <div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleReset}
            className="w-full h-full transition-transform duration-100 ease-out cursor-grab active:cursor-grabbing"
            style={{
              transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
              transformStyle: "preserve-3d",
            }}
          >
            <ReactCardFlip
              isFlipped={isFlipped}
              flipDirection="horizontal"
              containerStyle={{ width: "100%", height: "100%" }}
            >
              {/* ================= FRAMSIDA ================= */}
              <div style={{ ...faceStyle, ...(isMetal ? finish.brushed : finish.matte) }}>
                {isMetal ? (
                  <MetalFront
                    finish={finish}
                    customImage={customImage}
                    glare={glare}
                    textClass={textClass}
                    design={design}
                  />
                ) : (
                  <PlasticFront finish={finish} glare={glare} design={design} />
                )}
                <Rim />
              </div>

              {/* ================= BAKSIDA =================
                  Båda produkterna trycks på EN sida. Baksidan är alltså
                  otryckt — bar borstad metall respektive blank mattsvart PVC.
                  Ingen NFC-ikon här: den finns inte på det fysiska kortet. */}
              <div style={{ ...faceStyle, ...(isMetal ? finish.brushed : finish.matte) }}>
                <Glare glare={glare} isMetal={isMetal} />
                <Rim />
              </div>
            </ReactCardFlip>
          </div>
        </div>
      </div>

      <button
        onClick={() => setIsFlipped(!isFlipped)}
        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-3 rounded-full text-sm font-medium transition-colors text-gray-300"
      >
        <RotateCw size={18} className={`transition-transform duration-500 ${isFlipped ? "rotate-180" : ""}`} />
        Vänd kortet
      </button>

      <p className="text-center text-[11px] leading-relaxed text-gray-500 max-w-sm px-4">
        {isFlipped
          ? "Baksidan är otryckt — korten trycks på framsidan."
          : isMetal
            ? "Illustration. Trycket sitter på en glansig panel (82 × 51 mm) med en synlig borstad metallram runt om."
            : "Illustration. Plastkortet levereras i AvyraCards standarddesign."}
      </p>
    </div>
  );
}

// --- DELKOMPONENTER --------------------------------------------------------

/**
 * Metallkortets framsida: borstad ram (yttre ytan) + glansig tryckpanel.
 * Utan uppladdad bild trycks panelen i samma kulör som metallen, precis som
 * leverantören gör — skillnaden mot ramen blir då glans, inte färg.
 */
function MetalFront({
  finish,
  customImage,
  glare,
  textClass,
  design,
}: {
  finish: Finish;
  customImage?: string | null;
  glare: { x: number; y: number; opacity: number };
  textClass: string;
  design: "minimal" | "qr";
}) {
  const panelStyle: CSSProperties = {
    position: "absolute",
    top: `${PANEL_INSET_Y}%`,
    bottom: `${PANEL_INSET_Y}%`,
    left: `${PANEL_INSET_X}%`,
    right: `${PANEL_INSET_X}%`,
    borderRadius: PANEL_RADIUS_CSS,
    overflow: "hidden",
    // Panelen ligger ovanpå metallen — mjuk skugga mot ramen ger rätt djup.
    boxShadow: `0 0 0 0.5px ${shade(finish.hsl, -14, 0, 0.55)}, 0 1px 3px rgba(0,0,0,0.35)`,
    ...(customImage
      ? { backgroundImage: `url(${customImage})`, backgroundSize: "cover", backgroundPosition: "center" }
      : finish.gloss),
  };

  return (
    <>
      {/* Ramens egen glans, dämpad (matt borstad yta) */}
      <Glare glare={glare} isMetal />

      <div style={panelStyle}>
        {/* Glansskiktet ovanpå panelen — PVC:n är blank till skillnad från ramen */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(158deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.04) 26%, rgba(255,255,255,0) 48%, rgba(255,255,255,0.10) 100%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 70% 45% at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 62%)`,
            opacity: glare.opacity * 0.9,
            transition: "opacity 0.1s ease",
          }}
        />

        {!customImage && (
          <div className={`relative z-10 w-full h-full flex flex-col justify-between p-[6%] ${textClass}`}>
            <div className="flex justify-end">
              <div className="flex items-center gap-2 opacity-50">
                <Wifi className="w-4 h-4 md:w-5 md:h-5 rotate-90" />
                <span className="text-[10px] md:text-xs font-mono tracking-widest uppercase">NFC</span>
              </div>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-[10px] md:text-xs uppercase tracking-[0.25em] opacity-45">
                Din design här
              </span>
              {design === "qr" && (
                <div className="bg-white p-1.5 rounded-lg shadow-sm">
                  <QrCode size={28} className="text-[#141518]" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/**
 * Plastkortets framsida. Alla plastkort är identiska och bär AvyraCards
 * standarddesign — därför ingen kundtext och ingen uppladdning här.
 */
function PlasticFront({
  finish,
  glare,
  design,
}: {
  finish: Finish;
  glare: { x: number; y: number; opacity: number };
  design: "minimal" | "qr";
}) {
  const textClass = finish.needsDarkText ? "text-[#141518]" : "text-nordic-secondary";

  return (
    <>
      <Glare glare={glare} isMetal={false} />

      <div className={`relative z-10 w-full h-full p-[7%] flex flex-col justify-between ${textClass}`}>
        <div className="flex justify-end items-start">
          <div className="flex items-center gap-2 opacity-55">
            <Wifi className="w-5 h-5 md:w-6 md:h-6 rotate-90" />
            <span className="text-xs font-mono tracking-widest uppercase">NFC</span>
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div>
            {/* Riktiga varumärkeslockupen — samma bild som Wallet-passet använder.
                Ordbilden har egen typografi, därför bild och inte CSS-text. */}
            <Image
              src="/avyra-logo.png"
              alt="AvyraCards"
              width={512}
              height={312}
              className={`w-[34%] min-w-[92px] h-auto ${finish.needsDarkText ? "invert" : ""}`}
              priority={false}
            />
            <div className="text-[10px] md:text-xs opacity-55 mt-[4%] tracking-[0.2em] uppercase">
              avyracards.se
            </div>
          </div>

          {design === "qr" && (
            <div className="bg-white p-1.5 md:p-2 rounded-xl shadow-sm">
              <QrCode size={32} className="text-[#141518] md:w-10 md:h-10" />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/**
 * Ljusreflex. Metall får ett smalt, utdraget band (anisotropiskt, som borstad yta),
 * plast en bred och svag satinsheen.
 */
function Glare({ glare, isMetal }: { glare: { x: number; y: number; opacity: number }; isMetal: boolean }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none z-20"
      style={{
        background: isMetal
          ? `radial-gradient(ellipse 85% 16% at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.40) 0%, rgba(255,255,255,0) 70%)`
          : `radial-gradient(ellipse 55% 45% at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 65%)`,
        opacity: glare.opacity,
        transition: "opacity 0.1s ease",
      }}
    />
  );
}

/** Tunn ytterkant som ger kortet en definierad avslutning. */
function Rim() {
  return (
    <div
      className="absolute inset-0 pointer-events-none z-30"
      style={{
        borderRadius: CARD_RADIUS_CSS,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.10), inset 0 -1px 0 rgba(0,0,0,0.25)",
      }}
    />
  );
}
