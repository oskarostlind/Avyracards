import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { User, Link as LinkModel } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getTheme } from "@/utils/theme";

type PageProps = {
  params: { username: string };
};

type UserWithLinks = User & { links: LinkModel[] };

export const runtime = "nodejs";
export const revalidate = 0;

export default async function PublicProfilePage({ params }: PageProps) {
  const user = await prisma.user.findUnique({
    where: { username: params.username },
    include: {
      links: {
        where: { isActive: true },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!user) {
    notFound();
  }

  // Behåll befintligt beteende: om redirect är på och det finns aktiv länk
  if (user.redirectEnabled && user.links.length > 0) {
    const primary = user.links[0];
    const target = normalizeUrl(primary.url);
    redirect(target);
  }

  // Välj layout baserat på profileMode
  if (user.profileMode === "BUSINESS") {
    return <BusinessProfile user={user} />;
  }

  // Default: social layout
  return <SocialProfile user={user} />;
}

// ---------- SOCIAL LAYOUT ----------

function SocialProfile({ user }: { user: UserWithLinks }) {
  const tokens = getTheme(user.theme);
  const displayName = user.name || user.username;
  const bio =
    user.bio ||
    "Skriv en kort presentation av dig själv i dina profilinställningar.";

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-4 py-8">
        <section
          className={`w-full max-w-md rounded-[32px] border border-white/10 p-6 shadow-2xl ${tokens.card}`}
        >
          <div className="flex flex-col items-center gap-4">
            {/* Avatar */}
            <div className="relative h-24 w-24 overflow-hidden rounded-full border border-white/20 bg-black/40">
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={`${displayName}'s avatar`}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl font-semibold">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Namn + bio */}
            <div className="text-center">
              <h1 className="text-xl font-semibold">{displayName}</h1>
              <p className="mt-1 text-sm text-slate-200">{bio}</p>
            </div>
          </div>

          {/* Länkar */}
          <div className="mt-6 flex flex-col gap-3">
            {user.links.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/20 px-4 py-3 text-center text-xs text-slate-300">
                Inga länkar är aktiva ännu. Lägg till dem i din dashboard.
              </div>
            ) : (
              user.links.map((link) => (
                <Link
                  key={link.id}
                  href={normalizeUrl(link.url)}
                  className={`flex items-center justify-between rounded-full px-4 py-2 text-sm font-medium shadow-md transition hover:scale-[1.01] ${tokens.card}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="flex items-center gap-2">
                    <span>{getSocialIcon(link.url || link.title)}</span>
                    <span>{link.title || link.url}</span>
                  </span>
                  <span className="text-xs text-slate-200/80">Öppna</span>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

// ---------- BUSINESS LAYOUT ----------

function BusinessProfile({ user }: { user: UserWithLinks }) {
  const tokens = getTheme(user.theme);
  const displayName = user.name || user.username;
  const headline =
    user.bio ||
    "Skriv en kort beskrivning av din roll och hur du hjälper kunder, kollegor eller samarbetspartners.";

  const phone = user.phoneNumber;
  const email = user.contactEmail || user.email;

  // Försök hitta en LinkedIn-länk
  const linkedInLink = user.links.find((link) =>
    (link.url || "").toLowerCase().includes("linkedin")
  );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-4 py-8">
        <section
          className={`w-full max-w-xl rounded-[32px] border border-white/10 p-6 shadow-2xl ${tokens.card}`}
        >
          {/* Övre del: avatar + namn + headline */}
          <div className="flex flex-col items-center gap-4 border-b border-white/10 pb-5 text-center sm:flex-row sm:items-center sm:text-left">
            <div className="flex w-full justify-center sm:w-auto">
              <div className="relative h-24 w-24 overflow-hidden rounded-full border border-purple-400/60 bg-black/40">
                {user.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={`${displayName}'s avatar`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl font-semibold">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl font-semibold">{displayName}</h1>
              <p className="text-sm text-slate-200">{headline}</p>
            </div>
          </div>

          {/* Kontaktblock */}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {phone && (
              <Link
                href={`tel:${phone.replace(/\s+/g, "")}`}
                className="flex items-center justify-center gap-2 rounded-2xl border border-purple-500/40 bg-purple-500/10 px-3 py-2 text-sm font-medium text-purple-100 shadow-sm hover:bg-purple-500/20"
              >
                <span>📞</span>
                <span>Ring</span>
              </Link>
            )}
            {email && (
              <Link
                href={`mailto:${email}`}
                className="flex items-center justify-center gap-2 rounded-2xl border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-sm font-medium text-sky-100 shadow-sm hover:bg-sky-500/20"
              >
                <span>✉️</span>
                <span>Maila</span>
              </Link>
            )}
            {linkedInLink && (
              <Link
                href={normalizeUrl(linkedInLink.url)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-2xl border border-slate-500/40 bg-slate-500/10 px-3 py-2 text-sm font-medium text-slate-100 shadow-sm hover:bg-slate-500/20 sm:col-span-2"
              >
                <span>in</span>
                <span>Visa LinkedIn-profil</span>
              </Link>
            )}
          </div>

          {/* Länkar-sektion */}
          {user.links.length > 0 && (
            <div className="mt-6 space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
                Länkar
              </h2>
              <div className="flex flex-col gap-2">
                {user.links.map((link) => (
                  <Link
                    key={link.id}
                    href={normalizeUrl(link.url)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 text-xs font-medium text-slate-100 hover:bg-slate-900/70"
                  >
                    <span className="flex items-center gap-2">
                      <span>{getBusinessIcon(link.url || link.title)}</span>
                      <span>{link.title || link.url}</span>
                    </span>
                    <span className="text-[10px] text-slate-400">Öppna</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

// ---------- HELPERS ----------

function normalizeUrl(url: string): string {
  if (!url) return "/";
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function getSocialIcon(source: string): string {
  const s = source.toLowerCase();

  if (s.includes("instagram")) return "📸";
  if (s.includes("tiktok")) return "🎵";
  if (s.includes("youtube")) return "▶️";
  if (s.includes("twitch")) return "🎮";
  if (s.includes("spotify")) return "🎧";
  if (s.includes("twitter") || s.includes("x.com")) return "🐦";
  if (s.includes("snapchat")) return "👻";
  if (s.includes("facebook")) return "📘";
  if (s.includes("linkedin")) return "in";

  return "🔗";
}

function getBusinessIcon(source: string): string {
  const s = source.toLowerCase();

  if (s.includes("linkedin")) return "in";
  if (s.includes("calendar") || s.includes("calendly")) return "📅";
  if (s.includes("mailto:") || s.includes("@")) return "✉️";
  if (s.includes("tel:")) return "📞";
  if (s.includes("pdf")) return "📄";

  return "↗";
}
