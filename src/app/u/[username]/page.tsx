/* eslint-disable @next/next/no-img-element */
import { prisma } from "@/lib/prisma";

interface Props {
  params: { username: string };
}

export default async function PublicProfilePage({ params }: Props) {
  const username = params.username.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      links: {
        where: { isActive: true }, // Visa bara aktiva länkar
        orderBy: { order: "asc" },
      },
    },
  });

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50">
        <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-4">
          <p className="text-sm text-slate-400">Ingen profil hittades.</p>
        </div>
      </main>
    );
  }

  const displayName = user.name || user.username;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-10">
        {/* Header / profilinfo */}
        <header className="flex flex-col items-center gap-4">
          {user.avatarUrl && (
            <img
              src={user.avatarUrl}
              alt={`${user.username}'s avatar`}
              className="h-24 w-24 rounded-full object-cover ring-2 ring-slate-800"
            />
          )}

          <div className="text-center space-y-1">
            <h1 className="text-2xl font-semibold text-slate-50">
              {displayName}
            </h1>
            <p className="text-xs text-slate-400">@{user.username}</p>
          </div>

          {user.bio && (
            <p className="max-w-sm text-center text-sm text-slate-300">
              {user.bio}
            </p>
          )}

          {(user.contactEmail || user.phoneNumber) && (
            <div className="mt-1 flex flex-col items-center gap-1 text-sm text-slate-300">
              {user.contactEmail && (
                <a
                  href={`mailto:${user.contactEmail}`}
                  className="hover:text-violet-300"
                >
                  {user.contactEmail}
                </a>
              )}
              {user.phoneNumber && (
                <a
                  href={`tel:${user.phoneNumber.replace(/[^0-9+]/g, "")}`}
                  className="hover:text-violet-300"
                >
                  {user.phoneNumber}
                </a>
              )}
            </div>
          )}
        </header>

        {/* Länkar */}
        <section className="mt-8 flex flex-1 flex-col gap-3">
          {user.links.length === 0 && (
            <p className="text-center text-sm text-slate-500">
              Inga aktiva länkar ännu.
            </p>
          )}

          {user.links.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-xl bg-slate-800 px-4 py-3 text-center text-sm font-medium text-slate-50 transition hover:bg-slate-700"
            >
              {link.title}
            </a>
          ))}
        </section>
      </div>
    </main>
  );
}
