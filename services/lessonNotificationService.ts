import { createAndDispatchLessonNotification } from "@/services/notificationService";
import type { LessonStatus } from "@/types/domain";
import type { Lesson } from "@/types/models";

function summaryForStatus(s: LessonStatus): string {
  const map: Record<LessonStatus, string> = {
    RECEIVED: "Recibida",
    IN_PROGRESS: "En proceso de revisión",
    VALIDATED: "Validada",
    DISCARDED: "Descartada",
  };
  return `Estado: ${map[s]}`;
}

/**
 * Llamar tras persistir lección — errores se registran y no afectan el flujo principal.
 */
export async function notifyLessonCreatedEvent(
  lesson: Lesson,
  actorUserId: string,
): Promise<void> {
  try {
    await createAndDispatchLessonNotification({
      organizationId: lesson.organizationId,
      lessonId: lesson.id,
      title: lesson.title,
      kind: "LESSON_CREATED",
      summary: "Enviada a validación",
      lessonStatus: lesson.status,
      actorUserId,
    });
  } catch (e) {
    console.error("notifyLessonCreatedEvent", e);
  }
}

export async function notifyLessonUpdatedEvent(
  lesson: Lesson,
  actorUserId: string,
): Promise<void> {
  try {
    await createAndDispatchLessonNotification({
      organizationId: lesson.organizationId,
      lessonId: lesson.id,
      title: lesson.title,
      kind: "LESSON_UPDATED",
      summary: summaryForStatus(lesson.status),
      lessonStatus: lesson.status,
      actorUserId,
    });
  } catch (e) {
    console.error("notifyLessonUpdatedEvent", e);
  }
}
