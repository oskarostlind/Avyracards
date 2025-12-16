import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
//import { PrismaAdapter } from "@auth/prisma-adapter";
import { z } from "zod";
import { type Role } from "@prisma/client"; 
//import { type Adapter } from "next-auth/adapters";

import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  // 1. VIKTIGT: Vi kommenterar ut adaptern tillfälligt.
  // Detta hindrar NextAuth från att "automatiskt" hämta hela user-objektet (med themeSettings)
  // och trycka in det i cookien, vilket orsakade "Headers too big".
  // adapter: PrismaAdapter(prisma) as Adapter,
  
  session: { strategy: "jwt" },
  trustHost: true, // Viktigt för att Vercel/Edge ska hantera https rätt
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

        // Här returnerar vi BARA det nödvändiga för sessionen.
        // Vi utelämnar 'bio', 'themeSettings' etc för att hålla cookien liten.
        return {
          id: user.id,
          email: user.email,
          name: user.username,
          username: user.username,
          //image: user.avatarUrl,
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