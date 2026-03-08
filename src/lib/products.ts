import { prisma } from "@/lib/prisma";

// Hämtar alla aktiva produkter och deras varianter
export async function getActiveProducts() {
  const products = await prisma.product.findMany({
    where: { 
      isActive: true,
      // Vi exkluderar prenumerationen här om den bara ska synas i checkout/settings
      // Om du vill visa den i get-started, ta bort raden nedan:
      slug: { not: 'premium-subscription' } 
    },
    include: {
      variants: {
        where: { isActive: true },
        orderBy: { price: 'asc' } // Sortera billigast först eller efter behov
      }
    },
    orderBy: {
      createdAt: 'asc' // Eller hur du vill sortera produkterna (Metal först? Standard först?)
    }
  });

  return products;
}

// Hjälpfunktion för att formattera pris (t.ex. 49900 -> "499 kr")
export function formatPrice(amount: number, currency = 'sek') {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount / 100);
}