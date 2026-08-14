import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminUsers } from "@/actions/admin"; // Server Action vi skapade nyss
import { 
  Users, 
  Search, 
  Crown, 
  CreditCard, 
  Link as LinkIcon 
} from "lucide-react";
import { getT } from "@/i18n/server";

export const metadata = {
  title: "Admin | Users",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const t = getT();
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");

  const query = searchParams.q || "";
  const page = Number(searchParams.page) || 1;

  // Hämta data via vår Server Action
  const { users, totalPages, totalCount } = await getAdminUsers({
    page,
    query,
  });

  return (
    <div className="min-h-screen bg-nordic-primary p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
              <Users className="text-blue-500" /> {t("admin.users.title")}
            </h1>
            <p className="text-nordic-highlight">
              {t("admin.users.total", { count: totalCount })}
            </p>
          </div>
          
          {/* Sökfält (Enkel form som laddar om sidan med ?q=...) */}
          <form className="flex gap-2">
            <input 
              name="q"
              defaultValue={query}
              placeholder={t("admin.users.searchPlaceholder")}
              className="bg-slate-900 border border-nordic-highlight/40 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            />
            <button type="submit" className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-lg">
              <Search size={20} />
            </button>
          </form>
        </div>

        {/* Tabell */}
        <div className="rounded-2xl border border-nordic-highlight/40 bg-slate-900/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/50 text-nordic-highlight">
                <tr>
                  <th className="px-6 py-3 font-medium">{t("admin.users.user")}</th>
                  <th className="px-6 py-3 font-medium">{t("admin.users.email")}</th>
                  <th className="px-6 py-3 font-medium">{t("admin.status")}</th>
                  <th className="px-6 py-3 font-medium text-center">{t("admin.users.stats")}</th>
                  <th className="px-6 py-3 font-medium text-right">Reg. Datum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-800/30 group">
                    <td className="px-6 py-4">
                      <Link href={`/admin/users/${user.id}`} className="block">
                        <div className="font-medium text-slate-200 group-hover:text-blue-400 group-hover:underline">
                          {user.name || t("admin.users.nameless")}
                        </div>
                        <div className="text-xs text-nordic-highlight font-mono">
                          @{user.username}
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-nordic-highlight">
                      {user.email}
                    </td>
                    <td className="px-6 py-4">
                      {user.role === "ADMIN" ? (
                         <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-bold text-slate-300 border border-nordic-highlight/40">
                           ADMIN
                         </span>
                      ) : user.isPremium ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400 border border-amber-500/20" title={user.premiumSource || "PAID"}>
                          <Crown size={12} /> PREMIUM
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-800/50 px-2.5 py-0.5 text-xs font-medium text-nordic-highlight border border-nordic-highlight/40">
                          FREE
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-4 text-xs text-nordic-highlight">
                        <span className="flex items-center gap-1" title={t("admin.users.linkCount")}>
                          <LinkIcon size={12} /> {user._count.links}
                        </span>
                        <span className="flex items-center gap-1" title="Kopplade Kort">
                          <CreditCard size={12} /> {user._count.cards}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-nordic-highlight font-mono text-xs">
                      {new Date(user.createdAt).toLocaleDateString("sv-SE")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination (Enkel) */}
          <div className="p-4 border-t border-nordic-highlight/40 flex justify-between items-center text-xs text-nordic-highlight">
            <span>Sida {page} av {totalPages}</span>
            <div className="flex gap-2">
              <Link 
                href={`/admin/users?page=${page - 1}&q=${query}`}
                className={`px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 ${page <= 1 ? "pointer-events-none opacity-50" : ""}`}
              >
                {t("admin.users.previous")}
              </Link>
              <Link 
                href={`/admin/users?page=${page + 1}&q=${query}`}
                className={`px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 ${page >= totalPages ? "pointer-events-none opacity-50" : ""}`}
              >
                {t("admin.users.next")}
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}