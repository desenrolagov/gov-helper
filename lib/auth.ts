import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "govhelper_session";
const SESSION_DURATION_IN_DAYS = 7;

function getSecretKey() {
  const secretKey = process.env.AUTH_SECRET?.trim();

  if (!secretKey) {
    throw new Error("AUTH_SECRET não foi definido no ambiente");
  }

  return new TextEncoder().encode(secretKey);
}

export type SessionPayload = JWTPayload & {
  userId: string;
  email: string;
  role: "CLIENT" | "ADMIN";
};

export async function createSession(payload: {
  userId: string;
  email: string;
  role: "CLIENT" | "ADMIN";
}) {
  const key = getSecretKey();
  const expiresAt = new Date(
    Date.now() + SESSION_DURATION_IN_DAYS * 24 * 60 * 60 * 1000
  );

  const session = await new SignJWT({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_IN_DAYS}d`)
    .sign(key);

  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function verifySession(): Promise<SessionPayload | null> {
  try {
    const key = getSecretKey();
    const cookieStore = await cookies();
    const cookie = cookieStore.get(COOKIE_NAME)?.value;

    if (!cookie) {
      return null;
    }

    const { payload } = await jwtVerify(cookie, key);

    if (
      !payload ||
      typeof payload.userId !== "string" ||
      typeof payload.email !== "string" ||
      (payload.role !== "CLIENT" && payload.role !== "ADMIN")
    ) {
      return null;
    }

    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(0),
    path: "/",
  });
}