import { prisma } from "@/lib/prisma";
import GetStartedView from "@/components/get-started-view";

// Vi sätter revalidate till 0 eller en låg siffra så att prisändringar i DB syns direkt
export const revalidate = 0; 

export default async function GetStartedPage() {
  
  // 1. Hämta Premium (Abonnemanget)
  const premiumProduct = await prisma.product.findUnique({
    where: { slug: "premium-subscription" }, // Matchar din DB-slug
    include: { variants: true }
  });

  // 2. Hämta Bundle-produkten (Den du skapade i DB)
  const bundleProduct = await prisma.product.findUnique({
    where: { slug: "premium-bundle" }, // Matchar din DB-slug
    include: { variants: true }
  });

  // (Valfritt) Hämta standardkortet om vi vill visa jämförelsepris, 
  // men för bundle använder vi bundleProductens eget pris.


  return (
    <GetStartedView 
      premiumProduct={premiumProduct} 
      bundleProduct={bundleProduct} 
    />
  );
}