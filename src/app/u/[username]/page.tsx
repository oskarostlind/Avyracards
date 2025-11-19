import { prisma } from "@/lib/prisma";

interface Props {
  params: { username: string };
}

export default async function PublicProfilePage({ params }: Props) {
  const user = await prisma.user.findUnique({
    where: { username: params.username.toLowerCase() },
    include: { links: { where: { isActive: true }, orderBy: { order: "asc" } } }
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">Profil hittades inte</h1>
          <p className="text-slate-400 text-sm">
            Kontrollera att länken är korrekt.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50">
      <div className="w-full max-w-sm px-6 py-10">
        <div className="flex flex-col items-center gap-3 mb-6">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name ?? user.username}
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center text-3xl">
              {(user.name ?? user.username).slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="text-lg font-semibold">
            {user.name ?? user.username}
          </div>
          {user.bio && (
            <div className="text-xs text-slate-400 text-center max-w-xs">
              {user.bio}
            </div>
          )}
        </div>
        <div className="space-y-3">
          {user.links.map(link => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="block w-full text-center text-sm py-2.5 rounded-full bg-slate-50 text-slate-900 font-medium hover:bg-white transition"
            >
              {link.title}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
