"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { SESSION_COOKIE_NAME, SESSION_DAYS } from "@/lib/constants";
import { hashPassword, newToken, verifyPassword } from "@/lib/crypto";
import { createSession, deleteSessionByToken } from "@/services/sessionService";
import { createUser, getUserAuthByEmail } from "@/services/userService";
import type { ActionResult } from "@/types/actions";
import type { User } from "@/types/models";
import type { UserRole } from "@/types/domain";

const emailSchema = z.string().trim().toLowerCase().email();
const passwordSchema = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .max(72, "Máximo 72 caracteres");

const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

const registerSchema = z.object({
  name: z.string().trim().min(2, "Nombre muy corto").max(80),
  email: emailSchema,
  role: z.enum(["ENGINEER", "RESIDENT"]),
  password: passwordSchema,
});

function expiresAtIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function setSessionCookie(token: string) {
  const expiresAt = new Date(expiresAtIso(SESSION_DAYS));
  return cookies().then((store) => {
    store.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      expires: expiresAt,
      path: "/",
    });
  });
}

export async function registerAction(
  _prevState: unknown,
  formData: FormData,
): Promise<ActionResult<User>> {
  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    role: String(formData.get("role") ?? "ENGINEER"),
    password: String(formData.get("password") ?? ""),
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: { message: "Datos inválidos", fieldErrors: flattenZod(parsed.error) },
    };
  }

  const existing = getUserAuthByEmail(parsed.data.email);
  if (existing) {
    return {
      ok: false,
      error: { message: "El correo ya está registrado", fieldErrors: { email: "Ya existe" } },
    };
  }

  const pw = await hashPassword(parsed.data.password);
  const user = createUser({
    name: parsed.data.name,
    email: parsed.data.email,
    role: parsed.data.role as UserRole,
    passwordSaltHex: pw.saltHex,
    passwordHashHex: pw.hashHex,
  });

  const token = newToken(32);
  createSession({ userId: user.id, token, expiresAtIso: expiresAtIso(SESSION_DAYS) });
  await setSessionCookie(token);

  return { ok: true, data: user };
}

export async function loginAction(
  _prevState: unknown,
  formData: FormData,
): Promise<ActionResult<User>> {
  const raw = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: { message: "Datos inválidos", fieldErrors: flattenZod(parsed.error) },
    };
  }

  const userAuth = getUserAuthByEmail(parsed.data.email);
  if (!userAuth) {
    return { ok: false, error: { message: "Credenciales inválidas" } };
  }

  const ok = await verifyPassword(parsed.data.password, {
    algorithm: "scrypt",
    saltHex: userAuth.password.saltHex,
    hashHex: userAuth.password.hashHex,
  });
  if (!ok) return { ok: false, error: { message: "Credenciales inválidas" } };

  const token = newToken(32);
  createSession({ userId: userAuth.id, token, expiresAtIso: expiresAtIso(SESSION_DAYS) });
  await setSessionCookie(token);

  return { ok: true, data: userAuth };
}

export async function logoutAction(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (token) deleteSessionByToken(token);
  store.delete(SESSION_COOKIE_NAME);
  redirect("/login");
}

function flattenZod(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !out[key]) out[key] = issue.message;
  }
  return out;
}

