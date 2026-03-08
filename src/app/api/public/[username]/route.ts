import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit, type RateLimitOptions } from "@/lib/rate-limit";

const publicProfileRateLimitOptions: RateLimitOptions = {
  windowMs: 60_000,
  max: 60,
};

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  const username = params.username.toLowerCase();

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rateKey = `public_profile:${ip}:${username}`;
  const rate = consumeRateLimit(rateKey, publicProfileRateLimitOptions);

  if (!rate.allowed) {
    return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
  }

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      username: true,
      name: true,
      bio: true,
      theme: true,
      font: true,
      avatarUrl: true,
      backgroundUrl: true,

      // nya fält vi har lagt till i User
      profileMode: true,
      phoneNumber: true,
      contactEmail: true,
      redirectEnabled: true, // hålls i sync av links-API:t

      links: {
        where: { isActive: true },
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          url: true,
          icon: true,
          order: true,
          isActive: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Profil saknas" }, { status: 404 });
  }

  // "Superhård" regel: finns det aktiva länkar? då är redirect på.
  const hasActiveLinks = user.links.length > 0;
  const primaryLink = hasActiveLinks ? user.links[0] : null;

  return NextResponse.json({
    user,
    redirect: hasActiveLinks
      ? {
          enabled: true,
          url: primaryLink?.url ?? null,
        }
      : {
          enabled: false,
          url: null,
        },
  });
}
