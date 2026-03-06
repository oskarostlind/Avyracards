import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const form = await request.formData();
    const file = form.get('file') as File;

    if (!file) {
      return new NextResponse("No file provided", { status: 400 });
    }

    // Laddar upp filen till Vercel Blob i mappen "prints"
    const blob = await put(`prints/${Date.now()}-${file.name}`, file, {
      access: 'public',
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("Upload error:", error);
    return new NextResponse("Upload failed", { status: 500 });
  }
}