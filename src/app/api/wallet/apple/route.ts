import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PKPass } from "passkit-generator";
import path from "path";
import fs from "fs/promises";
import jwt from "jsonwebtoken";

export const dynamic = 'force-dynamic';

async function fetchImageBuffer(url: string | null): Promise<Buffer | undefined> {
  if (!url) return undefined;
  try {
    const res = await fetch(url);
    if (!res.ok) return undefined;
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (e) {
    console.error("Failed to fetch image", e);
    return undefined;
  }
}

// NYTT: Denna skapar VIP-biljetten (token) inuti appen där vi vet vem användaren är
export async function POST() {  
  try {
    const session = await auth();
    if (!session || !session.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Skapa en säker, tidsbegränsad token (giltig 5 minuter)
    const secret = process.env.NEXTAUTH_SECRET || "fallback_secret";
    const token = jwt.sign({ email: session.user.email }, secret, { expiresIn: '5m' });

    // Skicka tillbaka en URL med token i
    const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/wallet/apple?token=${token}`;
    return NextResponse.json({ url });
  } catch (error) {
    return new NextResponse("Failed to generate token", { status: 500 });
  }
}

// UPPDATERAD: Accepterar antingen vanlig inloggning (desktop) ELLER vår VIP-biljett (från iOS Safari)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    let userEmail = "";

    // 1. Kolla om vi fick en VIP-biljett
    if (token) {
      try {
        const secret = process.env.NEXTAUTH_SECRET || "fallback_secret";
        const decoded = jwt.verify(token, secret) as { email: string };
        userEmail = decoded.email;
      } catch (e) {
        return new NextResponse("Invalid or expired token", { status: 401 });
      }
    } else {
      // 2. Om ingen biljett finns, kolla vanliga cookies (t.ex. vid datorn)
      const session = await auth();
      if (!session || !session.user?.email) {
        return new NextResponse("Unauthorized. Not logged in.", { status: 401 });
      }
      userEmail = session.user.email;
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) return new NextResponse("User not found", { status: 404 });

    const signerPem = Buffer.from(process.env.WALLET_SIGNER_PEM || '', 'base64');
    const privateKey = Buffer.from(process.env.WALLET_PRIVATE_KEY || '', 'base64');
    const wwdrPem = Buffer.from(process.env.WALLET_WWDR_PEM || '', 'base64');

    if (!signerPem.length || !privateKey.length || !wwdrPem.length) {
        throw new Error("Missing wallet certificates in environment variables");
    }

    const avatarUrl = user.avatarUrl;
    const thumbnailBuffer = await fetchImageBuffer(avatarUrl);

    const publicDir = path.join(process.cwd(), "public");
    const [iconBuffer, logoBuffer] = await Promise.all([
      fs.readFile(path.join(publicDir, "icon.png")),
      fs.readFile(path.join(publicDir, "avyra_transparent_v2.jpg")),
    ]);

    const passImages: Record<string, Buffer> = {
        "logo.jpg": logoBuffer,
        "icon.png": iconBuffer,
    };

    if (thumbnailBuffer) {
        passImages["thumbnail.png"] = thumbnailBuffer;
    }

    const pass = new PKPass(
      passImages,
      {
        wwdr: wwdrPem,
        signerCert: signerPem,
        signerKey: privateKey,
        signerKeyPassphrase: process.env.APPLE_WALLET_PASSPHRASE, 
      },
      {
        description: "AvyraCards Digital Profile",
        organizationName: "AvyraCards",
        passTypeIdentifier: process.env.APPLE_PASS_TYPE_ID!,
        serialNumber: user.id,
        teamIdentifier: process.env.APPLE_TEAM_ID!,
        backgroundColor: "rgb(0, 0, 0)",
        foregroundColor: "rgb(255, 255, 255)",
        labelColor: "rgb(156, 163, 175)",
        logoText: "AvyraCards",
      }
    );

    pass.setBarcodes({
      format: "PKBarcodeFormatQR",
      message: `${process.env.NEXT_PUBLIC_BASE_URL}/u/${user.username}?source=wallet`,
      messageEncoding: "iso-8859-1",
      altText: user.username || "Profile"
    });

    pass.type = "generic"; 

    pass.primaryFields.push({
      key: "name",
      label: "NAMN",
      value: user.name || user.username || "Användare",
    });

    pass.secondaryFields.push({
      key: "role",
      label: "TITEL",
      value: user.bio || "Digital Profil",
    });

    pass.auxiliaryFields.push({
      key: "url",
      label: "PROFIL",
      value: `avyracards.se/u/${user.username}`,
    });
    
    pass.backFields.push({
        key: "manage",
        label: "Hantera Profil",
        value: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`,
        attributedValue: `<a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard">Klicka här för att redigera</a>`
    });

    const buffer = pass.getAsBuffer();

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.pkpass",
        "Content-Disposition": 'attachment; filename="pass.pkpass"',
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });

  } catch (error) {
    console.error("Wallet Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}