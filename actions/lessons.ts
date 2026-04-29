"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { uploadLessonAttachment } from "@/lib/cloudinary";
import { addEvidence } from "@/services/evidenceService";
import { listEvidenceForLesson } from "@/services/evidenceService";
import {
  createLesson,
  incrementLessonViews,
  listLessonsForValidation,
  searchValidatedLessons,
  setLessonStatus,
  updateLessonFromEngineer,
  upsertLessonRating,
} from "@/services/lessonService";
import { getOrganizationById } from "@/services/organizationService";
import {
  notifyLessonCreatedEvent,
  notifyLessonUpdatedEvent,
} from "@/services/lessonNotificationService";
import { listSpecialties } from "@/services/specialtyService";
import type { ActionResult } from "@/types/actions";
import type { LessonStatus, ProjectStageKey, SpecialtyKey } from "@/types/domain";
import type { Evidence, Lesson, LessonWithSpecialty, Specialty } from "@/types/models";

const STAGE_KEYS = [
  "LICITACION",
  "INICIO",
  "EJECUCION",
  "FINALIZACION",
] as const satisfies readonly ProjectStageKey[];

function parseFormDecimal(value: string): number {
  const t = value.trim().replace(/,/g, ".");
  if (t === "") return 0;
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : 0;
}

const createLessonSchema = z
  .object({
    projectName: z.string().trim().min(2, "Proyecto muy corto").max(200),
    projectType: z.string().trim().min(2, "Tipo muy corto").max(200),
    area: z.string().trim().min(2, "Especialidad muy corta").max(200),
    cargo: z.string().trim().min(2, "Cargo muy corto").max(120),
    title: z.string().trim().min(5, "Nombre muy corto").max(140),
    specialtyKey: z.string().trim().min(1, "Área requerida").max(80),
    projectStages: z
      .array(z.enum(STAGE_KEYS))
      .min(1, "Selecciona al menos una etapa del proyecto"),
    description: z.string().trim().min(10, "Texto muy corto").max(4000),
    rootCause: z.string().trim().min(10, "Texto muy corto").max(2000),
    actionsTaken: z.string().trim().min(10, "Texto muy corto").max(4000),
    lessonLearned: z.string().trim().min(10, "Texto muy corto").max(4000),
    actionPlan: z.string().trim().max(4000),
    eventDate: z
      .string()
      .trim()
      .min(1, "Fecha de suceso requerida")
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
    impactTime: z.string().trim().max(120),
    impactCostPen: z.number().min(0).max(1e15),
  })
  .refine((d) => d.impactTime.length > 0 || d.impactCostPen > 0, {
    message: "Ingresa horas de impacto o monto en soles (o ambos).",
    path: ["impactTime"],
  });

const updateLessonSchema = createLessonSchema.extend({
  lessonId: z.string().trim().min(1, "Lección requerida"),
});

export async function getLessonFormData(): Promise<{
  specialties: Specialty[];
  organizationLogoUrl: string | null;
  organizationName: string;
  canCreateLesson: boolean;
}> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.organizationId) redirect("/login");

  const org = await getOrganizationById(user.organizationId);

  return {
    specialties: await listSpecialties(),
    organizationLogoUrl: org?.logoUrl ?? null,
    organizationName: org?.name ?? "Empresa",
    canCreateLesson: user.role === "ENGINEER",
  };
}

export async function createLessonAction(
  _prevState: unknown,
  formData: FormData,
): Promise<ActionResult<{ lessonId: string }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: { message: "No autenticado" } };
  if (!user.organizationId) {
    return { ok: false, error: { message: "Usuario sin empresa asignada" } };
  }
  if (user.role !== "ENGINEER") {
    return { ok: false, error: { message: "Solo ingenieros pueden registrar lecciones" } };
  }

  const projectStages = formData
    .getAll("projectStages")
    .map(String)
    .filter((s): s is ProjectStageKey =>
      (STAGE_KEYS as readonly string[]).includes(s),
    );

  const raw = {
    projectName: String(formData.get("projectName") ?? ""),
    projectType: String(formData.get("projectType") ?? ""),
    area: String(formData.get("area") ?? ""),
    cargo: String(formData.get("cargo") ?? ""),
    title: String(formData.get("title") ?? ""),
    specialtyKey: String(formData.get("specialtyKey") ?? ""),
    projectStages,
    description: String(formData.get("description") ?? ""),
    rootCause: String(formData.get("rootCause") ?? ""),
    actionsTaken: String(formData.get("actionsTaken") ?? ""),
    lessonLearned: String(formData.get("lessonLearned") ?? ""),
    actionPlan: String(formData.get("actionPlan") ?? ""),
    eventDate: String(formData.get("eventDate") ?? ""),
    impactTime: String(formData.get("impactTime") ?? "").trim(),
    impactCostPen: parseFormDecimal(String(formData.get("impactCostPen") ?? "")),
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

  const specialties = await listSpecialties();
  const specialty = specialties.find((s) => s.key === parsed.data.specialtyKey);
  if (!specialty) {
    return { ok: false, error: { message: "Área inválida" } };
  }

  const lesson = await createLesson({
    title: parsed.data.title,
    specialtyId: specialty.id,
    organizationId: user.organizationId,
    projectName: parsed.data.projectName,
    projectType: parsed.data.projectType,
    area: parsed.data.area,
    cargo: parsed.data.cargo,
    projectStages: parsed.data.projectStages,
    description: parsed.data.description,
    rootCause: parsed.data.rootCause,
    actionsTaken: parsed.data.actionsTaken,
    lessonLearned: parsed.data.lessonLearned,
    actionPlan: parsed.data.actionPlan,
    solution: parsed.data.lessonLearned,
    eventDate: parsed.data.eventDate,
    impactTime: parsed.data.impactTime.length ? parsed.data.impactTime : null,
    impactCostPen: parsed.data.impactCostPen,
    createdBy: user.id,
  });

  const evidenceFile = formData.get("evidence") as File | null;
  if (evidenceFile && evidenceFile.size > 0) {
    try {
      assertAllowedEvidence(evidenceFile);
      const ext =
        evidenceFile.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "") ||
        "bin";
      const baseName = `lesson-${lesson.id}-${Date.now()}.${ext}`;
      const { url, isImage } = await uploadLessonAttachment(
        evidenceFile,
        baseName,
      );
      await addEvidence({
        lessonId: lesson.id,
        organizationId: user.organizationId,
        type: isImage ? "IMAGE" : "DOCUMENT",
        url,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Error al subir el archivo";
      return {
        ok: false,
        error: { message },
      };
    }
  }

  await notifyLessonCreatedEvent(lesson, user.id);

  revalidatePath("/dashboard");
  revalidatePath("/validate");
  revalidatePath("/library");
  return { ok: true, data: { lessonId: lesson.id } };
}

export async function updateLessonAction(
  _prevState: unknown,
  formData: FormData,
): Promise<ActionResult<{ lessonId: string }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: { message: "No autenticado" } };
  if (!user.organizationId) {
    return { ok: false, error: { message: "Usuario sin empresa asignada" } };
  }
  if (user.role !== "ENGINEER") {
    return { ok: false, error: { message: "Solo ingenieros pueden actualizar lecciones" } };
  }

  const projectStages = formData
    .getAll("projectStages")
    .map(String)
    .filter((s): s is ProjectStageKey =>
      (STAGE_KEYS as readonly string[]).includes(s),
    );

  const raw = {
    lessonId: String(formData.get("lessonId") ?? ""),
    projectName: String(formData.get("projectName") ?? ""),
    projectType: String(formData.get("projectType") ?? ""),
    area: String(formData.get("area") ?? ""),
    cargo: String(formData.get("cargo") ?? ""),
    title: String(formData.get("title") ?? ""),
    specialtyKey: String(formData.get("specialtyKey") ?? ""),
    projectStages,
    description: String(formData.get("description") ?? ""),
    rootCause: String(formData.get("rootCause") ?? ""),
    actionsTaken: String(formData.get("actionsTaken") ?? ""),
    lessonLearned: String(formData.get("lessonLearned") ?? ""),
    actionPlan: String(formData.get("actionPlan") ?? ""),
    eventDate: String(formData.get("eventDate") ?? ""),
    impactTime: String(formData.get("impactTime") ?? "").trim(),
    impactCostPen: parseFormDecimal(String(formData.get("impactCostPen") ?? "")),
  };

  const parsed = updateLessonSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        message: "Datos inválidos",
        fieldErrors: flattenZod(parsed.error),
      },
    };
  }

  const specialties = await listSpecialties();
  const specialty = specialties.find((s) => s.key === parsed.data.specialtyKey);
  if (!specialty) {
    return { ok: false, error: { message: "Área inválida" } };
  }

  try {
    const updated = await updateLessonFromEngineer({
      lessonId: parsed.data.lessonId,
      organizationId: user.organizationId,
      createdBy: user.id,
      title: parsed.data.title,
      specialtyId: specialty.id,
      projectName: parsed.data.projectName,
      projectType: parsed.data.projectType,
      area: parsed.data.area,
      cargo: parsed.data.cargo,
      projectStages: parsed.data.projectStages,
      description: parsed.data.description,
      rootCause: parsed.data.rootCause,
      actionsTaken: parsed.data.actionsTaken,
      lessonLearned: parsed.data.lessonLearned,
      actionPlan: parsed.data.actionPlan,
      solution: parsed.data.lessonLearned,
      eventDate: parsed.data.eventDate,
      impactTime: parsed.data.impactTime.length ? parsed.data.impactTime : null,
      impactCostPen: parsed.data.impactCostPen,
    });
    await notifyLessonUpdatedEvent(updated, user.id);
  } catch {
    return { ok: false, error: { message: "No se pudo actualizar la lección" } };
  }

  revalidatePath("/dashboard");
  revalidatePath("/validate");
  return { ok: true, data: { lessonId: parsed.data.lessonId } };
}

export async function setLessonStatusAction(
  _prevState: unknown,
  formData: FormData,
): Promise<ActionResult<Lesson>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: { message: "No autenticado" } };
  if (user.role !== "RESIDENT")
    return { ok: false, error: { message: "No autorizado" } };
  if (!user.organizationId) {
    return { ok: false, error: { message: "Usuario sin empresa asignada" } };
  }

  const lessonId = String(formData.get("lessonId") ?? "").trim();
  const status = String(formData.get("status") ?? "") as LessonStatus;
  const commentRaw = String(formData.get("reviewerComment") ?? "").trim();
  const reviewerComment = commentRaw.length ? commentRaw : null;

  const allowed: LessonStatus[] = ["IN_PROGRESS", "VALIDATED", "DISCARDED"];
  if (!lessonId || !allowed.includes(status)) {
    return { ok: false, error: { message: "Solicitud inválida" } };
  }

  const updated = await setLessonStatus({
    lessonId,
    organizationId: user.organizationId,
    status,
    reviewerComment,
  });
  await notifyLessonUpdatedEvent(updated, user.id);
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
  if (!user.organizationId) {
    return { ok: false, error: { message: "Usuario sin empresa asignada" } };
  }

  const lessonId = String(formData.get("lessonId") ?? "").trim();
  const rating = Number(formData.get("rating") ?? 0);
  if (!lessonId || !(rating >= 1 && rating <= 5)) {
    return { ok: false, error: { message: "Solicitud inválida" } };
  }

  const agg = await upsertLessonRating({
    lessonId,
    userId: user.id,
    organizationId: user.organizationId,
    rating,
  });
  revalidatePath("/library");
  return { ok: true, data: agg };
}

export async function incrementViewsAction(
  lessonId: string,
): Promise<ActionResult<{ views: number }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: { message: "No autenticado" } };
  if (!user.organizationId) {
    return { ok: false, error: { message: "Usuario sin empresa asignada" } };
  }
  const views = await incrementLessonViews(lessonId, user.organizationId);
  return { ok: true, data: { views } };
}

export async function listLessonEvidenceAction(
  lessonId: string,
): Promise<ActionResult<Evidence[]>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: { message: "No autenticado" } };
  if (!user.organizationId) {
    return { ok: false, error: { message: "Usuario sin empresa asignada" } };
  }
  // Both roles can view evidence; keep tenant scoping.
  const evidence = await listEvidenceForLesson(lessonId, user.organizationId);
  return { ok: true, data: evidence };
}

export async function listValidationQueue(input: {
  q?: string;
  status?: LessonStatus;
  specialtyKey?: SpecialtyKey;
  projectType?: string;
  year?: string;
  ratingMin?: number;
}): Promise<LessonWithSpecialty[]> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.organizationId) redirect("/login");
  if (user.role !== "RESIDENT") redirect("/dashboard");
  return await listLessonsForValidation({
    ...input,
    organizationId: user.organizationId,
  });
}

export async function searchLibrary(input: {
  q?: string;
  specialtyKey?: SpecialtyKey;
  projectType?: string;
  year?: string;
  ratingMin?: number;
}): Promise<LessonWithSpecialty[]> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.organizationId) redirect("/login");
  return await searchValidatedLessons({
    ...input,
    organizationId: user.organizationId,
  });
}

const DOC_MIMES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

function assertAllowedEvidence(file: File): void {
  const imageOk =
    file.type === "image/png" ||
    file.type === "image/jpeg" ||
    file.type === "image/webp";
  if (imageOk) {
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("La imagen supera el límite de 5MB");
    }
    return;
  }
  if (DOC_MIMES.has(file.type)) {
    if (file.size > 15 * 1024 * 1024) {
      throw new Error("El documento supera el límite de 15MB");
    }
    return;
  }
  const lower = file.name.toLowerCase();
  if (/\.(pdf|doc|docx|xls|xlsx)$/.test(lower) && file.size <= 15 * 1024 * 1024) {
    return;
  }
  throw new Error(
    "Formato no permitido. Usa PNG, JPG, WEBP, PDF, Word o Excel.",
  );
}

function flattenZod(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !out[key]) out[key] = issue.message;
  }
  return out;
}
