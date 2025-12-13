import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { prisma } from "@/lib/prisma";
import { ThemeEditor } from "@/components/themes/theme-editor";
import { CustomThemeSettings } from "@/types/theme";
import { Palette, Lock, ArrowRight, Zap, LayoutTemplate } from "lucide-react";

export default async function ThemesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { themeSettings: true, isPremium: true }
  });

  if (!user) redirect("/login");

  // --- 1. LÅST VY FÖR GRATISANVÄNDARE ---
  if (!user.isPremium) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center p-4 text-center animate-in fade-in zoom-in-95 duration-500">
        
        {/* Ikon-grupp */}
        <div className="relative mb-8">
          <div className="absolute -inset-4 rounded-full bg-purple-500/20 blur-xl animate-pulse" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
            <Palette className="h-10 w-10 text-purple-400" />
            <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 border border-slate-800">
                <Lock className="h-4 w-4 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Rubrik & Text */}
        <h1 className="mb-3 text-3xl font-bold text-slate-50">
          Skräddarsy din design
        </h1>
        <p className="mb-8 max-w-md text-slate-400 text-lg leading-relaxed">
          Sätt din personliga prägel på din profil. Med Premium får du full kontroll över färger, typsnitt, knappar och mycket mer.
        </p>

        {/* Feature-lista (för att sälja in värdet) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 w-full max-w-2xl">
            <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-900/50 border border-slate-800/50">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><LayoutTemplate size={20}/></div>
                <span className="text-sm font-medium text-slate-300">Unika Teman</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-900/50 border border-slate-800/50">
                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400"><Palette size={20}/></div>
                <span className="text-sm font-medium text-slate-300">Egna Färger</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-900/50 border border-slate-800/50">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400"><Zap size={20}/></div>
                <span className="text-sm font-medium text-slate-300">Ingen Reklam</span>
            </div>
        </div>

        {/* CTA Knapp */}
        <Link
          href="/checkout/premium"
          className="group relative inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-bold text-slate-950 transition hover:bg-slate-200 hover:scale-105 active:scale-95"
        >
          <span>Lås upp Premium</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          
          {/* Shine effekt */}
          <div className="absolute inset-0 -z-10 rounded-full bg-white/20 blur-md transition-opacity group-hover:opacity-100 opacity-0" />
        </Link>
        
        <p className="mt-4 text-xs text-slate-500">
            30 dagars öppet köp. Avsluta när du vill.
        </p>
      </div>
    );
  }

  // --- 2. THEME EDITOR FÖR PREMIUM ---
  return (
    <ThemeEditor initialSettings={user.themeSettings as CustomThemeSettings} />
  );
}