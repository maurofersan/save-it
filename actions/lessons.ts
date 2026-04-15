"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { addEvidence } from "@/services/evidenceService";
import {
  createLesson,
  incrementLessonViews,
  listLessonsForValidation,
  searchValidatedLessons,
  setLessonStatus,
  upsertLessonRating,
} from "@/services/lessonService";
import { listSpecialties } from "@/services/specialtyService";
import type { ActionResult } from "@/types/actions";
import type { LessonStatus, SpecialtyKey } from "@/types/domain";
import type { Lesson, LessonWithSpecialty, Specialty } from "@/types/models";
import { uploadImage } from "@/lib/cloudinary";

const createLessonSchema = z.object({
  title: z.string().trim().min(5, "Título muy corto").max(140),
  specialtyKey: z.enum(["QUALITY", "SAFETY", "PRODUCTION"]),
  description: z.string().trim().min(10, "Descripción muy corta").max(4000),
  rootCause: z.string().trim().min(5, "Causa raíz muy corta").max(2000),
  solution: z.string().trim().min(5, "Solución muy corta").max(2000),
  eventDate: z
    .string()
    .trim()
    .min(1, "Fecha de suceso requerida")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  impactType: z.enum(["TIME", "COST"]),
  impactValue: z.coerce.number().min(0).max(1_000_000),
});

export async function getLessonFormData(): Promise<{
  specialties: Specialty[];
}> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return { specialties: listSpecialties() };
}

export async function createLessonAction(
  _prevState: unknown,
  formData: FormData,
): Promise<ActionResult<{ lessonId: number }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: { message: "No autenticado" } };

  const raw = {
    title: String(formData.get("title") ?? ""),
    specialtyKey: String(formData.get("specialtyKey") ?? ""),
    description: String(formData.get("description") ?? ""),
    rootCause: String(formData.get("rootCause") ?? ""),
    solution: String(formData.get("solution") ?? ""),
    eventDate: String(formData.get("eventDate") ?? ""),
    impactType: String(formData.get("impactType") ?? ""),
    impactValue: formData.get("impactValue") ?? 0,
  };

  const parsed = createLessonSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        message: "Datos inválidos",
        fieldErrors: flattenZod(parsed.error),
      },
    };
  }

  const specialties = listSpecialties();
  const specialty = specialties.find((s) => s.key === parsed.data.specialtyKey);
  if (!specialty) {
    return { ok: false, error: { message: "Especialidad inválida" } };
  }

  const lesson = createLesson({
    title: parsed.data.title,
    specialtyId: specialty.id,
    description: parsed.data.description,
    rootCause: parsed.data.rootCause,
    solution: parsed.data.solution,
    eventDate: parsed.data.eventDate,
    impactType: parsed.data.impactType as Lesson["impactType"],
    impactValue: parsed.data.impactValue,
    createdBy: user.id,
  });

  const evidenceFile = formData.get("evidence") as File | null;
  if (evidenceFile && evidenceFile.size > 0) {
    const savedUrl = await saveEvidenceImage(evidenceFile, lesson.id);
    addEvidence({ lessonId: lesson.id, type: "IMAGE", url: savedUrl });
  }

  revalidatePath("/dashboard");
  revalidatePath("/validate");
  revalidatePath("/library");
  return { ok: true, data: { lessonId: lesson.id } };
}

export async function setLessonStatusAction(
  _prevState: unknown,
  formData: FormData,
): Promise<ActionResult<Lesson>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: { message: "No autenticado" } };
  if (user.role !== "RESIDENT")
    return { ok: false, error: { message: "No autorizado" } };

  const lessonId = Number(formData.get("lessonId") ?? 0);
  const status = String(formData.get("status") ?? "") as LessonStatus;
  const commentRaw = String(formData.get("reviewerComment") ?? "").trim();
  const reviewerComment = commentRaw.length ? commentRaw : null;

  const allowed: LessonStatus[] = ["IN_PROGRESS", "VALIDATED", "DISCARDED"];
  if (!lessonId || !allowed.includes(status)) {
    return { ok: false, error: { message: "Solicitud inválida" } };
  }

  const updated = setLessonStatus({ lessonId, status, reviewerComment });
  revalidatePath("/validate");
  revalidatePath("/library");
  revalidatePath("/dashboard");
  return { ok: true, data: updated };
}

export async function rateLessonAction(
  _prevState: unknown,
  formData: FormData,
): Promise<ActionResult<{ ratingAvg: number; ratingCount: number }>> {
  return rateLesson(formData);
}

export async function rateLesson(
  formData: FormData,
): Promise<ActionResult<{ ratingAvg: number; ratingCount: number }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: { message: "No autenticado" } };

  const lessonId = Number(formData.get("lessonId") ?? 0);
  const rating = Number(formData.get("rating") ?? 0);
  if (!lessonId || !(rating >= 1 && rating <= 5)) {
    return { ok: false, error: { message: "Solicitud inválida" } };
  }

  const agg = upsertLessonRating({ lessonId, userId: user.id, rating });
  revalidatePath("/library");
  return { ok: true, data: agg };
}

export async function incrementViewsAction(
  lessonId: number,
): Promise<ActionResult<{ views: number }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: { message: "No autenticado" } };
  const views = incrementLessonViews(lessonId);
  return { ok: true, data: { views } };
}

export async function listValidationQueue(input: {
  q?: string;
  status?: LessonStatus;
}): Promise<LessonWithSpecialty[]> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "RESIDENT") redirect("/dashboard");
  return listLessonsForValidation(input);
}

export async function searchLibrary(input: {
  q?: string;
  specialtyKey?: SpecialtyKey;
}): Promise<LessonWithSpecialty[]> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return searchValidatedLessons(input);
}

async function saveEvidenceImage(
  file: File,
  lessonId: number,
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("La evidencia debe ser una imagen");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("La imagen supera el límite de 5MB");
  }

  const ext = guessExtension(file.type) ?? "png";
  const baseName = `lesson-${lessonId}-${Date.now()}.${ext}`;

  try {
    return await uploadImage(file, baseName);
  } catch (error: unknown) {
    const details =
      error instanceof Error ? error.message : "Unknown upload error";
    throw new Error(
      `No se pudo subir la imagen. Intenta nuevamente más tarde. (${details})`,
    );
  }
}

function guessExtension(mime: string): string | null {
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return null;
}

function flattenZod(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !out[key]) out[key] = issue.message;
  }
  return out;
}
