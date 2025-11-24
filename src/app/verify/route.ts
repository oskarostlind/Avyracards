import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect("/login?error=invalid-token");
  }

  const user = await prisma.user.findFirst({
    where: { verificationToken: token },
  });

  if (!user) {
    return NextResponse.redirect("/login?error=invalid-token");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      verificationToken: null,
      emailVerified: new Date(),
    },
  });

  return NextResponse.redirect("/login?verified=1");
}
