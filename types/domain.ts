export type UserRole = "ENGINEER" | "RESIDENT";

export type LessonStatus = "RECEIVED" | "IN_PROGRESS" | "VALIDATED" | "DISCARDED";

export type SpecialtyKey = "QUALITY" | "SAFETY" | "PRODUCTION";

export type ImpactType = "TIME" | "COST";

/** Etapas del proyecto (mock: licitación → finalización). */
export type ProjectStageKey =
  | "LICITACION"
  | "INICIO"
  | "EJECUCION"
  | "FINALIZACION";

export type EvidenceType = "IMAGE" | "DOCUMENT";

export type Id = string;

