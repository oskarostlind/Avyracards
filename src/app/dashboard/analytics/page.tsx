import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Lock, ArrowRight } from "lucide-react";
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

  // 2. PREMIUM CHECK (Hard Gate för statistiken)
  if (!user.isPremium) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="mb-6 rounded-full bg-slate-900 p-6 ring-1 ring-slate-800">
          <Lock className="h-10 w-10 text-slate-500" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-slate-100">
          Lås upp Statistik
        </h1>
        <p className="mb-8 max-w-md text-slate-400">
          Se vem som besöker din profil och vad de klickar på. Uppgradera till
          Premium för att få tillgång till fullständig analys.
        </p>
        <Link
          href="/checkout/subscription" // Eller var din uppgraderingssida ligger
          className="flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500"
        >
          Uppgradera nu <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

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
  // Skapa en array med alla datum senaste 30 dagarna (även de med 0 views)
  const chartData = [];
  let currentDate = startDate;

  while (currentDate <= endDate) {
    const dayEvents = events.filter((e) =>
      isSameDay(new Date(e.createdAt), currentDate)
    );

    chartData.push({
      date: format(currentDate, "d MMM", { locale: sv }), // T.ex "12 Dec"
      views: dayEvents.filter((e) => e.type === "VIEW").length,
      clicks: dayEvents.filter((e) => e.type === "CLICK").length,
    });

    currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
  }

  // 5. Beräkna totaler
  const totalViews = events.filter((e) => e.type === "VIEW").length;
  const totalClicks = events.filter((e) => e.type === "CLICK").length;
  
  // CTR (Click Through Rate) - Undvik division med noll
  const ctr = totalViews > 0 
    ? ((totalClicks / totalViews) * 100).toFixed(1) 
    : "0.0";

  // 6. Topplista Länkar
  // Gruppera klick baserat på linkId
// 6. Topplista Länkar
  const linkClicks: Record<string, { title: string; url: string; clicks: number }> = {}; // Bytte 'count' till 'clicks'

  events
    .filter((e) => e.type === "CLICK" && e.link)
    .forEach((e) => {
      const linkId = e.linkId!;
      if (!linkClicks[linkId]) {
        linkClicks[linkId] = {
          title: e.link?.title || "Okänd länk",
          url: e.link?.url || "#",
          clicks: 0, // Bytte 'count' till 'clicks'
        };
      }
      linkClicks[linkId].clicks++; // Bytte 'count' till 'clicks'
    });

  const topLinks = Object.values(linkClicks)
    .sort((a, b) => b.clicks - a.clicks) // Bytte 'count' till 'clicks'
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