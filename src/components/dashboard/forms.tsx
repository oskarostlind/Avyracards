/* eslint-disable @next/next/no-img-element */
"use client";

import { ChangeEvent, useEffect, useState } from "react";
// NYTT: Importerar ikoner för kopiera-funktionen
import { Copy, Check, ExternalLink } from "lucide-react";
import { Wallet } from "lucide-react";

/* ---------------- Profilformulär ---------------- */

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

export function ProfileForm({ user }: ProfileFormProps) {
  const [name, setName] = useState(user.name ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber ?? "");
  const [contactEmail, setContactEmail] = useState(user.contactEmail ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    user.avatarUrl ?? null
  );
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatus("Välj en giltig bildfil.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setStatus("Bilden får max vara 2 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result?.toString() ?? "";
      setAvatarUrl(result);
      setStatus(null);
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setStatus(null);

    try {
      const body: Record<string, unknown> = {
        name,
        bio,
        phoneNumber,
        contactEmail,
      };

      if (avatarUrl) {
        body.avatarUrl = avatarUrl;
      }

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to save profile");

      setStatus("✔ Profilen är uppdaterad.");
    } catch (err) {
      console.error(err);
      setStatus("⚠ Kunde inte spara profilen.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {/* Namn */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-slate-200">
          Namn
        </label>
        <input
          className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:border-violet-400"
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
          className="w-full min-h-[80px] rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:border-violet-400"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Kort text om dig"
        />
      </div>

      {/* Profilbild */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-slate-200">
          Profilbild
        </label>

        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-slate-700 bg-slate-800 text-[11px] text-slate-400">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profilbild"
                className="h-full w-full object-cover"
              />
            ) : (
              <span>Ingen bild</span>
            )}
          </div>

          <label className="inline-flex cursor-pointer items-center rounded-md border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-100 hover:border-violet-400">
            Välj fil
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </label>
        </div>
      </div>

      {/* Telefonnummer */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-slate-200">
          Telefonnummer
        </label>
        <input
          type="tel"
          className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:border-violet-400"
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
          className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:border-violet-400"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          placeholder="namn@företag.se"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="px-4 py-2 rounded-md bg-slate-50 text-slate-900 text-xs font-medium disabled:opacity-60"
      >
        {saving ? "Sparar..." : "Spara"}
      </button>

      {status && (
        <p className="mt-2 text-xs text-slate-400" aria-live="polite">
          {status}
        </p>
      )}
    </form>
  );
}

/* ---------------- Länkar-delen ---------------- */

type Link = {
  id: string;
  title: string;
  url: string;
  order: number;
  isActive: boolean;
};

type LinksFormProps = {
  publicUrl: string;
};

type ApiLink = {
  id: string;
  label: string;
  url: string;
  isVisible: boolean;
};

type ProfileResponse = {
  redirectEnabled?: boolean;
};

export function LinksForm({ publicUrl }: LinksFormProps) {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [redirectEnabled, setRedirectEnabled] = useState(false);
  
  // NYTT STATE FÖR KOPIERING
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [linksRes, profileRes] = await Promise.all([
          fetch("/api/links"),
          fetch("/api/profile"),
        ]);

        if (!linksRes.ok) throw new Error("Failed to load links");
        if (!profileRes.ok) throw new Error("Failed to load profile");

        const linksData = (await linksRes.json()) as ApiLink[];
        const profileData = (await profileRes.json()) as ProfileResponse;

        const mapped: Link[] = linksData.map((l, index) => ({
          id: l.id,
          title: l.label,
          url: l.url,
          order: index,
          isActive: l.isVisible,
        }));

        setLinks(mapped);
        setRedirectEnabled(!!profileData.redirectEnabled);
      } catch (err) {
        console.error(err);
        setStatus("⚠ Kunde inte ladda länkar.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  async function handleAddLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!title || !url) return;

    setSaving(true);
    setStatus(null);

    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, url }),
      });

      if (!res.ok) throw new Error("Failed to create link");

      const createdApi = (await res.json()) as ApiLink;

      const created: Link = {
        id: createdApi.id,
        title: createdApi.label,
        url: createdApi.url,
        order: links.length,
        isActive: createdApi.isVisible,
      };

      setLinks((prev) => [...prev, created]);
      setTitle("");
      setUrl("");
      setStatus("✔ Länk tillagd.");
    } catch (err) {
      console.error(err);
      setStatus("⚠ Kunde inte lägga till länk.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setSaving(true);
    setStatus(null);

    try {
      const res = await fetch(`/api/links/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete link");

      setLinks((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      console.error(err);
      setStatus("⚠ Kunde inte ta bort länk.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(id: string, isActive: boolean) {
    try {
      const res = await fetch(`/api/links/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVisible: !isActive }),
      });

      if (!res.ok) throw new Error("Failed to update link");

      setLinks((prev) =>
        prev.map((l) => (l.id === id ? { ...l, isActive: !isActive } : l))
      );
      setStatus(null);
    } catch (err) {
      console.error(err);
      setStatus("⚠ Kunde inte uppdatera länken.");
    }
  }

  async function makePrimary(id: string) {
    setSaving(true);
    setStatus(null);

    try {
      const currentPrimaryId = links[0]?.id;

      // 1) Om redirect är PÅ och vi klickar på nuvarande offentlig → stäng av redirect
      if (redirectEnabled && currentPrimaryId === id) {
        const res = await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ redirectEnabled: false }),
        });

        if (!res.ok) throw new Error("Failed to disable redirect");

        setRedirectEnabled(false);
        setStatus(
          "✔ Redirect avstängd. /u/username visar nu din profilsida istället."
        );
        return;
      }

      // 2) Annars: sätt denna länk som ny första + slå PÅ redirect
      const current = [...links];
      const index = current.findIndex((l) => l.id === id);
      if (index === -1) return;

      const [selected] = current.splice(index, 1);
      current.unshift(selected);

      const reordered = current.map((l, idx) => ({ ...l, order: idx }));
      setLinks(reordered);

      await fetch("/api/links/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: reordered.map((l) => l.id) }),
      });

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ redirectEnabled: true }),
      });

      if (!res.ok) throw new Error("Failed to enable redirect");

      setRedirectEnabled(true);
      setStatus(
        "✔ Offentlig länk uppdaterad. /u/username redirectar nu till vald länk."
      );
    } catch (err) {
      console.error(err);
      setStatus("⚠ Kunde inte uppdatera offentlig länk.");
    } finally {
      setSaving(false);
    }
  }

  // --- NY FUNKTION FÖR ATT KOPIERA LÄNK ---
  const fullUrl = typeof window !== "undefined" 
    ? `${window.location.origin}${publicUrl}`
    : `https://avyracards.se${publicUrl}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <p className="text-xs text-slate-400">Laddar länkar...</p>;
  }

  const primaryId = links[0]?.id;

  return (
    <div className="space-y-4">
      
            {/* --- NY SEKTION: Kopiera Länk & Wallet --- */}
      <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold uppercase tracking-wider text-purple-400">
            Din publika profil
          </label>
        </div>

        <div className="flex flex-col gap-3">
          {/* Rad 1: URL och Verktyg */}
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-300 font-mono truncate">
              {fullUrl}
            </div>
            
            <button
              type="button"
              onClick={copyToClipboard}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors border border-slate-700"
              title="Kopiera länk"
            >
              {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
            </button>
            
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors border border-slate-700"
              title="Öppna profil"
            >
              <ExternalLink size={18} />
            </a>
          </div>

          {/* Rad 2: Apple Wallet (Full bredd) */}
          <a 
            href="/api/wallet/apple"
            className="flex items-center justify-center gap-2 bg-[#1C1C1E] text-white border border-white/10 px-4 py-3 rounded-xl hover:bg-[#2C2C2E] transition-all font-medium text-sm w-full shadow-lg"
          >
            <Wallet size={18} className="text-white" />
            <span>Add to Apple Wallet</span>
          </a>
        </div>
      </div>

      {/* formulär för ny länk */}
      <form onSubmit={handleAddLink} className="space-y-3">
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-200">
            Länktitel
          </label>
          <input
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:border-violet-400"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex. Instagram"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-200">
            URL
          </label>
          <input
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:border-violet-400"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded-md bg-slate-50 text-slate-900 text-xs font-medium disabled:opacity-60"
        >
          {saving ? "Lägger till..." : "Lägg till länk"}
        </button>
      </form>

      {status && (
        <p className="text-xs text-slate-400" aria-live="polite">
          {status}
        </p>
      )}

      <ul className="space-y-2">
        {links.map((link) => (
          <li
            key={link.id}
            className="space-y-2 rounded-md border border-slate-800 px-3 py-2 sm:flex sm:items-center sm:justify-between sm:space-y-0"
          >
            {/* Text-del */}
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-50">
                {link.title}
                {redirectEnabled && link.id === primaryId && (
                  <span className="ml-2 rounded-full bg-violet-600/20 px-2 py-[1px] text-[10px] font-semibold text-violet-300">
                    Offentlig
                  </span>
                )}
              </p>
              <p className="mt-1 text-[11px] text-slate-400 break-all sm:max-w-[260px] sm:truncate">
                {link.url}
              </p>
            </div>

            {/* Knapp-del – stackad på mobil, tight på desktop */}
            <div className="flex flex-wrap gap-2 sm:flex-nowrap sm:justify-end">
              <button
                type="button"
                onClick={() => makePrimary(link.id)}
                className="rounded-md border border-violet-500 px-2 py-1 text-[11px] text-violet-300"
              >
                Offentlig
              </button>
              <button
                type="button"
                onClick={() => toggleActive(link.id, !!link.isActive)}
                className="rounded-md border border-slate-700 px-2 py-1 text-[11px]"
              >
                {link.isActive ? "Aktiv" : "Inaktiv"}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(link.id)}
                className="rounded-md border border-red-500 px-2 py-1 text-[11px] text-red-400"
              >
                Ta bort
              </button>
            </div>
          </li>
        ))}

        {links.length === 0 && (
          <p className="text-xs text-slate-400">
            Du har inga länkar ännu. Lägg till en ovanför.
          </p>
        )}
      </ul>
    </div>
  );
}