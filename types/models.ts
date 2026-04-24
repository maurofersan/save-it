import type {
  EvidenceType,
  Id,
  ImpactType,
  LessonStatus,
  ProjectStageKey,
  SpecialtyKey,
  UserRole,
} from "@/types/domain";

export type Organization = {
  id: Id;
  name: string;
  slug: string;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type User = {
  id: Id;
  name: string;
  email: string;
  phone: string | null;
  title: string | null;
  /** Foto de perfil (Cloudinary u otra URL https). */
  avatarUrl: string | null;
  role: UserRole;
  /** Tenant: all app data is scoped to this organization. */
  organizationId: Id | null;
  createdAt: string;
  updatedAt: string;
};

export type Session = {
  id: Id;
  userId: Id;
  token: string;
  expiresAt: string;
  createdAt: string;
};

export type Specialty = {
  id: Id;
  key: SpecialtyKey;
  name: string;
};

export type Lesson = {
  id: Id;
  title: string;
  specialtyId: Id;
  /** Owning company (tenant). */
  organizationId: Id;
  /** Proyecto (obra / contrato). */
  projectName: string | null;
  projectType: string | null;
  area: string | null;
  /** Cargo del autor en contexto de la lección. */
  cargo: string | null;
  projectStages: ProjectStageKey[];
  description: string;
  rootCause: string;
  /** Acciones tomadas (mock). */
  actionsTaken: string | null;
  /** Lección aprendida explícita (mock). */
  lessonLearned: string | null;
  actionPlan: string | null;
  /** Resumen legado / búsqueda; en registros nuevos suele coincidir con `lessonLearned`. */
  solution: string;
  eventDate: string | null;
  /** Marcado en el formulario: tiempo y/o costo. */
  impactKinds: ImpactType[];
  /** Primera dimensión de impacto (compatibilidad con registros y vistas antiguas). */
  impactType: ImpactType;
  status: LessonStatus;
  reviewerComment: string | null;
  createdBy: Id;
  createdAt: string;
  updatedAt: string;
  validatedAt: string | null;
  viewsCount: number;
  ratingCount: number;
  ratingAvg: number;
};

export type LessonWithSpecialty = Lesson & {
  specialtyKey: SpecialtyKey;
  specialtyName: string;
  createdByName: string;
  createdByEmail: string;
};

export type Evidence = {
  id: Id;
  lessonId: Id;
  organizationId: Id;
  type: EvidenceType;
  url: string;
  createdAt: string;
};

export type DashboardMetrics = {
  lessonsTotal: number;
  lessonsValidated: number;
  lessonsInProgress: number;
  lessonsDiscarded: number;
  topSpecialties: Array<{ specialtyKey: SpecialtyKey; count: number }>;
  /** Una fila por especialidad del catálogo (incluye conteo 0). */
  specialtyBars: Array<{ specialtyKey: SpecialtyKey; label: string; count: number }>;
  /** Conteos por estado de lección (misma org). */
  statusCounts: Record<LessonStatus, number>;
};

