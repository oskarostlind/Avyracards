import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { z } from "zod";
import { type Role } from "@prisma/client"; 
import { type Adapter } from "next-auth/adapters"; // <--- 1. Importera Adapter-typen

import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  // 2. Vi castar adaptern till 'Adapter' för att matcha vår utökade User-typ
  adapter: PrismaAdapter(prisma) as Adapter,
  
  session: { strategy: "jwt" },
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

        const { email, password } = result.data;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.passwordHash) {
          throw new Error("Felaktig e-post eller lösenord");
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
          image: user.avatarUrl,
          role: user.role, 
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
        // 3. Vi castar specifikt till rätt typ (string och Role) istället för 'any'
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