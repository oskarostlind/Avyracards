import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PremiumCheckoutForm } from "@/components/premium-checkout-form";

export default async function PremiumCheckoutPage() {
  
  const product = await prisma.product.findUnique({
    where: { slug: "premium-subscription" },
    include: { variants: true }
  });

  if (!product || product.variants.length === 0) {
    redirect("/get-started");
  }

  const variant = product.variants[0];

  return (
    <PremiumCheckoutForm 
      productName={product.name}
      price={variant.price}
      variantId={variant.id}
    />
  );
}