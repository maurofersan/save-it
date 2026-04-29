import type { LessonStatus, UserRole } from "@/types/domain";

/**
 * Ruta a abrir al hacer clic: biblioteca si ya está validada; si no, cola o inicio
 * (ingenieros no usan /validate; redirige, pero evitamos depender de eso).
 */
export function resolveLessonNotificationHref(
  lessonId: string,
  lessonStatus: LessonStatus,
  role: UserRole,
): string {
  if (lessonStatus === "VALIDATED") {
    return `/library/${lessonId}`;
  }
  if (role === "RESIDENT") {
    return "/validate";
  }
  if (lessonStatus === "IN_PROGRESS") {
    return `/lessons/${lessonId}/edit`;
  }
  return "/dashboard";
}
