import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname, searchParams } = req.nextUrl;

  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isAdminRoute = pathname.startsWith("/admin");
  const isDashboardRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/profile");

  // 1. Omdirigera inloggade användare bort från login/register
  if (isAuthRoute && isLoggedIn) {
    const callbackUrl = searchParams.get("callbackUrl");

    if (callbackUrl) {
      // SÄKERHETSCHECK:
      // Avkoda URL:en och kolla så vi inte redirectar tillbaka till login (vilket skapar loop)
      const targetUrl = decodeURIComponent(callbackUrl);
      
      // Om callback INTE innehåller "/login" eller "/register", då är det säkert att gå dit
      if (!targetUrl.includes("/login") && !targetUrl.includes("/register")) {
         return NextResponse.redirect(new URL(targetUrl, req.url));
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
    const callbackUrl = encodeURIComponent(pathname);
    return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, req.url));
  }

  return NextResponse.next();
});

// Matcher config: Exkludera API:er och statiska filer
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};