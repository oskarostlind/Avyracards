/* eslint-disable @next/next/no-img-element */
import { prisma } from "@/lib/prisma";

interface Props {
  params: { username: string };
}

export default async function PublicProfilePage({ params }: Props) {
  const user = await prisma.user.findUnique({
    where: { username: params.username.toLowerCase() },
    include: {
      links: {
        where: { isActive: true },
        orderBy: { order: "asc" }
      }
    }
  });

  if (!user) {
    return (
      <div className="p-6 text-center text-slate-600">
        Ingen profil hittades.
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <div className="flex flex-col items-center gap-4">
        {user.avatarUrl && (
          <img
            src={user.avatarUrl}
            alt={`${user.username}'s avatar`}
            className="h-24 w-24 rounded-full object-cover"
          />
        )}

        <h1 className="text-2xl font-bold text-slate-900">{user.username}</h1>
        {user.bio && <p className="text-center text-slate-600">{user.bio}</p>}

        <div className="mt-6 flex w-full flex-col gap-3">
          {user.links.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-lg bg-slate-900 p-3 text-center text-white"
            >
              {link.title}
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
