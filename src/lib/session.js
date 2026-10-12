import { jwtVerify, SignJWT } from "jose";
/**
 * Edge-safe session primitives.
 *
 * Deliberately free of Prisma, bcrypt and `server-only` so that middleware can
 * import it without dragging the database client into the Edge bundle. Anything
 * that needs the database lives in auth.ts instead.
 */
export const SESSION_COOKIE_NAME = "mt_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
// The database-free demo (no DATABASE_URL) has no customer data to protect, so
// it may run without a configured secret. A real deployment must set one.
const DEMO_SECRET = "miracle-tree-demo-only-secret-not-for-production-use";
const isDemo = process.env.DEMO_MODE === "1" || !process.env.DATABASE_URL;

export function sessionSecret() {
  const value = process.env.AUTH_SECRET || (isDemo ? DEMO_SECRET : undefined);
  if (!value || value.length < 32) {
    throw new Error(
      "AUTH_SECRET is missing or shorter than 32 characters. Set it in .env before starting the server.",
    );
  }
  return new TextEncoder().encode(value);
}
export async function signSessionToken(payload) {
  return new SignJWT({ email: payload.email, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(sessionSecret());
}
/** Verifies the JWT signature only. Never treat this as authorization on its own. */
export async function readSessionToken(token) {
  try {
    const { payload } = await jwtVerify(token, sessionSecret(), {
      algorithms: ["HS256"],
    });
    if (!payload.sub) return null;
    return {
      sub: payload.sub,
      email: String(payload.email ?? ""),
      role: payload.role ?? "customer",
    };
  } catch {
    return null;
  }
}
export function isStaff(role) {
  return role === "admin" || role === "staff";
}
