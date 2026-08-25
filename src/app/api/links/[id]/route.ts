import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeLinkCustomization } from "@/lib/feature-access";
import { normalizeLinkUrl } from "@/utils/normalize-url";

export const runtime = "nodejs";

/**
 * `label` och `title` accepteras båda — dashboarden har historiskt skickat
 * `title` vid redigering, vilket tyst föll bort eftersom schemat bara kände
 * till `label`. Klienten skickar numera `label`, men vi tar emot båda så att
 * en gammal cachad klient inte tappar titeländringar.
 *
 * `url` valideras inte med z.string().url() längre: normaliseringen i
 * @/utils/normalize-url ska få chansen att lägga på https:// först.
 */
const updateSchema = z.object({
  label: z.string().min(1).max(60).optional(),
  title: z.string().min(1).max(60).optional(),
  url: z.string().min(1).max(2048).optional(),
  isVisible: z.boolean().optional(),
  icon: z.string().max(64).nullable().optional(),
  customColor: z.string().max(9).nullable().optional(),
});

interface Params {
  params: { id: string };
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json();
  const parsed = updateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Ogiltiga fält." }, { status: 400 });
  }

  const link = await prisma.link.findUnique({ where: { id: params.id } });
  if (!link || link.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};

  const nextLabel = parsed.data.label ?? parsed.data.title;
  if (nextLabel !== undefined) updateData.title = nextLabel.trim();

  if (parsed.data.url !== undefined) {
    const normalized = normalizeLinkUrl(parsed.data.url);
    if (!normalized.ok) {
      return NextResponse.json({ error: "Ogiltig URL." }, { status: 400 });
    }
    updateData.url = normalized.url;
  }

  if (parsed.data.isVisible !== undefined) {
    updateData.isActive = parsed.data.isVisible;
  }

  // Samma gating som POST /api/links och /api/themes/save: UI-låset är
  // bekvämlighet, det här är skyddet.
  const customizationInput: { icon?: unknown; customColor?: unknown } = {};
  if ("icon" in parsed.data) customizationInput.icon = parsed.data.icon;
  if ("customColor" in parsed.data) customizationInput.customColor = parsed.data.customColor;

  let sanitized = false;
  let removed: string[] = [];

  if (Object.keys(customizationInput).length > 0) {
    const account = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isPremium: true, role: true },
    });

    const customization = sanitizeLinkCustomization(customizationInput, {
      isPremium: account?.isPremium,
      isAdmin: account?.role === "ADMIN",
    });

    if (customization.icon !== undefined) updateData.icon = customization.icon;
    if (customization.customColor !== undefined) {
      updateData.customColor = customization.customColor;
    }

    sanitized = customization.sanitized;
    removed = customization.removed;
  }

  const updated = await prisma.link.update({
    where: { id: params.id },
    data: updateData,
  });

  return NextResponse.json({
    id: updated.id,
    label: updated.title,
    url: updated.url,
    isVisible: updated.isActive,
    icon: updated.icon,
    customColor: updated.customColor,
    sanitized,
    removed,
  });
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const link = await prisma.link.findUnique({ where: { id: params.id } });
  if (!link || link.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.link.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true });
}
