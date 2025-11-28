/* eslint-disable @next/next/no-img-element */
import { redirect } from "next/navigation";
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
        where: { isActive: true },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!user) {
    return (
      <main className="mx-auto max-w-md p-6">
        <div className="rounded-2xl bg-slate-900/60 p-6 text-center text-slate-300">
          Ingen profil hittades.
        </div>
      </main>
    );
  }

  // === NYTT: redirecta till "offentlig" länk ===
  // Vi tolkar första aktiva länken (lägst order) som din Offentliga länk.
  const primaryLink = user.links[0];
  if (primaryLink) {
    redirect(primaryLink.url);
  }

  // Om inga aktiva länkar finns visas istället profilen som tidigare.
  const profileImageUrl =
    (user as any).profileImageUrl ?? (user as any).avatarUrl ?? null;
  const contactEmail = (user as any).contactEmail as string | null;
  const phoneNumber = (user as any).phoneNumber as string | null;

  const displayName = user.name || user.username;

  return (
    <main className="mx-auto max-w-md p-6">
      <div className="rounded-2xl bg-slate-900/80 px-6 py-8 shadow-lg shadow-slate-900/40">
        <header className="mb-6 text-center">
          {profileImageUrl && (
            <div className="mb-4 flex justify-center">
              <img
                src={profileImageUrl}
                alt={`${displayName}'s avatar`}
                className="h-24 w-24 rounded-full object-cover ring-2 ring-slate-700"
              />
            </div>
          )}

          <h1 className="text-2xl font-semibold text-slate-50">
            {displayName}
          </h1>
          <p className="text-sm text-slate-400">@{user.username}</p>

          {user.bio && (
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              {user.bio}
            </p>
          )}

          {(contactEmail || phoneNumber) && (
            <div className="mt-4 space-y-1 text-sm text-slate-300">
              {contactEmail && (
                <a
                  href={`mailto:${contactEmail}`}
                  className="block break-all text-slate-200 hover:text-white"
                >
                  {contactEmail}
                </a>
              )}
              {phoneNumber && (
                <a
                  href={`tel:${phoneNumber}`}
                  className="block text-slate-200 hover:text-white"
                >
                  {phoneNumber}
                </a>
              )}
            </div>
          )}
        </header>

        {/* Om du skulle vilja ha kvar knapparna även utan redirect kan de ligga kvar här */}
        <div className="mt-6 flex w-full flex-col gap-3">
          {user.links.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-lg bg-slate-800 px-4 py-3 text-center text-sm font-medium text-slate-50 hover:bg-slate-700"
            >
              {link.title}
            </a>
          ))}

          {user.links.length === 0 && (
            <p className="text-center text-sm text-slate-400">
              Du har inga aktiva länkar ännu.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
