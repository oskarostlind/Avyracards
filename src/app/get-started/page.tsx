import { prisma } from "@/lib/prisma";
import GetStartedView from "@/components/get-started-view";

// Eftersom detta är en Server Component kan vi köra DB-frågor direkt här (async)
export default async function GetStartedPage() {
  
  // 1. Hämta Premium (Vi behöver ta bort slug-filtret i products.ts eller köra rå prisma här för flexibilitet)
  // Här kör vi direkt mot Prisma för att ha full kontroll på just denna sida
  const premiumProduct = await prisma.product.findUnique({
    where: { slug: "premium-subscription" },
    include: { variants: true }
  });

  // 2. Hämta en fysisk produkt (Standard) för att visa info
  const physicalProduct = await prisma.product.findUnique({
    where: { slug: "standard-card" }, // eller "metal-card" beroende på vad du vill visa
    include: { variants: true }
  });

  return (
    <GetStartedView 
      premiumProduct={premiumProduct} 
      physicalProduct={physicalProduct} 
    />
  );
}