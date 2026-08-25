import { ThemeMode, CustomThemeSettings, defaultSettings } from "@/types/theme";
import { resolveLinkIconSlug } from "@/lib/link-icons";
import { coerceUrl } from "@/utils/normalize-url";
import { normalizeHexColor } from "@/utils/color";

// --- TYPER ---

export interface ProfileAction {
  type: "phone" | "email" | "website" | "booking" | "landline" | "vcard";
  label: string;
  value: string;
  url: string;
  iconKey: string;
  primary?: boolean;
}

/**
 * Länken som den publika profilen och previewn faktiskt renderar.
 *
 * Skiljer sig från Prisma-modellen på tre punkter, och det är meningen:
 *  - `href` är färdignormaliserad, så ingen komponent behöver gissa protokoll
 *  - `iconSlug` är färdigupplöst (manuell override eller auto-detektering)
 *  - `customColor` är validerad hex eller null — aldrig skräp från databasen
 */
export interface MappedLink {
  id: string;
  title: string;
  url: string;
  /** Klickbar adress med protokoll. */
  href: string;
  /** Sluggen användaren valt manuellt. null = automatisk. */
  icon: string | null;
  /** Slutgiltig ikon-slug att rendera. */
  iconSlug: string;
  /** Premium: egen färg för just den här knappen. */
  customColor: string | null;
  mode: string;
  order: number;
  isActive: boolean;
}

export interface MappedProfileData {
  username: string; // NYTT: Behövs för vCard URL
  displayName: string;
  image: string | null;
  headline: string | null;
  location: string | null;

  jobTitle: string | null;
  companyName: string | null;

  actions: ProfileAction[];
  links: MappedLink[];

  mode: ThemeMode;
  showSaveContact: boolean; // NYTT: Skickar med toggle-status
}

// --- MAPPER FUNKTION ---
export function getProfileData(user: any, mode: ThemeMode): MappedProfileData {
  
  const isBusiness = mode === "BUSINESS";

  // Läs av tema-inställningar för att se om knappen ska visas
  const savedSettings = isBusiness ? user.businessThemeSettings : user.themeSettings;
  const themeConfig: CustomThemeSettings = { ...defaultSettings, ...(savedSettings || {}) };
  const showSaveContact = themeConfig.showSaveContact !== false; // Default true

  const image = isBusiness 
    ? (user.businessAvatarUrl || user.avatarUrl) 
    : user.avatarUrl;

  const displayName = user.name || user.username || "";
  
  const headline = isBusiness 
    ? (user.businessHeadline || user.jobTitle) 
    : user.bio;

  const actions: ProfileAction[] = [];

  // Lägg till vCard-knappen FÖRST om den är aktiverad (Hamnar överst)
  if (showSaveContact) {
      actions.push({
          type: "vcard",
          label: "Spara Kontakt",
          value: "vcard",
          url: `/api/vcard/${user.username}?mode=${mode.toLowerCase()}`, // Peka mot vår nya route
          iconKey: "contact", // En ny ikon-nyckel, kanske bäst att mappa till typ Save/User-ikon i social-icons.tsx
          primary: true
      });
  }

  if (isBusiness) {
    if (user.businessPhone) {
      actions.push({
        type: "phone",
        label: "Ring",
        value: user.businessPhone,
        url: `tel:${user.businessPhone}`,
        iconKey: "phone"
      });
    }
    if (user.businessEmail) {
      actions.push({
        type: "email",
        label: "Maila",
        value: user.businessEmail,
        url: `mailto:${user.businessEmail}`,
        iconKey: "email"
      });
    }
    if (user.bookingUrl) {
      actions.push({
        type: "booking",
        label: "Boka möte",
        value: user.bookingUrl,
        url: user.bookingUrl.startsWith("http") ? user.bookingUrl : `https://${user.bookingUrl}`,
        iconKey: "calendar",
        primary: false
      });
    }
    if (user.companyWebsite) {
      actions.push({
        type: "website",
        label: "Hemsida",
        value: user.companyWebsite,
        url: user.companyWebsite.startsWith("http") ? user.companyWebsite : `https://${user.companyWebsite}`,
        iconKey: "website"
      });
    }

  } else {
    if (user.phoneNumber) {
      actions.push({ 
        type: "phone", 
        label: "Ring", 
        value: user.phoneNumber, 
        url: `tel:${user.phoneNumber}`, 
        iconKey: "phone" 
      });
    }
    if (user.contactEmail) {
      actions.push({ 
        type: "email", 
        label: "Maila", 
        value: user.contactEmail, 
        url: `mailto:${user.contactEmail}`, 
        iconKey: "email" 
      });
    }
  }

  const rawLinks = Array.isArray(user.links) ? user.links : [];

  const links: MappedLink[] = rawLinks
    .filter((l: any) => {
      const linkMode = l.mode || "SOCIAL";
      const isActive = l.isActive !== false;

      return linkMode === mode && isActive;
    })
    // Ikon och färg löses ut här, en gång, i stället för i varje komponent.
    // Publik profil, dashboard-preview och temaredigeraren ska rita likadant.
    .map((l: any): MappedLink => {
      const title = l.title || "";
      const url = l.url || "";
      return {
        id: l.id,
        title,
        url,
        href: coerceUrl(url) || "/",
        icon: l.icon ?? null,
        iconSlug: resolveLinkIconSlug({ url, title, icon: l.icon ?? null }),
        customColor: normalizeHexColor(l.customColor),
        mode: l.mode || "SOCIAL",
        order: typeof l.order === "number" ? l.order : 0,
        isActive: l.isActive !== false,
      };
    });

  return {
    mode,
    username: user.username,
    displayName,
    image: image || null,
    headline: headline || null,
    location: user.location || null,
    jobTitle: user.jobTitle || null,
    companyName: user.companyName || null,
    actions,
    links,
    showSaveContact
  };
}