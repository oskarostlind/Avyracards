import { prisma } from "@/lib/prisma";
import OrderView, { DbVariant } from "@/components/order-view";

// Helper function to map Prisma variant to DbVariant interface
function mapVariant(variant: any): DbVariant {
    return {
        id: variant.id,
        name: variant.name,
        price: variant.price,
        compareAtPrice: variant.compareAtPrice,
        colorCode: variant.colorCode,
        type: variant.type || "standard", // fallback if type is missing
    };
}

export default async function OrderPage() {
  
  // 1. Hämta Plastkort
  const standardProduct = await prisma.product.findUnique({
    where: { slug: "standard-card" },
    include: { variants: { where: { isActive: true } } }
  });

  // 2. Hämta Metallkort
  const metalProduct = await prisma.product.findUnique({
    where: { slug: "metal-card" },
    include: { variants: { where: { isActive: true } } }
  });

  // 3. Hämta Bundle
  const bundleProduct = await prisma.product.findUnique({
    where: { slug: "premium-bundle" },
    include: { variants: { where: { isActive: true } } }
  });

  const standardVariants: DbVariant[] = standardProduct?.variants.map(mapVariant) || [];
  const metalVariants: DbVariant[] = metalProduct?.variants.map(mapVariant) || [];
  
  // Ta första varianten av bundlen, eller null om saknas
  const bundleVariant: DbVariant | null = bundleProduct?.variants[0] ? mapVariant(bundleProduct.variants[0]) : null;

  return (
    <OrderView 
      standardVariants={standardVariants} 
      metalVariants={metalVariants}
      bundleVariant={bundleVariant} 
    />
  );
}