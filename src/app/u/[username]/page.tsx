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

  // 👉 Redirect bara om redirectEnabled är true och det finns minst en aktiv länk
  if (user.redirectEnabled && user.links.length > 0) {
    const primaryLink = user.links[0];
    redirect(primaryLink.url);
  }

  const profileImageUrl =
    (user as any).avatarUrl ?? (user as any).profileImageUrl ?? null;
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

        {/* Knappar visas alltid när redirect är av – och även när redirect är på men inga aktiva länkar finns */}
        <section className="mt-6 flex flex-col gap-3">
          {user.links.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-lg bg-slate-800 px-4 py-3 text-center text-sm font-medium text-slate-50 transition hover:bg-slate-700"
            >
              {link.title}
            </a>
          ))}

          {user.links.length === 0 && (
            <p className="text-center text-sm text-slate-400">
              Inga aktiva länkar ännu.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
