import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import type { Role } from "@/app/generated/prisma/client";
import authConfig from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    // ── Google OAuth ─────────────────────────────────────────────────────────
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
    }),

    // ── Email + Password ──────────────────────────────────────────────────────
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.isActive) return null;

        // OAuth-only users have no password
        if (!user.password) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    // ── signIn callback — provision workspace for new OAuth users ────────────
    async signIn({ user, account }) {
      if (!account || account.provider === "credentials") return true;

      // Google OAuth flow — ensure user + workspace exist
      if (!user.email) return false;

      try {
        const existing = await db.user.findUnique({
          where: { email: user.email },
          include: {
            workspaceMemberships: { where: { acceptedAt: { not: null } }, take: 1 },
          },
        });

        if (!existing) {
          // Brand-new user — create user, workspace, and member record
          const newUser = await db.user.create({
            data: {
              name: user.name ?? user.email.split("@")[0],
              email: user.email,
              password: "", // no password for OAuth users
              role: "ADMIN",
            },
          });

          const slug = generateSlug(user.email.split("@")[0]);
          const workspace = await db.workspace.create({
            data: { name: user.name ?? "My Workspace", slug, type: "INDIVIDUAL" },
          });

          await db.workspaceMember.create({
            data: {
              workspaceId: workspace.id,
              userId: newUser.id,
              role: "OWNER",
              acceptedAt: new Date(),
            },
          });

          await db.userProfile.create({
            data: {
              userId: newUser.id,
              workspaceId: workspace.id,
              name: newUser.name ?? "",
            },
          });

          // Override user id so NextAuth can link the Account record
          user.id = newUser.id;
        } else {
          user.id = existing.id;

          // If they exist but have no workspace, create one
          if (existing.workspaceMemberships.length === 0) {
            const slug = generateSlug(existing.email.split("@")[0]);
            const workspace = await db.workspace.create({
              data: { name: existing.name ?? "My Workspace", slug, type: "INDIVIDUAL" },
            });
            await db.workspaceMember.create({
              data: {
                workspaceId: workspace.id,
                userId: existing.id,
                role: "OWNER",
                acceptedAt: new Date(),
              },
            });
          }
        }
      } catch (err) {
        console.error("[auth] signIn OAuth error:", err);
        return false;
      }

      return true;
    },

    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        // Load role from DB (user object from OAuth doesn't have it)
        if (account?.provider !== "credentials") {
          const dbUser = await db.user.findUnique({
            where: { id: user.id },
            select: { role: true },
          });
          token.role = dbUser?.role ?? "USER";
        } else {
          token.role = (user as { role: Role }).role;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateSlug(base: string): string {
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 48) || "workspace";
  // Append random suffix — uniqueness checked by DB unique constraint
  return `${slug}-${Math.random().toString(36).substring(2, 6)}`;
}
