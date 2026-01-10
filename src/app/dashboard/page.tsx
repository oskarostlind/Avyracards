import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell"; 
import { VARIANT_IDS } from "@/lib/constants"; 

export const runtime = "nodejs";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // 1. Hämta användaren, ordrar OCH info om vad som köpts
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      links: { orderBy: { order: "asc" } },
      orders: {
        where: { status: "PAID" },
        include: { 
          items: {
            include: {
              productVariant: true // Vi måste veta om det är PHYSICAL
            }
          } 
        },
      },
    },
  });

  if (!user) redirect("/login");

  // 2. LOGIK: Har användaren köpt NÅGOT fysiskt kort?
  // Detta gör att bannern försvinner oavsett färg/material
  const hasOrderedCard = user.orders.some((order) => 
    order.items.some((item) => 
      item.productVariant.type === "PHYSICAL"
    )
  );

  // 3. Hämta priser för widgeten (för de som INTE köpt)
  const variants = await prisma.productVariant.findMany({
    where: {
      id: { in: [VARIANT_IDS.STANDARD, VARIANT_IDS.BUNDLE] }
    }
  });

  const getPrice = (id: string) => {
    const variant = variants.find(v => v.id === id);
    if (!variant) return "Ej tillgänglig";
    return new Intl.NumberFormat("sv-SE", {
      style: "currency",
      currency: "SEK",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(variant.price / 100);
  };

  const prices = {
    standard: getPrice(VARIANT_IDS.STANDARD),
    bundle: getPrice(VARIANT_IDS.BUNDLE)
  };

  return (
    // BAKGRUNDS-FIXEN:
    // Vi lägger en wrapper som säkerställer att sidan fyller skärmen och har snygga "glows"
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
        
        {/* Glow Effects - Ger djup åt den svarta bakgrunden */}
        <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Innehållet */}
        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
          <DashboardShell 
            user={{
              ...user,
              hasSeenOnboarding: user.hasSeenOnboarding,
              hasOrderedCard: hasOrderedCard
            }} 
            prices={prices} 
          />
        </div>
    </div>
  );
}