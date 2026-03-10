"use client";

import { FormEvent, useState } from "react";
import { z } from "zod";
import { SocialIcon, type IconKey } from "@/components/icons/social-icons";

const schema = z.object({
  label: z.string().min(1).max(60),
  url: z.string().url(),
});

interface AddLinkFormProps {
  onCreated: () => Promise<void> | void;
  mode: "SOCIAL" | "BUSINESS";
}

type PlatformId = "CUSTOM" | "INSTAGRAM" | "SNAPCHAT" | "TIKTOK" | "FACEBOOK" | "SPOTIFY" | "WHATSAPP" | "LINKEDIN" | "CALENDLY" | "WEBSITE" | "GITHUB" | "TWITTER" | "YOUTUBE";

interface Platform {
  id: PlatformId;
  name: string;
  iconKey: IconKey;
  type: "A" | "B"; // A = Användarnamn, B = Hela länken
  prefix?: string; 
  displayPrefix?: string; 
  placeholder: string;
  modes: ("SOCIAL" | "BUSINESS")[];
}

const PLATFORMS: Platform[] = [
  { id: "CUSTOM", name: "Egen länk", iconKey: "default", type: "B", placeholder: "https://...", modes: ["SOCIAL", "BUSINESS"] },
  // SOCIAL QUICK-ADDS
  { id: "INSTAGRAM", name: "Instagram", iconKey: "instagram", type: "A", prefix: "https://instagram.com/", displayPrefix: "instagram.com/", placeholder: "användarnamn", modes: ["SOCIAL"] },
  { id: "SNAPCHAT", name: "Snapchat", iconKey: "snapchat", type: "A", prefix: "https://snapchat.com/add/", displayPrefix: "snapchat.com/add/", placeholder: "användarnamn", modes: ["SOCIAL"] },
  { id: "TIKTOK", name: "TikTok", iconKey: "tiktok", type: "A", prefix: "https://tiktok.com/@", displayPrefix: "tiktok.com/@", placeholder: "användarnamn", modes: ["SOCIAL"] },
  { id: "FACEBOOK", name: "Facebook", iconKey: "facebook", type: "B", placeholder: "Klistra in hela länken", modes: ["SOCIAL"] },
  { id: "SPOTIFY", name: "Spotify", iconKey: "spotify", type: "B", placeholder: "Länk till spellista/profil", modes: ["SOCIAL"] },
  { id: "WHATSAPP", name: "WhatsApp", iconKey: "whatsapp", type: "A", prefix: "https://wa.me/", displayPrefix: "wa.me/", placeholder: "Telefonnummer (ex. 4670...)", modes: ["SOCIAL"] },
  // BUSINESS QUICK-ADDS
  { id: "LINKEDIN", name: "LinkedIn", iconKey: "linkedin", type: "B", placeholder: "Klistra in hela din LinkedIn-länk", modes: ["BUSINESS"] },
  { id: "CALENDLY", name: "Calendly", iconKey: "calendar", type: "A", prefix: "https://calendly.com/", displayPrefix: "calendly.com/", placeholder: "användarnamn", modes: ["BUSINESS"] },
  { id: "WEBSITE", name: "Hemsida", iconKey: "website", type: "B", placeholder: "https://www...", modes: ["BUSINESS"] },
  { id: "GITHUB", name: "GitHub", iconKey: "github", type: "A", prefix: "https://github.com/", displayPrefix: "github.com/", placeholder: "användarnamn", modes: ["BUSINESS"] },
  { id: "TWITTER", name: "X (Twitter)", iconKey: "twitter", type: "A", prefix: "https://x.com/", displayPrefix: "x.com/", placeholder: "användarnamn", modes: ["BUSINESS"] },
  { id: "YOUTUBE", name: "YouTube", iconKey: "youtube", type: "B", placeholder: "Klistra in hela din YouTube-länk", modes: ["BUSINESS"] },
];

export function AddLinkForm({ onCreated, mode }: AddLinkFormProps) {
  const availablePlatforms = PLATFORMS.filter((p) => p.modes.includes(mode));
  
  const [selectedPlatformId, setSelectedPlatformId] = useState<PlatformId>("CUSTOM");
  const [form, setForm] = useState<{ label: string; url: string }>({
    label: "",
    url: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPlatform = availablePlatforms.find((p) => p.id === selectedPlatformId) || availablePlatforms[0];

  const handlePlatformChange = (id: PlatformId) => {
    setSelectedPlatformId(id);
    setError(null);
    setForm({ label: "", url: "" });
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    let finalLabel = form.label;
    let finalUrl = form.url.trim();

    // Hantera logik beroende på plattform
    if (selectedPlatform.id !== "CUSTOM") {
      finalLabel = selectedPlatform.name;

      if (selectedPlatform.type === "A" && selectedPlatform.prefix) {
        let cleanHandle = finalUrl
          .replace(selectedPlatform.prefix, "")
          .replace(selectedPlatform.displayPrefix || "", "");
        
        if (cleanHandle.startsWith("@")) {
          cleanHandle = cleanHandle.substring(1);
        }
        finalUrl = `${selectedPlatform.prefix}${cleanHandle}`;
      }
    }

    // Auto-fixa saknad https:// för type B eller Custom
    if (finalUrl && !finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
      finalUrl = `https://${finalUrl}`;
    }

    const parsed = schema.safeParse({ label: finalLabel, url: finalUrl });
    if (!parsed.success) {
      setError("Kontrollera inmatningen. Se till att det blir en giltig länk.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...parsed.data, mode }),
      });

      if (!response.ok) {
        try {
          const data = (await response.json()) as { error?: string };
          setError(data.error ?? "Kunde inte spara länk");
        } catch {
          setError("Kunde inte spara länk");
        }
        return;
      }

      setForm({ label: "", url: "" });
      setSelectedPlatformId("CUSTOM");
      await onCreated();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Snabbvals-piller med Ikoner */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {availablePlatforms.map((platform) => (
          <button
            key={platform.id}
            type="button"
            onClick={() => handlePlatformChange(platform.id)}
            className={`shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              selectedPlatformId === platform.id
                ? "bg-nordic-secondary text-nordic-primary"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {platform.iconKey !== "default" && (
              <SocialIcon 
                fallbackIcon={platform.iconKey} 
                size={14} 
                className={selectedPlatformId === platform.id ? "text-nordic-primary" : "text-slate-400"} 
              />
            )}
            {platform.name}
          </button>
        ))}
      </div>

      {selectedPlatformId === "CUSTOM" && (
        <div className="space-y-2 animate-in fade-in duration-200">
          <label className="block text-sm font-medium text-slate-200">
            Länktitel
          </label>
          <input
            type="text"
            value={form.label}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, label: e.target.value }))
            }
            placeholder={mode === "BUSINESS" ? "Ex. Min Portfolio" : "Ex. Reseblogg"}
            className="w-full rounded-xl border border-nordic-highlight/40 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      )}

      <div className="space-y-2 animate-in fade-in duration-200">
        <label className="block text-sm font-medium text-slate-200">
          {selectedPlatformId === "CUSTOM" || selectedPlatform.type === "B" 
            ? "URL" 
            : "Användarnamn / Länk"}
        </label>
        
        <div className="flex overflow-hidden rounded-xl border border-nordic-highlight/40 bg-slate-900/60 focus-within:ring-2 focus-within:ring-purple-500">
          {selectedPlatform.type === "A" && selectedPlatform.displayPrefix && (
            <span className="flex items-center bg-slate-800/50 pl-3 pr-1 text-sm text-slate-400 select-none">
              {selectedPlatform.displayPrefix}
            </span>
          )}
          <input
            type={selectedPlatformId === "CUSTOM" || selectedPlatform.type === "B" ? "url" : "text"}
            value={form.url}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, url: e.target.value }))
            }
            placeholder={selectedPlatform.placeholder}
            className="w-full bg-transparent px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
        </div>
      </div>

      {error && <p className="text-sm text-rose-500 animate-in fade-in">{error}</p>}

      <button
        type="submit"
        disabled={loading || !form.url}
        className="w-full rounded-full bg-nordic-secondary px-4 py-2 text-sm font-medium text-nordic-primary hover:bg-nordic-support disabled:opacity-60 transition-colors"
      >
        {loading ? "Sparar..." : "Lägg till länk"}
      </button>
    </form>
  );
}