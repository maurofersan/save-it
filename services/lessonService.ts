import { ObjectId } from "mongodb";
import { getMongoDb } from "@/lib/mongo";
import { getSpecialtyLabel } from "@/lib/specialtyLabels";
import type { LessonStatus } from "@/types/domain";
import type { Lesson, LessonWithSpecialty } from "@/types/models";

const LESSONS = "lessons";
const SPECIALTIES = "specialties";
const USERS = "users";
const RATINGS = "lesson_ratings";

type LessonDoc = {
  _id: ObjectId;
  title: string;
  specialtyId: ObjectId;
  description: string;
  rootCause: string;
  solution: string;
  eventDate: string | null;
  impactType: Lesson["impactType"];
  impactValue: number;
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

function mapLesson(doc: LessonDoc): Lesson {
  return {
    id: doc._id.toHexString(),
    title: doc.title,
    specialtyId: doc.specialtyId.toHexString(),
    description: doc.description,
    rootCause: doc.rootCause,
    solution: doc.solution,
    eventDate: doc.eventDate,
    impactType: doc.impactType,
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
  description: string;
  rootCause: string;
  solution: string;
  eventDate: string | null;
  impactType: Lesson["impactType"];
  impactValue: number;
  createdBy: string;
}): Promise<Lesson> {
  const db = await getMongoDb();
  const now = new Date().toISOString();
  const res = await db.collection(LESSONS).insertOne({
    title: input.title,
    specialtyId: new ObjectId(input.specialtyId),
    description: input.description,
    rootCause: input.rootCause,
    solution: input.solution,
    eventDate: input.eventDate,
    impactType: input.impactType,
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

export async function getValidatedLessonWithSpecialtyById(
  id: string,
): Promise<LessonWithSpecialty | null> {
  const db = await getMongoDb();
  let oid: ObjectId;
  try {
    oid = new ObjectId(id);
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
      { $match: { _id: oid, status: "VALIDATED" } },
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
          _id: 1,
          title: 1,
          specialtyId: 1,
          description: 1,
          rootCause: 1,
          solution: 1,
          eventDate: 1,
          impactType: 1,
          impactValue: 1,
          status: 1,
          reviewerComment: 1,
          createdBy: 1,
          createdAt: 1,
          updatedAt: 1,
          validatedAt: 1,
          viewsCount: 1,
          ratingCount: 1,
          ratingAvg: 1,
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
    { _id: new ObjectId(input.lessonId) },
    { $set },
  );
  if (r.matchedCount === 0) throw new Error("Lesson not found");

  const lesson = await getLessonById(input.lessonId);
  if (!lesson) throw new Error("Lesson not found after update");
  return lesson;
}

export async function incrementLessonViews(lessonId: string): Promise<number> {
  const db = await getMongoDb();
  const now = new Date().toISOString();
  const oid = new ObjectId(lessonId);
  const r = await db.collection<LessonDoc>(LESSONS).updateOne(
    { _id: oid },
    { $inc: { viewsCount: 1 }, $set: { updatedAt: now } },
  );
  if (r.matchedCount === 0) throw new Error("Lesson not found");
  const doc = await db.collection<LessonDoc>(LESSONS).findOne(
    { _id: oid },
    { projection: { viewsCount: 1 } },
  );
  if (!doc) throw new Error("Lesson not found");
  return doc.viewsCount;
}

export async function upsertLessonRating(input: {
  lessonId: string;
  userId: string;
  rating: number;
}): Promise<{ ratingAvg: number; ratingCount: number }> {
  const db = await getMongoDb();
  const lessonOid = new ObjectId(input.lessonId);
  const userOid = new ObjectId(input.userId);
  const now = new Date().toISOString();

  await db.collection(RATINGS).updateOne(
    { lessonId: lessonOid, userId: userOid },
    {
      $set: { rating: input.rating, updatedAt: now },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true },
  );

  const agg = await db
    .collection(RATINGS)
    .aggregate<{ avg: number; cnt: number }>([
      { $match: { lessonId: lessonOid } },
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
    { _id: lessonOid },
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
  q?: string;
  status?: LessonStatus;
}): Promise<LessonWithSpecialty[]> {
  const db = await getMongoDb();
  const q = (filters.q ?? "").trim();
  const status = filters.status;

  const pipeline: object[] = [
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
      _id: 1,
      title: 1,
      specialtyId: 1,
      description: 1,
      rootCause: 1,
      solution: 1,
      eventDate: 1,
      impactType: 1,
      impactValue: 1,
      status: 1,
      reviewerComment: 1,
      createdBy: 1,
      createdAt: 1,
      updatedAt: 1,
      validatedAt: 1,
      viewsCount: 1,
      ratingCount: 1,
      ratingAvg: 1,
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
  q?: string;
  specialtyKey?: LessonWithSpecialty["specialtyKey"];
}): Promise<LessonWithSpecialty[]> {
  const db = await getMongoDb();
  const q = (filters.q ?? "").trim();

  const pipeline: object[] = [
    { $match: { status: "VALIDATED" } },
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
      ],
    });
  }
  if (and.length) pipeline.push({ $match: { $and: and } });

  pipeline.push({ $sort: { ratingAvg: -1, viewsCount: -1, createdAt: -1 } });
  pipeline.push({ $limit: 100 });
  pipeline.push({
    $project: {
      _id: 1,
      title: 1,
      specialtyId: 1,
      description: 1,
      rootCause: 1,
      solution: 1,
      eventDate: 1,
      impactType: 1,
      impactValue: 1,
      status: 1,
      reviewerComment: 1,
      createdBy: 1,
      createdAt: 1,
      updatedAt: 1,
      validatedAt: 1,
      viewsCount: 1,
      ratingCount: 1,
      ratingAvg: 1,
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
