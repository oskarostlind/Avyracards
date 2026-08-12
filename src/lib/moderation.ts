import { ReportReason } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendMailSafe } from "@/lib/mailer";
import {
  MODERATION_CONTACT_EMAIL,
  REPORT_REASON_LABELS,
} from "@/lib/moderation-shared";

export {
  MODERATION_CONTACT_EMAIL,
  REPORT_REASON_LABELS,
  isReportReason,
} from "@/lib/moderation-shared";

/**
 * Guideline 1.2 kräver fyra saker av en app med användarskapat innehåll:
 * filtrering, rapportering, blockering och en publicerad kontaktväg. Den här
 * modulen bär rapport- och moderationsdelen så att API-routes, admin-vyn och
 * de publika profilerna delar samma regler.
 */

/** Adress som moderationsärenden skickas till. Faller tillbaka på kontaktadressen. */
export function getModerationInbox(): string {
  return process.env.MODERATION_EMAIL ?? MODERATION_CONTACT_EMAIL;
}

export const REPORT_REASONS = Object.keys(REPORT_REASON_LABELS) as ReportReason[];

interface CreateReportInput {
  reportedUserId: string;
  reportedUsername: string;
  reporterUserId?: string | null;
  reporterEmail?: string | null;
  reason: ReportReason;
  details?: string | null;
}

/**
 * Sparar rapporten och larmar moderationen. Mailet skickas med sendMailSafe:
 * ett mailfel får aldrig göra att rapporten ser ut att misslyckas för den som
 * anmäler — Apple testar just att rapportknappen kvitterar.
 */
export async function createProfileReport(input: CreateReportInput) {
  const report = await prisma.profileReport.create({
    data: {
      reportedUserId: input.reportedUserId,
      reporterUserId: input.reporterUserId ?? null,
      reporterEmail: input.reporterEmail?.trim() || null,
      reason: input.reason,
      details: input.details?.slice(0, 2000) || null,
    },
    select: { id: true, createdAt: true },
  });

  const pendingCount = await prisma.profileReport.count({
    where: { reportedUserId: input.reportedUserId, status: "PENDING" },
  });

  await sendMailSafe({
    to: getModerationInbox(),
    subject: `[Moderation] Rapporterad profil: @${input.reportedUsername}`,
    text: [
      `Ny rapport om användarinnehåll`,
      `Profil: @${input.reportedUsername}`,
      `Anledning: ${REPORT_REASON_LABELS[input.reason]}`,
      `Beskrivning: ${input.details ?? "—"}`,
      `Rapportör: ${input.reporterEmail ?? input.reporterUserId ?? "anonym"}`,
      `Öppna rapporter mot profilen: ${pendingCount}`,
      `Moderationskö: https://avyracards.se/admin/reports`,
      `Rapport-ID: ${report.id}`,
    ].join("\n"),
    html: `
      <h2>Ny rapport om användarinnehåll</h2>
      <p><strong>Profil:</strong> @${escapeHtml(input.reportedUsername)}</p>
      <p><strong>Anledning:</strong> ${escapeHtml(REPORT_REASON_LABELS[input.reason])}</p>
      <p><strong>Beskrivning:</strong><br>${escapeHtml(input.details ?? "—")}</p>
      <p><strong>Rapportör:</strong> ${escapeHtml(
        input.reporterEmail ?? input.reporterUserId ?? "anonym"
      )}</p>
      <p><strong>Öppna rapporter mot profilen:</strong> ${pendingCount}</p>
      <p><a href="https://avyracards.se/admin/reports">Öppna moderationskön</a></p>
      <p style="color:#666;font-size:12px">Rapport-ID: ${report.id}</p>
    `,
  });

  return report;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** True om `viewerId` har blockerat `profileUserId`. */
export async function hasBlocked(
  viewerId: string | null | undefined,
  profileUserId: string
): Promise<boolean> {
  if (!viewerId) return false;

  const block = await prisma.userBlock.findUnique({
    where: { blockerId_blockedId: { blockerId: viewerId, blockedId: profileUserId } },
    select: { id: true },
  });

  return Boolean(block);
}
