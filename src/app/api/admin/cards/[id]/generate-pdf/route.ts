import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import path from "path";
import fs from "fs/promises";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";

const MM_TO_PT = 2.834645669;
const PVC_SAFETY_MM = 4;
const PVC_PRINT_WIDTH_MM = 85.6 - 2 * PVC_SAFETY_MM;
const PVC_PRINT_HEIGHT_MM = 54 - 2 * PVC_SAFETY_MM;
const METAL_PRINT_WIDTH_MM = 82;
const METAL_PRINT_HEIGHT_MM = 51;

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cardId = params.id;
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    select: { material: true, printFileUrl: true },
  });

  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }
  if (!card.printFileUrl) {
    return NextResponse.json(
      { error: "No print file for this card" },
      { status: 404 }
    );
  }

  let imageBuffer: Buffer;
  try {
    const res = await fetch(card.printFileUrl);
    if (!res.ok) throw new Error("Failed to fetch image");
    const ab = await res.arrayBuffer();
    imageBuffer = Buffer.from(ab);
  } catch (e) {
    console.error("Fetch print image failed", e);
    return NextResponse.json(
      { error: "Could not load print image" },
      { status: 502 }
    );
  }

  const isPvc = card.material?.toLowerCase() === "plastic" || card.material?.toLowerCase() === "pvc" || card.material?.toLowerCase() === "standard";
  if (isPvc) {
    try {
      const alphaBuf = await sharp(imageBuffer).extractChannel("alpha").toBuffer();
      const mainBuf = await sharp(imageBuffer)
        .removeAlpha()
        .grayscale()
        .threshold(128)
        .toBuffer();
      imageBuffer = await sharp(mainBuf).joinChannel(alphaBuf).png().toBuffer();
    } catch (e) {
      console.error("Sharp PVC conversion failed", e);
      return NextResponse.json(
        { error: "Image processing failed" },
        { status: 500 }
      );
    }
  }

  const templateName = isPvc ? "pvc-template.pdf" : "metal-template.pdf";
  const templatePath = path.join(process.cwd(), "public", "templates", templateName);
  let templateBytes: Buffer;
  try {
    templateBytes = await fs.readFile(templatePath);
  } catch {
    return NextResponse.json(
      { error: "Template not found" },
      { status: 500 }
    );
  }

  const pdfDoc = await PDFDocument.load(templateBytes);
  const pages = pdfDoc.getPages();
  const page = pages[1]; // Sida 2 = kortets framsida (instruktioner är på sida 1) för både PVC och Metal
  if (!page) {
    return NextResponse.json(
      { error: "Template page not found" },
      { status: 500 }
    );
  }

  const pngBytes = new Uint8Array(imageBuffer);
  const pngImage = await pdfDoc.embedPng(pngBytes);
  const pageWidth = page.getWidth();
  const pageHeight = page.getHeight();

  const boxWidthPt = isPvc
    ? PVC_PRINT_WIDTH_MM * MM_TO_PT
    : METAL_PRINT_WIDTH_MM * MM_TO_PT;
  const boxHeightPt = isPvc
    ? PVC_PRINT_HEIGHT_MM * MM_TO_PT
    : METAL_PRINT_HEIGHT_MM * MM_TO_PT;
  const dims = pngImage.scaleToFit(boxWidthPt, boxHeightPt);

  // Centrera PNG (aspect 85.6/54) exakt i tryckytan / den röda ramen på sida 2
  const boxLeft = isPvc
    ? PVC_SAFETY_MM * MM_TO_PT
    : (pageWidth - boxWidthPt) / 2;
  const boxBottom = isPvc
    ? PVC_SAFETY_MM * MM_TO_PT
    : (pageHeight - boxHeightPt) / 2;
  const x = boxLeft + (boxWidthPt - dims.width) / 2;
  const y = boxBottom + (boxHeightPt - dims.height) / 2;

  page.drawImage(pngImage, {
    x,
    y,
    width: dims.width,
    height: dims.height,
  });

  const pdfBytes = await pdfDoc.save();
  return new NextResponse(pdfBytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="tryckfil.pdf"',
      "Content-Length": String(pdfBytes.length),
    },
  });
}
