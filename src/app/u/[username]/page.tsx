import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { User, Link as LinkModel } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type PageProps = {
  params: { username: string };
};

type UserWithLinks = User & { links: LinkModel[] };

export const runtime = "nodejs";
export const revalidate = 0;

export default async function PublicProfilePage({ params }: PageProps) {
  const username = params.username.toLowerCase();

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

  // 👉 Redirect bara om redirectEnabled ÄR PÅ och det finns aktiv länk
  if (user.redirectEnabled && user.links.length > 0) {
    const primary = user.links[0];
    const target = normalizeUrl(primary.url);
    redirect(target);
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

        <div className="space-y-1 text-center">
          <h1 className="text-xl font-semibold text-slate-50">
            {user.name ?? user.username}
          </h1>
          <p className="text-xs text-slate-400">@{user.username}</p>
          {user.bio && (
            <p className="mt-2 max-w-sm text-xs text-slate-300">{user.bio}</p>
          )}
        </div>

        <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-3 py-1 text-[11px] text-sky-300">
          <span className="h-2 w-2 rounded-full bg-sky-400" />
          Social profil
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-slate-500">
        Ägaren till den här profilen kan lägga till länkar i sin dashboard. Om
        de väljer att aktivera en offentlig länk redirectar /u/{user.username}{" "}
        direkt dit.
      </p>
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

      <p className="mt-6 text-xs text-slate-500">
        Inga länkar är satta som offentlig redirect just nu. När ägaren väljer
        en Offentlig länk kommer /u/{user.username} öppna den direkt.
      </p>
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
