import NextAuth from "next-auth";
import authConfig from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

// Routes that skip auth entirely
const PUBLIC_PREFIXES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/api/auth",
  "/api/webhooks",
  "/api/invites",
"/subscription-required",
];

// Routes that require auth but NOT an active subscription
// (billing page must be accessible so lapsed users can re-subscribe)
const SUBSCRIPTION_EXEMPT_PREFIXES = [
  "/settings/billing",
  "/settings/profile",
  "/settings/ai-usage",
  "/settings/alerts",
  "/settings/members",
  "/onboarding",
  "/api/stripe",
  "/api/alerts",
];

function nextWithPathname(pathname: string) {
  const res = NextResponse.next();
  res.headers.set("x-pathname", pathname);
  return res;
}

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const pathname = nextUrl.pathname;

  // Allow public routes (includes marketing landing page at "/")
  if (pathname === "/" || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return nextWithPathname(pathname);
  }

  const isLoggedIn = !!session;

  if (!isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from login
  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/opportunities", req.url));
  }

  // Subscription gating — subscription check is done in page/layout server components
  // for accuracy (middleware can't easily query the DB).
  // Middleware only ensures exempt routes aren't gated.
  if (SUBSCRIPTION_EXEMPT_PREFIXES.some((p) => pathname.startsWith(p))) {
    return nextWithPathname(pathname);
  }

  return nextWithPathname(pathname);
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
