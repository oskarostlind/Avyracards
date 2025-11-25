/* eslint-disable @next/next/no-img-element */
import { prisma } from "@/lib/prisma";

interface Props {
  params: { username: string };
}

export default async function PublicProfilePage({ params }: Props) {
  const username = params.username.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      name: true,
      bio: true,
      profileImageUrl: true,
      phoneNumber: true,
      contactEmail: true,
      links: {
        where: { isActive: true },
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          url: true,
        },
      },
    },
  });

  if (!user) {
    return (
      <main className="mx-auto max-w-md p-6">
        <div className="text-center text-slate-400">
          Ingen profil hittades.
        </div>
      </main>
    );
  }

  const displayName = user.name && user.name.trim().length > 0
    ? user.name
    : user.username;

  return (
    <main className="mx-auto max-w-md p-6">
      <div className="flex flex-col items-center gap-4">
        {/* Profilbild */}
        {user.profileImageUrl && (
          <img
            src={user.profileImageUrl}
            alt={`${displayName}'s avatar`}
            className="h-24 w-24 rounded-full object-cover border border-slate-700"
          />
        )}

        {/* Namn / användarnamn */}
        <h1 className="text-2xl font-bold text-slate-50">{displayName}</h1>
        {user.username && (
          <p className="text-xs text-slate-400">@{user.username}</p>
        )}

        {/* Bio */}
        {user.bio && (
          <p className="text-center text-sm text-slate-300">{user.bio}</p>
        )}

        {/* Kontaktinfo */}
        {(user.phoneNumber || user.contactEmail) && (
          <div className="mt-2 flex flex-col items-center gap-1 text-xs text-slate-300">
            {user.phoneNumber && (
              <a
                href={`tel:${user.phoneNumber}`}
                className="rounded-full border border-slate-700 px-3 py-1 hover:bg-slate-800"
              >
                📞 {user.phoneNumber}
              </a>
            )}
            {user.contactEmail && (
              <a
                href={`mailto:${user.contactEmail}`}
                className="rounded-full border border-slate-700 px-3 py-1 hover:bg-slate-800"
              >
                ✉️ {user.contactEmail}
              </a>
            )}
          </div>
        )}

        {/* Länkar – endast aktiva (Inaktiv döljs) */}
        <div className="mt-6 flex w-full flex-col gap-3">
          {user.links.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-lg bg-slate-900 px-4 py-3 text-center text-sm font-medium text-slate-50 hover:bg-slate-800"
            >
              {link.title}
            </a>
          ))}

          {user.links.length === 0 && (
            <p className="text-center text-xs text-slate-500">
              Den här profilen har inga offentliga länkar ännu.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
