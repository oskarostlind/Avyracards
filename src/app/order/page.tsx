import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import OrderView, { DbVariant } from "@/components/order-view";

function mapVariant(variant: any): DbVariant {
    return {
        id: variant.id,
        name: variant.name,
        price: variant.price,
        compareAtPrice: variant.compareAtPrice,
        colorCode: variant.colorCode,
        type: variant.type || "standard", 
    };
}

export default async function OrderPage() {
  const session = await auth();
  const userId = session?.user?.id;

  // 1. Kolla om user är premium
  let isPremium = false;
  if (userId) {
     const user = await prisma.user.findUnique({
         where: { id: userId },
         select: { isPremium: true } // Eller hur du kollar premiumstatus
     });
     // Anpassa logiken: t.ex. user.plan === 'PRO' eller user.hasPremium === true
     isPremium = user?.isPremium === true; 
  }

  // 2. Hämta produkter
  const standardProduct = await prisma.product.findUnique({
    where: { slug: "standard-card" },
    include: { variants: { where: { isActive: true } } }
  });

  const metalProduct = await prisma.product.findUnique({
    where: { slug: "metal-card" },
    include: { variants: { where: { isActive: true } } }
  });

  const bundleProduct = await prisma.product.findUnique({
    where: { slug: "premium-bundle" },
    include: { variants: { where: { isActive: true } } }
  });

  const standardVariants: DbVariant[] = standardProduct?.variants.map(mapVariant) || [];
  const metalVariants: DbVariant[] = metalProduct?.variants.map(mapVariant) || [];
  const bundleVariant: DbVariant | null = bundleProduct?.variants[0] ? mapVariant(bundleProduct.variants[0]) : null;

  return (
    <OrderView 
      standardVariants={standardVariants} 
      metalVariants={metalVariants}
      bundleVariant={bundleVariant}
      isPremium={isPremium} 
    />
  );
}