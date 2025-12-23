import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";

const EnvSchema = z.object({
  AUTH_SECRET: z.string().min(16),
  ADMIN_USERNAME: z.string().min(1).default("admin"),
  ADMIN_PASSWORD: z.string().min(1),
});

export function getAuthEnv() {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `Auth env invalid: ${parsed.error.issues.map((i) => i.path.join(".")).join(", ")}`,
    );
  }
  return parsed.data;
}

export const ADMIN_COOKIE = "ymd_admin";

function secretKey() {
  const env = getAuthEnv();
  return new TextEncoder().encode(env.AUTH_SECRET);
}

export async function signAdminToken() {
  return await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey());
}

export async function verifyAdminToken(token: string) {
  const { payload } = await jwtVerify(token, secretKey(), {
    algorithms: ["HS256"],
  });
  if (payload.role !== "admin") throw new Error("NOT_ADMIN");
  return payload;
}

export function verifyAdminCredentials(username: string, password: string) {
  const env = getAuthEnv();
  return username === env.ADMIN_USERNAME && password === env.ADMIN_PASSWORD;
}



