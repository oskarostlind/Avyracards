import { compare, hash } from "bcryptjs";
import { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const credentialsSchema = z.object({
  username: z.string().min(3).max(30),
  password: z.string().min(6).max(128),
});

export const authConfig = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Användarnamn", type: "text" },
        password: { label: "Lösenord", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const existingUser = await prisma.user.findUnique({
          where: { username: parsed.data.username.toLowerCase() },
        });

        if (!existingUser) {
          return null;
        }

        const isValid = await compare(parsed.data.password, existingUser.passwordHash);
        if (!isValid) {
          return null;
        }

        return {
          id: existingUser.id,
          name: existingUser.username,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
        token.username = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.username = token.username as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export async function hashPassword(plain: string): Promise<string> {
  const saltRounds = Number(process.env.AUTH_SALT_ROUNDS ?? "12");
  return hash(plain, saltRounds);
}

export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  return compare(plain, hashed);
}
