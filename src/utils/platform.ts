import { Instagram, Linkedin, LinkIcon, Mail, Twitter, Youtube } from "lucide-react";
import { ComponentType, SVGProps } from "react";

export type PlatformKey = "instagram" | "linkedin" | "twitter" | "youtube" | "email" | "generic";

export function platformFromUrl(url: string): PlatformKey {
  const lower = url.toLowerCase();
  if (lower.includes("instagram")) return "instagram";
  if (lower.includes("linkedin")) return "linkedin";
  if (lower.includes("twitter") || lower.includes("x.com")) return "twitter";
  if (lower.includes("youtube") || lower.includes("youtu.be")) return "youtube";
  if (lower.startsWith("mailto:")) return "email";
  return "generic";
}

const iconMap: Record<PlatformKey, ComponentType<SVGProps<SVGSVGElement>>> = {
  instagram: Instagram,
  linkedin: Linkedin,
  twitter: Twitter,
  youtube: Youtube,
  email: Mail,
  generic: LinkIcon,
};

export function getPlatformIcon(url: string) {
  return iconMap[platformFromUrl(url)];
}
