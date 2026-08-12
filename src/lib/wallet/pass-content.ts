/**
 * En källa till sanning för VAD ett wallet-pass visar.
 *
 * Bakgrund: Apple- och Google-routerna byggde tidigare varsin egen tolkning av
 * användaren. De gled isär på tre punkter:
 *
 *  - Apple visade `user.bio` som titel, Google `user.jobTitle || user.bio`.
 *  - Apple skrev hårdkodat "avyracards.com/u/..." i passet trots att domänen
 *    är avyracards.se — Google hade en normalisering, Apple inte.
 *  - Båda använde alltid `user.avatarUrl`, även för konton som kör
 *    BUSINESS-läge och därmed visar `businessAvatarUrl` på den publika sidan.
 *    Passet kunde alltså visa en annan bild än profilen det leder till.
 *
 * Reglerna här speglar `getProfileData()` i profile-mapper, så att passet och
 * den publika profilen alltid visar samma sak.
 */

export type WalletPassUser = {
  id: string;
  username: string | null;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
  businessAvatarUrl: string | null;
  businessHeadline: string | null;
  jobTitle: string | null;
  profileMode: string | null;
};

export type WalletPassContent = {
  /** Namnet högst upp på passet. */
  displayName: string;
  /** Rad två: titel/headline, med samma fallback som publika profilen. */
  headline: string;
  /** Länk som QR-koden pekar på (med analytics-källa). */
  profileUrl: string;
  /** Läsbar länk som visas i passet (utan query-parametrar). */
  displayUrl: string;
  /** Bild att använda som logotyp/thumbnail, eller null. */
  imageUrl: string | null;
};

export const WALLET_ANALYTICS_SOURCE = "wallet";
const CANONICAL_HOST = "avyracards.se";
const LEGACY_HOSTS = ["avyracards.com"];
const DEFAULT_BASE_URL = `https://${CANONICAL_HOST}`;

/**
 * NEXT_PUBLIC_BASE_URL har historiskt pekat på .com i vissa miljöer. En QR-kod
 * är tryckt/sparad och kan inte rättas i efterhand, så domänen normaliseras
 * alltid till den kanoniska innan den hamnar i ett pass.
 */
export function normalizeWalletBaseUrl(baseUrl?: string | null): string {
  const raw = (baseUrl || "").trim();
  if (!raw) return DEFAULT_BASE_URL;

  let normalized = raw.replace(/\/+$/, "");
  for (const legacy of LEGACY_HOSTS) {
    normalized = normalized.split(legacy).join(CANONICAL_HOST);
  }

  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`;
  }

  return normalized || DEFAULT_BASE_URL;
}

export function isBusinessMode(user: Pick<WalletPassUser, "profileMode">): boolean {
  return user.profileMode === "BUSINESS";
}

/** Samma fallback-kedja som profile-mapper använder för profilbilden. */
export function walletPassImageUrl(
  user: Pick<WalletPassUser, "profileMode" | "avatarUrl" | "businessAvatarUrl">
): string | null {
  const image = isBusinessMode(user)
    ? user.businessAvatarUrl || user.avatarUrl
    : user.avatarUrl;

  return image || null;
}

/**
 * Google Wallet hämtar bilden själv från en publik URL och klarar därför inte
 * base64-avatarer (som `/api/profile` tillåter). Apple läser in bufferten och
 * klarar inte heller data-URI:er via fetch.
 */
export function walletRemoteImageUrl(
  user: Pick<WalletPassUser, "profileMode" | "avatarUrl" | "businessAvatarUrl">
): string | null {
  const image = walletPassImageUrl(user);
  return image && /^https?:\/\//i.test(image) ? image : null;
}

export function buildWalletPassContent(
  user: WalletPassUser,
  baseUrl?: string | null
): WalletPassContent {
  const base = normalizeWalletBaseUrl(baseUrl);
  const username = user.username || "";
  const business = isBusinessMode(user);

  const headline = business
    ? user.businessHeadline || user.jobTitle || user.bio
    : user.bio || user.jobTitle;

  const host = base.replace(/^https?:\/\//i, "");

  return {
    displayName: user.name || username || "Användare",
    headline: headline || "Digital Profil",
    profileUrl: `${base}/u/${username}?source=${WALLET_ANALYTICS_SOURCE}`,
    displayUrl: `${host}/u/${username}`,
    imageUrl: walletRemoteImageUrl(user),
  };
}

/**
 * Fälten som påverkar hur ett wallet-pass ser ut. Används för att avgöra om en
 * profilsparning behöver trigga en synk mot Google Wallet — de allra flesta
 * sparningar (tema, länkar, redirect) gör inte det.
 */
export const WALLET_PASS_FIELDS = [
  "name",
  "username",
  "bio",
  "avatarUrl",
  "businessAvatarUrl",
  "businessHeadline",
  "jobTitle",
  "profileMode",
] as const;

export const WALLET_PASS_USER_SELECT = {
  id: true,
  username: true,
  name: true,
  bio: true,
  avatarUrl: true,
  businessAvatarUrl: true,
  businessHeadline: true,
  jobTitle: true,
  profileMode: true,
} as const;
