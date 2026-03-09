"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useIsApp } from "@/hooks/useIsApp";
import { SignInButton } from "@/components/sign-in-button";
import { SignOutButton } from "@/components/sign-out-button";
import { 
  ShieldCheck, 
  ShoppingBag, 
  LayoutDashboard, 
  BarChart3, 
  Palette, 
  Settings,
  Menu,
  X 
} from "lucide-react"; 

type NavbarClientProps = {
  isAuthenticated: boolean;
  isAdmin?: boolean;
};

// Vi definierar länkarna här för att hålla koden ren och enkel att ändra
const navLinks = [
  { 
    name: "Dashboard", 
    href: "/dashboard", 
    icon: LayoutDashboard,
    exact: true 
  },  
  { 
    name: "Teman", 
    href: "/profile/themes", 
    icon: Palette,
    exact: false
  },
  { 
    name: "Statistik", 
    href: "/dashboard/analytics", 
    icon: BarChart3,
    exact: false
  },

  { 
    name: "Shop", 
    href: "/order", 
    icon: ShoppingBag,
    exact: true
  },
  { 
    name: "Inställningar", 
    href: "/profile/settings", 
    icon: Settings,
    exact: false
  },
];

export function NavbarClient({ isAuthenticated, isAdmin }: NavbarClientProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const isApp = useIsApp();

  const inSocial = pathname === "/" || pathname.startsWith("/social");
  const inBusiness = pathname.startsWith("/business");

  const closeMenu = () => setIsOpen(false);

  // Hjälpfunktion för att kolla om en länk är aktiv
  const isLinkActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <header
      className={`sticky top-0 z-50 border-b border-nordic-highlight/10 bg-nordic-primary/80 backdrop-blur-md ${
        isApp ? "pt-[env(safe-area-inset-top,20px)]" : ""
      }`}
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-3 md:py-4">
        
        {/* === MOBILNAV (HEADER) === */}
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
            className="flex cursor-pointer items-center justify-center rounded-full border border-nordic-highlight/20 bg-nordic-primary/50 px-3 py-2 text-nordic-secondary transition hover:bg-nordic-primary/80"
            aria-label={isOpen ? "Stäng meny" : "Öppna meny"}
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* === MOBIL MENY (DROPDOWN) === */}
        {isOpen && (
          <div className="absolute left-0 right-0 top-full border-b border-nordic-highlight/20 bg-[#050505] p-4 shadow-2xl md:hidden animate-in slide-in-from-top-2">
            {isAuthenticated ? (
              <nav className="space-y-2">
                <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wide text-nordic-highlight/60">
                  Meny
                </div>

                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={closeMenu}
                    className="flex items-center gap-3 rounded-xl bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400 border border-red-500/20 hover:bg-red-500/20 mb-4"
                  >
                    <ShieldCheck size={18} /> Admin Panel
                  </Link>
                )}

                {navLinks.map((link) => {
                  const active = isLinkActive(link.href, link.exact);
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={closeMenu}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                        active
                          ? "bg-nordic-accent/10 text-nordic-accent border border-nordic-accent/20"
                          : "text-nordic-secondary hover:bg-white/5"
                      }`}
                    >
                      <Icon size={18} className={active ? "text-nordic-accent" : "text-nordic-highlight"} />
                      {link.name}
                    </Link>
                  );
                })}

                <div className="mt-4 border-t border-nordic-highlight/20 pt-4 px-2">
                  <SignOutButton />
                </div>
              </nav>
            ) : (
              <nav className="space-y-3">
                 <Link href="/get-started" onClick={closeMenu} className="block w-full text-center rounded-lg bg-nordic-accent text-nordic-primary font-bold px-3 py-3 text-sm">
                  Kom igång
                </Link>
                <div className="flex justify-center">
                  <SignInButton />
                </div>
              </nav>
            )}
          </div>
        )}

        {/* === DESKTOPNAV === */}
        <div className="hidden items-center justify-between md:flex">
          {/* VÄNSTER SIDA */}
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="text-lg font-bold tracking-tight text-nordic-secondary"
            >
              AvyraCards
            </Link>

            {/* Segment Switcher */}
            <nav className="rounded-full border border-nordic-highlight/20 bg-white/5 p-1 text-xs">
              <ul className="flex items-center gap-1">
                <li>
                  <Link href="/social" className={`rounded-full px-4 py-1.5 font-medium transition-all ${inSocial ? "bg-nordic-secondary text-nordic-primary shadow-sm" : "text-nordic-highlight hover:text-nordic-secondary"}`}>
                    Socialt
                  </Link>
                </li>
                <li>
                  <Link href="/business" className={`rounded-full px-4 py-1.5 font-medium transition-all ${inBusiness ? "bg-nordic-secondary text-nordic-primary shadow-sm" : "text-nordic-highlight hover:text-nordic-secondary"}`}>
                    Business
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* HÖGER SIDA (Menyn) */}
          <nav className="flex items-center gap-3 text-sm">
            {isAuthenticated ? (
              <>
                {/* Dynamiska Länkar */}
                <div className="flex items-center gap-2 mr-4 bg-white/5 rounded-full p-1 border border-white/5">
                    {navLinks.map((link) => {
                      const active = isLinkActive(link.href, link.exact);
                      const Icon = link.icon;
                      
                      return (
                        <Link 
                          key={link.href}
                          href={link.href} 
                          className={`
                            flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all duration-300
                            ${active 
                              ? "bg-nordic-accent/10 text-nordic-accent shadow-[0_0_10px_rgba(var(--accent-rgb),0.2)] border border-nordic-accent/20" 
                              : "text-nordic-highlight hover:text-nordic-secondary hover:bg-white/5 border border-transparent"
                            }
                          `}
                        >
                           <Icon size={14} className={active ? "text-nordic-accent" : "opacity-70 group-hover:opacity-100"} />
                           {link.name}
                        </Link>
                      );
                    })}
                </div>

                {isAdmin && (
                  <Link href="/admin" className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-2 text-xs font-bold text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-colors mr-2">
                    <ShieldCheck size={14} /> Admin
                  </Link>
                )}

                <div className="pl-2 border-l border-white/10">
                  <SignOutButton />
                </div>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <SignInButton />
                <Link href="/get-started" className="rounded-full bg-nordic-accent px-5 py-2 text-sm font-bold text-nordic-primary hover:bg-nordic-accent/90 transition-all shadow-lg shadow-nordic-accent/20">
                  Kom igång
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}