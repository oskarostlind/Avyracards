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
  Users
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import type { OrderStatus } from "@prisma/client";

export const metadata = {
  title: "Admin Dashboard | AvyraCards",
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
function StatusBadge({ status }: { status: OrderStatus }) {
  switch (status) {
    case "PAID":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
          <CheckCircle size={12} /> Betald
        </span>
      );
    case "PENDING":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400 border border-amber-500/20">
          <Clock size={12} /> Väntar
        </span>
      );
    case "SHIPPED":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-400 border border-blue-500/20">
          <Truck size={12} /> Skickad
        </span>
      );
    case "FAILED":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400 border border-red-500/20">
          <AlertCircle size={12} /> Misslyckades
        </span>
      );
    default:
      return <span className="text-slate-500 text-xs">{status}</span>;
  }
}

export default async function AdminPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // 1. Hämta ordrar som måste hanteras (Betalda men ej skickade)
  const todoOrders = await prisma.order.findMany({
    where: { status: "PAID" },
    orderBy: { createdAt: "asc" }, // Äldsta först (FIFO)
  });

  // 2. Hämta de senaste ordrarna (för historik)
  const recentOrders = await prisma.order.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        
    {/* Header */}
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Orderöversikt</h1>
        <p className="text-slate-400">
          Välkommen tillbaka, {session.user.username}.
        </p>
      </div>
      <div className="flex gap-3">
        {/* --- NY KNAPP FÖR USERS --- */}
        <Link 
            href="/admin/users"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition shadow-lg shadow-blue-500/20"
          >
            <Users size={16} /> Hantera Användare
          </Link>

        {/* --- BEFINTLIG KNAPP FÖR PRODUKTER --- */}
        <Link 
            href="/admin/products"
            className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 transition shadow-lg shadow-purple-500/20"
          >
            <Tag size={16} /> Hantera Produkter
          </Link>

        <button className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 transition">
            <Search size={16} /> Sök order
        </button>
      </div>
    </div>

        {/* KPI / Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <div className="text-sm font-medium text-slate-400">Att skicka</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-100">{todoOrders.length}</span>
              <span className="text-sm text-slate-500">ordrar</span>
            </div>
          </div>
        </div>

        {/* SEKTION 1: ATT GÖRA (PRIO) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden">
          <div className="border-b border-slate-800 bg-slate-900/80 px-6 py-4">
            <h2 className="flex items-center gap-2 font-semibold text-emerald-400">
              <Package size={18} />
              Kräver åtgärd
            </h2>
          </div>
          
          {todoOrders.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-600">
                <CheckCircle size={24} />
              </div>
              <h3 className="text-slate-300 font-medium">Allt är klart!</h3>
              <p className="text-slate-500 text-sm">Inga nya ordrar väntar på att skickas just nu.</p>
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
                      <span className="font-mono text-sm text-slate-400">#{order.id.slice(-6).toUpperCase()}</span>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="font-medium text-slate-200">
                      {order.customerEmail}
                    </div>
                    <div className="text-xs text-slate-500">
                      Beställd {formatDate(order.createdAt)} &bull; {order.quantity} st kort
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
        <div className="rounded-2xl border border-slate-800 bg-slate-900/20">
          <div className="border-b border-slate-800 px-6 py-4">
            <h2 className="font-semibold text-slate-300">Senaste aktivitet</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/50 text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-medium">Order ID</th>
                  <th className="px-6 py-3 font-medium">Datum</th>
                  <th className="px-6 py-3 font-medium">Kund</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Belopp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-800/30">
                    <td className="px-6 py-4 font-mono text-slate-400">
                      <Link href={`/admin/orders/${order.id}`} className="hover:text-purple-400 hover:underline">
                        #{order.id.slice(-6).toUpperCase()}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{formatDate(order.createdAt)}</td>
                    <td className="px-6 py-4 text-slate-300">{order.customerEmail}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={order.status} />
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