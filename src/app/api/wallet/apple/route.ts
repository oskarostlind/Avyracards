import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PKPass } from "passkit-generator";
import path from "path";
import fs from "fs/promises";

// Vi stänger av caching för denna route så att passet alltid är nytt
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Autentisering
    const session = await auth();
    if (!session || !session.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 2. Hämta användardata
    // FIX 1: Vi tar bort 'include: { profile: true }' eftersom fälten ligger direkt på User
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // 3. Konfigurera sökvägar till certifikat och bilder
    const certsDir = path.resolve(process.cwd(), "certs");
    
    // Läs in filerna
    const [signerPem, privateKey, wwdrPem, iconBuffer, logoBuffer] = await Promise.all([
      fs.readFile(path.join(certsDir, "signer.pem")),
      fs.readFile(path.join(certsDir, "private.key")),
      fs.readFile(path.join(certsDir, "wwdr.pem")),
      fs.readFile(path.join(certsDir, "icon.png")),
      fs.readFile(path.join(certsDir, "logo.png")),
    ]);

    // 4. Skapa Passet
    const pass = new PKPass(
      {
        "logo.png": logoBuffer,
        "icon.png": iconBuffer,
      },
      {
        wwdr: wwdrPem,
        signerCert: signerPem,
        signerKey: privateKey,
        // Vi använder lösenordet från .env som vi fixade
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

    // 5. Definiera innehållet
    pass.setBarcodes({
      format: "PKBarcodeFormatQR",
      message: `${process.env.NEXT_PUBLIC_BASE_URL}/u/${user.username}`,
      messageEncoding: "iso-8859-1",
      altText: user.username || "Profile"
    });

    pass.type = "generic"; 

    // FIX 2: Vi hämtar datan direkt från 'user' objektet
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

    // 6. Generera bufferten
    const buffer = pass.getAsBuffer();

    // 7. Skicka som respons
    // FIX 3: 'buffer as any' löser TypeScript-felet med BodyInit
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