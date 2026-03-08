import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { type Role } from "@prisma/client"; 

import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
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
        impersonateId: { label: "Impersonate Id", type: "text" },
        adminSecret: { label: "Admin Secret", type: "text" },
      },
      authorize: async (credentials) => {
        
        // --- 1. IMPERSONATION LOGIN (Admin Only) ---
        if (credentials?.impersonateId) {
          
          if (!credentials.adminSecret || credentials.adminSecret !== process.env.NEXTAUTH_SECRET) {
            throw new Error("Unauthorized: Invalid admin secret or missing permissions");
          }

          const user = await prisma.user.findUnique({
            where: { id: credentials.impersonateId as string },
          });

          if (!user) {
            throw new Error("User not found for impersonation");
          }

          return {
            id: user.id,
            email: user.email,
            name: user.username,
            username: user.username,
            role: user.role,
          };
        }


        // --- 2. VANLIG LOGIN ---
        const result = loginSchema.safeParse(credentials);

        if (!result.success) {
          throw new Error("Ogiltig e-post eller lösenord");
        }

        const email = result.data.email.toLowerCase();
        const password = result.data.password;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.passwordHash) {
          throw new Error("Felaktig e-post eller lösenord");
        }

        // BORTTAGET: Spärren för email-verifiering.
        // Detta möjliggör "Lazy Verification" (användaren får logga in direkt).
        /* if (!user.emailVerified) {
          throw new Error("Du måste verifiera din e-postadress innan du kan logga in.");
        }
        */

        const isValid = await verifyPassword(password, user.passwordHash);

        if (!isValid) {
          throw new Error("Felaktig e-post eller lösenord");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.username,
          username: user.username,
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