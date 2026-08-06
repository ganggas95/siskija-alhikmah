import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { db } from "@/lib/db";

const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
});

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCK_WINDOW_MS = 15 * 60 * 1000;
const loginAttemptStore = new Map<
  string,
  { attempts: number; lockedUntil: number | null }
>();

function getLoginAttemptState(email: string) {
  const key = email.trim().toLowerCase();
  const current = loginAttemptStore.get(key);
  const now = Date.now();

  if (!current) {
    return { key, state: { attempts: 0, lockedUntil: null } };
  }

  if (current.lockedUntil && current.lockedUntil <= now) {
    const reset = { attempts: 0, lockedUntil: null };
    loginAttemptStore.set(key, reset);
    return { key, state: reset };
  }

  return { key, state: current };
}

function registerLoginFailure(email: string) {
  const { key, state } = getLoginAttemptState(email);
  const attempts = state.attempts + 1;
  const lockedUntil =
    attempts >= MAX_LOGIN_ATTEMPTS ? Date.now() + LOGIN_LOCK_WINDOW_MS : null;

  loginAttemptStore.set(key, { attempts, lockedUntil });
}

function clearLoginFailures(email: string) {
  loginAttemptStore.delete(email.trim().toLowerCase());
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 12,
    updateAge: 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = loginSchema.safeParse(rawCredentials);

        if (!parsed.success) {
          return null;
        }

        const normalizedEmail = parsed.data.email.trim().toLowerCase();
        const { state } = getLoginAttemptState(normalizedEmail);

        if (state.lockedUntil && state.lockedUntil > Date.now()) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: normalizedEmail },
          include: {
            userRoles: {
              include: {
                role: true,
              },
            },
          },
        });

        if (!user?.isActive) {
          registerLoginFailure(normalizedEmail);
          return null;
        }

        const isValidPassword = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash,
        );

        if (!isValidPassword) {
          registerLoginFailure(normalizedEmail);
          return null;
        }

        clearLoginFailures(normalizedEmail);

        const primaryRole = user.userRoles[0]?.role.key ?? "AUDITOR";

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: primaryRole,
          isActive: user.isActive,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.isActive = user.isActive;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as "ADMIN" | "TREASURER" | "AUDITOR";
        session.user.isActive = token.isActive as boolean | undefined;
      }

      return session;
    },
  },
});
