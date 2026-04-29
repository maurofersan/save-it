export type UserRole = "ENGINEER" | "RESIDENT";

export type LessonStatus = "RECEIVED" | "IN_PROGRESS" | "VALIDATED" | "DISCARDED";

/**
 * Catálogo en Mongo (`specialties.key`).
 *
 * Nota: el listado es configurable por tenant/seed, así que no lo limitamos
 * a un union estático.
 */
export type SpecialtyKey = string;

/** Etapas del proyecto (mock: licitación → finalización). */
export type ProjectStageKey =
  | "LICITACION"
  | "INICIO"
  | "EJECUCION"
  | "FINALIZACION";

export type EvidenceType = "IMAGE" | "DOCUMENT";

export type Id = string;

