import { Link as LinkModel } from "@prisma/client";
import { ThemeMode } from "@/types/theme";

// --- TYPER ---

export interface ProfileAction {
  type: "phone" | "email" | "website" | "booking" | "landline" | "vcard";
  label: string;
  value: string;
  url: string;
  iconKey: string;
  primary?: boolean;
}

export interface MappedProfileData {
  // Grundläggande
  displayName: string;
  image: string | null;
  headline: string | null;
  location: string | null;
  
  // Business specifikt (kan vara null i social)
  jobTitle: string | null;
  companyName: string | null;
  
  // Listor
  actions: ProfileAction[]; 
  links: LinkModel[];
  
  // Meta
  mode: ThemeMode;
}

// --- MAPPER FUNKTION ---
export function getProfileData(user: any, mode: ThemeMode): MappedProfileData {
  
  const isBusiness = mode === "BUSINESS";

  // 1. BILD & TEXT
  // Prioritera Business-bild om vi är i business-läge, annars fallback till vanlig
  const image = isBusiness 
    ? (user.businessAvatarUrl || user.avatarUrl) 
    : user.avatarUrl;

  const displayName = user.name || user.username || "";
  
  const headline = isBusiness 
    ? (user.businessHeadline || user.jobTitle) 
    : user.bio;

  // 2. SKAPA ACTION-LISTAN
  const actions: ProfileAction[] = [];

  if (isBusiness) {
    // --- BUSINESS ACTIONS ---
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
        primary: true
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
    // Lägg till fler business-fält här i framtiden (t.ex. Landline)

  } else {
    // --- SOCIAL ACTIONS ---
    if (user.phoneNumber) {
      actions.push({ 
        type: "phone", 
        label: "", 
        value: user.phoneNumber, 
        url: `tel:${user.phoneNumber}`, 
        iconKey: "phone" 
      });
    }
    if (user.contactEmail) {
      actions.push({ 
        type: "email", 
        label: "", 
        value: user.contactEmail, 
        url: `mailto:${user.contactEmail}`, 
        iconKey: "email" 
      });
    }
  }

  // 3. FILTRERA LÄNKAR
  // Hanterar både råa Prisma-objekt och objekt från editorn
  const rawLinks = Array.isArray(user.links) ? user.links : [];
  
  const links = rawLinks.filter((l: any) => {
      // Om 'mode' saknas på länken, anta SOCIAL (för bakåtkompatibilitet)
      const linkMode = l.mode || "SOCIAL";
      // Filtrera även på isActive om egenskapen finns (från databas), 
      // men i editorn (preview) vill vi kanske se alla
      const isActive = l.isActive !== false; 
      
      return linkMode === mode && isActive;
  });

  return {
    mode,
    displayName,
    image: image || null,
    headline: headline || null,
    location: user.location || null,
    jobTitle: user.jobTitle || null,
    companyName: user.companyName || null,
    actions,
    links
  };
}