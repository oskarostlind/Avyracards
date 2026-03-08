/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // NYTT
import { AvatarUploader } from "@/components/avatar-uploader";

type ProfileFormProps = {
  user: {
    id?: string;
    name?: string | null;
    bio?: string | null;
    username?: string | null;
    phoneNumber?: string | null;
    contactEmail?: string | null;
    avatarUrl?: string | null;
    redirectEnabled?: boolean | null;
  };
};

export function SocialProfileForm({ user }: ProfileFormProps) {
  const router = useRouter(); // Används för att refresha data efter sparning

  const [name, setName] = useState(user.name ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber ?? "");
  const [contactEmail, setContactEmail] = useState(user.contactEmail ?? "");
  
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    user.avatarUrl ?? null
  );
  
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  // LOGIK FÖR "DIRTY STATE" (Har vi ändrat något?)
  const hasChanges = 
    name !== (user.name ?? "") ||
    bio !== (user.bio ?? "") ||
    phoneNumber !== (user.phoneNumber ?? "") ||
    contactEmail !== (user.contactEmail ?? "") ||
    avatarUrl !== (user.avatarUrl ?? null);

  // VARNING VID OSPARADE ÄNDRINGAR
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = ""; // Standard för moderna webbläsare att visa varning
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!hasChanges) return; // Förhindra onödiga anrop

    setSaving(true);
    setStatus(null);

    try {
      const body: Record<string, unknown> = {
        name,
        bio,
        phoneNumber,
        contactEmail,
        avatarUrl,
      };

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to save profile");

      setStatus("✔ Profilen är uppdaterad.");
      router.refresh(); // Uppdaterar server-data så att "user" prop blir ny och hasChanges blir false
    } catch (err) {
      console.error(err);
      setStatus("⚠ Kunde inte spara profilen.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {/* Namn */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-slate-200">
          Namn
        </label>
        <input
          className="w-full rounded-md border border-nordic-highlight/40 bg-slate-900 px-3 py-2 text-sm text-nordic-secondary outline-none focus:border-violet-400"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ditt namn"
        />
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-slate-200">
          Bio
        </label>
        <textarea
          className="w-full min-h-[80px] rounded-md border border-nordic-highlight/40 bg-slate-900 px-3 py-2 text-sm text-nordic-secondary outline-none focus:border-violet-400"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Kort text om dig"
        />
      </div>

      {/* NY BILDHANTERARE */}
      <AvatarUploader 
        label="Profilbild"
        value={avatarUrl}
        onChange={(url) => setAvatarUrl(url)}
        onUploadStart={() => setSaving(true)}
        onUploadEnd={() => setSaving(false)}
      />

      {/* Telefonnummer */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-slate-200">
          Telefonnummer
        </label>
        <input
          type="tel"
          className="w-full rounded-md border border-nordic-highlight/40 bg-slate-900 px-3 py-2 text-sm text-nordic-secondary outline-none focus:border-violet-400"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="+46 70 123 45 67"
        />
      </div>

      {/* Kontakt-mail */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-slate-200">
          Kontakt-e-post
        </label>
        <input
          type="email"
          className="w-full rounded-md border border-nordic-highlight/40 bg-slate-900 px-3 py-2 text-sm text-nordic-secondary outline-none focus:border-violet-400"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          placeholder="namn@företag.se"
        />
      </div>

      {/* SPARA-KNAPP MED LOGIK FÖR FÄRG */}
      <div className="flex items-center gap-3">
        <button
            type="submit"
            disabled={!hasChanges || saving}
            className={`px-4 py-2 rounded-md text-xs font-medium transition-all ${
            hasChanges 
                ? "bg-violet-600 text-white hover:bg-violet-500 shadow-md shadow-violet-500/20" 
                : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
            }`}
        >
            {saving ? "Sparar..." : hasChanges ? "Spara ändringar" : "Spara"}
        </button>

        {status && (
            <p className="text-xs text-nordic-highlight animate-in fade-in" aria-live="polite">
            {status}
            </p>
        )}
      </div>
    </form>
  );
}