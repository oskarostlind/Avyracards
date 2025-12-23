import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { auth } from "@/auth"; // Se till att sökvägen till auth stämmer

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filename = searchParams.get("filename");

  // Vi använder användarens ID i filnamnet för att undvika dubbletter/överskrivningar av andra
  // T.ex: avatars/user_123_filename.jpg
  const path = `avatars/${session.user.id}-${filename}`;

  if (!request.body || !filename) {
    return new NextResponse("No file provided", { status: 400 });
  }

  try {
    const blob = await put(path, request.body, {
      access: "public",
    });

    return NextResponse.json(blob);
  } catch (error) {
    console.error("Upload error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}