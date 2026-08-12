"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role, ReportStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

/**
 * Moderationens serveråtgärder (Guideline 1.2). Apple kräver inte bara att
 * användare kan rapportera, utan att vi faktiskt *agerar* på rapporter — därför
 * finns avstängning av profil här, inte bara statusbyte på ärendet.
 */

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) {
    throw new Error("Unauthorized: Admin access required");
  }
  return session;
}

export async function getModerationQueue(status: ReportStatus | "ALL" = "PENDING") {
  await requireAdmin();

  const reports = await prisma.profileReport.findMany({
    where: status === "ALL" ? {} : { status },
    orderBy: { createdAt: "desc" },
    // Kön kan växa obegränsat — alltid ett tak, enligt datalagerriktlinjerna.
    take: 100,
    select: {
      id: true,
      reason: true,
      details: true,
      status: true,
      createdAt: true,
      reporterEmail: true,
      handledNote: true,
      reportedUser: {
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          isSuspended: true,
          suspendedReason: true,
        },
      },
    },
  });

  const pendingCount = await prisma.profileReport.count({
    where: { status: "PENDING" },
  });

  return { reports, pendingCount };
}

export async function setReportStatus(reportId: string, status: ReportStatus, note?: string) {
  const session = await requireAdmin();

  await prisma.profileReport.update({
    where: { id: reportId },
    data: {
      status,
      handledAt: new Date(),
      handledById: session.user.id,
      handledNote: note?.slice(0, 500) || null,
    },
  });

  revalidatePath("/admin/reports");
}

export async function setUserSuspension(
  userId: string,
  suspended: boolean,
  reason?: string
) {
  await requireAdmin();

  await prisma.user.update({
    where: { id: userId },
    data: {
      isSuspended: suspended,
      suspendedAt: suspended ? new Date() : null,
      suspendedReason: suspended ? reason?.slice(0, 500) || "Bryter mot användarvillkoren" : null,
    },
  });

  if (suspended) {
    // Alla öppna ärenden mot profilen är nu åtgärdade.
    await prisma.profileReport.updateMany({
      where: { reportedUserId: userId, status: { in: ["PENDING", "REVIEWING"] } },
      data: { status: "ACTIONED", handledAt: new Date() },
    });
  }

  revalidatePath("/admin/reports");
  revalidatePath(`/admin/users/${userId}`);
}
