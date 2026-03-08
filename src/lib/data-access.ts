import { prisma } from "@/lib/prisma";

export async function getDashboardUserWithRecentOrders(userId: string) {
  const [user, hasOrderedCardOrder] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: {
        links: { orderBy: { order: "asc" } },
        orders: {
          where: { status: "PAID" },
          include: {
            items: {
              include: {
                productVariant: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    }),
    prisma.order.findFirst({
      where: {
        userId,
        status: "PAID",
        items: {
          some: {
            productVariant: {
              type: "PHYSICAL",
            },
          },
        },
      },
      select: { id: true },
    }),
  ]);

  if (!user) {
    return { user: null, hasOrderedCard: false };
  }

  return {
    user,
    hasOrderedCard: !!hasOrderedCardOrder,
  };
}

