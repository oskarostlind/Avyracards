import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logIosNativeServer } from "@/lib/ios-native-server-debug";

const pushTokenSchema = z.object({
  token: z.string().min(1, "Token krävs"),
});

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const result = pushTokenSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Ogiltig data", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const { token } = result.data;

  await prisma.user.update({
    where: { id: session.user.id },
    data: { pushToken: token },
  });

  logIosNativeServer("PUSH", "api/user/push-token:POST", "Token saved", {
    userId: session.user.id,
    tokenLength: token.length,
  });

  return NextResponse.json({ ok: true });
}
