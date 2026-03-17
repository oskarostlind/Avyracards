import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const pushTokenSchema = z.object({
  token: z.string().min(1, "Token krävs"),
});

export async function POST(req: Request) {
  const session = await auth();
  const url = new URL(req.url);
  const ua = req.headers.get("user-agent") ?? null;
  const origin = req.headers.get("origin") ?? null;
  const hasCookieHeader = Boolean(req.headers.get("cookie"));

  // #region agent log
  console.log(
    JSON.stringify({
      type: "push_debug",
      message: "push_token_endpoint_called",
      hasSession: Boolean(session?.user?.id),
      userId: session?.user?.id ?? null,
      host: url.host,
      origin,
      hasCookieHeader,
      hasUserAgent: Boolean(ua),
    })
  );
  fetch("http://127.0.0.1:7873/ingest/09085440-baf4-4edb-b47d-e635d859caa3", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "1abe96" },
    body: JSON.stringify({
      sessionId: "1abe96",
      runId: "vercel",
      hypothesisId: "H1",
      location: "src/app/api/user/push-token/route.ts:POST:entry",
      message: "push_token_endpoint_called",
      data: {
        hasSession: Boolean(session?.user?.id),
        host: url.host,
        origin,
        hasCookieHeader,
        hasUserAgent: Boolean(ua),
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  if (!session?.user?.id) {
    // #region agent log
    console.log(
      JSON.stringify({
        type: "push_debug",
        message: "push_token_unauthorized",
        host: url.host,
        origin,
        hasCookieHeader,
      })
    );
    fetch("http://127.0.0.1:7873/ingest/09085440-baf4-4edb-b47d-e635d859caa3", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "1abe96" },
      body: JSON.stringify({
        sessionId: "1abe96",
        runId: "vercel",
        hypothesisId: "H2",
        location: "src/app/api/user/push-token/route.ts:POST:unauthorized",
        message: "push_token_unauthorized",
        data: { host: url.host, origin, hasCookieHeader },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const result = pushTokenSchema.safeParse(body);

  if (!result.success) {
    // #region agent log
    console.log(
      JSON.stringify({
        type: "push_debug",
        message: "push_token_invalid_body",
        userId: session.user.id,
        hasTokenField: typeof (body as { token?: unknown } | null)?.token === "string",
      })
    );
    fetch("http://127.0.0.1:7873/ingest/09085440-baf4-4edb-b47d-e635d859caa3", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "1abe96" },
      body: JSON.stringify({
        sessionId: "1abe96",
        runId: "vercel",
        hypothesisId: "H3",
        location: "src/app/api/user/push-token/route.ts:POST:invalid_body",
        message: "push_token_invalid_body",
        data: {
          userId: session.user.id,
          hasTokenField: typeof (body as { token?: unknown } | null)?.token === "string",
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
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
      tokenLength: token.length,
    })
  );
  fetch("http://127.0.0.1:7873/ingest/09085440-baf4-4edb-b47d-e635d859caa3", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "1abe96" },
    body: JSON.stringify({
      sessionId: "1abe96",
      runId: "vercel",
      hypothesisId: "H4",
      location: "src/app/api/user/push-token/route.ts:POST:saved",
      message: "push_token_saved",
      data: { userId: session.user.id, tokenLength: token.length },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  return NextResponse.json({ ok: true });
}
