import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: credentials.email },
              { phone: credentials.email }
            ]
          }
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          systematicId: user.systematicId,
          email: user.email,
          role: user.role,
          mainWalletBalance: user.mainWalletBalance,
          bonusWalletBalance: user.bonusWalletBalance,
          vipLevel: user.vipLevelId,
          firstName: user.firstName,
          lastName: user.lastName,
          profilePhoto: user.profilePhoto
        };
      }
    })
  ],
    callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        (token as any).systematicId = user.systematicId;
        (token as any).role = user.role;
      }
      
      // Always fetch latest data from DB to ensure session is up to date (Profile & Wallet)
      if (token?.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string }
          });
          if (dbUser) {
            (token as any).firstName = dbUser.firstName;
            (token as any).lastName = dbUser.lastName;
            (token as any).profilePhoto = dbUser.profilePhoto;
            (token as any).mainWalletBalance = dbUser.mainWalletBalance;
            (token as any).bonusWalletBalance = dbUser.bonusWalletBalance;
          }
        } catch (e) {
          console.error("JWT Session DB Sync Error", e);
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).systematicId = token.systematicId as string;
        (session.user as any).role = token.role as string;
        (session.user as any).mainWalletBalance = token.mainWalletBalance as number;
        (session.user as any).bonusWalletBalance = token.bonusWalletBalance as number;
        (session.user as any).vipLevel = token.vipLevel as number;
        (session.user as any).firstName = token.firstName as string;
        (session.user as any).lastName = token.lastName as string;
        (session.user as any).profilePhoto = token.profilePhoto as string;
      }
      return session;
    }
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback_secret_for_development",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

