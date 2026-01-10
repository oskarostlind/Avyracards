import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PKPass } from "passkit-generator";
import path from "path";
import fs from "fs/promises";

export const dynamic = 'force-dynamic';

// Hjälpfunktion för att hämta bild från URL och göra om till Buffer
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

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // 1. Läs in certifikat från MILJÖVARIABLER (Base64)
    const signerPem = Buffer.from(process.env.WALLET_SIGNER_PEM || '', 'base64');
    const privateKey = Buffer.from(process.env.WALLET_PRIVATE_KEY || '', 'base64');
    const wwdrPem = Buffer.from(process.env.WALLET_WWDR_PEM || '', 'base64');

    if (!signerPem.length || !privateKey.length || !wwdrPem.length) {
        throw new Error("Missing wallet certificates in environment variables");
    }

    // 2. Hämta profilbild (Thumbnail)
    const avatarUrl = user.avatarUrl;
    const thumbnailBuffer = await fetchImageBuffer(avatarUrl);

    // 3. Läs in statiska ikoner från PUBLIC-mappen
    const publicDir = path.join(process.cwd(), 'public', 'wallet');
    const [iconBuffer, logoBuffer] = await Promise.all([
      fs.readFile(path.join(publicDir, "icon.png")),
      fs.readFile(path.join(publicDir, "logo.png")),
    ]);

    // Skapa bild-objektet dynamiskt
    const passImages: Record<string, Buffer> = {
        "logo.png": logoBuffer,
        "icon.png": iconBuffer,
    };

    if (thumbnailBuffer) {
        passImages["thumbnail.png"] = thumbnailBuffer;
    }

    // 4. Skapa Passet
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

    // --- HÄR ÄR ÄNDRINGEN FÖR ANALYTICS ---
    pass.setBarcodes({
      format: "PKBarcodeFormatQR",
      // Vi lägger till ?source=wallet här
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
      value: `avyracards.com/u/${user.username}`, // Visas bara för användaren, behöver inte source
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
    return new NextResponse("Internal Server Error: " + (error as Error).message, { status: 500 });
  }
}