"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { CLOUDINARY_PROFILE_FOLDER, uploadImage } from "@/lib/cloudinary";
import { updateUserProfile } from "@/services/userService";
import type { ActionResult } from "@/types/actions";
import type { User } from "@/types/models";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Nombre muy corto").max(80),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
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
    title: String(formData.get("title") ?? ""),
  };

  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: { message: "Datos inválidos", fieldErrors: flattenZod(parsed.error) },
    };
  }

  const avatar = formData.get("avatar");
  let newAvatarUrl: string | undefined;
  if (avatar instanceof File && avatar.size > 0) {
    const allowed =
      avatar.type === "image/png" ||
      avatar.type === "image/jpeg" ||
      avatar.type === "image/webp";
    if (!allowed) {
      return {
        ok: false,
        error: { message: "Usa una imagen PNG, JPG o WEBP." },
      };
    }
    if (avatar.size > 5 * 1024 * 1024) {
      return {
        ok: false,
        error: { message: "La imagen supera 5 MB." },
      };
    }
    const ext = avatar.type === "image/png" ? "png" : avatar.type === "image/webp" ? "webp" : "jpg";
    newAvatarUrl = await uploadImage(avatar, `user-${user.id}-${Date.now()}.${ext}`, {
      folder: CLOUDINARY_PROFILE_FOLDER,
    });
  }

  const updated = await updateUserProfile(user.id, {
    name: parsed.data.name,
    phone: parsed.data.phone?.length ? parsed.data.phone : null,
    title: parsed.data.title?.length ? parsed.data.title : null,
    ...(newAvatarUrl !== undefined ? { avatarUrl: newAvatarUrl } : {}),
  });

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/members");
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

