import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Skapar Premium Bundle...");

  // 1. Skapa produkten
  const product = await prisma.product.upsert({
    where: { slug: "premium-bundle" },
    update: {},
    create: {
      name: "Premium Bundle (Order Addon)",
      slug: "premium-bundle",
      description: "Uppgradering som visas i kassan",
      isActive: true,
    },
  });

  // 2. Skapa varianten (Priset)
  // Pris: 299 kr (29900 öre), Ord: 474 kr (47400 öre)
  await prisma.productVariant.create({
    data: {
      productId: product.id,
      name: "6 Månader",
      type: "DIGITAL", // Eller SUBSCRIPTION
      price: 29900,
      compareAtPrice: 47400,
      stock: 9999, // Oändligt lager
      isActive: true,
    },
  });

  console.log("Klart! Gå till /admin/products för att se den.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });