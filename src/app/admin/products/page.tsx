import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ProductManager } from "@/components/admin/product-manager";

export default async function AdminProductsPage() {
  const session = await auth();
  
  if (session?.user?.role !== "ADMIN") {
    redirect("/login");
  }

  // Hämta produkter
  const products = await prisma.product.findMany({
    include: {
      variants: {
        orderBy: { price: 'asc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // NYTT: Hämta rabatter
  const discounts = await prisma.discount.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <div className="mb-8 flex justify-between items-end">
        <div>
            <h1 className="text-3xl font-bold text-white mb-2">Produkthantering</h1>
            <p className="text-slate-400">Hantera priser, lager och kampanjer.</p>
        </div>
      </div>

      <ProductManager 
        products={products} 
        initialDiscounts={discounts} // Skicka med rabatter här
      />
    </div>
  );
}