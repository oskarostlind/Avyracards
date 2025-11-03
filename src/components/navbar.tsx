import Link from "next/link";

import { SignInButton } from "@/components/sign-in-button";
import { SignOutButton } from "@/components/sign-out-button";
import { getCurrentSession } from "@/lib/session";

export async function Navbar() {
  const session = await getCurrentSession();
  const isAuthenticated = Boolean(session?.user);

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-semibold text-slate-900">
          SocialCard
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium text-slate-600">
          {isAuthenticated ? (
            <>
              <Link href="/dashboard" className="hover:text-slate-900">
                Dashboard
              </Link>
              <Link href="/profile/settings" className="hover:text-slate-900">
                Profil & tema
              </Link>
              <SignOutButton />
            </>
          ) : (
            <SignInButton />
          )}
        </nav>
      </div>
    </header>
  );
}
