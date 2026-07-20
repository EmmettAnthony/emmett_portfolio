import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { logSignIn, logFailedSignIn, checkBruteForce } from "@/lib/auth-activity";

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const username = credentials.username as string;
        const password = credentials.password as string;

        // Check env-var admin credentials first (fast path, always works)
        const adminUsername = process.env.ADMIN_USERNAME;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (username === adminUsername && password === adminPassword) {
          logSignIn("1").catch(() => {});
          return {
            id: "1",
            name: "Admin",
            email: adminUsername,
          };
        }

        // Fallback: try DB-backed auth (for database-stored users)
        const connectionString = process.env.DATABASE_URL;
        if (connectionString) {
          try {
            const adapter = new PrismaPg({ connectionString });
            const prisma = new PrismaClient({ adapter });

            const user = await prisma.user.findUnique({
              where: { email: username },
            });

            if (user?.password) {
              const isValid = await bcrypt.compare(password, user.password);
              await prisma.$disconnect();
              if (isValid) {
                logSignIn(user.id).catch(() => {});
                return {
                  id: user.id,
                  name: user.name || "Admin",
                  email: user.email,
                };
              }
              return null;
            }
            await prisma.$disconnect();
          } catch {
            // DB unreachable or schema mismatch — login fails (no fallback beyond this point)
          }
        }

        logFailedSignIn(username).catch(() => {});
        checkBruteForce(username).catch(() => {});

        return null;
      },
    }),
  ],
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
});
