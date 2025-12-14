import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname, searchParams } = req.nextUrl; // Destructure searchParams

  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isAdminRoute = pathname.startsWith("/admin");
  const isDashboardRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/profile");

  // 1. Redirect logged-in users away from login/register
  if (isAuthRoute && isLoggedIn) {
    // CHECK: Is there a callbackUrl?
    const callbackUrl = searchParams.get("callbackUrl");

    if (callbackUrl) {
      // If a callbackUrl exists, redirect there (e.g., /activate/confirm)
      return NextResponse.redirect(new URL(callbackUrl, req.url));
    }

    // Otherwise, default behavior: redirect to dashboard
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // 2. Protect Admin routes (Requires ADMIN role)
  if (isAdminRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    
    if (req.auth?.user?.role !== "ADMIN") {
      // Unauthorized -> Send to dashboard
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // 3. Protect Dashboard/Profile routes (Requires login)
  if (isDashboardRoute && !isLoggedIn) {
    // Preserve the intended destination
    const callbackUrl = encodeURIComponent(pathname);
    return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, req.url));
  }

  return NextResponse.next();
});

// Matcher config to exclude static files and APIs that don't need auth
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};