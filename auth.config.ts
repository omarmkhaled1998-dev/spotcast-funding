import type { NextAuthConfig } from "next-auth";

// Edge-safe auth config (no Prisma, no Node.js-only modules)
// Used by middleware for JWT session validation
export default {
  providers: [],
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
} satisfies NextAuthConfig;
