"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { SESSION_COOKIE_NAME, SESSION_DAYS } from "@/lib/constants";
import { getCurrentUser } from "@/lib/auth";
import { hashPassword, newToken, verifyPassword } from "@/lib/crypto";
import { createSession, deleteSessionByToken } from "@/services/sessionService";
import {
  createUser,
  getUserAuthByEmail,
  getUserAuthById,
  updateUserPassword,
} from "@/services/userService";
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

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Indica tu contraseña actual"),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Confirma la nueva contraseña"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Las contraseñas nuevas no coinciden",
    path: ["confirmPassword"],
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    message: "La nueva contraseña debe ser distinta de la actual",
    path: ["newPassword"],
  });

function expiresAtIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

/** Same-origin path only; blocks protocol-relative and absolute URLs in `next`. */
function safeRedirectPath(raw: unknown, fallback = "/dashboard"): string {
  if (typeof raw !== "string") return fallback;
  const s = raw.trim();
  if (!s.startsWith("/") || s.startsWith("//")) return fallback;
  if (s.includes("\\") || /[\r\n\0]/.test(s)) return fallback;
  if (s.length > 256) return fallback;
  return s;
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

  const existing = await getUserAuthByEmail(parsed.data.email);
  if (existing) {
    return {
      ok: false,
      error: { message: "El correo ya está registrado", fieldErrors: { email: "Ya existe" } },
    };
  }

  const pw = await hashPassword(parsed.data.password);
  const user = await createUser({
    name: parsed.data.name,
    email: parsed.data.email,
    role: parsed.data.role as UserRole,
    passwordSaltHex: pw.saltHex,
    passwordHashHex: pw.hashHex,
  });

  const token = newToken(32);
  await createSession({ userId: user.id, token, expiresAtIso: expiresAtIso(SESSION_DAYS) });
  await setSessionCookie(token);

  redirect(safeRedirectPath(formData.get("next")));
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

  const userAuth = await getUserAuthByEmail(parsed.data.email);
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
  await createSession({ userId: userAuth.id, token, expiresAtIso: expiresAtIso(SESSION_DAYS) });
  await setSessionCookie(token);

  redirect(safeRedirectPath(formData.get("next")));
}

export async function logoutAction(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (token) await deleteSessionByToken(token);
  store.delete(SESSION_COOKIE_NAME);
  redirect("/login");
}

export async function changePasswordAction(
  _prevState: unknown,
  formData: FormData,
): Promise<ActionResult<{ updated: true }>> {
  const raw = {
    currentPassword: String(formData.get("currentPassword") ?? ""),
    newPassword: String(formData.get("newPassword") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  };

  const parsed = changePasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: { message: "Revisa los campos", fieldErrors: flattenZod(parsed.error) },
    };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: { message: "Sesión no válida" } };
  }

  const auth = await getUserAuthById(user.id);
  if (!auth) {
    return { ok: false, error: { message: "Usuario no encontrado" } };
  }

  const currentOk = await verifyPassword(parsed.data.currentPassword, {
    algorithm: "scrypt",
    saltHex: auth.password.saltHex,
    hashHex: auth.password.hashHex,
  });
  if (!currentOk) {
    return {
      ok: false,
      error: {
        message: "La contraseña actual no es correcta",
        fieldErrors: { currentPassword: "No coincide con tu contraseña" },
      },
    };
  }

  const pw = await hashPassword(parsed.data.newPassword);
  await updateUserPassword(user.id, pw.saltHex, pw.hashHex);
  revalidatePath("/settings");
  revalidatePath("/profile");

  return { ok: true, data: { updated: true } };
}

function flattenZod(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !out[key]) out[key] = issue.message;
  }
  return out;
}

