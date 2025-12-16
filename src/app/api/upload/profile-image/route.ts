import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  // Returnerar 501 Not Implemented
  // Detta hindrar frontend från att tro att uppladdningen fungerade om någon försöker anropa den.
  return NextResponse.json(
    { error: "Profile image upload is not implemented yet." },
    { status: 501 }
  );
}