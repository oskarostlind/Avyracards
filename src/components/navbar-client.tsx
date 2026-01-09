"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SignInButton } from "@/components/sign-in-button";
import { SignOutButton } from "@/components/sign-out-button";
import { ShieldCheck, ShoppingBag } from "lucide-react"; 

type NavbarClientProps = {
  isAuthenticated: boolean;
  isAdmin?: boolean;
};

export function NavbarClient({ isAuthenticated, isAdmin }: NavbarClientProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const inSocial = pathname === "/" || pathname.startsWith("/social");
  const inBusiness = pathname.startsWith("/business");
  const inShop = pathname === "/order"; // Kollar om vi är i shoppen

  const closeMenu = () => setIsOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-nordic-highlight/30 bg-nordic-primary/80 backdrop-blur">
      <div className="mx-auto w-full max-w-6xl px-4 py-3 md:py-4">
        {/* === MOBILNAV === */}
        <div className="flex items-center justify-between md:hidden">
          <Link
            href="/"
            onClick={closeMenu}
            className="text-base font-semibold tracking-tight text-nordic-secondary"
          >
            AvyraCards
          </Link>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex cursor-pointer items-center justify-center rounded-full border border-nordic-highlight/40 bg-nordic-primary/80 px-3 py-2 text-nordic-secondary transition hover:bg-nordic-primary/60"
            aria-label="Öppna meny"
          >
            {isOpen ? (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <div className="flex flex-col gap-0.5">
                <span className="h-0.5 w-4 rounded bg-nordic-secondary" />
                <span className="h-0.5 w-4 rounded bg-nordic-secondary" />
                <span className="h-0.5 w-4 rounded bg-nordic-secondary" />
              </div>
            )}
          </button>
        </div>

        {/* Mobilmeny Dropdown */}
        {isOpen && (
          <div className="absolute left-0 right-0 top-full border-b border-nordic-highlight/30 bg-nordic-primary/95 p-4 shadow-xl md:hidden animate-in slide-in-from-top-2">
            {isAuthenticated ? (
              <nav className="space-y-2">
                <div className="px-2 text-[10px] font-semibold uppercase tracking-wide text-nordic-highlight">
                  Mitt konto
                </div>

                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={closeMenu}
                    className="flex items-center gap-2 rounded-lg bg-nordic-accent/10 px-3 py-2 text-sm font-medium text-nordic-accent border border-nordic-accent/40 hover:bg-nordic-accent/15"
                  >
                    <ShieldCheck size={16} /> Admin Panel
                  </Link>
                )}

                <Link href="/dashboard" onClick={closeMenu} className="block rounded-lg px-3 py-2 text-sm text-nordic-secondary hover:bg-nordic-primary/70">
                  Dashboard
                </Link>
                
                {/* NY SHOP-LÄNK (MOBIL) - Samma stil som övriga */}
                <Link href="/order" onClick={closeMenu} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-nordic-secondary hover:bg-nordic-primary/70">
                   <ShoppingBag size={16} className="text-nordic-highlight"/> Köp Kort
                </Link>

                <Link href="/dashboard/analytics" onClick={closeMenu} className="block rounded-lg px-3 py-2 text-sm text-nordic-secondary hover:bg-nordic-primary/70">
                  Statistik
                </Link>
                <Link href="/profile/themes" onClick={closeMenu} className="block rounded-lg px-3 py-2 text-sm text-nordic-secondary hover:bg-nordic-primary/70">
                  Teman
                </Link>
                <Link href="/profile/settings" onClick={closeMenu} className="block rounded-lg px-3 py-2 text-sm text-nordic-secondary hover:bg-nordic-primary/70">
                  Inställningar
                </Link>

                <div className="mt-2 border-t border-nordic-highlight/30 pt-2 px-3">
                  <SignOutButton />
                </div>
              </nav>
            ) : (
              <nav className="space-y-3">
                <div className="px-2 text-[10px] font-semibold uppercase tracking-wide text-nordic-highlight">
                  Konto
                </div>
                <Link href="/get-started" onClick={closeMenu} className="block w-full text-center rounded-lg bg-nordic-accent/10 border border-nordic-accent/40 px-3 py-2 text-sm font-medium text-nordic-accent hover:bg-nordic-accent/15">
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
              className="text-sm font-semibold tracking-tight text-nordic-secondary md:text-base"
            >
              AvyraCards
            </Link>

            <nav aria-label="Segment" className="rounded-full border border-nordic-highlight/30 bg-nordic-primary/80 px-1 py-0.5 text-xs text-nordic-highlight shadow-sm">
              <ul className="flex items-center gap-1">
                <li>
                  <Link href="/social" className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${inSocial ? "bg-nordic-primary/70 text-nordic-secondary shadow-sm" : "text-nordic-highlight hover:bg-nordic-primary/70 hover:text-nordic-secondary"}`}>
                    Socialt
                  </Link>
                </li>
                <li>
                  <Link href="/business" className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${inBusiness ? "bg-nordic-primary/70 text-nordic-secondary shadow-sm" : "text-nordic-highlight hover:bg-nordic-primary/70 hover:text-nordic-secondary"}`}>
                    Business
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          <nav aria-label="Huvudnavigering" className="flex items-center gap-6 text-sm">
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <Link href="/admin" className="flex items-center gap-1.5 rounded-full bg-nordic-accent/10 px-3 py-1 text-xs font-bold text-nordic-accent border border-nordic-accent/40 hover:bg-nordic-accent/15 transition-colors">
                    <ShieldCheck size={14} /> Admin
                  </Link>
                )}

                <Link href="/dashboard" className="text-nordic-highlight hover:text-nordic-accent transition-colors">
                  Dashboard
                </Link>
                <Link href="/dashboard/analytics" className="text-nordic-highlight hover:text-nordic-accent transition-colors">
                  Statistik
                </Link>
                <Link href="/profile/themes" className="text-nordic-highlight hover:text-nordic-accent transition-colors">
                  Teman
                </Link>
                
                {/* NY SHOP-LÄNK (DESKTOP) - Subtil men tydlig */}
                <Link 
                    href="/order" 
                    className={`flex items-center gap-1.5 transition-colors ${inShop ? "text-nordic-accent font-medium" : "text-nordic-highlight hover:text-nordic-secondary"}`}
                >
                   <ShoppingBag size={16} className={inShop ? "text-nordic-accent" : "opacity-70"} /> Shop
                </Link>

                <Link href="/profile/settings" className="text-nordic-highlight hover:text-nordic-accent transition-colors">
                  Inställningar
                </Link>

                <div className="ml-1">
                  <SignOutButton />
                </div>
              </>
            ) : (
              <>
                <Link href="/get-started" className="rounded-full border border-nordic-highlight/40 px-4 py-1.5 text-sm font-medium text-nordic-secondary hover:border-nordic-accent hover:text-nordic-accent transition-colors">
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