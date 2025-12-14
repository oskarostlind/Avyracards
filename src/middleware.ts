import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isAdminRoute = pathname.startsWith("/admin");
  const isDashboardRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/profile");

  // 1. Omdirigera inloggade användare bort från login/register
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // 2. Skydda Admin-routes (Kräver rollen ADMIN)
  if (isAdminRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    
    if (req.auth?.user?.role !== "ADMIN") {
      // Obehörig -> Skicka till dashboard
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // 3. Skydda Dashboard/Profil-routes (Kräver inloggning)
  if (isDashboardRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
});

// Matcher config för att exkludera statiska filer och API:er som inte behöver auth
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};