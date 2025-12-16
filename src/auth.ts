import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
// import { PrismaAdapter } from "@auth/prisma-adapter";
import { z } from "zod";
import { type Role } from "@prisma/client"; 
// import { type Adapter } from "next-auth/adapters";

import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Vi behåller adaptern utkommenterad för att undvika cookie-storleksfel
  // adapter: PrismaAdapter(prisma) as Adapter,
  
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const result = loginSchema.safeParse(credentials);

        if (!result.success) {
          throw new Error("Ogiltig e-post eller lösenord");
        }

        // FIX 1: Normalisera e-post till gemener (lowercase)
        // Detta säkerställer att User@Example.com hittas även om man skriver user@example.com
        const email = result.data.email.toLowerCase();
        const password = result.data.password;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.passwordHash) {
          throw new Error("Felaktig e-post eller lösenord");
        }

        // FIX 2: Kontrollera om e-posten är verifierad
        // Hindrar inloggning om kontot inte aktiverats via mail
        if (!user.emailVerified) {
          throw new Error("Du måste verifiera din e-postadress innan du kan logga in.");
        }

        const isValid = await verifyPassword(password, user.passwordHash);

        if (!isValid) {
          throw new Error("Felaktig e-post eller lösenord");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.username,
          username: user.username,
          // image: user.avatarUrl, // Fortsatt utkommenterad pga Base64-problemet
          role: user.role, 
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
        session.user.username = token.username as string;
        session.user.role = token.role as Role; 
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.username = user.username;
        token.role = user.role; 
      }
      return token;
    },
  },
});