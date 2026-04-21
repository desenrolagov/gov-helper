import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "govhelper_session";

function getSecretKey() {
  const secretKey = process.env.AUTH_SECRET?.trim();

  if (!secretKey) return null;

  return new TextEncoder().encode(secretKey);
}

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/privacy",
  "/terms",
  "/about",
  "/services",
  "/continue",
];

const ADMIN_ROUTES = ["/admin"];

const AUTHENTICATED_ROUTES = [
  "/dashboard",
  "/checkout",
  "/orders",
  "/payment",
  "/support",
];

async function getSessionFromRequest(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const key = getSecretKey();

  if (!token || !key) return null;

  try {
    const { payload } = await jwtVerify(token, key);

    if (
      !payload ||
      typeof payload.userId !== "string" ||
      typeof payload.email !== "string" ||
      (payload.role !== "CLIENT" && payload.role !== "ADMIN")
    ) {
      return null;
    }

    return payload as {
      userId: string;
      email: string;
      role: "CLIENT" | "ADMIN";
    };
  } catch {
    return null;
  }
}

function startsWithRoute(pathname: string, routes: string[]) {
  return routes.some((route) =>
    route === "/" ? pathname === "/" : pathname.startsWith(route)
  );
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const session = await getSessionFromRequest(req);

  const isPublicRoute = startsWithRoute(pathname, PUBLIC_ROUTES);
  const isAdminRoute = startsWithRoute(pathname, ADMIN_ROUTES);
  const isAuthenticatedRoute = startsWithRoute(pathname, AUTHENTICATED_ROUTES);

  if (!session && (isAdminRoute || isAuthenticatedRoute)) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session && isAdminRoute && session.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (session && (pathname === "/login" || pathname === "/register")) {
    const target = session.role === "ADMIN" ? "/admin/orders" : "/dashboard";
    return NextResponse.redirect(new URL(target, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/register",
    "/services/:path*",
    "/continue/:path*",
    "/dashboard/:path*",
    "/checkout/:path*",
    "/orders/:path*",
    "/payment/:path*",
    "/support/:path*",
    "/admin/:path*",
    "/privacy",
    "/terms",
    "/about",
  ],
};