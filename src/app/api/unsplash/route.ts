import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  const accessKey = process.env.UNSPLASH_ACCESS_KEY;

  // FALLBACK: Om ingen nyckel finns (för dev), returnera demo-data så appen inte kraschar
  if (!accessKey) {
    console.warn("Missing UNSPLASH_ACCESS_KEY in .env");
    return NextResponse.json({
      results: [
        {
          id: "demo1",
          urls: { regular: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400" },
          alt_description: "Abstract Demo 1"
        },
        {
          id: "demo2",
          urls: { regular: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=400" },
          alt_description: "Abstract Demo 2"
        },
        {
            id: "demo3",
            urls: { regular: "https://images.unsplash.com/photo-1492571350019-22de08371fd3?q=80&w=400" },
            alt_description: "Abstract Demo 3"
        }
      ]
    });
  }

  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=20&orientation=landscape`,
      {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
        },
      }
    );

    if (!res.ok) throw new Error("Unsplash API error");

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}