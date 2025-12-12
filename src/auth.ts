import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./lib/prisma";
import { verifyPassword } from "./lib/password";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      id: "credentials",
      name: "Användarnamn & lösenord",
      credentials: {
        username: { label: "Användarnamn", type: "text" },
        password: { label: "Lösenord", type: "password" }
      },
      async authorize(credentials) {
        const username = credentials?.username as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!username || !password) {
          throw new Error("Användarnamn och lösenord krävs");
        }

        const user = await prisma.user.findUnique({
          where: {
            // FIX: Matchar exakt användarnamn (case sensitive) som det sparades vid registrering
            username: username 
          }
        });

        if (!user) {
          throw new Error("Felaktiga uppgifter");
        }

        const isValid = await verifyPassword(password, user.passwordHash);

        if (!isValid) {
          throw new Error("Felaktiga uppgifter");
        }

        // FIX: Tillfälligt inaktiverad verifieringskrav för enklare inloggning
        /* if (!user.emailVerified) {
          throw new Error("Kontot är inte verifierat");
        }
        */

        return {
          id: user.id,
          name: user.name ?? undefined,
          email: user.email,
          username: user.username
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          id: (user as any).id,
          username: (user as any).username
        };
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).username = token.username;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login"
  }
});