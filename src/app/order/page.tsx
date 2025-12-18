import { prisma } from "@/lib/prisma";
import OrderView from "@/components/order-view";

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

  // 3. Hämta Bundle (NYTT)
  const bundleProduct = await prisma.product.findUnique({
    where: { slug: "premium-bundle" },
    include: { variants: { where: { isActive: true } } }
  });

  const standardVariants = standardProduct?.variants || [];
  const metalVariants = metalProduct?.variants || [];
  
  // Ta första varianten av bundlen, eller en fallback om den råkat raderas
  const bundleVariant = bundleProduct?.variants[0] || null;

  return (
    <OrderView 
      standardVariants={standardVariants as any} 
      metalVariants={metalVariants as any}
      bundleVariant={bundleVariant as any} // Skicka med till vyn
    />
  );
}