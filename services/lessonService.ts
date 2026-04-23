import { ObjectId } from "mongodb";
import { getMongoDb } from "@/lib/mongo";
import { getSpecialtyLabel } from "@/lib/specialtyLabels";
import type { ImpactType, LessonStatus, ProjectStageKey } from "@/types/domain";
import type { Lesson, LessonWithSpecialty } from "@/types/models";

const LESSONS = "lessons";
const SPECIALTIES = "specialties";
const USERS = "users";
const RATINGS = "lesson_ratings";

const STAGE_KEYS: ProjectStageKey[] = [
  "LICITACION",
  "INICIO",
  "EJECUCION",
  "FINALIZACION",
];

const LESSON_FULL_PROJECTION = {
  _id: 1,
  title: 1,
  specialtyId: 1,
  organizationId: 1,
  description: 1,
  rootCause: 1,
  solution: 1,
  eventDate: 1,
  impactType: 1,
  impactKinds: 1,
  impactValue: 1,
  projectName: 1,
  projectType: 1,
  area: 1,
  cargo: 1,
  projectStages: 1,
  actionsTaken: 1,
  lessonLearned: 1,
  actionPlan: 1,
  status: 1,
  reviewerComment: 1,
  createdBy: 1,
  createdAt: 1,
  updatedAt: 1,
  validatedAt: 1,
  viewsCount: 1,
  ratingCount: 1,
  ratingAvg: 1,
} as const;

type LessonDoc = {
  _id: ObjectId;
  title: string;
  specialtyId: ObjectId;
  organizationId: ObjectId;
  description: string;
  rootCause: string;
  solution: string;
  eventDate: string | null;
  impactType: Lesson["impactType"];
  impactKinds?: ImpactType[] | null;
  impactValue: number;
  projectName?: string | null;
  projectType?: string | null;
  area?: string | null;
  cargo?: string | null;
  projectStages?: string[] | null;
  actionsTaken?: string | null;
  lessonLearned?: string | null;
  actionPlan?: string | null;
  status: LessonStatus;
  reviewerComment: string | null;
  createdBy: ObjectId;
  createdAt: string;
  updatedAt: string;
  validatedAt: string | null;
  viewsCount: number;
  ratingCount: number;
  ratingAvg: number;
};

function normalizeProjectStages(raw: unknown): ProjectStageKey[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (x): x is ProjectStageKey =>
      typeof x === "string" && STAGE_KEYS.includes(x as ProjectStageKey),
  );
}

function normalizeImpactKinds(doc: LessonDoc): ImpactType[] {
  if (Array.isArray(doc.impactKinds) && doc.impactKinds.length) {
    const kinds = doc.impactKinds.filter(
      (x): x is ImpactType => x === "TIME" || x === "COST",
    );
    if (kinds.length) return [...new Set(kinds)];
  }
  if (doc.impactType === "TIME" || doc.impactType === "COST") {
    return [doc.impactType];
  }
  return ["TIME"];
}

function mapLesson(doc: LessonDoc): Lesson {
  const impactKinds = normalizeImpactKinds(doc);
  return {
    id: doc._id.toHexString(),
    title: doc.title,
    specialtyId: doc.specialtyId.toHexString(),
    organizationId: doc.organizationId.toHexString(),
    projectName: doc.projectName ?? null,
    projectType: doc.projectType ?? null,
    area: doc.area ?? null,
    cargo: doc.cargo ?? null,
    projectStages: normalizeProjectStages(doc.projectStages),
    description: doc.description,
    rootCause: doc.rootCause,
    actionsTaken: doc.actionsTaken ?? null,
    lessonLearned: doc.lessonLearned ?? null,
    actionPlan: doc.actionPlan ?? null,
    solution: doc.solution,
    eventDate: doc.eventDate,
    impactKinds,
    impactType: impactKinds[0] ?? "TIME",
    impactValue: doc.impactValue,
    status: doc.status,
    reviewerComment: doc.reviewerComment,
    createdBy: doc.createdBy.toHexString(),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    validatedAt: doc.validatedAt,
    viewsCount: doc.viewsCount,
    ratingCount: doc.ratingCount,
    ratingAvg: doc.ratingAvg,
  };
}

export async function createLesson(input: {
  title: string;
  specialtyId: string;
  organizationId: string;
  projectName: string;
  projectType: string;
  area: string;
  cargo: string;
  projectStages: ProjectStageKey[];
  description: string;
  rootCause: string;
  actionsTaken: string;
  lessonLearned: string;
  actionPlan: string;
  solution: string;
  eventDate: string | null;
  impactKinds: ImpactType[];
  impactValue: number;
  createdBy: string;
}): Promise<Lesson> {
  const db = await getMongoDb();
  const now = new Date().toISOString();
  const res = await db.collection(LESSONS).insertOne({
    title: input.title,
    specialtyId: new ObjectId(input.specialtyId),
    organizationId: new ObjectId(input.organizationId),
    projectName: input.projectName,
    projectType: input.projectType,
    area: input.area,
    cargo: input.cargo,
    projectStages: input.projectStages,
    description: input.description,
    rootCause: input.rootCause,
    actionsTaken: input.actionsTaken,
    lessonLearned: input.lessonLearned,
    actionPlan: input.actionPlan,
    solution: input.solution,
    eventDate: input.eventDate,
    impactKinds: input.impactKinds,
    impactType: input.impactKinds[0] ?? "TIME",
    impactValue: input.impactValue,
    status: "RECEIVED",
    reviewerComment: null,
    createdBy: new ObjectId(input.createdBy),
    createdAt: now,
    updatedAt: now,
    validatedAt: null,
    viewsCount: 0,
    ratingCount: 0,
    ratingAvg: 0,
  });
  const lesson = await getLessonById(res.insertedId.toHexString());
  if (!lesson) throw new Error("Failed to create lesson");
  return lesson;
}

export async function getLessonById(id: string): Promise<Lesson | null> {
  const db = await getMongoDb();
  let oid: ObjectId;
  try {
    oid = new ObjectId(id);
  } catch {
    return null;
  }
  const doc = await db.collection<LessonDoc>(LESSONS).findOne({ _id: oid });
  return doc ? mapLesson(doc) : null;
}

export async function getLessonByIdInOrganization(
  lessonId: string,
  organizationId: string,
): Promise<Lesson | null> {
  const db = await getMongoDb();
  let lid: ObjectId;
  let orgOid: ObjectId;
  try {
    lid = new ObjectId(lessonId);
    orgOid = new ObjectId(organizationId);
  } catch {
    return null;
  }
  const doc = await db.collection<LessonDoc>(LESSONS).findOne({
    _id: lid,
    organizationId: orgOid,
  });
  return doc ? mapLesson(doc) : null;
}

export async function getValidatedLessonWithSpecialtyById(
  id: string,
  organizationId: string,
): Promise<LessonWithSpecialty | null> {
  const db = await getMongoDb();
  let oid: ObjectId;
  let orgOid: ObjectId;
  try {
    oid = new ObjectId(id);
    orgOid = new ObjectId(organizationId);
  } catch {
    return null;
  }
  const rows = await db
    .collection<LessonDoc>(LESSONS)
    .aggregate<
      LessonDoc & {
        specialty_key: LessonWithSpecialty["specialtyKey"];
        created_by_name: string;
        created_by_email: string;
      }
    >([
      {
        $match: { _id: oid, status: "VALIDATED", organizationId: orgOid },
      },
      {
        $lookup: {
          from: SPECIALTIES,
          localField: "specialtyId",
          foreignField: "_id",
          as: "s",
        },
      },
      { $unwind: "$s" },
      {
        $lookup: {
          from: USERS,
          localField: "createdBy",
          foreignField: "_id",
          as: "u",
        },
      },
      { $unwind: "$u" },
      {
        $project: {
          ...LESSON_FULL_PROJECTION,
          specialty_key: "$s.key",
          created_by_name: "$u.name",
          created_by_email: "$u.email",
        },
      },
      { $limit: 1 },
    ])
    .toArray();

  const row = rows[0];
  if (!row) return null;
  const { specialty_key, created_by_name, created_by_email, ...lessonFields } = row;
  const base = mapLesson(lessonFields as LessonDoc);
  return {
    ...base,
    specialtyKey: specialty_key,
    specialtyName: getSpecialtyLabel(specialty_key),
    createdByName: created_by_name,
    createdByEmail: created_by_email,
  };
}

export async function setLessonStatus(input: {
  lessonId: string;
  organizationId: string;
  status: LessonStatus;
  reviewerComment: string | null;
}): Promise<Lesson> {
  const db = await getMongoDb();
  const now = new Date().toISOString();
  const $set: Record<string, unknown> = {
    status: input.status,
    reviewerComment: input.reviewerComment,
    updatedAt: now,
  };
  if (input.status === "VALIDATED") {
    $set.validatedAt = new Date().toISOString();
  }

  const r = await db.collection<LessonDoc>(LESSONS).updateOne(
    {
      _id: new ObjectId(input.lessonId),
      organizationId: new ObjectId(input.organizationId),
    },
    { $set },
  );
  if (r.matchedCount === 0) throw new Error("Lesson not found");

  const lesson = await getLessonById(input.lessonId);
  if (!lesson) throw new Error("Lesson not found after update");
  return lesson;
}

export async function incrementLessonViews(
  lessonId: string,
  organizationId: string,
): Promise<number> {
  const db = await getMongoDb();
  const now = new Date().toISOString();
  const oid = new ObjectId(lessonId);
  const r = await db.collection<LessonDoc>(LESSONS).updateOne(
    { _id: oid, organizationId: new ObjectId(organizationId) },
    { $inc: { viewsCount: 1 }, $set: { updatedAt: now } },
  );
  if (r.matchedCount === 0) throw new Error("Lesson not found");
  const orgOid = new ObjectId(organizationId);
  const doc = await db.collection<LessonDoc>(LESSONS).findOne(
    { _id: oid, organizationId: orgOid },
    { projection: { viewsCount: 1 } },
  );
  if (!doc) throw new Error("Lesson not found");
  return doc.viewsCount;
}

export async function upsertLessonRating(input: {
  lessonId: string;
  userId: string;
  organizationId: string;
  rating: number;
}): Promise<{ ratingAvg: number; ratingCount: number }> {
  const db = await getMongoDb();
  const lessonOid = new ObjectId(input.lessonId);
  const userOid = new ObjectId(input.userId);
  const orgOid = new ObjectId(input.organizationId);
  const now = new Date().toISOString();

  const lesson = await db.collection<LessonDoc>(LESSONS).findOne({
    _id: lessonOid,
    organizationId: orgOid,
  });
  if (!lesson) throw new Error("Lección no encontrada");

  await db.collection(RATINGS).updateOne(
    { lessonId: lessonOid, userId: userOid },
    {
      $set: { rating: input.rating, updatedAt: now },
      $setOnInsert: { createdAt: now, organizationId: orgOid },
    },
    { upsert: true },
  );

  const agg = await db
    .collection(RATINGS)
    .aggregate<{ avg: number; cnt: number }>([
      { $match: { lessonId: lessonOid, organizationId: orgOid } },
      {
        $group: {
          _id: null,
          avg: { $avg: "$rating" },
          cnt: { $sum: 1 },
        },
      },
    ])
    .toArray();

  const ratingAvg = agg[0]?.avg ?? 0;
  const ratingCount = agg[0]?.cnt ?? 0;

  await db.collection<LessonDoc>(LESSONS).updateOne(
    { _id: lessonOid, organizationId: orgOid },
    {
      $set: {
        ratingAvg,
        ratingCount,
        updatedAt: now,
      },
    },
  );

  return { ratingAvg, ratingCount };
}

export async function listLessonsForValidation(filters: {
  organizationId: string;
  q?: string;
  status?: LessonStatus;
}): Promise<LessonWithSpecialty[]> {
  const db = await getMongoDb();
  const q = (filters.q ?? "").trim();
  const status = filters.status;
  const orgOid = new ObjectId(filters.organizationId);

  const pipeline: object[] = [
    { $match: { organizationId: orgOid } },
    {
      $lookup: {
        from: USERS,
        localField: "createdBy",
        foreignField: "_id",
        as: "u",
      },
    },
    { $unwind: "$u" },
    {
      $lookup: {
        from: SPECIALTIES,
        localField: "specialtyId",
        foreignField: "_id",
        as: "s",
      },
    },
    { $unwind: "$s" },
  ];

  const match: Record<string, unknown> = {};
  if (status) match.status = status;
  if (q) {
    match.$or = [
      { title: { $regex: escapeRegex(q), $options: "i" } },
      { description: { $regex: escapeRegex(q), $options: "i" } },
      { "u.name": { $regex: escapeRegex(q), $options: "i" } },
    ];
  }
  if (Object.keys(match).length) pipeline.push({ $match: match });

  pipeline.push({ $sort: { createdAt: -1 } });

  pipeline.push({
    $project: {
      ...LESSON_FULL_PROJECTION,
      specialty_key: "$s.key",
      created_by_name: "$u.name",
      created_by_email: "$u.email",
    },
  });

  const rows = await db
    .collection<LessonDoc>(LESSONS)
    .aggregate<
      LessonDoc & {
        specialty_key: LessonWithSpecialty["specialtyKey"];
        created_by_name: string;
        created_by_email: string;
      }
    >(pipeline)
    .toArray();

  return rows.map((row) => {
    const { specialty_key, created_by_name, created_by_email, ...rest } = row;
    return {
      ...mapLesson(rest as LessonDoc),
      specialtyKey: specialty_key,
      specialtyName: getSpecialtyLabel(specialty_key),
      createdByName: created_by_name,
      createdByEmail: created_by_email,
    };
  });
}

export async function searchValidatedLessons(filters: {
  organizationId: string;
  q?: string;
  specialtyKey?: LessonWithSpecialty["specialtyKey"];
}): Promise<LessonWithSpecialty[]> {
  const db = await getMongoDb();
  const q = (filters.q ?? "").trim();
  const orgOid = new ObjectId(filters.organizationId);

  const pipeline: object[] = [
    { $match: { status: "VALIDATED", organizationId: orgOid } },
    {
      $lookup: {
        from: SPECIALTIES,
        localField: "specialtyId",
        foreignField: "_id",
        as: "s",
      },
    },
    { $unwind: "$s" },
    {
      $lookup: {
        from: USERS,
        localField: "createdBy",
        foreignField: "_id",
        as: "u",
      },
    },
    { $unwind: "$u" },
  ];

  const and: object[] = [];
  if (filters.specialtyKey) {
    and.push({ "s.key": filters.specialtyKey });
  }
  if (q) {
    const rx = escapeRegex(q);
    and.push({
      $or: [
        { title: { $regex: rx, $options: "i" } },
        { description: { $regex: rx, $options: "i" } },
        { rootCause: { $regex: rx, $options: "i" } },
        { solution: { $regex: rx, $options: "i" } },
        { projectName: { $regex: rx, $options: "i" } },
        { projectType: { $regex: rx, $options: "i" } },
        { area: { $regex: rx, $options: "i" } },
        { lessonLearned: { $regex: rx, $options: "i" } },
        { actionsTaken: { $regex: rx, $options: "i" } },
      ],
    });
  }
  if (and.length) pipeline.push({ $match: { $and: and } });

  pipeline.push({ $sort: { ratingAvg: -1, viewsCount: -1, createdAt: -1 } });
  pipeline.push({ $limit: 100 });
  pipeline.push({
    $project: {
      ...LESSON_FULL_PROJECTION,
      specialty_key: "$s.key",
      created_by_name: "$u.name",
      created_by_email: "$u.email",
    },
  });

  const rows = await db
    .collection<LessonDoc>(LESSONS)
    .aggregate<
      LessonDoc & {
        specialty_key: LessonWithSpecialty["specialtyKey"];
        created_by_name: string;
        created_by_email: string;
      }
    >(pipeline)
    .toArray();

  return rows.map((row) => {
    const { specialty_key, created_by_name, created_by_email, ...rest } = row;
    return {
      ...mapLesson(rest as LessonDoc),
      specialtyKey: specialty_key,
      specialtyName: getSpecialtyLabel(specialty_key),
      createdByName: created_by_name,
      createdByEmail: created_by_email,
    };
  });
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
