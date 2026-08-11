import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendSystemNotification } from "@/lib/notifications";

const statusSchema = z.object({
  status: z.enum(["PENDING", "PAID", "SHIPPED", "FAILED"]),
});

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
    const { status } = statusSchema.parse(body);

    // Läs före skrivningen: bara en faktisk övergång till SHIPPED ska ge mail.
    // Att admin klickar "Markera som skickad" två gånger ska inte mejla kunden
    // två gånger.
    const before = await prisma.order.findUnique({
      where: { id: params.id },
      select: { status: true },
    });

    const order = await prisma.order.update({
      where: { id: params.id },
      data: { status },
    });

    if (status === "SHIPPED" && before?.status !== "SHIPPED") {
      await sendSystemNotification({
        type: "card_order_shipped",
        to: order.customerEmail,
        name: order.shippingName,
        orderId: order.id,
        quantity: order.quantity,
        shippingCity: order.shippingCity,
      });
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}