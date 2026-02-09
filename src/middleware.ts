import { NextResponse, NextRequest } from "next/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

const publicRoutes = ["/", "/sign-in", "/sign-up", "/api/webhooks", "/api/auth"];
const authRoutes = ["/", "/sign-in", "/sign-up"];

function isPublicRoute(pathname: string) {
  return publicRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"));
}

function isAuthRoute(pathname: string) {
  return authRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"));
}

function isProcessRoute(pathname: string) {
  return pathname.startsWith("/api/process");
}

function isApiRoute(pathname: string) {
  return pathname.startsWith("/api/");
}

function getRateLimitResponse(result: ReturnType<typeof checkRateLimit>) {
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: {
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": result.remaining.toString(),
        "X-RateLimit-Reset": result.resetAt.toString(),
        "Retry-After": Math.ceil((result.resetAt - Date.now()) / 1000).toString(),
      },
    }
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Get the Firebase token from cookie
  const token = req.cookies.get("firebase-token")?.value;
  const isAuthenticated = !!token;

  // Rate limiting for API routes
  if (isApiRoute(pathname)) {
    // Use token presence as identifier for rate limiting
    const identifier =
      token?.slice(0, 32) ||
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "anonymous";

    // Apply stricter limits for expensive operations
    const config = isProcessRoute(pathname) ? RATE_LIMITS.process : RATE_LIMITS.api;
    const rateLimitKey = `${isProcessRoute(pathname) ? "process" : "api"}:${identifier}`;

    const result = checkRateLimit(rateLimitKey, config);

    if (!result.success) {
      return getRateLimitResponse(result);
    }
  }

  // Redirect authenticated users away from auth/landing pages to dashboard
  if (isAuthenticated && isAuthRoute(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Protect non-public routes
  if (!isPublicRoute(pathname) && !isAuthenticated) {
    // For API routes, return 401
    if (isApiRoute(pathname)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // For pages, redirect to sign-in
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
