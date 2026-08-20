import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendSystemNotification } from "@/lib/notifications";

const statusSchema = z.object({
  status: z.enum(["PENDING", "PAID", "SHIPPED", "FAILED"]),
  trackingNumber: z.string().trim().max(64).optional(),
});

// Tillåtna övergångar — en skickad order ska inte kunna gå baklänges till
// PENDING av ett felklick, och ett nytt SHIPPED-mail ska aldrig kunna
// provoceras fram genom att studsa fram och tillbaka.
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["PAID", "FAILED"],
  FAILED: ["PAID"],
  PAID: ["SHIPPED"],
  SHIPPED: [],
};

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { status, trackingNumber } = statusSchema.parse(body);

    // Läs före skrivningen: bara en faktisk övergång till SHIPPED ska ge mail.
    // Att admin klickar "Markera som skickad" två gånger ska inte mejla kunden
    // två gånger.
    const before = await prisma.order.findUnique({
      where: { id: params.id },
      select: { status: true },
    });

    if (!before) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (
      before.status !== status &&
      !ALLOWED_TRANSITIONS[before.status]?.includes(status)
    ) {
      return NextResponse.json(
        { error: `Ogiltig statusövergång: ${before.status} → ${status}` },
        { status: 409 }
      );
    }

    const order = await prisma.order.update({
      where: { id: params.id },
      data: {
        status,
        ...(trackingNumber !== undefined
          ? { trackingNumber: trackingNumber || null }
          : {}),
      },
    });

    if (status === "SHIPPED" && before.status !== "SHIPPED") {
      await sendSystemNotification({
        type: "card_order_shipped",
        to: order.customerEmail,
        name: order.shippingName,
        orderId: order.id,
        quantity: order.quantity,
        shippingCity: order.shippingCity,
        trackingNumber: order.trackingNumber,
      });
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}