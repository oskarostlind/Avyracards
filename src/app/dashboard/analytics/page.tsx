import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  Lock, 
  ArrowRight, 
  BarChart3, 
  MousePointerClick, 
  TrendingUp, 
  Users 
} from "lucide-react"; // Uppdaterade ikoner
import { format, subDays, isSameDay } from "date-fns";
import { sv } from "date-fns/locale";

import { prisma } from "@/lib/prisma";
import { AnalyticsView } from "@/components/dashboard/analytics-view";

export const metadata = {
  title: "Statistik | SocialCard",
};

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user) return redirect("/login");

  // 1. Hämta användaren för att kolla Premium-status
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isPremium: true, username: true },
  });

  if (!user) return redirect("/login");

  // 2. PREMIUM CHECK - NY SNYGG DESIGN
  if (!user.isPremium) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center p-4 text-center animate-in fade-in zoom-in-95 duration-500">
        
        {/* Ikon-grupp med Glow */}
        <div className="relative mb-8">
          <div className="absolute -inset-4 rounded-full bg-blue-500/20 blur-xl animate-pulse" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
            <BarChart3 className="h-10 w-10 text-blue-400" />
            <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 border border-slate-800">
                <Lock className="h-4 w-4 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Rubrik & Text */}
        <h1 className="mb-3 text-3xl font-bold text-slate-50">
          Lås upp Statistik
        </h1>
        <p className="mb-8 max-w-md text-slate-400 text-lg leading-relaxed">
          Få full insikt i din trafik. Se vem som besöker din profil, vad de klickar på och hur du växer över tid.
        </p>

        {/* Feature-lista */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 w-full max-w-2xl">
            <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-900/50 border border-slate-800/50">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><Users size={20}/></div>
                <span className="text-sm font-medium text-slate-300">Besöksantal</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-900/50 border border-slate-800/50">
                <div className="p-2 bg-green-500/10 rounded-lg text-green-400"><MousePointerClick size={20}/></div>
                <span className="text-sm font-medium text-slate-300">Klickspårning</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-900/50 border border-slate-800/50">
                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400"><TrendingUp size={20}/></div>
                <span className="text-sm font-medium text-slate-300">Trender & CTR</span>
            </div>
        </div>

        {/* CTA Knapp med Shine-effekt */}
        <Link
          href="/checkout/premium"
          className="group relative inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-bold text-slate-950 transition hover:bg-slate-200 hover:scale-105 active:scale-95"
        >
          <span>Uppgradera nu</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          
          <div className="absolute inset-0 -z-10 rounded-full bg-white/20 blur-md transition-opacity group-hover:opacity-100 opacity-0" />
        </Link>
        
        <p className="mt-4 text-xs text-slate-500">
            30 dagars öppet köp. Avsluta när du vill.
        </p>
      </div>
    );
  }

  // --- HÄR BÖRJAR DATAHÄMTNINGEN FÖR PREMIUM (Samma som förut) ---

  // 3. Hämta data (Senaste 30 dagarna)
  const endDate = new Date();
  const startDate = subDays(endDate, 30);

  const events = await prisma.analyticsEvent.findMany({
    where: {
      profileOwnerId: session.user.id,
      createdAt: {
        gte: startDate,
      },
    },
    include: {
      link: true, // För att få länktitlar
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // 4. Bearbeta data för grafer
  const chartData = [];
  let currentDate = startDate;

  while (currentDate <= endDate) {
    const dayEvents = events.filter((e) =>
      isSameDay(new Date(e.createdAt), currentDate)
    );

    chartData.push({
      date: format(currentDate, "d MMM", { locale: sv }), 
      views: dayEvents.filter((e) => e.type === "VIEW").length,
      clicks: dayEvents.filter((e) => e.type === "CLICK").length,
    });

    currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
  }

  // 5. Beräkna totaler
  const totalViews = events.filter((e) => e.type === "VIEW").length;
  const totalClicks = events.filter((e) => e.type === "CLICK").length;
  
  const ctr = totalViews > 0 
    ? ((totalClicks / totalViews) * 100).toFixed(1) 
    : "0.0";

  // 6. Topplista Länkar
  const linkClicks: Record<string, { title: string; url: string; clicks: number }> = {}; 

  events
    .filter((e) => e.type === "CLICK" && e.link)
    .forEach((e) => {
      const linkId = e.linkId!;
      if (!linkClicks[linkId]) {
        linkClicks[linkId] = {
          title: e.link?.title || "Okänd länk",
          url: e.link?.url || "#",
          clicks: 0, 
        };
      }
      linkClicks[linkId].clicks++; 
    });

  const topLinks = Object.values(linkClicks)
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100">Statistik</h1>
        <p className="text-slate-400">
          Översikt över din profils prestanda de senaste 30 dagarna.
        </p>
      </div>

      <AnalyticsView
        stats={{ totalViews, totalClicks, ctr }}
        chartData={chartData}
        topLinks={topLinks}
      />
    </div>
  );
}