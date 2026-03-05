import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;
    const mode = req.nextUrl.searchParams.get("mode") || "social";

    // 1. Hämta användaren
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // 2. Förbered data baserat på mode (Social eller Business)
    const isBusiness = mode === "business";
    
    // Namn (Om name saknas, använd username, annars fall tillbaka på "Kontakt")
    const fullName = user.name || user.username || "Kontakt";
    const nameParts = fullName.split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

    const phone = isBusiness ? user.businessPhone : user.phoneNumber;
    const email = isBusiness ? user.businessEmail : user.contactEmail;
    const company = isBusiness ? user.companyName : "";
    const title = isBusiness ? user.jobTitle : "";
    const website = isBusiness ? user.companyWebsite : `https://avyracards.se/${user.username}`;
    const note = isBusiness ? user.businessHeadline : user.bio;
    const url = `https://avyracards.se/${user.username}`; // Alltid länk tillbaka till profilen

    // 3. Bygg vCard string (Version 3.0 för bredast stöd)
    let vcard = `BEGIN:VCARD
VERSION:3.0
N:${lastName};${firstName};;;
FN:${fullName}
`;

    // Lägg till valfria fält om de existerar
    if (company) vcard += `ORG:${company}\n`;
    if (title) vcard += `TITLE:${title}\n`;
    if (phone) vcard += `TEL;TYPE=CELL,VOICE:${phone}\n`;
    if (email) vcard += `EMAIL;TYPE=PREF,INTERNET:${email}\n`;
    if (website) vcard += `URL:${website}\n`;
    if (url && url !== website) vcard += `URL;type=AvyraProfile:${url}\n`;
    if (note) vcard += `NOTE:${note.replace(/\n/g, '\\n')}\n`; // Escape radbrytningar i anteckningar

    // Stäng kortet
    vcard += `END:VCARD`;

    // 4. Returnera som fil-nedladdning
    return new NextResponse(vcard, {
      status: 200,
      headers: {
        "Content-Type": "text/vcard; charset=utf-8",
        "Content-Disposition": `attachment; filename="${username}.vcf"`,
        // Cache control viktigt så webbläsaren inte sparar en gammal version
        "Cache-Control": "no-store, no-cache, must-revalidate", 
      },
    });

  } catch (error) {
    console.error("Error generating vCard:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}