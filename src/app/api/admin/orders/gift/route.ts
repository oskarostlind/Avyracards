import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { fulfillPhysicalCardOrder } from "@/lib/stripe-order-fulfillment";

// Enkel sanity-check, inte en fullständig RFC 5322-validering: e-posten används
// bara för bekräftelsemailet, den verifieras inte mot något konto.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MAX_QUANTITY = 10;

/**
 * Gratisorder från admin: skapar en riktig order (status PAID, belopp 0) med
 * kort via samma väg som Stripe-webhooken, så att ordern dyker upp i
 * /admin/orders och korten får cardCode + claimToken som vanligt.
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Ogiltig begäran" }, { status: 400 });
    }

    const variantId = typeof body.variantId === "string" ? body.variantId.trim() : "";
    const customerEmail =
      typeof body.customerEmail === "string" ? body.customerEmail.trim() : "";
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const quantity = Number(body.quantity);

    if (!variantId) {
      return NextResponse.json({ error: "Välj en produktvariant" }, { status: 400 });
    }

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
      return NextResponse.json(
        { error: `Antal måste vara ett heltal mellan 1 och ${MAX_QUANTITY}` },
        { status: 400 }
      );
    }

    if (!EMAIL_RE.test(customerEmail)) {
      return NextResponse.json({ error: "Ogiltig e-postadress" }, { status: 400 });
    }

    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
    });

    if (!variant) {
      return NextResponse.json({ error: "Produktvarianten finns inte" }, { status: 400 });
    }

    if (!variant.isActive) {
      return NextResponse.json(
        { error: "Produktvarianten är inaktiv" },
        { status: 400 }
      );
    }

    if (variant.type !== "PHYSICAL") {
      return NextResponse.json(
        { error: "Endast fysiska kort kan ges bort gratis" },
        { status: 400 }
      );
    }

    // Kopplar man ordern till ett konto får korten assignedUserId direkt
    // (samma beteende som ett vanligt köp av en inloggad användare).
    let userId: string | null = null;
    if (username) {
      const user = await prisma.user.findUnique({
        where: { username },
        select: { id: true },
      });
      if (!user) {
        return NextResponse.json(
          { error: `Ingen användare med användarnamnet "${username}"` },
          { status: 400 }
        );
      }
      userId = user.id;
    }

    const orderId = await fulfillPhysicalCardOrder({
      userId,
      amountTotal: 0,
      currency: "sek",
      customerEmail,
      checkoutSource: "admin_gift",
      premiumOption: "none",
      items: [{ variantId, quantity, price: 0 }],
    });

    return NextResponse.json({ success: true, orderId });
  } catch (error) {
    console.error("Gift order error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
