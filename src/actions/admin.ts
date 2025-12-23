"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role, PremiumSource, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

// Hjälpfunktion för att säkra att bara admins kommer åt detta
async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) {
    throw new Error("Unauthorized: Admin access required");
  }
  return session;
}

// 1. Hämta användarlista (Sökbar + Paginering + Sortering)
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

  // Bygg sökfilter
  const where: Prisma.UserWhereInput = query
    ? {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { username: { contains: query, mode: "insensitive" } },
        ],
      }
    : {};

  // Bestäm sortering (säkerställer att vi inte skickar ogiltig data till Prisma)
  let orderBy: Prisma.UserOrderByWithRelationInput = { createdAt: "desc" };

  switch (sort) {
    case "name":
      orderBy = { name: order };
      break;
    case "email":
      orderBy = { email: order };
      break;
    case "username":
      orderBy = { username: order };
      break;
    case "isPremium":
      orderBy = { isPremium: order };
      break;
    case "createdAt":
      orderBy = { createdAt: order };
      break;
    // Fallback till createdAt desc
    default:
      orderBy = { createdAt: "desc" };
  }

  // Hämta data + totalt antal
  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      take: limit,
      skip,
      orderBy, // <-- Här används den dynamiska sorteringen
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

// 2. Hämta detaljer för en specifik användare
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

// 3. Hantera Premium
export async function toggleUserPremium(
  userId: string,
  shouldBePremium: boolean,
  source: PremiumSource = "GIFT"
) {
  const adminSession = await requireAdmin();

  if (shouldBePremium) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        isPremium: true,
        premiumSource: source,
        premiumGivenAt: new Date(),
        premiumExpiresAt: null,
        adminNotes: `Premium gifted by admin (${adminSession.user.email}) at ${new Date().toISOString()}`,
      },
    });
  } else {
    await prisma.user.update({
      where: { id: userId },
      data: {
        isPremium: false,
        premiumSource: null,
        premiumGivenAt: null,
        premiumExpiresAt: null,
        adminNotes: `Premium removed by admin (${adminSession.user.email}) at ${new Date().toISOString()}`,
      },
    });
  }

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
}

// 4. Uppdatera Admin Notes
export async function updateAdminNotes(userId: string, notes: string) {
  await requireAdmin();

  await prisma.user.update({
    where: { id: userId },
    data: { adminNotes: notes },
  });

  revalidatePath(`/admin/users/${userId}`);
}