import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import type { OrderStatus, Prisma } from "@prisma/client";
import { getT } from "@/i18n/server";
import { GiftOrderForm } from "@/components/admin/gift-order-form";

export async function generateMetadata() {
  return { title: getT()("admin.ordersList.metaTitle") };
}

const STATUSES: (OrderStatus | "ALL")[] = ["ALL", "PAID", "SHIPPED", "PENDING", "FAILED"];

const formatCurrency = (amount: number, currency: string) =>
  new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("sv-SE", { dateStyle: "medium", timeStyle: "short" }).format(date);

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string };
}) {
  const t = getT();
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");

  const q = searchParams.q?.trim() ?? "";
  const status = (STATUSES as string[]).includes(searchParams.status ?? "")
    ? (searchParams.status as OrderStatus | "ALL")
    : "ALL";

  const where: Prisma.OrderWhereInput = {
    ...(status !== "ALL" ? { status } : {}),
    ...(q
      ? {
          OR: [
            { customerEmail: { contains: q, mode: "insensitive" } },
            // Admin-UI:t visar de sista 6 tecknen som ordernummer — matcha på suffix.
            { id: { endsWith: q.toLowerCase() } },
            { id: q },
          ],
        }
      : {}),
  };

  const [orders, giftableVariants] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        cards: { select: { status: true } },
      },
    }),
    // Bara aktiva fysiska varianter kan ges bort — prenumerationer har inga kort.
    prisma.productVariant.findMany({
      where: { isActive: true, type: "PHYSICAL" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="min-h-screen bg-nordic-primary p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <Link
              href="/admin"
              className="mb-4 inline-flex items-center gap-2 text-sm text-nordic-highlight hover:text-nordic-secondary transition-colors"
            >
              <ArrowLeft size={16} /> {t("admin.order.backToOverview")}
            </Link>
            <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-100">
              <Package size={22} className="text-purple-400" />
              {t("admin.ordersList.title")}
            </h1>
          </div>
          <GiftOrderForm variants={giftableVariants} />
        </div>

        {/* Sök + statusfilter (GET-formulär: delbar URL, ingen client-JS) */}
        <form method="GET" action="/admin/orders" className="flex flex-wrap items-center gap-3">
          {status !== "ALL" && <input type="hidden" name="status" value={status} />}
          <div className="relative flex-1 min-w-[240px]">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-nordic-highlight"
            />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder={t("admin.ordersList.searchPlaceholder")}
              className="w-full rounded-lg border border-nordic-highlight/40 bg-slate-900/50 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder:text-nordic-highlight focus:border-purple-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-nordic-secondary hover:bg-purple-500 transition"
          >
            {t("admin.ordersList.searchButton")}
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <Link
              key={s}
              href={`/admin/orders?${new URLSearchParams({
                ...(q ? { q } : {}),
                ...(s !== "ALL" ? { status: s } : {}),
              }).toString()}`}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                status === s
                  ? "bg-slate-100 text-slate-900"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {s === "ALL" ? t("admin.ordersList.filterAll") : t(`admin.orderStatus.${s}`)}
            </Link>
          ))}
        </div>

        {orders.length === 0 ? (
          <div className="rounded-2xl border border-nordic-highlight/30 bg-slate-900/50 p-10 text-center text-sm text-nordic-highlight">
            {t("admin.ordersList.empty")}
          </div>
        ) : (
          <div className="rounded-2xl border border-nordic-highlight/40 bg-slate-900/20 overflow-hidden">
            <div className="border-b border-nordic-highlight/40 px-6 py-3 text-xs text-nordic-highlight">
              {t("admin.ordersList.showing", { count: orders.length })}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900/50 text-nordic-highlight">
                  <tr>
                    <th className="px-6 py-3 font-medium">Order ID</th>
                    <th className="px-6 py-3 font-medium">{t("admin.date")}</th>
                    <th className="px-6 py-3 font-medium">{t("admin.customer")}</th>
                    <th className="px-6 py-3 font-medium">{t("admin.status")}</th>
                    <th className="px-6 py-3 font-medium">{t("admin.ordersList.cards")}</th>
                    <th className="px-6 py-3 font-medium text-right">{t("admin.amount")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {orders.map((order) => {
                    const claimed = order.cards.filter((c) => c.status === "CLAIMED").length;
                    return (
                      <tr key={order.id} className="hover:bg-slate-800/30">
                        <td className="px-6 py-4 font-mono text-nordic-highlight">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="hover:text-purple-400 hover:underline"
                          >
                            #{order.id.slice(-6).toUpperCase()}
                          </Link>
                          {order.checkoutSource === "admin_gift" && (
                            <span className="ml-2 rounded-full border border-pink-500/20 bg-pink-500/10 px-2 py-0.5 font-sans text-[10px] font-medium text-pink-400">
                              {t("admin.giftOrder.badge")}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-300">{formatDate(order.createdAt)}</td>
                        <td className="px-6 py-4 text-slate-300">{order.customerEmail}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                              order.status === "PAID"
                                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                                : order.status === "SHIPPED"
                                  ? "border-blue-500/20 bg-blue-500/10 text-blue-400"
                                  : order.status === "PENDING"
                                    ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
                                    : "border-red-500/20 bg-red-500/10 text-red-400"
                            }`}
                          >
                            {t(`admin.orderStatus.${order.status}`)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-300">
                          {t("admin.ordersList.cardsClaimed", {
                            claimed,
                            total: order.cards.length,
                          })}
                        </td>
                        <td className="px-6 py-4 text-right text-slate-300">
                          {formatCurrency(order.amountTotal, order.currency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
