import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell"; 

export const runtime = "nodejs";

// ID:n för varianterna (Standard & Bundle)
export const VARIANT_IDS = {
  STANDARD: "cmjbqkzmn0002cv4zf9wmkmyi",
  BUNDLE: "cmjbmtf4a00036vxtmme5ao1x"
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // 1. Hämta användaren OCH deras ordrar
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      links: {
        orderBy: { order: "asc" },
      },
      // NYTT: Inkludera ordrar för att se om de köpt kortet
      orders: {
        where: { status: "PAID" }, // Endast betalda ordrar
        include: {
          items: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  // 2. Beräkna om användaren har beställt kortet
  // Vi kollar igenom alla order-items och ser om någon matchar våra IDn
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
          hasOrderedCard: hasOrderedCard // <--- Skickar med denna flagga
        }} 
        prices={prices} 
      />
    </div>
  );
}