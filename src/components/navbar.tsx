import Link from "next/link";

import { auth } from "@/auth";
import { SignInButton } from "@/components/sign-in-button";
import { SignOutButton } from "@/components/sign-out-button";

export async function Navbar() {
  const session = await auth();
  const isAuthenticated = Boolean(session?.user);

  return (
    <header className="border-b border-slate-900/70 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 md:py-4">
        {/* Vänster: logga + segment-switch */}
        <div className="flex items-center gap-4 md:gap-6">
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight text-slate-50 md:text-base"
          >
            SocialCard
          </Link>

          {/* Segment: Socialt | Business */}
          <nav
            aria-label="Segment"
            className="rounded-full border border-slate-800 bg-slate-900/80 px-1 py-0.5 text-xs text-slate-200 shadow-sm"
          >
            <ul className="flex items-center gap-1">
              <li>
                <Link
                  href="/#socialt"
                  className="rounded-full bg-slate-800 px-3 py-1 text-[11px] font-medium text-slate-50 shadow-sm hover:bg-slate-700"
                >
                  Socialt
                </Link>
              </li>
              <li>
                <Link
                  href="/#business"
                  className="rounded-full px-3 py-1 text-[11px] font-medium text-slate-200 hover:bg-slate-800/80 hover:text-slate-50"
                >
                  Business
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* Höger: auth / meny */}
        <nav
          aria-label="Huvudnavigering"
          className="flex items-center gap-3 text-xs md:gap-4 md:text-sm"
        >
          {isAuthenticated ? (
            <>
              <Link
                href="/dashboard"
                className="text-slate-200 hover:text-emerald-300"
              >
                Dashboard
              </Link>
              <Link
                href="/profile/settings"
                className="text-slate-200 hover:text-emerald-300"
              >
                Inställningar
              </Link>
              {/* Just nu pekar Teman också mot settings-sidan med en query-param.
                 Senare kan vi göra en egen vy eller tab för teman. */}
              <Link
                href="/profile/settings?view=themes"
                className="hidden text-slate-200 hover:text-emerald-300 sm:inline"
              >
                Teman
              </Link>
              <div className="ml-1">
                <SignOutButton />
              </div>
            </>
          ) : (
            <>
              <Link
                href="/register"
                className="rounded-full border border-slate-500/70 px-3 py-1.5 text-xs font-medium text-slate-100 hover:border-emerald-400 hover:text-emerald-300 md:px-4 md:text-sm"
              >
                Bli medlem
              </Link>
              <SignInButton />
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
