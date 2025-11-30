import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { User, Link as LinkModel } from "@prisma/client";
import Link from "next/link";

type PageProps = {
  params: { username: string };
};

type UserWithLinks = User & { links: LinkModel[] };

export const revalidate = 0;

export default async function PublicProfilePage({ params }: PageProps) {
  const username = params.username;

  const user = await prisma.user.findUnique({
    where: { username },
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

  const profileMode = user.profileMode ?? "SOCIAL";

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 pb-16 pt-10">
        {profileMode === "BUSINESS" ? (
          <BusinessProfile user={user} />
        ) : (
          <SocialProfile user={user} />
        )}

        {/* Liten brand-footer */}
        <div className="mt-10 text-center text-[11px] text-slate-500">
          Skapat med{" "}
          <Link
            href="/"
            className="font-medium text-emerald-300 underline-offset-4 hover:underline"
          >
            SocialCard
          </Link>
        </div>
      </div>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  SOCIAL                                    */
/* -------------------------------------------------------------------------- */

function SocialProfile({ user }: { user: UserWithLinks }) {
  return (
    <div className="w-full max-w-md">
      {/* Header */}
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 px-6 py-8 shadow-xl shadow-slate-950/80">
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl}
            alt={user.name ?? user.username}
            className="h-20 w-20 rounded-full border border-slate-700 object-cover shadow-lg"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-2xl font-semibold text-slate-200">
            {user.username.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="text-center space-y-1">
          <h1 className="text-xl font-semibold text-slate-50">
            {user.name ?? user.username}
          </h1>
          <p className="text-xs text-slate-400">@{user.username}</p>
          {user.bio && (
            <p className="mt-2 max-w-sm text-xs text-slate-300">
              {user.bio}
            </p>
          )}
        </div>

        {/* Chips för social/business typ – här alltid socialt */}
        <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-3 py-1 text-[11px] text-sky-300">
          <span className="h-2 w-2 rounded-full bg-sky-400" />
          Social profil
        </div>
      </div>

      {/* Länkar */}
      <div className="mt-6 space-y-3">
        {user.links.length === 0 && (
          <p className="text-center text-xs text-slate-500">
            Inga länkar ännu. Ägaren av profilen kan lägga till länkar via sin
            dashboard.
          </p>
        )}

        {user.links.map((link) => (
          <a
            key={link.id}
            href={normalizeUrl(link.url)}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-50 transition hover:border-sky-500/70 hover:bg-slate-900/80"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs text-slate-200 group-hover:bg-sky-500 group-hover:text-slate-950">
              {getSocialIcon(link.icon ?? link.url)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{link.title}</p>
              <p className="truncate text-[11px] text-slate-400">
                {shortenUrl(link.url)}
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 BUSINESS                                   */
/* -------------------------------------------------------------------------- */

function BusinessProfile({ user }: { user: UserWithLinks }) {
  const hasContactBlock = user.phoneNumber || user.contactEmail;

  return (
    <div className="w-full max-w-md">
      {/* Header */}
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 px-6 py-7 shadow-xl shadow-slate-950/80">
        <div className="flex items-start gap-4">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt={user.name ?? user.username}
              className="h-16 w-16 rounded-full border border-slate-700 object-cover shadow-lg"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-xl font-semibold text-slate-200">
              {user.username.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex-1 space-y-1">
            <h1 className="text-lg font-semibold text-slate-50">
              {user.name ?? user.username}
            </h1>
            <p className="text-xs text-slate-300">
              {user.bio ?? "Digitalt visitkort via SocialCard"}
            </p>
            <p className="text-[11px] text-slate-500">@{user.username}</p>
          </div>
        </div>

        {/* Kontaktblock */}
        {hasContactBlock && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {user.phoneNumber && (
              <a
                href={`tel:${user.phoneNumber}`}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500/15 px-3 py-2 text-xs font-medium text-emerald-200 ring-1 ring-emerald-500/40 transition hover:bg-emerald-500/25"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Ring
              </a>
            )}
            {user.contactEmail && (
              <a
                href={`mailto:${user.contactEmail}`}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-3 py-2 text-xs font-medium text-slate-100 ring-1 ring-slate-700 transition hover:bg-slate-800"
              >
                ✉️ Maila
              </a>
            )}
          </div>
        )}

        <div className="mt-4 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] text-emerald-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Business-profil
        </div>
      </div>

      {/* Länkar (mer “resurs”-stil) */}
      <div className="mt-6 space-y-3">
        {user.links.length > 0 && (
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Länkar & resurser
          </p>
        )}

        {user.links.length === 0 && (
          <p className="text-xs text-slate-500">
            Inga publika länkar ännu. Ägaren av profilen kan lägga till relevanta
            länkar via sin dashboard (LinkedIn, hemsida, bokningslänk osv).
          </p>
        )}

        {user.links.map((link) => (
          <a
            key={link.id}
            href={normalizeUrl(link.url)}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-50 transition hover:border-emerald-500/70 hover:bg-slate-900/80"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs text-slate-200 group-hover:bg-emerald-500 group-hover:text-slate-950">
                {getBusinessIcon(link.icon ?? link.url)}
              </div>
              <div>
                <p className="text-sm font-medium">{link.title}</p>
                <p className="truncate text-[11px] text-slate-400">
                  {shortenUrl(link.url)}
                </p>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                HELPERS                                     */
/* -------------------------------------------------------------------------- */

function normalizeUrl(url: string): string {
  if (!url) return "#";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
}

function shortenUrl(url: string): string {
  try {
    const u = new URL(normalizeUrl(url));
    return u.host.replace("www.", "") + u.pathname.replace(/\/$/, "");
  } catch {
    return url;
  }
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
  if (s.includes("onlyfans")) return "⭐";

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
