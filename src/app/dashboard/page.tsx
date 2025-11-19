import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function getData(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { links: { orderBy: { order: "asc" } } }
  });
  return user;
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.email) {
    // middleware ska redan ha stoppat detta i praktiken
    return <div className="max-w-3xl mx-auto px-4 py-16">Inte inloggad.</div>;
  }

  const user = await getData(session.user.email);

  if (!user) {
    return <div className="max-w-3xl mx-auto px-4 py-16">Ingen användare hittades.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 grid gap-8 md:grid-cols-[2fr,1.5fr]">
      <section>
        <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
        <p className="text-sm text-slate-400 mb-6">
          Redigera din profil och hantera dina länkar. Din publika profil finns på{" "}
          <code className="bg-slate-900 px-2 py-1 rounded text-xs">
            /u/{user.username}
          </code>
          .
        </p>

        <ProfileForm user={user} />
        <LinksForm links={user.links} />
      </section>

      <section className="bg-slate-900 border border-slate-700 rounded-xl p-4">
        <h2 className="text-sm font-semibold mb-2">Mobilförhandsvisning (enkel)</h2>
        <div className="mt-2 mx-auto w-64 h-[460px] rounded-[32px] border border-slate-700 bg-slate-950 p-4 flex flex-col">
          <div className="h-10 flex items-center justify-center text-xs text-slate-500">
            socialcards.se/u/{user.username}
          </div>
          <div className="flex flex-col items-center gap-2 mt-2 mb-4">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name ?? user.username}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center text-xl">
                {(user.name ?? user.username).slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="text-sm font-semibold">{user.name ?? user.username}</div>
            {user.bio && (
              <div className="text-xs text-slate-400 text-center px-4">
                {user.bio}
              </div>
            )}
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto">
            {user.links
              .filter(l => l.isActive)
              .map(link => (
                <div
                  key={link.id}
                  className="w-full rounded-full bg-slate-800 text-center text-xs py-2 px-3 truncate"
                >
                  {link.title}
                </div>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// ----- Client components -----

"use client";

import { useState } from "react";

function ProfileForm({ user }: { user: any }) {
  const [name, setName] = useState(user.name ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus(null);

    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, bio })
    });

    setSaving(false);
    if (!res.ok) {
      setStatus("Kunde inte spara profil.");
      return;
    }
    setStatus("Profil uppdaterad.");
  }

  async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload/profile-image", {
      method: "POST",
      body: formData
    });

    if (!res.ok) {
      setStatus("Kunde inte ladda upp bild.");
      return;
    }
    setStatus("Profilbild uppdaterad. Ladda om sidan om du inte ser ändring.");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 mb-8">
      <h2 className="text-sm font-semibold">Profil</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-xs mb-1">Namn</label>
          <input
            className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs mb-1">Profilbild</label>
          <input
            type="file"
            accept="image/*"
            className="block w-full text-xs text-slate-400"
            onChange={onAvatarChange}
          />
        </div>
      </div>
      <div>
        <label className="block text-xs mb-1">Bio</label>
        <textarea
          className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm min-h-[80px]"
          value={bio}
          onChange={e => setBio(e.target.value)}
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="px-4 py-2 rounded-md bg-slate-50 text-slate-900 text-xs font-medium disabled:opacity-60"
      >
        {saving ? "Sparar..." : "Spara"}
      </button>
      {status && <p className="text-xs text-slate-400 mt-2">{status}</p>}
    </form>
  );
}

function LinksForm({ links }: { links: any[] }) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [localLinks, setLocalLinks] = useState(links);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus(null);

    const res = await fetch("/api/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, url })
    });

    setSaving(false);

    if (!res.ok) {
      setStatus("Kunde inte lägga till länk.");
      return;
    }

    const created = await res.json();
    setLocalLinks(prev => [...prev, created]);
    setTitle("");
    setUrl("");
  }

  async function toggleActive(id: string, isActive: boolean) {
    const res = await fetch(`/api/links/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive })
    });

    if (!res.ok) return;

    setLocalLinks(prev =>
      prev.map(l => (l.id === id ? { ...l, isActive: !isActive } : l))
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold">Länkar</h2>
      <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-[2fr,3fr,auto]">
        <input
          placeholder="Titel"
          className="rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />
        <input
          placeholder="https://"
          className="rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm"
          value={url}
          onChange={e => setUrl(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={saving}
          className="px-3 py-2 rounded-md bg-slate-50 text-slate-900 text-xs font-medium disabled:opacity-60"
        >
          Lägg till
        </button>
      </form>
      {status && <p className="text-xs text-slate-400">{status}</p>}
      <div className="mt-4 space-y-2">
        {localLinks.map(link => (
          <div
            key={link.id}
            className="flex items-center justify-between rounded-md border border-slate-800 px-3 py-2 text-xs"
          >
            <div className="flex flex-col">
              <span className="font-medium">{link.title}</span>
              <span className="text-slate-400 truncate max-w-xs">{link.url}</span>
            </div>
            <button
              onClick={() => toggleActive(link.id, link.isActive)}
              className="text-xs px-2 py-1 rounded-md border border-slate-700"
            >
              {link.isActive ? "Dölj" : "Visa"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
