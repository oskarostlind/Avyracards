import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "edge";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Ingen fil skickades." }, { status: 400 });
  }

  const filename = `avatars/${session.user.email}/${Date.now()}-${file.name}`;

  const { url } = await put(filename, file, {
    access: "public",
    token: process.env.BLOB_READ_WRITE_TOKEN
  });

  await prisma.user.update({
    where: { email: session.user.email },
    data: { avatarUrl: url }
  });

  return NextResponse.json({ url }, { status: 200 });
}
