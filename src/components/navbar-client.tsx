"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SignInButton } from "@/components/sign-in-button";
import { SignOutButton } from "@/components/sign-out-button";

type NavbarClientProps = {
  isAuthenticated: boolean;
};

export function NavbarClient({ isAuthenticated }: NavbarClientProps) {
  const pathname = usePathname();

  const inSocial = pathname === "/" || pathname.startsWith("/social");
  const inBusiness = pathname.startsWith("/business");

  return (
    <header className="border-b border-slate-900/70 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto w-full max-w-6xl px-4 py-3 md:py-4">
        {/* === MOBILNAV (md:hidden) === */}
        <div className="flex items-center justify-between md:hidden">
          {/* Logo */}
          <Link
            href="/"
            className="text-base font-semibold tracking-tight text-slate-50"
          >
            SocialCard
          </Link>

          {/* Hamburgermeny */}
          <details className="group relative">
            <summary className="flex cursor-pointer list-none items-center justify-center rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-100">
              <span className="sr-only">Öppna meny</span>
              <span className="flex flex-col gap-0.5">
                <span className="h-0.5 w-4 rounded bg-slate-100" />
                <span className="h-0.5 w-4 rounded bg-slate-100" />
                <span className="h-0.5 w-4 rounded bg-slate-100" />
              </span>
            </summary>
            <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-slate-800 bg-slate-950/95 p-2 text-xs text-slate-100 shadow-xl">
              {/* Socialt / Business först i menyn på mobil */}
              <div className="mb-2 rounded-xl bg-slate-900/80 p-1">
                <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Utforska
                </div>
                <nav className="space-y-1">
                  <Link
                    href="/social"
                    className={`block rounded-lg px-3 py-1.5 text-xs ${
                      inSocial
                        ? "bg-slate-800/80 text-slate-50"
                        : "text-slate-100 hover:bg-slate-800/80"
                    }`}
                  >
                    Socialt
                  </Link>
                  <Link
                    href="/business"
                    className={`block rounded-lg px-3 py-1.5 text-xs ${
                      inBusiness
                        ? "bg-slate-800/80 text-slate-50"
                        : "text-slate-100 hover:bg-slate-800/80"
                    }`}
                  >
                    Business
                  </Link>
                </nav>
              </div>

              {/* Separat block för konto / navigation */}
              {isAuthenticated ? (
                <nav className="space-y-1">
                  <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Mitt konto
                  </div>
                  <Link
                    href="/dashboard"
                    className="block rounded-lg px-3 py-1.5 hover:bg-slate-800/80"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/profile/settings"
                    className="block rounded-lg px-3 py-1.5 hover:bg-slate-800/80"
                  >
                    Inställningar
                  </Link>
                  <Link
                    href="/profile/settings?view=themes"
                    className="block rounded-lg px-3 py-1.5 hover:bg-slate-800/80"
                  >
                    Teman
                  </Link>
                  <div className="mt-1 border-t border-slate-800 pt-1.5">
                    <SignOutButton />
                  </div>
                </nav>
              ) : (
                <nav className="space-y-1">
                  <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Konto
                  </div>
                  <Link
                    href="/register"
                    className="block rounded-lg px-3 py-1.5 hover:bg-slate-800/80"
                  >
                    Bli medlem
                  </Link>
                  <div className="mt-1 border-t border-slate-800 pt-1.5">
                    <SignInButton />
                  </div>
                </nav>
              )}
            </div>
          </details>
        </div>

        {/* === DESKTOPNAV (hidden md:flex) === */}
        <div className="hidden items-center justify-between md:flex">
          {/* Vänster: logga + segment-switch */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-semibold tracking-tight text-slate-50 md:text-base"
            >
              SocialCard
            </Link>

            {/* Segment Socialt / Business – desktop */}
            <nav
              aria-label="Segment"
              className="rounded-full border border-slate-800 bg-slate-900/80 px-1 py-0.5 text-xs text-slate-200 shadow-sm"
            >
              <ul className="flex items-center gap-1">
                <li>
                  <Link
                    href="/social"
                    className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${
                      inSocial
                        ? "bg-slate-800 text-slate-50 shadow-sm"
                        : "text-slate-200 hover:bg-slate-800/80 hover:text-slate-50"
                    }`}
                  >
                    Socialt
                  </Link>
                </li>
                <li>
                  <Link
                    href="/business"
                    className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${
                      inBusiness
                        ? "bg-slate-800 text-slate-50 shadow-sm"
                        : "text-slate-200 hover:bg-slate-800/80 hover:text-slate-50"
                    }`}
                  >
                    Business
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* Höger: auth / meny desktop */}
          <nav
            aria-label="Huvudnavigering"
            className="flex items-center gap-4 text-sm"
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
                <Link
                  href="/profile/settings?view=themes"
                  className="text-slate-200 hover:text-emerald-300"
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
                  className="rounded-full border border-slate-500/70 px-4 py-1.5 text-sm font-medium text-slate-100 hover:border-emerald-400 hover:text-emerald-300"
                >
                  Bli medlem
                </Link>
                <SignInButton />
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
