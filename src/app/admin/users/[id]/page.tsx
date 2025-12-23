import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminUsers } from "@/actions/admin";
import { 
  Users, 
  Search, 
  Crown, 
  CreditCard, 
  Link as LinkIcon,
  ArrowUp,
  ArrowDown,
  ArrowUpDown
} from "lucide-react";

export const metadata = {
  title: "Admin | Användare",
};

// --- HJÄLPKOMPONENT FÖR SORTERING ---
function SortableHeader({ 
  label, 
  sortKey, 
  currentSort, 
  currentOrder, 
  searchQuery 
}: { 
  label: string; 
  sortKey: string; 
  currentSort: string; 
  currentOrder: string;
  searchQuery: string;
}) {
  const isActive = currentSort === sortKey;
  const newOrder = isActive && currentOrder === "asc" ? "desc" : "asc";
  
  // Behåll sökfrågan när vi byter sortering
  const href = `/admin/users?page=1&q=${searchQuery}&sort=${sortKey}&order=${newOrder}`;

  return (
    <Link href={href} className="group flex items-center gap-1 hover:text-white transition-colors">
      {label}
      {isActive ? (
        currentOrder === "asc" ? <ArrowUp size={14} className="text-blue-400" /> : <ArrowDown size={14} className="text-blue-400" />
      ) : (
        <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-50 transition-opacity" />
      )}
    </Link>
  );
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string; sort?: string; order?: string };
}) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");

  const query = searchParams.q || "";
  const page = Number(searchParams.page) || 1;
  const sort = searchParams.sort || "createdAt";
  const order = (searchParams.order === "asc" ? "asc" : "desc") as "asc" | "desc";

  // Hämta data med sortering
  const { users, totalPages, totalCount } = await getAdminUsers({
    page,
    query,
    sort,
    order,
  });

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
              <Users className="text-blue-500" /> Användare
            </h1>
            <p className="text-slate-400">
              Totalt {totalCount} användare i databasen.
            </p>
          </div>
          
          {/* Sökfält */}
          <form className="flex gap-2">
            {/* Vi gömmer sort/order input här för att inte tappa dem när man söker */}
            <input type="hidden" name="sort" value={sort} />
            <input type="hidden" name="order" value={order} />
            
            <input 
              name="q"
              defaultValue={query}
              placeholder="Sök namn/email..."
              className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            />
            <button type="submit" className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-lg">
              <Search size={20} />
            </button>
          </form>
        </div>

        {/* Tabell */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/50 text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-medium">
                    <SortableHeader label="Användare" sortKey="name" currentSort={sort} currentOrder={order} searchQuery={query} />
                  </th>
                  <th className="px-6 py-3 font-medium">
                    <SortableHeader label="Email" sortKey="email" currentSort={sort} currentOrder={order} searchQuery={query} />
                  </th>
                  <th className="px-6 py-3 font-medium">
                    <SortableHeader label="Status" sortKey="isPremium" currentSort={sort} currentOrder={order} searchQuery={query} />
                  </th>
                  <th className="px-6 py-3 font-medium text-center">Stats</th>
                  <th className="px-6 py-3 font-medium text-right flex justify-end">
                    <SortableHeader label="Reg. Datum" sortKey="createdAt" currentSort={sort} currentOrder={order} searchQuery={query} />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-800/30 group">
                    <td className="px-6 py-4">
                      <Link href={`/admin/users/${user.id}`} className="block">
                        <div className="font-medium text-slate-200 group-hover:text-blue-400 group-hover:underline">
                          {user.name || "Namnlös"}
                        </div>
                        <div className="text-xs text-slate-500 font-mono">
                          @{user.username}
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {user.email}
                    </td>
                    <td className="px-6 py-4">
                      {user.role === "ADMIN" ? (
                         <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-bold text-slate-300 border border-slate-700">
                           ADMIN
                         </span>
                      ) : user.isPremium ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400 border border-amber-500/20" title={user.premiumSource || "PAID"}>
                          <Crown size={12} /> PREMIUM
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-800/50 px-2.5 py-0.5 text-xs font-medium text-slate-500 border border-slate-800">
                          FREE
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1" title="Antal Länkar">
                          <LinkIcon size={12} /> {user._count.links}
                        </span>
                        <span className="flex items-center gap-1" title="Kopplade Kort">
                          <CreditCard size={12} /> {user._count.cards}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-slate-500 font-mono text-xs">
                      {new Date(user.createdAt).toLocaleDateString("sv-SE")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="p-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500">
            <span>Sida {page} av {totalPages}</span>
            <div className="flex gap-2">
              <Link 
                href={`/admin/users?page=${page - 1}&q=${query}&sort=${sort}&order=${order}`}
                className={`px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 ${page <= 1 ? "pointer-events-none opacity-50" : ""}`}
              >
                Föregående
              </Link>
              <Link 
                href={`/admin/users?page=${page + 1}&q=${query}&sort=${sort}&order=${order}`}
                className={`px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 ${page >= totalPages ? "pointer-events-none opacity-50" : ""}`}
              >
                Nästa
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}