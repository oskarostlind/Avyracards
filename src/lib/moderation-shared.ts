/**
 * Klientsäkra delar av moderationen. Ligger separat från `moderation.ts`
 * eftersom den senare importerar Prisma och mailern — importeras de från en
 * klientkomponent dras serverkod in i klientbundlen och bygget bryter.
 */

export const REPORT_REASON_KEYS = [
  "SPAM",
  "IMPERSONATION",
  "HARASSMENT",
  "SEXUAL_CONTENT",
  "VIOLENCE",
  "ILLEGAL",
  "OTHER",
] as const;

export type ReportReasonKey = (typeof REPORT_REASON_KEYS)[number];

export const REPORT_REASON_LABELS: Record<ReportReasonKey, string> = {
  SPAM: "Spam eller bedrägeri",
  IMPERSONATION: "Utger sig för att vara någon annan",
  HARASSMENT: "Trakasserier eller hat",
  SEXUAL_CONTENT: "Sexuellt eller stötande innehåll",
  VIOLENCE: "Våld eller hot",
  ILLEGAL: "Olagligt innehåll",
  OTHER: "Annat",
};

export function isReportReason(value: unknown): value is ReportReasonKey {
  return typeof value === "string" && value in REPORT_REASON_LABELS;
}

export const MODERATION_CONTACT_EMAIL = "kontakt@avyracards.se";
