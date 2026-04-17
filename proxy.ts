import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secretKey = process.env.AUTH_SECRET;
const key = new TextEncoder().encode(secretKey);

const PUBLIC_ROUTES = ["/login", "/register"];
const ADMIN_ROUTES = ["/admin"];
const CLIENT_OR_ADMIN_ROUTES = ["/dashboard", "/services", "/checkout"];

async function getSessionFromRequest(req: NextRequest) {
  const token = req.cookies.get("govhelper_session")?.value;
  if (!token || !secretKey) return null;

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

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await getSessionFromRequest(req);

  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  const isAdminRoute = ADMIN_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  const isProtectedRoute = CLIENT_OR_ADMIN_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // 🔒 Rotas privadas exigem sessão
  if (!session && (isProtectedRoute || isAdminRoute)) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // 🔒 Só admin entra no /admin
  if (session && isAdminRoute && session.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // ✅ IMPORTANTE:
  // Não redirecionar automaticamente /login e /register para /dashboard.
  // Isso evita loop quando existe cookie antigo/inconsistente.
  if (isPublicRoute) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/dashboard/:path*",
    "/services/:path*",
    "/checkout/:path*",
    "/admin/:path*",
  ],
};