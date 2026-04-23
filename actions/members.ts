"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { hashPassword } from "@/lib/crypto";
import { createUser, getUserAuthByEmail } from "@/services/userService";
import type { ActionResult } from "@/types/actions";
import type { User } from "@/types/models";

const emailSchema = z.string().trim().toLowerCase().email();
const passwordSchema = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .max(72, "Máximo 72 caracteres");

const inviteSchema = z.object({
  name: z.string().trim().min(2, "Nombre muy corto").max(80),
  email: emailSchema,
  password: passwordSchema,
});

export async function createMemberByReviewerAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<User>> {
  const actor = await getCurrentUser();
  if (!actor) return { ok: false, error: { message: "No autenticado" } };
  if (actor.role !== "RESIDENT") {
    return { ok: false, error: { message: "Solo el residente puede crear cuentas de personal." } };
  }
  if (!actor.organizationId) {
    return { ok: false, error: { message: "Tu usuario no está asignado a una empresa." } };
  }

  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
  const parsed = inviteSchema.safeParse(raw);
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
      error: { message: "Ese correo ya está en uso", fieldErrors: { email: "Ya existe" } },
    };
  }

  const pw = await hashPassword(parsed.data.password);
  const created = await createUser({
    name: parsed.data.name,
    email: parsed.data.email,
    role: "ENGINEER",
    organizationId: actor.organizationId,
    passwordSaltHex: pw.saltHex,
    passwordHashHex: pw.hashHex,
  });

  revalidatePath("/members");
  return { ok: true, data: created };
}

function flattenZod(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !out[key]) out[key] = issue.message;
  }
  return out;
}
