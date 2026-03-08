import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    // 1. Kontrollera att användaren är inloggad (efter registrering)
    const sessionAuth = await auth();
    const userId = sessionAuth?.user?.id;

    if (!userId) {
      return new NextResponse("Unauthorized: User must be logged in to activate premium.", { status: 401 });
    }

    // 2. Hämta session_id från requesten
    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId) {
      return new NextResponse("Missing session ID", { status: 400 });
    }

    // 3. Hämta sessionen från Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return new NextResponse("Invalid Session", { status: 404 });
    }

    // 4. Kontrollera betalningsstatus
    if (session.payment_status !== "paid") {
      return new NextResponse("Payment not completed", { status: 400 });
    }

    // 5. Uppdatera användaren
    // Vi uppdaterar oavsett om de redan är premium eller inte, för att säkra stripeCustomerId
    await prisma.user.update({
      where: { id: userId },
      data: {
        isPremium: true,
        stripeCustomerId: session.customer as string,
      },
    });

    console.log(`✅ User ${userId} manually activated premium via session ${sessionId}`);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[VERIFY_SESSION_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}