import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const runtime = "nodejs";

function sanitizeFilename(filename: string) {
  const trimmed = filename.trim();
  const extensionMatch = trimmed.match(/\.(jpe?g|png|webp|gif)$/i);
  const extension = extensionMatch?.[0].toLowerCase() ?? ".jpg";
  const baseName = trimmed
    .replace(/\.[^/.]+$/, "")
    .normalize("NFKD")
    .replace(/[^\w-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);

  return `${baseName || "upload"}${extension}`;
}

function getImageContentType(request: Request) {
  const contentType = request.headers.get("content-type");
  return contentType?.startsWith("image/") ? contentType : undefined;
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Du måste vara inloggad för att ladda upp bilder." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filename = searchParams.get("filename");

  if (!request.body || !filename) {
    return NextResponse.json({ error: "Ingen bild skickades med uppladdningen." }, { status: 400 });
  }

  const safeFilename = sanitizeFilename(filename);
  // User ID in the path prevents users from overwriting each other's uploads.
  const path = `avatars/${session.user.id}-${safeFilename}`;
  const contentType = getImageContentType(request);

  try {
    const blob = await put(path, request.body, {
      access: "public",
      contentType,
    });

    return NextResponse.json(blob);
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Bildlagringen kunde inte ta emot uppladdningen just nu." },
      { status: 500 }
    );
  }
}