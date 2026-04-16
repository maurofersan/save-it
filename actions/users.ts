"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { updateUserProfile } from "@/services/userService";
import type { ActionResult } from "@/types/actions";
import type { User } from "@/types/models";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Nombre muy corto").max(80),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  company: z.string().trim().max(80).optional().or(z.literal("")),
  title: z.string().trim().max(80).optional().or(z.literal("")),
});

export async function updateProfileAction(
  _prevState: unknown,
  formData: FormData,
): Promise<ActionResult<User>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: { message: "No autenticado" } };

  const raw = {
    name: String(formData.get("name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    company: String(formData.get("company") ?? ""),
    title: String(formData.get("title") ?? ""),
  };

  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: { message: "Datos inválidos", fieldErrors: flattenZod(parsed.error) },
    };
  }

  const updated = await updateUserProfile(user.id, {
    name: parsed.data.name,
    phone: parsed.data.phone?.length ? parsed.data.phone : null,
    company: parsed.data.company?.length ? parsed.data.company : null,
    title: parsed.data.title?.length ? parsed.data.title : null,
  });

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { ok: true, data: updated };
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

function flattenZod(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !out[key]) out[key] = issue.message;
  }
  return out;
}

