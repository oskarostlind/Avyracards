import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { z } from "zod";

// Schema för validering
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
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
        // 1. Validera input
        const result = loginSchema.safeParse(credentials);

        if (!result.success) {
          throw new Error("Ogiltig e-post eller lösenord");
        }

        const { email, password } = result.data;

        // 2. Hitta användare via e-post
        const user = await prisma.user.findUnique({
          where: { email },
        });

        // Kontrollera om användare finns och har ett lösenord
        if (!user || !user.passwordHash) {
          throw new Error("Felaktig e-post eller lösenord");
        }

        // 3. Verifiera lösenord
        const isValid = await verifyPassword(password, user.passwordHash);

        if (!isValid) {
          throw new Error("Felaktig e-post eller lösenord");
        }

        // 4. Returnera användardata (Mappar avatarUrl till image)
        return {
          id: user.id,
          email: user.email,
          name: user.username, // NextAuth förväntar sig ofta 'name', vi sätter username där
          username: user.username,
          image: user.avatarUrl, // VIKTIGT: Här rättade vi felet från din screenshot
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string;
        // Vi tvingar typerna här för att lösa TS-felen snabbt
        (session.user as any).username = token.username as string;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.username = (user as any).username;
      }
      return token;
    },
  },
});