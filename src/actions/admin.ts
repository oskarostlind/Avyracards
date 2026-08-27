"use server";

import { auth, signIn } from "@/auth"; 
import { prisma } from "@/lib/prisma";
import { Role, PremiumSource, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { sendSystemNotification } from "@/lib/notifications";

// Hjälpfunktion för att säkra att bara admins kommer åt detta
async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) {
    throw new Error("Unauthorized: Admin access required");
  }
  return session;
}

// 1. Hämta användarlista 
export async function getAdminUsers({
  page = 1,
  query = "",
  limit = 20,
  sort = "createdAt",
  order = "desc",
}: {
  page?: number;
  query?: string;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}) {
  await requireAdmin();

  const skip = (page - 1) * limit;

  const where: Prisma.UserWhereInput = query
    ? {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { username: { contains: query, mode: "insensitive" } },
        ],
      }
    : {};

  let orderBy: Prisma.UserOrderByWithRelationInput = { createdAt: "desc" };

  switch (sort) {
    case "name": orderBy = { name: order }; break;
    case "email": orderBy = { email: order }; break;
    case "username": orderBy = { username: order }; break;
    case "isPremium": orderBy = { isPremium: order }; break;
    case "createdAt": orderBy = { createdAt: order }; break;
    default: orderBy = { createdAt: "desc" };
  }

  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      take: limit,
      skip,
      orderBy,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        isPremium: true,
        premiumSource: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            links: true,
            cards: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
    totalCount,
  };
}

// 2. Hämta detaljer 
export async function getAdminUserDetails(userId: string) {
  await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      cards: true, 
      _count: {
        select: {
          links: true,
          analyticsEvents: true,
        },
      },
    },
  });

  if (!user) throw new Error("User not found");

  return user;
}

// Anteckningarna är en append-logg i ett enda textfält (User.adminNotes) —
// ingen egen tabell. Nya poster läggs överst med tidsstämpel. Tidigare skrev
// både premium-togglen och spara-knappen ÖVER hela fältet, så anteckningar
// försvann; nu appendas allt. Cap:as så fältet inte växer obegränsat.
const ADMIN_NOTES_MAX_LENGTH = 20_000;

function appendToAdminNotes(existing: string | null, entry: string): string {
  const stamp = new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Stockholm",
  }).format(new Date());

  const line = `[${stamp}] ${entry.trim()}`;
  const combined = existing?.trim() ? `${line}\n\n${existing.trim()}` : line;
  // Trunkera i botten (äldsta) om loggen blivit för lång.
  return combined.length > ADMIN_NOTES_MAX_LENGTH
    ? combined.slice(0, ADMIN_NOTES_MAX_LENGTH)
    : combined;
}

// 3. Hantera Premium
export async function toggleUserPremium(
  userId: string,
  shouldBePremium: boolean,
  source: PremiumSource = "GIFT"
) {
  const adminSession = await requireAdmin();

  if (shouldBePremium) {
    // Läs före skrivningen så att bara en faktisk aktivering ger mail — en
    // admin som klickar "ge premium" på ett konto som redan har det ska inte
    // mejla användaren igen.
    const before = await prisma.user.findUnique({
      where: { id: userId },
      select: { isPremium: true, email: true, name: true, adminNotes: true },
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        isPremium: true,
        premiumSource: source,
        premiumGivenAt: new Date(),
        premiumExpiresAt: null,
        adminNotes: appendToAdminNotes(
          before?.adminNotes ?? null,
          `Premium gavs av admin (${adminSession.user.email})`
        ),
      },
    });

    if (before && !before.isPremium) {
      await sendSystemNotification({
        type: "premium_activated",
        to: before.email,
        name: before.name,
        source: "gift",
      });
    }
  } else {
    const before = await prisma.user.findUnique({
      where: { id: userId },
      select: { adminNotes: true },
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        isPremium: false,
        premiumSource: null,
        premiumGivenAt: null,
        premiumExpiresAt: null,
        adminNotes: appendToAdminNotes(
          before?.adminNotes ?? null,
          `Premium togs bort av admin (${adminSession.user.email})`
        ),
      },
    });
  }

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
}

// 4. Lägg till en admin-anteckning (append — skriver aldrig över loggen)
export async function addAdminNote(userId: string, note: string) {
  await requireAdmin();

  const trimmed = note.trim();
  if (!trimmed) return;

  const before = await prisma.user.findUnique({
    where: { id: userId },
    select: { adminNotes: true },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { adminNotes: appendToAdminNotes(before?.adminNotes ?? null, trimmed) },
  });

  revalidatePath(`/admin/users/${userId}`);
}

// 5. Impersonate User 
export async function impersonateUser(userId: string) {
  const session = await requireAdmin(); 

  console.log(`🕵️ Admin ${session.user.email} is impersonating user ${userId}`);

  await signIn("credentials", {
    impersonateId: userId,
    adminSecret: process.env.NEXTAUTH_SECRET, // ÄNDRAT HÄR: Använder NEXTAUTH_SECRET
    redirectTo: "/dashboard", 
  });
}