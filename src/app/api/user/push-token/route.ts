import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const pushTokenSchema = z.object({
  token: z.string().min(1, "Token krävs"),
});

export async function POST(req: Request) {
  const session = await auth();

  // #region agent log
  console.log(
    JSON.stringify({
      type: "push_debug",
      message: "push_token_endpoint_called",
      hasSession: Boolean(session?.user?.id),
      userId: session?.user?.id ?? null,
    })
  );
  // #endregion

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

  // #region agent log
  console.log(
    JSON.stringify({
      type: "push_debug",
      message: "push_token_saved",
      userId: session.user.id,
    })
  );
  // #endregion

  return NextResponse.json({ ok: true });
}
