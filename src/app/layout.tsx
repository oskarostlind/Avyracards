import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "SocialCard",
  description: "Digital NFC-baserad visitkortslösning"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="sv">
      <body className="min-h-screen bg-slate-950 text-slate-50">
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-slate-800">
            <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
              <div className="font-semibold tracking-tight">SocialCard</div>
              <nav className="flex gap-4 text-sm">
                <a href="/login" className="hover:underline">
                  Logga in
                </a>
                <a href="/register" className="hover:underline">
                  Skapa konto
                </a>
              </nav>
            </div>
          </header>
          <main className="flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
