import {
  Instagram,
  Linkedin,
  Twitter,
  Facebook,
  Github,
  Youtube,
  Globe,
  Mail,
  Link as LinkIcon,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Video,
  Music,
  Twitch,
  MessageCircle,
  Smartphone,
  Briefcase
  // LucideProps <-- BORTTAGEN (Orsakade felet)
} from "lucide-react";
import React from "react";

// 1. MAPPNING: Koppla nyckelord till komponenter
export const iconMap = {
  // Social Media
  instagram: Instagram,
  linkedin: Linkedin,
  twitter: Twitter,
  x: Twitter,
  facebook: Facebook,
  github: Github,
  youtube: Youtube,
  twitch: Twitch,
  tiktok: Music,
  spotify: Music,
  whatsapp: MessageCircle,
  snapchat: MessageCircle,
  discord: MessageCircle,

  // Business & Kontakt
  email: Mail,
  phone: Phone,
  mobile: Smartphone,
  website: Globe,
  booking: Calendar, // <-- LÄGG TILL DENNA!
  calendar: Calendar,
  document: FileText,
  meeting: Video,
  location: MapPin,
  job: Briefcase,
  
  // Fallback
  default: LinkIcon,
} as const;

export type IconKey = keyof typeof iconMap;

// 2. DETEKTIVEN: Analysera URL eller text
export function detectIconKey(urlOrTitle?: string | null): IconKey {
  if (!urlOrTitle) return "default";
  
  const lower = urlOrTitle.toLowerCase().trim();

  // Protokoll
  if (lower.startsWith("mailto:")) return "email";
  if (lower.startsWith("tel:")) return "phone";

  // Domäner & Nyckelord
  if (lower.includes("instagram")) return "instagram";
  if (lower.includes("linkedin")) return "linkedin";
  if (lower.includes("twitter") || lower.includes("x.com")) return "twitter";
  if (lower.includes("facebook")) return "facebook";
  if (lower.includes("github")) return "github";
  if (lower.includes("youtube") || lower.includes("youtu.be")) return "youtube";
  if (lower.includes("twitch")) return "twitch";
  if (lower.includes("tiktok")) return "tiktok";
  if (lower.includes("spotify")) return "spotify";
  if (lower.includes("whatsapp")) return "whatsapp";
  if (lower.includes("discord")) return "discord";
  
  // Business
  if (lower.includes("calendly") || lower.includes("bokadirekt") || lower.includes("boka")) return "calendar";
  if (lower.includes("zoom") || lower.includes("teams") || lower.includes("meet.google")) return "meeting";
  if (lower.includes("drive.google") || lower.includes("dropbox") || lower.includes(".pdf")) return "document";
  if (lower.includes("@") && !lower.startsWith("http")) return "email"; 

  // Generella
  if (lower.includes("web") || lower.includes("hemsida") || lower.includes("site")) return "website";

  return "default";
}

// 3. KOMPONENTEN
interface SocialIconProps extends Omit<React.ComponentProps<"svg">, "ref"> {
  url?: string | null;
  fallbackIcon?: IconKey;
  size?: number | string;       
  strokeWidth?: number | string;
}

export function SocialIcon({ url, fallbackIcon = "default", className, ...props }: SocialIconProps) {
  const iconKey = url ? detectIconKey(url) : fallbackIcon;
  const IconComponent = iconMap[iconKey];

  return <IconComponent className={className} {...(props as any)} />;
}