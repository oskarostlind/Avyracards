/**
 * Texter för push-notiser om analytics-händelser.
 *
 * Notiserna skickas från servern utan request-kontext (vi vet inte vilket språk
 * mottagarens telefon står på), så de är på svenska precis som tidigare. Det
 * som är nytt är att KÄLLAN vävs in i meningen: "Någon från Instagram har
 * öppnat din profil." säger mycket mer än "Någon har öppnat din profil.".
 *
 * Modulen är avsiktligt ren (inga imports, inga sidoeffekter) så att
 * formuleringarna kan enhetstestas.
 */

/**
 * Hur källan formuleras i meningen.
 *  - "from": källan är en avsändare  -> "Någon FRÅN Instagram har öppnat ..."
 *  - "via":  källan är en kanal      -> "Någon har öppnat din profil VIA ditt NFC-kort."
 *  - saknas: generisk text utan källa (direct/internal/okänd).
 */
type SourcePhrase = { style: "from"; label: string } | { style: "via"; label: string };

/**
 * Nycklarna är de lagrade `source`-värdena från src/lib/analytics/events.ts,
 * gemener. Ändra inte nycklarna utan backfill — värdena i databasen styr.
 */
const SOURCE_PHRASES: Record<string, SourcePhrase> = {
  // Fysiska och digitala kanaler
  nfc: { style: "via", label: "ditt NFC-kort" },
  qr: { style: "via", label: "din QR-kod" },
  wallet: { style: "via", label: "din digitala plånbok" },
  apple_wallet: { style: "via", label: "Apple Wallet" },
  google_wallet: { style: "via", label: "Google Wallet" },
  ios_widget: { style: "via", label: "hemskärms-widgeten" },
  email_signature: { style: "via", label: "din e-postsignatur" },
  link_bio: { style: "via", label: "länken i din bio" },

  // Referrer-härledda källor
  instagram: { style: "from", label: "Instagram" },
  facebook: { style: "from", label: "Facebook" },
  linkedin: { style: "from", label: "LinkedIn" },
  "x (twitter)": { style: "from", label: "X" },
  tiktok: { style: "from", label: "TikTok" },
  youtube: { style: "from", label: "YouTube" },
  snapchat: { style: "from", label: "Snapchat" },
  pinterest: { style: "from", label: "Pinterest" },
  google: { style: "from", label: "Google" },
  bing: { style: "from", label: "Bing" },
  duckduckgo: { style: "from", label: "DuckDuckGo" },
  webbplats: { style: "from", label: "en annan webbplats" },

  // Medvetet utan källa:
  //   direct   – vi vet ingenting, generisk text är ärligare
  //   internal – trafik inifrån sajten, inte intressant att lyfta i en notis
  //   vcard    – beskriver handlingen (spara kontakt), inte varifrån besökaren kom
};

export function getSourcePhrase(source: string | null | undefined): SourcePhrase | null {
  const key = source?.trim().toLowerCase();
  if (!key) return null;
  return SOURCE_PHRASES[key] ?? null;
}

export type AnalyticsNotificationKind = "view" | "click" | "vcard";

export type AnalyticsNotificationCopy = {
  title: string;
  body: string;
};

const TITLES: Record<AnalyticsNotificationKind, string> = {
  view: "Profilvisning",
  click: "Länkklick",
  vcard: "Sparade kontakt",
};

/**
 * Meningsmallar per händelsetyp.
 *  - `plain`: utan källa
 *  - `from`:  "{phrase}" sätts in mitt i meningen
 *  - `via`:   "{phrase}" hängs på slutet
 */
const TEMPLATES: Record<
  AnalyticsNotificationKind,
  { plain: string; from: string; via: string }
> = {
  view: {
    plain: "Någon har öppnat din profil.",
    from: "Någon från {label} har öppnat din profil.",
    via: "Någon har öppnat din profil via {label}.",
  },
  click: {
    plain: "Någon klickade på en länk på din profil.",
    from: "Någon från {label} klickade på en länk på din profil.",
    via: "Någon klickade på en länk på din profil via {label}.",
  },
  vcard: {
    plain: "Någon sparade ditt visitkort.",
    from: "Någon från {label} sparade ditt visitkort.",
    via: "Någon sparade ditt visitkort via {label}.",
  },
};

/** VIEW/CLICK + källa -> vilken sorts notis det är. */
export function resolveNotificationKind(
  type: "VIEW" | "CLICK",
  source: string | null | undefined,
): AnalyticsNotificationKind {
  if (type === "VIEW") return "view";
  return source?.trim().toLowerCase() === "vcard" ? "vcard" : "click";
}

/**
 * Bygger titel och brödtext för en analytics-push.
 *
 * Okända källor faller tillbaka på den generiska texten — vi hittar hellre på
 * ingenting än sätter råa databasvärden i en notis.
 */
export function buildAnalyticsNotificationCopy(
  type: "VIEW" | "CLICK",
  source: string | null | undefined,
): AnalyticsNotificationCopy {
  const kind = resolveNotificationKind(type, source);
  const templates = TEMPLATES[kind];
  const phrase = getSourcePhrase(source);

  const body = phrase
    ? templates[phrase.style].replace("{label}", phrase.label)
    : templates.plain;

  return { title: TITLES[kind], body };
}
