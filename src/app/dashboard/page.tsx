// src/app/dashboard/page.tsx
/// <reference types="react" />

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm, LinksForm } from "@/components/dashboard/forms";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: (session!.user as any).id },
  });

  if (!user) {
    redirect("/login");
  }

  const publicUrl = `${
    process.env.NEXT_PUBLIC_APP_URL ?? ""
  }/u/${user.username ?? ""}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 md:flex-row">
        {/* Vänster: formulär */}
        <section className="flex-1 space-y-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Din SocialCard-panel
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Uppdatera din profil och hantera dina länkar.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <h2 className="text-sm font-medium text-slate-100">
              Profilinformation
            </h2>
            <p className="mb-4 mt-1 text-xs text-slate-400">
              Namn och bio visas på din publika profilsida.
            </p>
            <ProfileForm user={user as any} />
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <h2 className="text-sm font-medium text-slate-100">Länkar</h2>
            <p className="mb-4 mt-1 text-xs text-slate-400">
              Lägg till och hantera knapparna på din SocialCard-sida.
            </p>
            <LinksForm publicUrl={publicUrl} />
          </div>
        </section>

        {/* Höger: mobil-preview placeholder (vi bygger ut senare) */}
        <section className="w-full max-w-sm space-y-4 md:w-80">
          <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 to-black p-4">
            <p className="text-xs font-medium text-slate-400">
              Förhandsvisning (coming soon)
            </p>
            <div className="mt-4 h-[420px] rounded-2xl bg-slate-900/60" />
          </div>
          <p className="text-[11px] text-slate-500">
            Här kommer vi senare lägga in en riktig mobilförhandsvisning med
            tema, färger och kortdesign.
          </p>
        </section>
      </main>
    </div>
  );
}
