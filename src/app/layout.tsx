import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ReactNode } from "react";

import "./globals.css";

import { AuthSessionProvider } from "@/components/providers/session-provider";
import { Navbar } from "@/components/navbar";
import { auth } from "./api/auth/[...nextauth]/auth";

export const metadata: Metadata = {
  title: "SocialCard TS",
  description: "Hantera sociala länkar med Next.js",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  await cookies();
  const session = await auth();

  return (
    <html lang="sv">
      <body className="min-h-screen bg-slate-50">
        <AuthSessionProvider session={session}>
          <Navbar />
          <main className="mx-auto w-full max-w-6xl px-4 py-10">{children}</main>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
