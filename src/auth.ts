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

        // --- NORMALISERING (NYTT) ---
        // Konvertera input till lowercase innan sökning
        const user = await prisma.user.findUnique({
          where: {
            username: username.toLowerCase().trim() 
          }
        });
        // ----------------------------

        if (!user) {
          throw new Error("Felaktiga uppgifter");
        }

        const isValid = await verifyPassword(password, user.passwordHash);

        if (!isValid) {
          throw new Error("Felaktiga uppgifter");
        }
        
        // Vi behåller verifierings-checken utkommenterad tills vidare
        // if (!user.emailVerified) throw new Error("Kontot är inte verifierat");

        return {
          id: user.id,
          name: user.name ?? undefined,
          email: user.email,
          username: user.username
        };
      }
    })
  ],
  // ... callbacks och pages är oförändrade ...
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return { ...token, id: (user as any).id, username: (user as any).username };
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