import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET: Hämta alla rabatter
export async function GET() {
  const session = await auth();
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const discounts = await prisma.discount.findMany({
    orderBy: { createdAt: 'desc' }
  });
  
  return NextResponse.json(discounts);
}

// POST: Skapa ny rabatt
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { code, value } = body; // value är procent, t.ex. 20

    const discount = await prisma.discount.create({
      data: {
        code: code.toUpperCase(),
        type: "PERCENTAGE",
        value: parseInt(value),
        isActive: true,
      }
    });

    return NextResponse.json(discount);
  } catch (error) {
    return NextResponse.json({ error: "Could not create discount" }, { status: 500 });
  }
}

// DELETE: Ta bort rabatt
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    await prisma.discount.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Could not delete" }, { status: 500 });
  }
}