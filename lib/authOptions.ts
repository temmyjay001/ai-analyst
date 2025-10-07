import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import { NextAuthOptions } from "next-auth";
import { db } from "./db";
import { users, accounts, sessions, verificationTokens } from "./schema";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db, {
    usersTable: users as any,
    accountsTable: accounts,
    sessionsTable: sessions as any,
    verificationTokensTable: verificationTokens,
  }),

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),

    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await db
            .select()
            .from(users)
            .where(eq(users.email, credentials.email))
            .limit(1);

          if (!user[0] || !user[0].hashedPassword) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user[0].hashedPassword
          );

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user[0].id,
            email: user[0].email,
            name: user[0].name,
            image: user[0].avatar,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }

      if (account?.provider === "google") {
        try {
          await db
            .update(users)
            .set({
              emailVerified: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(users.email, token.email!));
        } catch (error) {
          console.error("Error auto-verifying Google user:", error);
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        //@ts-expect-error // next-auth types are wrong about id being optional
        session.user.id = token.id as string;
      }
      return session;
    },

    async signIn({ user, account }) {
      // Google OAuth users are auto-verified
      if (account?.provider === "google") {
        return true;
      }

      // For credentials, check is done in authorize
      return true;
    },
  },

  pages: {
    signIn: "/auth/signin",
    // signUp: "/auth/signup",
    error: "/auth/error",
  },
};
