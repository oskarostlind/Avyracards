import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname, searchParams, origin } = req.nextUrl; // Hämta origin direkt

  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isAdminRoute = pathname.startsWith("/admin");
  const isDashboardRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/profile");

  // 1. Omdirigera inloggade användare bort från login/register
  if (isAuthRoute && isLoggedIn) {
    const callbackUrl = searchParams.get("callbackUrl");

    if (callbackUrl) {
      try {
        // SÄKERHET: Skapa ett URL-objekt för att analysera destinationen.
        // Vi använder req.url som bas för att hantera relativa sökvägar korrekt.
        const targetUrl = new URL(callbackUrl, req.url);

        // 1. Origin Check: Se till att vi stannar på samma domän.
        // Detta stoppar "Open Redirect"-attacker (t.ex. redirect till phishing-sida).
        if (targetUrl.origin === origin) {
          
          // 2. Loop Protection: Se till att vi inte skickas tillbaka till login/register
          const targetPath = targetUrl.pathname;
          if (!targetPath.startsWith("/login") && !targetPath.startsWith("/register")) {
            return NextResponse.redirect(targetUrl);
          }
        }
      } catch (error) {
        // Om callbackUrl är ogiltig/felformaterad (t.ex. trasig encoding),
        // fångar vi felet här och faller tillbaka till standard-redirecten nedan.
        // Detta förhindrar 500 Server Error.
      }
    }

    // Annars, standard: skicka till dashboard
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // 2. Skydda Admin-router (Kräver ADMIN roll)
  if (isAdminRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    
    if (req.auth?.user?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // 3. Skydda Dashboard/Profil-router (Kräver inloggning)
  if (isDashboardRoute && !isLoggedIn) {
    // Här använder vi encodeURIComponent för att säkert bygga URL:en
    const callbackUrl = encodeURIComponent(pathname);
    return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, req.url));
  }

  return NextResponse.next();
});

// Matcher config: Exkludera API:er och statiska filer
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};