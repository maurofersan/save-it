import type { Id, LessonStatus } from "@/types/domain";

/** Tipo almacenado en Mongo / enviado por Ably. */
export type NotificationKind = "LESSON_CREATED" | "LESSON_UPDATED";

/** Payload publicado en Ably (canal por organización). */
export type AblyNotificationPayloadV1 = {
  v: 1;
  id: Id;
  organizationId: Id;
  kind: NotificationKind;
  lessonId: Id;
  title: string;
  summary: string | null;
  lessonStatus: LessonStatus;
  createdAt: string;
  /** Quién disparó el evento (no mostrarlo como "no leído" a sí mismo en UI inmediata). */
  actorUserId: Id;
};

export type NotificationListItem = {
  id: Id;
  kind: NotificationKind;
  lessonId: Id;
  title: string;
  summary: string | null;
  lessonStatus: LessonStatus;
  createdAt: string;
  read: boolean;
  href: string;
};
