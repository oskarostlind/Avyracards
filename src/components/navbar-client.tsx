"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SignInButton } from "@/components/sign-in-button";
import { SignOutButton } from "@/components/sign-out-button";

type NavbarClientProps = {
  isAuthenticated: boolean;
};

export function NavbarClient({ isAuthenticated }: NavbarClientProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const inSocial = pathname === "/" || pathname.startsWith("/social");
  const inBusiness = pathname.startsWith("/business");

  const closeMenu = () => setIsOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-900/70 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto w-full max-w-6xl px-4 py-3 md:py-4">
        
        {/* === MOBILNAV === */}
        <div className="flex items-center justify-between md:hidden">
          <Link
            href="/"
            onClick={closeMenu}
            className="text-base font-semibold tracking-tight text-slate-50"
          >
            SocialCard
          </Link>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex cursor-pointer items-center justify-center rounded-full border border-slate-700 bg-slate-900/80 px-3 py-2 text-slate-100 transition hover:bg-slate-800"
            aria-label="Öppna meny"
          >
            {isOpen ? (
               <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               </svg>
            ) : (
               <div className="flex flex-col gap-0.5">
                  <span className="h-0.5 w-4 rounded bg-slate-100" />
                  <span className="h-0.5 w-4 rounded bg-slate-100" />
                  <span className="h-0.5 w-4 rounded bg-slate-100" />
               </div>
            )}
          </button>
        </div>

        {/* Mobilmeny Dropdown */}
        {isOpen && (
          <div className="absolute left-0 right-0 top-full border-b border-slate-800 bg-slate-950/95 p-4 shadow-xl md:hidden animate-in slide-in-from-top-2">
             
             

             {/* Konto Navigation */}
             {isAuthenticated ? (
                <nav className="space-y-2">
                   <div className="px-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Mitt konto
                   </div>
                   <Link
                      href="/dashboard"
                      onClick={closeMenu}
                      className="block rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-slate-800/80"
                   >
                      Dashboard
                   </Link>
                   
                   {/* NY LÄNK: STATISTIK */}
                   <Link
                      href="/dashboard/analytics"
                      onClick={closeMenu}
                      className="block rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-slate-800/80"
                   >
                      Statistik
                   </Link>
                   <Link
                      href="/profile/settings?view=themes"
                      onClick={closeMenu}
                      className="block rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-slate-800/80"
                   >
                      Teman
                   </Link>
                   <Link
                      href="/profile/settings"
                      onClick={closeMenu}
                      className="block rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-slate-800/80"
                   >
                      Inställningar
                   </Link>

                   <div className="mt-2 border-t border-slate-800 pt-2 px-3">
                      <SignOutButton />
                   </div>
                </nav>
             ) : (
                <nav className="space-y-3">
                   <div className="px-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Konto
                   </div>
                   <Link
                      href="/get-started"
                      onClick={closeMenu}
                      className="block w-full text-center rounded-lg bg-emerald-500/10 border border-emerald-500/50 px-3 py-2 text-sm font-medium text-emerald-400 hover:bg-emerald-500/20"
                   >
                      Kom igång
                   </Link>
                   <div className="px-3">
                      <SignInButton />
                   </div>
                </nav>
             )}
          </div>
        )}

        {/* === DESKTOPNAV === */}
        <div className="hidden items-center justify-between md:flex">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-semibold tracking-tight text-slate-50 md:text-base"
            >
              SocialCard
            </Link>

            <nav aria-label="Segment" className="rounded-full border border-slate-800 bg-slate-900/80 px-1 py-0.5 text-xs text-slate-200 shadow-sm">
               <ul className="flex items-center gap-1">
                  <li>
                     <Link href="/social" className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${inSocial ? "bg-slate-800 text-slate-50 shadow-sm" : "text-slate-200 hover:bg-slate-800/80 hover:text-slate-50"}`}>
                        Socialt
                     </Link>
                  </li>
                  <li>
                     <Link href="/business" className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${inBusiness ? "bg-slate-800 text-slate-50 shadow-sm" : "text-slate-200 hover:bg-slate-800/80 hover:text-slate-50"}`}>
                        Business
                     </Link>
                  </li>
               </ul>
            </nav>
          </div>

          <nav aria-label="Huvudnavigering" className="flex items-center gap-4 text-sm">
            {isAuthenticated ? (
               <>
                  <Link href="/dashboard" className="text-slate-200 hover:text-emerald-300 transition-colors">
                     Dashboard
                  </Link>
                  
                  {/* NY LÄNK: STATISTIK */}
                  <Link href="/dashboard/analytics" className="text-slate-200 hover:text-emerald-300 transition-colors">
                     Statistik
                  </Link>
                  <Link href="/profile/settings?view=themes" className="text-slate-200 hover:text-emerald-300 transition-colors">
                     Teman
                  </Link>
                  <Link href="/profile/settings" className="text-slate-200 hover:text-emerald-300 transition-colors">
                     Inställningar
                  </Link>
                  
                  <div className="ml-1">
                     <SignOutButton />
                  </div>
               </>
            ) : (
               <>
                  <Link href="/get-started" className="rounded-full border border-slate-500/70 px-4 py-1.5 text-sm font-medium text-slate-100 hover:border-emerald-400 hover:text-emerald-300 transition-colors">
                     Kom igång
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