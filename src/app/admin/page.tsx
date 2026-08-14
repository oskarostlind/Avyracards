import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  Package, 
  Truck, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  ChevronRight,
  Search,
  Tag, // <-- NY IMPORT
  Users,
  Activity,
  ShieldAlert,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import type { OrderStatus } from "@prisma/client";
import { getT } from "@/i18n/server";
import type { Translator } from "@/i18n";

export const metadata = {
  title: "Admin dashboard | AvyraCards",
};

// Hjälpfunktion för att formatera valuta (öre -> kr)
const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
};

// Hjälpfunktion för datum
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

// Komponent för status-badgar
function StatusBadge({ status, t }: { status: OrderStatus; t: Translator }) {
  switch (status) {
    case "PAID":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
          <CheckCircle size={12} /> {t("admin.orderStatus.PAID")}
        </span>
      );
    case "PENDING":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400 border border-amber-500/20">
          <Clock size={12} /> {t("admin.orderStatus.PENDING")}
        </span>
      );
    case "SHIPPED":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-400 border border-blue-500/20">
          <Truck size={12} /> {t("admin.orderStatus.SHIPPED")}
        </span>
      );
    case "FAILED":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400 border border-red-500/20">
          <AlertCircle size={12} /> {t("admin.orderStatus.FAILED")}
        </span>
      );
    default:
      return <span className="text-nordic-highlight text-xs">{status}</span>;
  }
}

export default async function AdminPage() {
  const t = getT();
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // 1. Hämta ordrar som måste hanteras (Betalda men ej skickade)
  const todoOrders = await prisma.order.findMany({
    where: { status: "PAID" },
    orderBy: { createdAt: "asc" }, // Äldsta först (FIFO)
    take: 50,
  });

  // 2. Hämta de senaste ordrarna (för historik)
  const recentOrders = await prisma.order.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-nordic-primary p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        
    {/* Header */}
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">{t("admin.ordersTitle")}</h1>
        <p className="text-nordic-highlight">
          {t("admin.welcomeBack", { name: session.user.username ?? "" })}
        </p>
      </div>
      <div className="flex gap-3">
        {/* --- NY KNAPP FÖR USERS --- */}
        <Link 
            href="/admin/users"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-nordic-secondary hover:bg-blue-500 transition shadow-lg shadow-blue-500/20"
          >
            <Users size={16} /> {t("admin.manageUsers")}
          </Link>

        {/* --- BEFINTLIG KNAPP FÖR PRODUKTER --- */}
        <Link 
            href="/admin/products"
            className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-nordic-secondary hover:bg-purple-500 transition shadow-lg shadow-purple-500/20"
          >
            <Tag size={16} /> {t("admin.manageProducts")}
          </Link>

        {/* --- MODERATION (Guideline 1.2: rapporterat användarinnehåll) --- */}
        <Link
            href="/admin/reports"
            className="flex items-center gap-2 rounded-lg bg-red-600/90 px-4 py-2 text-sm font-medium text-nordic-secondary hover:bg-red-500 transition shadow-lg shadow-red-500/20"
          >
            <ShieldAlert size={16} /> {t("admin.moderation")}
          </Link>

        {/* --- SYSTEMSTATUS (konfigurationskontroll) --- */}
        <Link
            href="/admin/system"
            className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 transition"
          >
            <Activity size={16} /> {t("admin.systemStatus")}
          </Link>

        <button className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 transition">
            <Search size={16} /> {t("admin.searchOrder")}
        </button>
      </div>
    </div>

        {/* KPI / Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-nordic-highlight/40 bg-slate-900/50 p-6">
            <div className="text-sm font-medium text-nordic-highlight">{t("admin.toShip")}</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-100">{todoOrders.length}</span>
              <span className="text-sm text-nordic-highlight">{t("admin.ordersSuffix")}</span>
            </div>
          </div>
        </div>

        {/* SEKTION 1: ATT GÖRA (PRIO) */}
        <div className="rounded-2xl border border-nordic-highlight/40 bg-slate-900/50 overflow-hidden">
          <div className="border-b border-nordic-highlight/40 bg-slate-900/80 px-6 py-4">
            <h2 className="flex items-center gap-2 font-semibold text-emerald-400">
              <Package size={18} />
              {t("admin.needsAction")}
            </h2>
          </div>
          
          {todoOrders.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-600">
                <CheckCircle size={24} />
              </div>
              <h3 className="text-slate-300 font-medium">{t("admin.allDone")}</h3>
              <p className="text-nordic-highlight text-sm">{t("admin.noPendingOrders")}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {todoOrders.map((order) => (
                <Link 
                  key={order.id} 
                  href={`/admin/orders/${order.id}`}
                  className="flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors group"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm text-nordic-highlight">#{order.id.slice(-6).toUpperCase()}</span>
                      <StatusBadge status={order.status} t={t} />
                    </div>
                    <div className="font-medium text-slate-200">
                      {order.customerEmail}
                    </div>
                    <div className="text-xs text-nordic-highlight">
                      {t("admin.orderedOn", { date: formatDate(order.createdAt), count: order.quantity })}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className="hidden sm:block font-medium text-slate-300">
                      {formatCurrency(order.amountTotal, order.currency)}
                    </span>
                    <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-300 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* SEKTION 2: SENASTE ORDRAR (HISTORIK) */}
        <div className="rounded-2xl border border-nordic-highlight/40 bg-slate-900/20">
          <div className="border-b border-nordic-highlight/40 px-6 py-4">
            <h2 className="font-semibold text-slate-300">{t("admin.recentActivity")}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/50 text-nordic-highlight">
                <tr>
                  <th className="px-6 py-3 font-medium">Order ID</th>
                  <th className="px-6 py-3 font-medium">{t("admin.date")}</th>
                  <th className="px-6 py-3 font-medium">{t("admin.customer")}</th>
                  <th className="px-6 py-3 font-medium">{t("admin.status")}</th>
                  <th className="px-6 py-3 font-medium text-right">{t("admin.amount")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-800/30">
                    <td className="px-6 py-4 font-mono text-nordic-highlight">
                      <Link href={`/admin/orders/${order.id}`} className="hover:text-purple-400 hover:underline">
                        #{order.id.slice(-6).toUpperCase()}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{formatDate(order.createdAt)}</td>
                    <td className="px-6 py-4 text-slate-300">{order.customerEmail}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={order.status} t={t} />
                    </td>
                    <td className="px-6 py-4 text-right text-slate-300">
                      {formatCurrency(order.amountTotal, order.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}