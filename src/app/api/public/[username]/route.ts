import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: { username: string } }
) {
  const username = params.username.toLowerCase();

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
