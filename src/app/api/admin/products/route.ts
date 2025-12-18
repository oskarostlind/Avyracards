import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { 
        variantId, 
        productId, 
        // Nya flaggor och fält
        updateProduct, 
        name, 
        description, 
        // Variantfält
        price, compareAtPrice, stock, isActive, colorCode 
    } = body;

    // SCENARIO 1: UPPDATERA SJÄLVA PRODUKTEN (Namn/Beskrivning)
    if (updateProduct && productId) {
        const updatedProduct = await prisma.product.update({
            where: { id: productId },
            data: {
                name: name,
                description: description,
            }
        });
        
        revalidatePath("/order");
        revalidatePath("/get-started");
        return NextResponse.json({ success: true, product: updatedProduct });
    }

    // SCENARIO 2: MASSUPPDATERING AV VARIANTER (Pris)
    if (productId && !variantId && !updateProduct) {
        await prisma.productVariant.updateMany({
            where: { productId: productId },
            data: {
                price: price !== undefined ? parseInt(price) : undefined,
                compareAtPrice: compareAtPrice !== undefined ? (parseInt(compareAtPrice) || null) : undefined,
            }
        });
        
        revalidatePath("/order");
        revalidatePath("/get-started");
        return NextResponse.json({ success: true, message: "Bulk update complete" });
    }

    // SCENARIO 3: INDIVIDUELL VARIANT (Allt)
    if (variantId) {
        // Bygg data-objektet dynamiskt så vi inte skriver över med undefined
        const dataToUpdate: any = {};
        if (price !== undefined) dataToUpdate.price = parseInt(price);
        if (compareAtPrice !== undefined) dataToUpdate.compareAtPrice = parseInt(compareAtPrice) || null;
        if (stock !== undefined) dataToUpdate.stock = parseInt(stock);
        if (isActive !== undefined) dataToUpdate.isActive = isActive;
        if (name !== undefined) dataToUpdate.name = name; // <-- Uppdatera namn
        if (colorCode !== undefined) dataToUpdate.colorCode = colorCode; // <-- Uppdatera färg

        const updatedVariant = await prisma.productVariant.update({
          where: { id: variantId },
          data: dataToUpdate,
        });

        revalidatePath("/order");
        revalidatePath("/get-started");
        return NextResponse.json({ success: true, variant: updatedVariant });
    }

    return NextResponse.json({ error: "Missing ID" }, { status: 400 });
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

// POST (Skapa) behåller vi oförändrad
export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
        const body = await req.json();
        const { productId, name, price, compareAtPrice, colorCode, type } = body; 
    
        const newVariant = await prisma.productVariant.create({
          data: {
            productId,
            name,
            price: parseInt(price),
            compareAtPrice: compareAtPrice ? parseInt(compareAtPrice) : null,
            colorCode,
            type: type || "PHYSICAL",
            stock: 100,
            isActive: true
          }
        });
    
        revalidatePath("/order");
        return NextResponse.json({ success: true, variant: newVariant });
      } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
      }
}