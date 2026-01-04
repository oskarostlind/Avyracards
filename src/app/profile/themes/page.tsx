import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth"; 
import { prisma } from "@/lib/prisma";
import { ThemeEditor } from "@/components/themes/theme-editor";
import { CustomThemeSettings, defaultSettings } from "@/types/theme";
import { Palette, Lock, ArrowRight, Zap, LayoutTemplate } from "lucide-react";

export default async function ThemesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { 
      themeSettings: true, 
      isPremium: true,
      username: true,
      name: true,
      bio: true,
      avatarUrl: true,
      links: {
        where: { isActive: true },
        orderBy: { order: "asc" }
      }
    }
  });

  if (!user) redirect("/login");

  if (!user.isPremium) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center p-4 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="relative mb-8">
          <div className="absolute -inset-4 rounded-full bg-purple-500/20 blur-xl animate-pulse" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-nordic-highlight/40 bg-slate-900 shadow-2xl">
            <Palette className="h-10 w-10 text-purple-400" />
            <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-nordic-primary border border-nordic-highlight/40">
                <Lock className="h-4 w-4 text-nordic-highlight" />
            </div>
          </div>
        </div>

        <h1 className="mb-3 text-3xl font-bold text-nordic-secondary">
          Skräddarsy din design
        </h1>
        <p className="mb-8 max-w-md text-nordic-highlight text-lg leading-relaxed">
          Sätt din personliga prägel på din profil. Med Premium får du full kontroll över färger, typsnitt, knappar och mycket mer.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 w-full max-w-2xl">
            <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-900/50 border border-nordic-highlight/40/50">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><LayoutTemplate size={20}/></div>
                <span className="text-sm font-medium text-slate-300">Unika Teman</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-900/50 border border-nordic-highlight/40/50">
                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400"><Palette size={20}/></div>
                <span className="text-sm font-medium text-slate-300">Egna Färger</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-900/50 border border-nordic-highlight/40/50">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400"><Zap size={20}/></div>
                <span className="text-sm font-medium text-slate-300">Ingen Reklam</span>
            </div>
        </div>

        <Link
          href="/checkout/premium"
          className="group relative inline-flex items-center gap-2 rounded-full bg-nordic-secondary px-8 py-4 text-sm font-bold text-nordic-primary transition hover:bg-nordic-support hover:scale-105 active:scale-95"
        >
          <span>Lås upp Premium</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
        
        <p className="mt-4 text-xs text-nordic-highlight">
            30 dagars öppet köp. Avsluta när du vill.
        </p>
      </div>
    );
  }

  // --- FIX HÄR: Type Casting för Prisma JSON ---
  // Vi måste tala om för TS att detta JSON-objekt faktiskt är CustomThemeSettings
  const savedSettings = (user.themeSettings as unknown as Partial<CustomThemeSettings>) || {};
  
  const safeSettings: CustomThemeSettings = { ...defaultSettings, ...savedSettings };

  const liveUserData = {
    username: user.username || "",
    name: user.name || "",
    bio: user.bio || "",
    avatarUrl: user.avatarUrl || "",
    links: user.links.map(l => ({
      id: l.id,
      title: l.title,
      url: l.url,
      icon: l.icon || undefined 
    }))
  };

  return (
    <ThemeEditor 
      initialSettings={safeSettings} 
      userData={liveUserData} 
    />
  );
}