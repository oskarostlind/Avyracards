import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell"; 
import { VARIANT_IDS } from "@/lib/constants"; // <--- IMPORTERA HÄR

export const runtime = "nodejs";

// TA BORT: export const VARIANT_IDS = { ... }

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // 1. Hämta användaren
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      links: { orderBy: { order: "asc" } },
      orders: {
        where: { status: "PAID" },
        include: { items: true },
      },
    },
  });

  if (!user) redirect("/login");

  // 2. Logik med VARIANT_IDS
  const hasOrderedCard = user.orders.some((order) => 
    order.items.some((item) => 
      [VARIANT_IDS.STANDARD, VARIANT_IDS.BUNDLE].includes(item.productVariantId)
    )
  );

  // 3. Hämta priser
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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <DashboardShell 
        user={{
          ...user,
          hasSeenOnboarding: user.hasSeenOnboarding,
          hasOrderedCard: hasOrderedCard
        }} 
        prices={prices} 
      />
    </div>
  );
}