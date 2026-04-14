import type {
  EvidenceType,
  Id,
  ImpactType,
  LessonStatus,
  SpecialtyKey,
  UserRole,
} from "@/types/domain";

export type User = {
  id: Id;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  title: string | null;
  role: UserRole;
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
  description: string;
  rootCause: string;
  solution: string;
  impactType: ImpactType;
  impactValue: number;
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
};

