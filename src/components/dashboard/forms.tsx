// src/components/dashboard/forms.tsx
"use client";

import { useEffect, useState } from "react";

type ProfileFormProps = {
  user: {
    name?: string | null;
    bio?: string | null;
    username?: string | null;
  };
};

export function ProfileForm({ user }: ProfileFormProps) {
  const [name, setName] = useState(user.name ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio }),
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

      <button
        type="submit"
        disabled={saving}
        className="px-4 py-2 rounded-md bg-slate-50 text-slate-900 text-xs font-medium disabled:opacity-60"
      >
        {saving ? "Sparar..." : "Spara"}
      </button>

      {status && (
        <p className="text-xs text-slate-400 mt-2" aria-live="polite">
          {status}
        </p>
      )}
    </form>
  );
}

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

export function LinksForm({ publicUrl }: LinksFormProps) {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/links");
        if (!res.ok) throw new Error("Failed to load links");
        const data: Link[] = await res.json();
        setLinks(data.sort((a, b) => a.order - b.order));
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

      const created: Link = await res.json();
      setLinks((prev) =>
        [...prev, created].sort((a, b) => a.order - b.order)
      );
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
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (!res.ok) throw new Error("Failed to update link");

      setLinks((prev) =>
        prev.map((l) => (l.id === id ? { ...l, isActive: !isActive } : l))
      );
    } catch (err) {
      console.error(err);
      setStatus("⚠ Kunde inte uppdatera länken.");
    }
  }

  if (loading) {
    return <p className="text-xs text-slate-400">Laddar länkar...</p>;
  }

  return (
    <div className="space-y-4">
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

      <div className="space-y-1">
        <p className="text-xs text-slate-400">
          Din publika profil:{" "}
          <span className="font-mono text-slate-200">{publicUrl}</span>
        </p>
      </div>

      <ul className="space-y-2">
        {links.map((link) => (
          <li
            key={link.id}
            className="flex items-center justify-between rounded-md border border-slate-800 px-3 py-2"
          >
            <div>
              <p className="text-xs font-medium text-slate-50">
                {link.title}
              </p>
              <p className="text-[11px] text-slate-400 truncate max-w-[220px]">
                {link.url}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleActive(link.id, link.isActive)}
                className="text-[11px] px-2 py-1 rounded-md border border-slate-700"
              >
                {link.isActive ? "Aktiv" : "Inaktiv"}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(link.id)}
                className="text-[11px] px-2 py-1 rounded-md border border-red-500 text-red-400"
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
