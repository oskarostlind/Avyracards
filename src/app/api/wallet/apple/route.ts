import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PKPass } from "passkit-generator";
import path from "path";
import fs from "fs/promises";

export const dynamic = 'force-dynamic';

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
    // Vi konverterar tillbaka från Base64 till Buffer/String
    const signerPem = Buffer.from(process.env.WALLET_SIGNER_PEM || '', 'base64');
    const privateKey = Buffer.from(process.env.WALLET_PRIVATE_KEY || '', 'base64');
    const wwdrPem = Buffer.from(process.env.WALLET_WWDR_PEM || '', 'base64');

    if (!signerPem.length || !privateKey.length || !wwdrPem.length) {
        throw new Error("Missing wallet certificates in environment variables");
    }

    // 2. Läs in bilder från PUBLIC-mappen (Dessa följer med i deployen)
    const publicDir = path.join(process.cwd(), 'public', 'images', 'wallet');
    const [iconBuffer, logoBuffer] = await Promise.all([
      fs.readFile(path.join(publicDir, "icon.png")),
      fs.readFile(path.join(publicDir, "logo.png")),
    ]);

    // 3. Skapa Passet
    const pass = new PKPass(
      {
        "logo.png": logoBuffer,
        "icon.png": iconBuffer,
      },
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
      message: `${process.env.NEXT_PUBLIC_BASE_URL}/u/${user.username}`,
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
      value: `avyracards.com/u/${user.username}`,
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